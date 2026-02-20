#include <boost/program_options.hpp>
#include <boost/program_options/option.hpp>
#include <unordered_map>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <string>
#include <vector>
#include <unordered_set>
#include <chrono>
#include <iomanip>
#include <sstream>

#include <nlohmann/json.hpp>
#include <dyninst_wrapper.hpp>
#include <archive.h>
#include <archive_entry.h>

using json = nlohmann::json;
namespace po = boost::program_options;
namespace fs = std::filesystem;

auto SOURCE_TAGS_TO_STR = std::unordered_map<SOURCE_CODE_FLAGS, std::string>(
    {{SOURCE_CODE_FLAGS::SOURCE_CODE_INLINE, "INLINE"},
     {SOURCE_CODE_FLAGS::SOURCE_CODE_VECTORIZED, "VECTORIZED"},
     {SOURCE_CODE_FLAGS::SOURCE_CODE_MEMORY_READ, "MEMORY_READ"},
     {SOURCE_CODE_FLAGS::SOURCE_CODE_MEMORY_WRITE, "MEMORY_WRITE"},
     {SOURCE_CODE_FLAGS::SOURCE_CODE_CALL, "CALL"},
     {SOURCE_CODE_FLAGS::SOURCE_CODE_SYSCALL, "SYSCALL"},
     {SOURCE_CODE_FLAGS::SOURCE_CODE_FP, "FP"},
     {SOURCE_CODE_FLAGS::SOURCE_CODE_HOISTED, "HOISTED"}});

// Helper function to find copied path for a given source file
std::string findCopiedPath(const std::string& source_file, 
                          const std::unordered_map<std::string, std::string>& source_mapping) {
    // Try exact match first
    auto it = source_mapping.find(source_file);
    if (it != source_mapping.end()) {
        return it->second;
    }
    
    // Try normalized path if exact match fails
    try {
        const auto normalized_file = fs::weakly_canonical(source_file).string();
        it = source_mapping.find(normalized_file);
        if (it != source_mapping.end()) {
            return it->second;
        }
    } catch (const fs::filesystem_error&) {
        // Ignore normalization errors
    }
    
    return {}; // Return empty string if no mapping found
}

// Helper function to convert instruction flags to strings
std::vector<std::string> convertInstructionFlags(const std::unordered_set<INSTRUCTION_FLAGS>& flags) {
    std::vector<std::string> result;
    result.reserve(flags.size());
    
    for (const auto& flag : flags) {
        switch(flag) {
            case INST_VECTORIZED: result.emplace_back("VECTORIZED"); break;
            case INST_MEMORY_READ: result.emplace_back("MEMORY_READ"); break;
            case INST_MEMORY_WRITE: result.emplace_back("MEMORY_WRITE"); break;
            case INST_CALL: result.emplace_back("CALL"); break;
            case INST_SYSCALL: result.emplace_back("SYSCALL"); break;
            case INST_FP: result.emplace_back("FP"); break;
            case INST_HOISTED: result.emplace_back("HOISTED"); break;
            case INST_BRANCH: result.emplace_back("BRANCH"); break;
            case INST_INLINE: result.emplace_back("INLINE"); break;
        }
    }
    
    return result;
}

// Helper function to get correspondences for a specific file and line
json getLineCorrespondences(const std::string& file, int line_no,
                           const std::unordered_map<std::string, std::map<int, std::vector<unsigned long>>>& correspondences) {
    json line_correspondences = json::array();
    
    const auto file_it = correspondences.find(file);
    if (file_it != correspondences.end()) {
        const auto line_it = file_it->second.find(line_no);
        if (line_it != file_it->second.end()) {
            line_correspondences = json(line_it->second);
        }
    }
    
    return line_correspondences;
}

json convertInlineEntryNlohmann(const InlineEntry& inlineEntry) {
    json result{
        {"name", inlineEntry.name},
        {"simplified_name", inlineEntry.simplified_name},
        {"callsite_file", inlineEntry.callsite_file},
        {"callsite_line", inlineEntry.callsite_line}
    };
    
    // Convert ranges array
    json ranges = json::array();
    for (const auto& range : inlineEntry.ranges) {
        ranges.emplace_back(json{
            {"start", range.first},
            {"end", range.second}
        });
    }
    result["ranges"] = std::move(ranges);
    
    // Convert children recursively
    if (!inlineEntry.children.empty()) {
        json children = json::array();
        for (const auto& child : inlineEntry.children) {
            children.emplace_back(convertInlineEntryNlohmann(child));
        }
        result["children"] = std::move(children);
    }
    
    return result;
}

json convertInlineTreeNlohmann(const std::vector<InlineEntry>& inlineTree) {
    json result = json::array();
    for (const auto& entry : inlineTree) {
        result.emplace_back(convertInlineEntryNlohmann(entry));
    }
    return result;
}

json convertMinimapInfoNlohmann(const MinimapInfo& minimap) {
    return json{
        {"block_heights", minimap.block_heights},
        {"built_in_block", minimap.built_in_blocks},
        {"block_start_address", minimap.block_start_address},
        {"block_loop_indents", minimap.block_loop_indents},
        {"block_types", minimap.block_types}
    };
}

json convertInstructionInfoNlohmann(const InstructionInfo& instruction) {
    json result{
        {"address", instruction.address},
        {"instruction", instruction.instruction},
        {"flags", convertInstructionFlags(instruction.flags)}
    };
    
    if (!instruction.correspondence.empty()) {
        result["correspondence"] = instruction.correspondence;
    }

    return result;
}

json convertBlockLoopStateNlohmann(const BlockLoopState& loopState) {
    return json{
        {"name", loopState.name},
        {"loop_count", loopState.loopCount},
        {"loop_total", loopState.loopTotal}
    };
}

json convertBlockInfoNlohmann(const BlockInfo& block) {
    json result{
        {"name", block.name},
        {"function_name", block.functionName},
        {"block_type", (block.block_type == BlockInfo::BLOCK_TYPE_NORMAL) ? "normal" : "pseudoloop"},
        {"backedges", block.backedges},
        {"next_block_numbers", block.nextBlockNames},
        {"start_address", block.startAddress},
        {"end_address", block.endAddress},
        {"n_instructions", block.nInstructions},
        {"is_loop_header", block.isLoopHeader}
    };
    
    // Convert instructions
    json instructions = json::array();
    for (const auto& instruction : block.instructions) {
        instructions.emplace_back(convertInstructionInfoNlohmann(instruction));
    }
    result["instructions"] = std::move(instructions);
    
    // Convert loops
    json loops = json::array();
    for (const auto& loop : block.loops) {
        loops.emplace_back(convertBlockLoopStateNlohmann(loop));
    }
    result["loops"] = std::move(loops);
    
    // Convert hidables if present
    if (!block.hidables.empty()) {
        json hidables = json::array();
        for (const auto& hidable : block.hidables) {
            hidables.emplace_back(json{
                {"name", hidable.name},
                {"start_address", hidable.start},
                {"end_address", hidable.end}
            });
        }
        result["hidables"] = std::move(hidables);
    }
    
    return result;
}

json convertSourceCodeInfoNlohmann(const std::unordered_map<std::string, SourceCodeInfo>& sourceCodeInfo, 
                                   const std::unordered_map<std::string, std::map<int, std::vector<unsigned long>>>& correspondences,
                                   const std::vector<std::string>& all_source_files,
                                   const std::unordered_map<std::string, std::string>& source_mapping) {
    
    std::unordered_set<std::string> processed_files;
    json result = json::array();
    
    // Process files that have detailed source code info
    for (const auto& [file, info] : sourceCodeInfo) {
        processed_files.insert(file);
        
        const auto copied_path = findCopiedPath(file, source_mapping);
        
        json file_info{
            {"file", file},
            {"total_lines", info.total_lines},
            {"copied_path", copied_path.empty() ? json(nullptr) : json(copied_path)}
        };
        
        json lines = json::array();
        
        for (const auto& [line_no, lineInfo] : info.lines) {
            json line_flags = json::array();
            for (const auto& flag : lineInfo.flags) {
                line_flags.emplace_back(SOURCE_TAGS_TO_STR.at(flag));
            }
            
            lines.emplace_back(json{
                {"line", line_no},
                {"flags", std::move(line_flags)},
                {"correspondences", getLineCorrespondences(file, line_no, correspondences)},
                {"inline_tree", convertInlineTreeNlohmann(lineInfo.inlineTree)}
            });
        }
        
        file_info["lines"] = std::move(lines);
        result.emplace_back(std::move(file_info));
    }
    
    // Process files without detailed source code info
    for (const auto& file : all_source_files) {
        if (processed_files.find(file) == processed_files.end()) {
            const auto copied_path = findCopiedPath(file, source_mapping);
            
            json file_info{
                {"file", file},
                {"total_lines", 0},
                {"copied_path", copied_path.empty() ? json(nullptr) : json(copied_path)}
            };
            
            // Check for correspondences even without detailed source info
            json lines = json::array();
            const auto file_it = correspondences.find(file);
            if (file_it != correspondences.end()) {
                for (const auto& [line_no, addresses] : file_it->second) {
                    lines.emplace_back(json{
                        {"line", line_no},
                        {"flags", json::array()},
                        {"correspondences", json(addresses)}
                    });
                }
            }
            
            file_info["lines"] = std::move(lines);
            result.emplace_back(std::move(file_info));
        }
    }
    
    return result;
}

json convertVariableInfoNlohmann(const VariableInfo& var) {
    json result{
        {"name", var.name},
        {"file", var.file},
        {"line", var.line},
        {"var_type", (var.var_type == VariableInfo::VAR_TYPE_LOCAL) ? "local" : "param"}
    };
    
    // Convert locations
    json locations = json::array();
    for (const auto& loc : var.locations) {
        locations.emplace_back(json{
            {"start", loc.start},
            {"end", loc.end},
            {"location", loc.location}
        });
    }
    result["locations"] = std::move(locations);
    
    return result;
}

json convertCallNlohmann(const Call& call) {
    return json{
        {"address", call.address},
        {"target", call.target},
        {"target_func_names", call.targetFuncNames}
    };
}

json convertLoopEntryNlohmann(const LoopEntry& loop) {
    json result{
        {"name", loop.name},
        {"header_block", loop.header_block},
        {"latch_block", loop.latch_block},
        {"blocks", loop.blocks}
    };
    
    // Convert backedges
    json backedges = json::array();
    for (const auto& backedge : loop.backedges) {
        backedges.emplace_back(json{
            {"from", backedge.first},
            {"to", backedge.second}
        });
    }
    result["backedges"] = std::move(backedges);
    
    // Convert nested loops recursively
    if (!loop.loops.empty()) {
        json nested_loops = json::array();
        for (const auto& nested_loop : loop.loops) {
            nested_loops.emplace_back(convertLoopEntryNlohmann(nested_loop));
        }
        result["loops"] = std::move(nested_loops);
    }
    
    return result;
}

json convertHidableNlohmann(const Hidable& hidable) {
    return json{
        {"name", hidable.name},
        {"start", hidable.start},
        {"end", hidable.end}
    };
}

json convertFunctionInfoNlohmann(const FunctionInfo& func) {
    json result{
        {"name", func.name},
        {"entry", func.entry},
        {"basic_blocks", func.basic_blocks},
        {"is_builtin", func.is_builtin},
        {"call_graph_in_degree", func.call_graph_in_degree},
        {"call_graph_out_degree", func.call_graph_out_degree}
    };
    
    // Convert source info
    json source_info{
        {"file", func.source_info.file},
        {"line", func.source_info.line},
        {"return_type", func.source_info.returnType}
    };
    
    json source_params = json::array();
    for (const auto& param : func.source_info.parameters) {
        source_params.emplace_back(json{
            {"type", param.type},
            {"name", param.name}
        });
    }
    source_info["parameters"] = std::move(source_params);
    result["source_info"] = std::move(source_info);
    
    // Convert local variables
    json local_vars = json::array();
    for (const auto& var : func.localVars) {
        local_vars.emplace_back(convertVariableInfoNlohmann(var));
    }
    result["local_vars"] = std::move(local_vars);
    
    // Convert parameters
    json params = json::array();
    for (const auto& param : func.params) {
        params.emplace_back(convertVariableInfoNlohmann(param));
    }
    result["params"] = std::move(params);
    
    // Convert calls
    json calls = json::array();
    for (const auto& call : func.calls) {
        calls.emplace_back(convertCallNlohmann(call));
    }
    result["calls"] = std::move(calls);
    
    // Convert inlines
    json inlines = json::array();
    for (const auto& inline_entry : func.inlines) {
        inlines.emplace_back(convertInlineEntryNlohmann(inline_entry));
    }
    result["inlines"] = std::move(inlines);
    
    // Convert loops
    json loops = json::array();
    for (const auto& loop : func.loops) {
        loops.emplace_back(convertLoopEntryNlohmann(loop));
    }
    result["loops"] = std::move(loops);
    
    // Convert hidables
    json hidables = json::array();
    for (const auto& hidable : func.hidables) {
        hidables.emplace_back(convertHidableNlohmann(hidable));
    }
    result["hidables"] = std::move(hidables);
    
    return result;
}

json convertBinaryDecodeNlohmann(const BinaryDecodeResult& res, 
                                const std::unordered_map<std::string, std::string>& source_mapping) {
    
    // Convert disassembly blocks
    json memory_order_blocks = json::array();
    for (const auto& block : res.disassembly.memory_order_blocks) {
        memory_order_blocks.emplace_back(convertBlockInfoNlohmann(block));
    }
    
    json loop_order_blocks = json::array();
    for (const auto& block : res.disassembly.loop_order_blocks) {
        loop_order_blocks.emplace_back(convertBlockInfoNlohmann(block));
    }

    return json{
        {"metadata", {
            {"architecture", res.metadata.architecture},
            {"date", res.metadata.analysis_date},
            {"time", res.metadata.analysis_time},
            {"compiler", res.metadata.compiler_used},
            {"flags", res.metadata.compiler_flags}
        }},
        {"disassembly", json{
            {"memory_order_blocks", std::move(memory_order_blocks)},
            {"loop_order_blocks", std::move(loop_order_blocks)}
        }},
        {"minimap", json{
            {"memory_order", convertMinimapInfoNlohmann(res.minimap.memory_order)},
            {"loop_order", convertMinimapInfoNlohmann(res.minimap.loop_order)}
        }},
        {"source_code_info", convertSourceCodeInfoNlohmann(res.sourceCodeInfo, res.correspondences, res.source_files, source_mapping)},
        {"functionInfos", [&res]() {
            json function_infos = json::array();
            for (const auto& func : res.functionInfos) {
                function_infos.emplace_back(convertFunctionInfoNlohmann(func));
            }
            return function_infos;
        }()}
    };
}

std::string generateUniqueFilename(const std::string& filename, const std::unordered_set<std::string>& used_names) {
    if (used_names.find(filename) == used_names.end()) {
        return filename;
    }
    
    const auto dot_pos = filename.find_last_of('.');
    const auto base = (dot_pos != std::string::npos) ? filename.substr(0, dot_pos) : filename;
    const auto ext = (dot_pos != std::string::npos) ? filename.substr(dot_pos) : "";
    
    for (int counter = 1; ; ++counter) {
        const auto new_name = base + "_" + std::to_string(counter) + ext;
        if (used_names.find(new_name) == used_names.end()) {
            return new_name;
        }
    }
}

// Helper function to add a file to tar archive
bool addFileToArchive(struct archive* a, const fs::path& file_path, const std::string& archive_path) {
    struct archive_entry* entry = archive_entry_new();
    if (!entry) {
        return false;
    }
    
    try {
        // Set up the archive entry
        archive_entry_set_pathname(entry, archive_path.c_str());
        archive_entry_set_size(entry, fs::file_size(file_path));
        archive_entry_set_filetype(entry, AE_IFREG);
        archive_entry_set_perm(entry, 0644);
        
        // Write entry header
        if (archive_write_header(a, entry) != ARCHIVE_OK) {
            archive_entry_free(entry);
            return false;
        }
        
        // Write file content
        std::ifstream file(file_path, std::ios::binary);
        if (!file) {
            archive_entry_free(entry);
            return false;
        }
        
        char buffer[8192];
        while (file.read(buffer, sizeof(buffer)) || file.gcount() > 0) {
            archive_write_data(a, buffer, file.gcount());
        }
        
        archive_entry_free(entry);
        return true;
        
    } catch (const std::exception& e) {
        archive_entry_free(entry);
        return false;
    }
}

std::unordered_map<std::string, std::string> createDisVizArchive(
    const std::vector<std::string>& source_files, 
    const fs::path& output_path,
    const std::string& binary_name,
    const json& binary_json) {
    
    std::unordered_set<std::string> used_names;
    std::unordered_map<std::string, std::string> source_mapping;
    source_mapping.reserve(source_files.size() * 2);
    
    std::cout << "Creating .disviz archive for " << source_files.size() << " source files..." << std::endl;
    
    // Create the .disviz file path
    const auto disviz_path = output_path / (binary_name + ".disviz");
    
    // Create archive
    struct archive* a = archive_write_new();
    if (!a) {
        std::cerr << "Error: Failed to create archive" << std::endl;
        return source_mapping;
    }
    
    // Set compression and format
    archive_write_add_filter_gzip(a);
    archive_write_set_format_pax_restricted(a); // Modern tar format
    
    if (archive_write_open_filename(a, disviz_path.string().c_str()) != ARCHIVE_OK) {
        std::cerr << "Error: Cannot create .disviz file: " << disviz_path << std::endl;
        archive_write_free(a);
        return source_mapping;
    }
    
    // Add binary JSON as data.json
    {
        struct archive_entry* entry = archive_entry_new();
        const auto json_str = binary_json.dump(2);
        
        archive_entry_set_pathname(entry, "data.json");
        archive_entry_set_size(entry, json_str.size());
        archive_entry_set_filetype(entry, AE_IFREG);
        archive_entry_set_perm(entry, 0644);
        
        if (archive_write_header(a, entry) == ARCHIVE_OK) {
            archive_write_data(a, json_str.c_str(), json_str.size());
        }
        
        archive_entry_free(entry);
    }
    
    // Add source files
    for (const auto& source_file : source_files) {
        if (!fs::exists(source_file)) {
            std::cerr << "Warning: Source file not found: " << source_file << std::endl;
            continue;
        }
        
        const auto original_filename = fs::path(source_file).filename().string();
        const auto unique_filename = generateUniqueFilename(original_filename, used_names);
        used_names.insert(unique_filename);
        
        const auto archive_path = "sources/" + unique_filename;
        
        if (addFileToArchive(a, source_file, archive_path)) {
            // Store both original and normalized paths
            source_mapping[source_file] = archive_path;
            
            try {
                const auto normalized_source = fs::weakly_canonical(source_file).string();
                if (normalized_source != source_file) {
                    source_mapping[normalized_source] = archive_path;
                }
            } catch (const fs::filesystem_error&) {
                // Ignore normalization errors
            }
        } else {
            std::cerr << "Warning: Failed to add file to archive: " << source_file << std::endl;
        }
    }
    
    // Close archive
    archive_write_close(a);
    archive_write_free(a);
    
    std::cout << "Created " << disviz_path << " with " << source_mapping.size() / 2 << " source files" << std::endl;
    
    return source_mapping;
}

int main(int argc, char* argv[]) {
    std::vector<std::string> binary_paths;
    std::string binary_paths_file;
    std::string output_dir = ".";

    po::options_description desc("Allowed options");
    desc.add_options()
        ("help,h", "produce help message")
        ("binary-paths,b", po::value(&binary_paths), "The paths to binary files to analyze")
        ("binary-paths-file,c", po::value(&binary_paths_file), "A file containing the paths to binary files to analyze")
        ("output-dir,o", po::value(&output_dir)->default_value("."), "Output directory for .disviz files");

    try {
        po::variables_map vm;
        po::store(po::command_line_parser(argc, argv).options(desc).run(), vm);
        po::notify(vm);

        if (vm.count("help")) {
            std::cout << desc << std::endl;
            return 0;
        }

        // Read binary paths from file if specified
        if (!binary_paths_file.empty()) {
            std::ifstream file_stream(binary_paths_file);
            if (!file_stream) {
                std::cerr << "Error: Cannot open binary paths file: " << binary_paths_file << std::endl;
                return 1;
            }
            
            std::string line;
            while (std::getline(file_stream, line)) {
                if (!line.empty()) {
                    binary_paths.emplace_back(std::move(line));
                }
            }
        }

        if (binary_paths.empty()) {
            std::cerr << "Error: No binary paths specified. Use --binary-paths or --binary-paths-file." << std::endl;
            return 1;
        }

        // Create output directory
        const auto output_path = fs::path(output_dir);
        fs::create_directories(output_path);

        // Collect all valid binaries
        std::vector<std::pair<std::string, std::string>> binary_list;
        for (const auto& binary_path : binary_paths) {
            if (fs::is_directory(binary_path)) {
                for (const auto& entry : fs::directory_iterator(binary_path)) {
                    if (entry.is_regular_file() && isParsable(entry.path().string())) {
                        binary_list.emplace_back(entry.path().filename().string(), entry.path().string());
                    }
                }
            } else if (fs::is_regular_file(binary_path) && isParsable(binary_path)) {
                binary_list.emplace_back(fs::path(binary_path).filename().string(), binary_path);
            }
        }

        if (binary_list.empty()) {
            std::cerr << "Error: No parsable binaries found." << std::endl;
            return 1;
        }

        // Process each binary
        for (const auto& [binary_name, binary_path] : binary_list) {
            std::cout << "Processing: " << binary_path << std::endl;
            
            const auto binary_result = decodeBinary(binary_path);
            if (!binary_result) {
                std::cerr << "Failed to process binary: " << binary_path << std::endl;
                continue;
            }
            
            // First create the JSON without source mapping to get initial structure
            std::unordered_map<std::string, std::string> empty_mapping;
            auto binary_json = convertBinaryDecodeNlohmann(*binary_result, empty_mapping);
            
            // Create .disviz archive with source files and get the mapping
            const auto source_mapping = createDisVizArchive(
                binary_result->source_files, 
                output_path, 
                binary_name, 
                binary_json
            );
            
            // Update the JSON with correct source mapping
            binary_json = convertBinaryDecodeNlohmann(*binary_result, source_mapping);
            
            // Recreate the archive with updated JSON
            createDisVizArchive(binary_result->source_files, output_path, binary_name, binary_json);
            
            std::cout << "Saved analysis to: " << output_path / (binary_name + ".disviz") << std::endl;
        }
        
        std::cout << "Processing complete!" << std::endl;
        return 0;
        
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }
}