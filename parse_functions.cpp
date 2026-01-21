#include "parse_source.hpp"
#include <iostream>
#include <fstream>
#include <nlohmann/json.hpp>
#include <filesystem>

using json = nlohmann::json;
namespace fs = std::filesystem;

int main(int argc, char* argv[]) {
    // Path to the source file
    std::string source_file = "sample_inputs/comprehensive_code.cpp";
    
    if (argc > 1) {
        source_file = argv[1];
    }
    
    // Check if file exists
    if (!fs::exists(source_file)) {
        std::cerr << "Error: File not found: " << source_file << std::endl;
        return 1;
    }
    
    std::cout << "Parsing functions from: " << source_file << std::endl;
    
    // Parse the source code
    SourceCodeData data = parseSourceCode(source_file);
    
    std::cout << "Found " << data.functions.size() << " functions" << std::endl;
    
    // Convert functions to JSON
    json functions_json = json::array();
    
    for (const auto& func : data.functions) {
        json func_json;
        func_json["line"] = func.line;
        func_json["name"] = func.name;
        func_json["className"] = func.className;
        func_json["qualifiedName"] = func.qualifiedName;
        func_json["returnType"] = func.returnType;
        func_json["isTemplateSpecialization"] = func.isTemplateSpecialization;
        func_json["isPrimaryTemplate"] = func.isPrimaryTemplate;
        
        // Add parameters
        json params = json::array();
        for (const auto& param : func.parameters) {
            params.push_back(json{
                {"type", param.type},
                {"name", param.name}
            });
        }
        func_json["parameters"] = params;
        
        functions_json.push_back(func_json);
    }
    
    // Create output JSON
    json output = json{
        {"source_file", source_file},
        {"total_functions", data.functions.size()},
        {"functions", functions_json}
    };
    
    // Save to file in dis-viz folder
    std::string output_file = "comprehensive_code_functions.json";
    std::ofstream out(output_file);
    if (!out.is_open()) {
        std::cerr << "Error: Cannot create output file: " << output_file << std::endl;
        return 1;
    }
    
    out << output.dump(2) << std::endl;
    out.close();
    
    std::cout << "Saved parsed functions to: " << output_file << std::endl;
    
    // Save function names to .txt file
    std::string txt_output_file = "comprehensive_code_functions.txt";
    std::ofstream txt_out(txt_output_file);
    if (!txt_out.is_open()) {
        std::cerr << "Error: Cannot create output file: " << txt_output_file << std::endl;
        return 1;
    }
    
    for (const auto& func : data.functions) {
        txt_out << func.qualifiedName << " : " << func.line << std::endl;
    }
    txt_out.close();
    
    std::cout << "Saved function names to: " << txt_output_file << std::endl;
    
    // Also print a summary
    std::cout << "\nFunction Summary:" << std::endl;
    std::cout << "=================" << std::endl;
    for (const auto& func : data.functions) {
        std::cout << "Line " << func.line << ": ";
        if (!func.className.empty()) {
            std::cout << func.className << "::";
        }
        std::cout << func.name;
        if (func.isPrimaryTemplate) {
            std::cout << " [TEMPLATE]";
        }
        if (func.isTemplateSpecialization) {
            std::cout << " [SPECIALIZATION]";
        }
        std::cout << " -> " << func.returnType;
        std::cout << " (" << func.qualifiedName << ")" << std::endl;
    }
    
    return 0;
}
