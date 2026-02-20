#include <boost/program_options.hpp>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <string>
#include <vector>
#include <map>
#include <unordered_map>
#include <unordered_set>
#include <sstream>
#include <chrono>
#include <iomanip>
#include <cstdio>
#include <algorithm>
#include <cctype>
#include <cxxabi.h>

#include <nlohmann/json.hpp>
#include <archive.h>
#include <archive_entry.h>

using json = nlohmann::json;
namespace po = boost::program_options;
namespace fs = std::filesystem;

// ── Data structures ────────────────────────────────────────────────────────────

struct Instruction {
    uint64_t address;
    std::string text;
};

struct Function {
    std::string name;
    uint64_t startAddress = 0;
    uint64_t endAddress = 0;
    std::vector<Instruction> instructions;
};

struct LineTableEntry {
    std::string file;
    int line = 0;
    bool endSequence = false;
};

// ── Utility ────────────────────────────────────────────────────────────────────

static std::string trim(const std::string& s) {
    auto start = s.find_first_not_of(" \t\r\n");
    if (start == std::string::npos) return "";
    auto end = s.find_last_not_of(" \t\r\n");
    return s.substr(start, end - start + 1);
}

static std::string unquote(const std::string& s) {
    if (s.size() >= 2 && s.front() == '"' && s.back() == '"')
        return s.substr(1, s.size() - 2);
    return s;
}

static bool allHex(const std::string& s) {
    return !s.empty() && std::all_of(s.begin(), s.end(),
        [](unsigned char c) { return std::isxdigit(c); });
}

static std::string demangle(const std::string& mangled) {
    int status = 0;
    char* demangled = abi::__cxa_demangle(mangled.c_str(), nullptr, nullptr, &status);
    if (status == 0 && demangled) {
        std::string result(demangled);
        std::free(demangled);
        return result;
    }
    return mangled;
}

static std::string runCommand(const std::string& cmd) {
    std::string result;
    FILE* pipe = popen(cmd.c_str(), "r");
    if (!pipe)
        throw std::runtime_error("popen() failed for: " + cmd);
    char buf[8192];
    while (fgets(buf, sizeof(buf), pipe))
        result += buf;
    int status = pclose(pipe);
    if (status != 0)
        throw std::runtime_error("Command failed with exit code " +
            std::to_string(WEXITSTATUS(status)) + ": " + cmd);
    return result;
}

// ── Parse objdump -d ───────────────────────────────────────────────────────────
//
// Function header format:  "0000000000401126 <main>:"
// Instruction format:      "  401126:\t55 48 89\tpush   %rbp"
//   (address : TAB bytes TAB mnemonic+operands)

std::vector<Function> parseObjdump(const std::string& binaryPath) {
    auto output = runCommand("objdump -d \"" + binaryPath + "\"");

    std::vector<Function> functions;
    std::istringstream stream(output);
    std::string line;
    Function* cur = nullptr;

    while (std::getline(stream, line)) {
        // Function header: starts with hex address, then " <name>:"
        if (!line.empty() && std::isxdigit(static_cast<unsigned char>(line[0]))) {
            auto angleOpen = line.find('<');
            auto angleClose = line.rfind('>');
            if (angleOpen != std::string::npos && angleClose != std::string::npos &&
                angleClose > angleOpen && angleClose + 1 < line.size() &&
                line[angleClose + 1] == ':') {
                uint64_t addr = std::stoull(line.substr(0, angleOpen), nullptr, 16);
                std::string name = demangle(line.substr(angleOpen + 1, angleClose - angleOpen - 1));
                functions.push_back({name, addr, 0, {}});
                cur = &functions.back();
                continue;
            }
        }

        // Instruction line: leading whitespace, hex address, colon, tab, bytes, tab, text
        if (cur && !line.empty() && (line[0] == ' ' || line[0] == '\t')) {
            auto colonPos = line.find(':');
            if (colonPos == std::string::npos) continue;
            auto addrStr = trim(line.substr(0, colonPos));
            if (!allHex(addrStr)) continue;

            auto firstTab = line.find('\t', colonPos);
            if (firstTab == std::string::npos) continue;
            auto secondTab = line.find('\t', firstTab + 1);
            if (secondTab == std::string::npos) continue;

            auto instrText = trim(line.substr(secondTab + 1));
            if (instrText.empty()) continue;

            uint64_t addr = std::stoull(addrStr, nullptr, 16);
            cur->instructions.push_back({addr, instrText});
            cur->endAddress = addr;
        }
    }

    return functions;
}

// ── Parse llvm-dwarfdump --debug-line ──────────────────────────────────────────
//
// Parses the line number table from DWARF debug info. Handles DWARF v4 and v5.
// Builds a sorted map of address → (file, line) entries suitable for range lookup.

std::map<uint64_t, LineTableEntry> parseDwarfdumpLineTable(const std::string& binaryPath) {
    auto output = runCommand("llvm-dwarfdump --debug-line \"" + binaryPath + "\"");

    std::map<uint64_t, LineTableEntry> lineMap;

    // Per-CU tables (reset on each "debug_line[...]" header)
    std::map<int, std::string> includeDirs;
    std::map<int, std::pair<std::string, int>> fileNames; // idx → (name, dirIndex)

    // State for multi-line file_names blocks
    int pendingFileIdx = -1;
    std::string pendingName;
    int pendingDirIdx = -1;

    auto commitPendingFile = [&]() {
        if (pendingFileIdx >= 0 && !pendingName.empty()) {
            fileNames[pendingFileIdx] = {pendingName, std::max(pendingDirIdx, 0)};
        }
        pendingFileIdx = -1;
        pendingName.clear();
        pendingDirIdx = -1;
    };

    auto resolveFile = [&](int fileIdx) -> std::string {
        auto it = fileNames.find(fileIdx);
        if (it == fileNames.end()) return "";
        auto& [name, dirIdx] = it->second;
        auto dirIt = includeDirs.find(dirIdx);
        if (dirIt != includeDirs.end() && !dirIt->second.empty()) {
            return (fs::path(dirIt->second) / name).string();
        }
        return name;
    };

    std::istringstream stream(output);
    std::string line;

    while (std::getline(stream, line)) {
        auto trimmed = trim(line);
        if (trimmed.empty()) continue;

        // New CU — reset per-CU tables
        if (trimmed.starts_with("debug_line[")) {
            commitPendingFile();
            includeDirs.clear();
            fileNames.clear();
            continue;
        }

        // include_directories[  N] = "path"
        if (trimmed.starts_with("include_directories[")) {
            commitPendingFile();
            auto open = trimmed.find('[');
            auto close = trimmed.find(']');
            if (open == std::string::npos || close == std::string::npos) continue;
            int idx = std::stoi(trim(trimmed.substr(open + 1, close - open - 1)));
            auto eq = trimmed.find('=', close);
            if (eq == std::string::npos) continue;
            includeDirs[idx] = unquote(trim(trimmed.substr(eq + 1)));
            continue;
        }

        // file_names[  N]:
        if (trimmed.starts_with("file_names[")) {
            commitPendingFile();
            auto open = trimmed.find('[');
            auto close = trimmed.find(']');
            if (open == std::string::npos || close == std::string::npos) continue;
            pendingFileIdx = std::stoi(trim(trimmed.substr(open + 1, close - open - 1)));
            continue;
        }

        // Inside a file_names block: "name: ..."
        if (pendingFileIdx >= 0 && trimmed.starts_with("name:")) {
            pendingName = unquote(trim(trimmed.substr(5)));
            continue;
        }

        // Inside a file_names block: "dir_index: N"
        if (pendingFileIdx >= 0 && trimmed.starts_with("dir_index:")) {
            pendingDirIdx = std::stoi(trim(trimmed.substr(10)));
            continue;
        }

        // Address row: "0x<hex>   <line>  <col>  <file> ..."
        if (trimmed.starts_with("0x")) {
            commitPendingFile();
            std::istringstream rowStream(trimmed);
            std::string addrStr;
            int lineNo = 0, col = 0, fileIdx = 0;
            rowStream >> addrStr >> lineNo >> col >> fileIdx;
            if (rowStream.fail()) continue;

            uint64_t addr = 0;
            try { addr = std::stoull(addrStr, nullptr, 16); }
            catch (...) { continue; }

            bool isEndSeq = trimmed.find("end_sequence") != std::string::npos;
            if (isEndSeq) {
                lineMap[addr] = {"", 0, true};
            } else {
                auto file = resolveFile(fileIdx);
                if (!file.empty() && lineNo > 0)
                    lineMap[addr] = {file, lineNo, false};
            }
        }
    }

    commitPendingFile();
    return lineMap;
}

// ── Line table lookup (range-based) ────────────────────────────────────────────

static std::pair<std::string, int> lookupLine(
    uint64_t addr, const std::map<uint64_t, LineTableEntry>& lineMap) {
    if (lineMap.empty()) return {"", 0};
    auto it = lineMap.upper_bound(addr);
    if (it == lineMap.begin()) return {"", 0};
    --it;
    if (it->second.endSequence) return {"", 0};
    return {it->second.file, it->second.line};
}

// ── Count lines in a file ──────────────────────────────────────────────────────

static int countFileLines(const std::string& path) {
    std::ifstream f(path);
    if (!f) return 0;
    int count = 0;
    std::string line;
    while (std::getline(f, line)) ++count;
    return count;
}

// ── Build the data.json structure ──────────────────────────────────────────────

json buildDataJson(
    const std::vector<Function>& functions,
    const std::map<uint64_t, LineTableEntry>& lineMap,
    const std::unordered_map<std::string, std::string>& sourceMapping) {

    // Reverse map: file → (line → sorted list of instruction addresses)
    std::map<std::string, std::map<int, std::vector<uint64_t>>> sourceInfo;

    json memoryOrderBlocks = json::array();
    json functionInfos = json::array();
    std::vector<int>      blockHeights;
    std::vector<bool>     builtInBlock;
    std::vector<uint64_t> blockStartAddr;
    std::vector<int>      blockLoopIndents;
    std::vector<json>     blockTypes;

    for (const auto& func : functions) {
        if (func.instructions.empty()) continue;

        std::string blockName = func.name + ": B0";
        json instructions = json::array();

        for (const auto& inst : func.instructions) {
            auto [file, lineNo] = lookupLine(inst.address, lineMap);
            json correspondence = json::object();
            if (!file.empty() && lineNo > 0) {
                correspondence[file] = json::array({lineNo});
                sourceInfo[file][lineNo].push_back(inst.address);
            }
            instructions.push_back({
                {"address", inst.address},
                {"instruction", inst.text},
                {"flags", json::array()},
                {"correspondence", correspondence}
            });
        }

        uint64_t startAddr = func.startAddress;
        uint64_t endAddr   = func.endAddress;
        int nInst = static_cast<int>(func.instructions.size());

        memoryOrderBlocks.push_back({
            {"name", blockName},
            {"function_name", func.name},
            {"block_type", "normal"},
            {"backedges", json::array()},
            {"next_block_numbers", json::array()},
            {"start_address", startAddr},
            {"end_address", endAddr},
            {"n_instructions", nInst},
            {"is_loop_header", false},
            {"instructions", instructions},
            {"loops", json::array()},
            {"hidables", json::array()}
        });

        blockHeights.push_back(nInst);
        builtInBlock.push_back(false);
        blockStartAddr.push_back(startAddr);
        blockLoopIndents.push_back(0);
        blockTypes.push_back(json::array({"normal"}));

        // Function source info from first instruction with a correspondence
        std::string funcFile;
        int funcLine = 0;
        for (const auto& inst : func.instructions) {
            auto [f, l] = lookupLine(inst.address, lineMap);
            if (!f.empty() && l > 0) { funcFile = f; funcLine = l; break; }
        }

        functionInfos.push_back({
            {"name", func.name},
            {"entry", startAddr},
            {"basic_blocks", json::array({blockName})},
            {"is_builtin", false},
            {"call_graph_in_degree", 0},
            {"call_graph_out_degree", 0},
            {"source_info", {
                {"file", funcFile},
                {"line", funcLine},
                {"return_type", ""},
                {"parameters", json::array()}
            }},
            {"local_vars", json::array()},
            {"params", json::array()},
            {"calls", json::array()},
            {"inlines", json::array()},
            {"loops", json::array()},
            {"hidables", json::array()}
        });
    }

    // Build source_code_info
    json sourceCodeInfo = json::array();
    for (const auto& [file, lineAddrs] : sourceInfo) {
        int totalLines = countFileLines(file);

        json copiedPath = json(nullptr);
        auto smIt = sourceMapping.find(file);
        if (smIt != sourceMapping.end())
            copiedPath = smIt->second;
        // Also try canonical path
        if (copiedPath.is_null()) {
            try {
                auto canonical = fs::weakly_canonical(file).string();
                smIt = sourceMapping.find(canonical);
                if (smIt != sourceMapping.end())
                    copiedPath = smIt->second;
            } catch (...) {}
        }

        json lines = json::array();
        for (const auto& [lineNo, addrs] : lineAddrs) {
            lines.push_back({
                {"line", lineNo},
                {"flags", json::array()},
                {"correspondences", addrs},
                {"inline_tree", json::array()}
            });
        }

        sourceCodeInfo.push_back({
            {"file", file},
            {"total_lines", totalLines},
            {"copied_path", copiedPath},
            {"lines", lines}
        });
    }

    // Minimap
    json minimapData = {
        {"block_heights", blockHeights},
        {"built_in_block", builtInBlock},
        {"block_start_address", blockStartAddr},
        {"block_loop_indents", blockLoopIndents},
        {"block_types", blockTypes}
    };

    // Timestamp
    auto now = std::chrono::system_clock::now();
    auto t = std::chrono::system_clock::to_time_t(now);
    std::tm tm{};
    localtime_r(&t, &tm);
    char dateBuf[16], timeBuf[16];
    std::strftime(dateBuf, sizeof(dateBuf), "%Y-%m-%d", &tm);
    std::strftime(timeBuf, sizeof(timeBuf), "%H:%M:%S", &tm);

    return {
        {"metadata", {
            {"architecture", "unknown"},
            {"date", dateBuf},
            {"time", timeBuf},
            {"compiler", "unknown"},
            {"flags", json::array()}
        }},
        {"disassembly", {
            {"memory_order_blocks", memoryOrderBlocks},
            {"loop_order_blocks", memoryOrderBlocks}
        }},
        {"minimap", {
            {"memory_order", minimapData},
            {"loop_order", minimapData}
        }},
        {"source_code_info", sourceCodeInfo},
        {"functionInfos", functionInfos}
    };
}

// ── Archive creation ───────────────────────────────────────────────────────────

static std::string generateUniqueFilename(
    const std::string& filename, const std::unordered_set<std::string>& used) {
    if (!used.count(filename)) return filename;
    auto dot = filename.find_last_of('.');
    auto base = (dot != std::string::npos) ? filename.substr(0, dot) : filename;
    auto ext  = (dot != std::string::npos) ? filename.substr(dot)    : "";
    for (int i = 1; ; ++i) {
        auto candidate = base + "_" + std::to_string(i) + ext;
        if (!used.count(candidate)) return candidate;
    }
}

static bool addFileToArchive(
    struct archive* a, const fs::path& filePath, const std::string& archivePath) {
    auto* entry = archive_entry_new();
    if (!entry) return false;
    try {
        archive_entry_set_pathname(entry, archivePath.c_str());
        archive_entry_set_size(entry, static_cast<int64_t>(fs::file_size(filePath)));
        archive_entry_set_filetype(entry, AE_IFREG);
        archive_entry_set_perm(entry, 0644);
        if (archive_write_header(a, entry) != ARCHIVE_OK) {
            archive_entry_free(entry);
            return false;
        }
        std::ifstream file(filePath, std::ios::binary);
        if (!file) { archive_entry_free(entry); return false; }
        char buf[8192];
        while (file.read(buf, sizeof(buf)) || file.gcount() > 0)
            archive_write_data(a, buf, file.gcount());
        archive_entry_free(entry);
        return true;
    } catch (...) {
        archive_entry_free(entry);
        return false;
    }
}

std::unordered_map<std::string, std::string> createDisVizArchive(
    const std::vector<std::string>& sourceFiles,
    const fs::path& outputPath,
    const std::string& binaryName,
    const json& dataJson) {

    std::unordered_set<std::string> usedNames;
    std::unordered_map<std::string, std::string> sourceMapping;
    auto disvizPath = outputPath / (binaryName + ".disviz");

    auto* a = archive_write_new();
    if (!a) {
        std::cerr << "Error: Failed to create archive\n";
        return sourceMapping;
    }
    archive_write_add_filter_gzip(a);
    archive_write_set_format_pax_restricted(a);
    if (archive_write_open_filename(a, disvizPath.string().c_str()) != ARCHIVE_OK) {
        std::cerr << "Error: Cannot create " << disvizPath << "\n";
        archive_write_free(a);
        return sourceMapping;
    }

    // Write data.json
    {
        auto* entry = archive_entry_new();
        auto jsonStr = dataJson.dump(2);
        archive_entry_set_pathname(entry, "data.json");
        archive_entry_set_size(entry, static_cast<int64_t>(jsonStr.size()));
        archive_entry_set_filetype(entry, AE_IFREG);
        archive_entry_set_perm(entry, 0644);
        if (archive_write_header(a, entry) == ARCHIVE_OK)
            archive_write_data(a, jsonStr.c_str(), jsonStr.size());
        archive_entry_free(entry);
    }

    // Add source files
    for (const auto& srcFile : sourceFiles) {
        if (!fs::exists(srcFile)) continue;
        auto origName = fs::path(srcFile).filename().string();
        auto uniqueName = generateUniqueFilename(origName, usedNames);
        usedNames.insert(uniqueName);
        auto archivePath = "sources/" + uniqueName;
        if (addFileToArchive(a, srcFile, archivePath)) {
            sourceMapping[srcFile] = archivePath;
            try {
                auto canonical = fs::weakly_canonical(srcFile).string();
                if (canonical != srcFile)
                    sourceMapping[canonical] = archivePath;
            } catch (...) {}
        }
    }

    archive_write_close(a);
    archive_write_free(a);
    return sourceMapping;
}

// ── Architecture detection ─────────────────────────────────────────────────────

static std::string detectArchitecture(const std::string& binaryPath) {
    try {
        auto output = runCommand("file \"" + binaryPath + "\"");
        if (output.find("x86-64") != std::string::npos)   return "x86_64";
        if (output.find("Intel 80386") != std::string::npos) return "i386";
        if (output.find("aarch64") != std::string::npos)  return "aarch64";
        if (output.find("ARM") != std::string::npos)      return "arm";
        if (output.find("PowerPC") != std::string::npos)  return "ppc64";
    } catch (...) {}
    return "unknown";
}

// ── Main ───────────────────────────────────────────────────────────────────────

int main(int argc, char* argv[]) {
    std::vector<std::string> binaryPaths;
    std::string outputDir = ".";

    po::options_description desc(
        "dis-viz-dwarfdump: Generate .disviz files using llvm-dwarfdump + objdump\n"
        "Requires 'objdump' and 'llvm-dwarfdump' on PATH.\n\n"
        "Options");
    desc.add_options()
        ("help,h", "Show this help message")
        ("binary-paths,b", po::value(&binaryPaths)->multitoken(),
            "One or more binary files to analyze (compiled with -g)")
        ("output-dir,o", po::value(&outputDir)->default_value("."),
            "Output directory for .disviz files");

    try {
        po::variables_map vm;
        po::store(po::command_line_parser(argc, argv).options(desc).run(), vm);
        po::notify(vm);

        if (vm.count("help")) {
            std::cout << desc << "\n";
            return 0;
        }
        if (binaryPaths.empty()) {
            std::cerr << "Error: No binary paths specified.\n\n" << desc << "\n";
            return 1;
        }

        auto outputPath = fs::path(outputDir);
        fs::create_directories(outputPath);

        for (const auto& binaryPath : binaryPaths) {
            if (!fs::is_regular_file(binaryPath)) {
                std::cerr << "Skipping (not a regular file): " << binaryPath << "\n";
                continue;
            }

            std::cout << "Processing: " << binaryPath << "\n";
            auto binaryName = fs::path(binaryPath).filename().string();
            auto arch = detectArchitecture(binaryPath);

            std::cout << "  Disassembling with objdump...\n";
            auto functions = parseObjdump(binaryPath);
            std::cout << "  Found " << functions.size() << " functions\n";

            std::cout << "  Reading line table with llvm-dwarfdump...\n";
            auto lineMap = parseDwarfdumpLineTable(binaryPath);
            std::cout << "  Found " << lineMap.size() << " line table entries\n";

            // Collect unique source files from the line table
            std::unordered_set<std::string> srcSet;
            for (const auto& [addr, entry] : lineMap)
                if (!entry.endSequence && !entry.file.empty())
                    srcSet.insert(entry.file);
            std::vector<std::string> sourceFiles(srcSet.begin(), srcSet.end());
            std::sort(sourceFiles.begin(), sourceFiles.end());

            // First pass: build JSON without source-archive mapping
            std::unordered_map<std::string, std::string> emptyMapping;
            auto dataJson = buildDataJson(functions, lineMap, emptyMapping);
            dataJson["metadata"]["architecture"] = arch;

            // Create archive and get the mapping of source paths → archive paths
            auto sourceMapping = createDisVizArchive(
                sourceFiles, outputPath, binaryName, dataJson);

            // Second pass: rebuild JSON with correct copied_path values
            dataJson = buildDataJson(functions, lineMap, sourceMapping);
            dataJson["metadata"]["architecture"] = arch;
            createDisVizArchive(sourceFiles, outputPath, binaryName, dataJson);

            std::cout << "  Created: "
                      << (outputPath / (binaryName + ".disviz")).string() << "\n";
        }

        std::cout << "Done.\n";
        return 0;
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << "\n";
        return 1;
    }
}
