#include <boost/program_options.hpp>
#include <boost/program_options/option.hpp>
#include <unordered_map>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <string>
#include <vector>
#include <unordered_set>

#include <nlohmann/json.hpp>
#include <dyninst_wrapper.hpp>

using json = nlohmann::json;
namespace po = boost::program_options;

auto SOURCE_TAGS_TO_STR = std::unordered_map<SOURCE_CODE_FLAGS, std::string>(
    {{SOURCE_CODE_FLAGS::SOURCE_CODE_INLINE, "INLINE"},
     {SOURCE_CODE_FLAGS::SOURCE_CODE_VECTORIZED, "VECTORIZED"},
     {SOURCE_CODE_FLAGS::SOURCE_CODE_MEMORY_READ, "MEMORY_READ"},
     {SOURCE_CODE_FLAGS::SOURCE_CODE_MEMORY_WRITE, "MEMORY_WRITE"},
     {SOURCE_CODE_FLAGS::SOURCE_CODE_CALL, "CALL"},
     {SOURCE_CODE_FLAGS::SOURCE_CODE_SYSCALL, "SYSCALL"},
     {SOURCE_CODE_FLAGS::SOURCE_CODE_FP, "FP"},
     {SOURCE_CODE_FLAGS::SOURCE_CODE_HOISTED, "HOISTED"}});

// JSON converter functions for nlohmann/json (renamed to avoid conflicts)
json convertMinimapInfoNlohmann(const MinimapInfo &minimap) {
    json result;
    result["block_heights"] = minimap.block_heights;
    result["built_in_block"] = minimap.built_in_blocks;
    result["block_start_address"] = minimap.block_start_address;
    result["block_loop_indents"] = minimap.block_loop_indents;
    result["block_types"] = minimap.block_types;
    return result;
}

json convertInstructionInfoNlohmann(const InstructionInfo &instruction) {
    json result;
    result["address"] = instruction.address;
    result["instruction"] = instruction.instruction;
    
    if (!instruction.correspondence.empty()) {
        result["correspondence"] = instruction.correspondence;
    }
    
    std::vector<std::string> flags;
    for (const auto &flag : instruction.flags) {
        // Map instruction flags to strings
        switch(flag) {
            case INST_VECTORIZED: flags.push_back("VECTORIZED"); break;
            case INST_MEMORY_READ: flags.push_back("MEMORY_READ"); break;
            case INST_MEMORY_WRITE: flags.push_back("MEMORY_WRITE"); break;
            case INST_CALL: flags.push_back("CALL"); break;
            case INST_SYSCALL: flags.push_back("SYSCALL"); break;
            case INST_FP: flags.push_back("FP"); break;
            case INST_HOISTED: flags.push_back("HOISTED"); break;
            case INST_BRANCH: flags.push_back("BRANCH"); break;
        }
    }
    result["flags"] = flags;
    
    return result;
}

json convertBlockLoopStateNlohmann(const BlockLoopState &loopState) {
    json result;
    result["name"] = loopState.name;
    result["loop_count"] = loopState.loopCount;
    result["loop_total"] = loopState.loopTotal;
    return result;
}

json convertBlockInfoNlohmann(const BlockInfo &block) {
    json result;
    result["name"] = block.name;
    result["function_name"] = block.functionName;
    
    json instructions = json::array();
    for (const auto &instruction : block.instructions) {
        instructions.push_back(convertInstructionInfoNlohmann(instruction));
    }
    result["instructions"] = instructions;
    
    json loops = json::array();
    for (const auto &loop : block.loops) {
        loops.push_back(convertBlockLoopStateNlohmann(loop));
    }
    result["loops"] = loops;
    
    if (block.block_type == BlockInfo::BLOCK_TYPE_NORMAL)
        result["block_type"] = "normal";
    else if (block.block_type == BlockInfo::BLOCK_TYPE_PSEUDOLOOP)
        result["block_type"] = "pseudoloop";
    
    result["backedges"] = block.backedges;
    
    if (!block.hidables.empty()) {
        json hidables = json::array();
        for (const auto &hidable : block.hidables) {
            hidables.push_back({
                {"name", hidable.name},
                {"start_address", hidable.start},
                {"end_address", hidable.end}
            });
        }
        result["hidables"] = hidables;
    }
    
    result["next_block_numbers"] = block.nextBlockNames;
    result["start_address"] = block.startAddress;
    result["end_address"] = block.endAddress;
    result["n_instructions"] = block.nInstructions;
    result["is_loop_header"] = block.isLoopHeader;
    
    return result;
}

json convertSourceCodeInfoNlohmann(const std::unordered_map<std::string, SourceCodeInfo> &sourceCodeInfo) {
    json result = json::array();
    for (const auto &[file, info] : sourceCodeInfo) {
        json file_info;
        file_info["file"] = file;
        file_info["total_lines"] = info.total_lines;
        
        json lines = json::array();
        for (const auto &[line_no, flags] : info.lines) {
            json line_flags = json::array();
            for (const auto &flag : flags) {
                line_flags.push_back(SOURCE_TAGS_TO_STR.at(flag));
            }
            lines.push_back({
                {"line", line_no},
                {"flags", line_flags}
            });
        }
        file_info["lines"] = lines;
        result.push_back(file_info);
    }
    return result;
}

json convertBinaryCacheNlohmann(const BinaryCacheResult *res) {
    json result;
    
    // Convert disassembly blocks
    json memory_order_blocks = json::array();
    for (const auto &block : res->disassembly.memory_order_blocks) {
        memory_order_blocks.push_back(convertBlockInfoNlohmann(block));
    }
    
    json loop_order_blocks = json::array();
    for (const auto &block : res->disassembly.loop_order_blocks) {
        loop_order_blocks.push_back(convertBlockInfoNlohmann(block));
    }
    
    result["disassembly"] = {
        {"memory_order_blocks", memory_order_blocks},
        {"loop_order_blocks", loop_order_blocks}
    };
    
    // Convert minimap
    result["minimap"] = {
        {"memory_order", convertMinimapInfoNlohmann(res->minimap.memory_order)},
        {"loop_order", convertMinimapInfoNlohmann(res->minimap.loop_order)}
    };
    
    result["source_files"] = res->source_files;
    result["correspondences"] = res->correspondences;
    
    // Add source code info
    result["source_code_info"] = convertSourceCodeInfoNlohmann(res->sourceCodeInfo);
    
    return result;
}

std::string generateUniqueFilename(const std::string &filename, const std::unordered_set<std::string> &used_names) {
    if (used_names.find(filename) == used_names.end()) {
        return filename;
    }
    
    // Extract base name and extension
    auto dot_pos = filename.find_last_of('.');
    std::string base = (dot_pos != std::string::npos) ? filename.substr(0, dot_pos) : filename;
    std::string ext = (dot_pos != std::string::npos) ? filename.substr(dot_pos) : "";
    
    int counter = 1;
    std::string new_name;
    do {
        new_name = base + "_" + std::to_string(counter) + ext;
        counter++;
    } while (used_names.find(new_name) != used_names.end());
    
    return new_name;
}

void copySourceFiles(const std::vector<std::string> &source_files, 
                     const std::filesystem::path &output_dir,
                     json &source_mapping) {
    auto sources_dir = output_dir / "sources";
    std::filesystem::create_directories(sources_dir);
    
    std::unordered_set<std::string> used_names;
    
    for (const auto &source_file : source_files) {
        if (!std::filesystem::exists(source_file)) {
            std::cerr << "Warning: Source file not found: " << source_file << std::endl;
            continue;
        }
        
        auto original_filename = std::filesystem::path(source_file).filename().string();
        auto unique_filename = generateUniqueFilename(original_filename, used_names);
        used_names.insert(unique_filename);
        
        auto dest_path = sources_dir / unique_filename;
        
        try {
            std::filesystem::copy_file(source_file, dest_path);
            source_mapping[source_file] = "sources/" + unique_filename;
        } catch (const std::filesystem::filesystem_error &e) {
            std::cerr << "Error copying " << source_file << ": " << e.what() << std::endl;
        }
    }
}

int main(int argc, char *argv[]) {
    auto binary_paths = std::vector<std::string>();
    auto binary_paths_file = std::string();
    auto output_dir = std::string(".");

    auto desc = po::options_description("Allowed options");
    desc.add_options()
        ("help", "produce help message")
        ("binary-paths,b", po::value(&binary_paths), "The paths to binary files to analyze")
        ("binary-paths-file,c", po::value(&binary_paths_file), "A file containing the paths to binary files to analyze")
        ("output-dir,o", po::value(&output_dir)->default_value("."), "Output directory for JSON files");

    auto vm = po::variables_map();
    po::store(po::command_line_parser(argc, argv).options(desc).run(), vm);
    po::notify(vm);

    if (vm.count("help")) {
        std::cout << desc << std::endl;
        return 0;
    }

    // Read all lines from binary_paths_file and append them to binary_paths
    if (!binary_paths_file.empty()) {
        auto binary_paths_file_stream = std::ifstream(binary_paths_file);
        auto line = std::string();
        while (std::getline(binary_paths_file_stream, line)) {
            binary_paths.push_back(line);
        }
    }

    if (binary_paths.empty()) {
        std::cerr << "Error: No binary paths specified. Use --binary-paths or --binary-paths-file." << std::endl;
        return 1;
    }

    // Create output directory
    auto output_path = std::filesystem::path(output_dir);
    std::filesystem::create_directories(output_path);

    // Process binaries
    auto binaryList = std::vector<std::pair<std::string, std::string>>();
    for (const auto &binary_path : binary_paths) {
        // Check if binary_path is a directory or a file
        if (std::filesystem::is_directory(binary_path)) {
            for (const auto &entry : std::filesystem::directory_iterator(binary_path)) {
                if (isParsable(entry.path().string()))
                    binaryList.push_back({entry.path().filename().string(), entry.path().string()});
            }
        } else {
            if (!isParsable(binary_path))
                continue;
            binaryList.push_back({std::filesystem::path(binary_path).filename().string(), binary_path});
        }
    }

    // Process each binary
    for (const auto &[binary_name, binary_path] : binaryList) {
        std::cout << "Processing: " << binary_path << std::endl;
        
        // Get binary cache result
        auto binary_result = decodeBinaryCache(binary_path);
        if (!binary_result) {
            std::cerr << "Failed to process binary: " << binary_path << std::endl;
            continue;
        }
        
        // Convert to JSON
        auto binary_json = convertBinaryCacheNlohmann(binary_result);
        
        // Save binary data as JSON
        auto binary_json_filename = binary_name + ".json";
        auto binary_json_path = output_path / binary_json_filename;
        std::ofstream binary_json_file(binary_json_path);
        binary_json_file << binary_json.dump(2) << std::endl;
        binary_json_file.close();
        
        std::cout << "Saved binary data to: " << binary_json_path << std::endl;
        
        // Copy source files and create mapping
        json source_mapping = json::object();
        copySourceFiles(binary_result->source_files, output_path, source_mapping);
        
        // Save source mapping
        auto mapping_filename = binary_name + "_source_mapping.json";
        auto mapping_path = output_path / mapping_filename;
        std::ofstream mapping_file(mapping_path);
        mapping_file << source_mapping.dump(2) << std::endl;
        mapping_file.close();
        
        std::cout << "Saved source mapping to: " << mapping_path << std::endl;
        std::cout << "Copied " << source_mapping.size() << " source files to sources/ directory" << std::endl;
    }
    
    std::cout << "Processing complete!" << std::endl;
    return 0;
}