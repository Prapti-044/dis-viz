#include <boost/program_options/option.hpp>
#include <boost/program_options.hpp>
#include <crow/http_request.h>
#include <unordered_map>
// #include <boost/program_options/value_semantic.hpp>
#define CROW_STATIC_DIRECTORY "templates/static/"

#include <crow.h>
#include <crow/common.h>
#include <crow/http_response.h>
#include <crow/middlewares/cors.h>
#include <dyninst_wrapper.hpp>
#include <filesystem>
#include <json_converter.hpp>
#include <numeric>
#include <string>

using json = crow::json::wvalue;
namespace po = boost::program_options;

#define BLOCKS_PER_PAGE 100

enum BLOCK_ORDER { MEMORY_ORDER, LOOP_ORDER };
BLOCK_ORDER getBlockOrder(std::string order) {
  if (order == "memory_order")
    return MEMORY_ORDER;
  else
    return LOOP_ORDER;
}

int main(int argc, char *argv[]) {
  auto WRITE_TO_JSON = false;
  auto binary_paths = std::vector<std::string>();
  auto binary_paths_file = std::string();
  auto port = int();
  auto no_server = false;
  
  auto desc = po::options_description("Allowed options");
  desc.add_options()
    ("help", "produce help message")
    ("save-json,j", po::bool_switch(&WRITE_TO_JSON), "Save the json from dyninst")
    ("binary-paths,b", po::value(&binary_paths),"The paths to binary files to visualize")
    ("binary-paths-file,c", po::value(&binary_paths_file), "A file containing the paths to binary files to visualize")
    ("no-server", po::bool_switch(&no_server), "Don't run the server")
    ("port,p", po::value(&port)->default_value(8080), "The port to run the server on")
  ;
  
  // TODO: Make binary-paths also a positional argument
  // po::positional_options_description p; p.add("binary-paths,b", -1);

  auto vm = po::variables_map();
  po::store(po::command_line_parser(argc, argv)
    .options(desc)
    // .positional(p)
    .run(),
  vm);
  po::notify(vm); 
  
  if (vm.count("help")) {
    std::cout << desc << std::endl;
    return 0;
  }
  
  // Read all lines from binary_paths_file and append them to binary_paths
  if(!binary_paths_file.empty()){
    auto binary_paths_file_stream = std::ifstream(binary_paths_file);
    auto line = std::string();
    while(std::getline(binary_paths_file_stream, line)){
      binary_paths.push_back(line);
    }
  }
  
  if(no_server) {
    auto binaryList = std::vector<std::pair<std::string, std::string>>();
    for (const auto &binary_path : binary_paths) {
      // Check if binary_path is a directory or a file
      if (std::filesystem::is_directory(binary_path)) {
        for (const auto &entry : std::filesystem::directory_iterator(binary_path)) {
          if (isParsable(entry.path().string()))
            binaryList.push_back({entry.path().filename().string(), entry.path().string()});
        }
      } else {
        if(!isParsable(binary_path)) continue;
        binaryList.push_back({std::filesystem::path(binary_path).filename().string(), binary_path});
      }
    }
    
    for(const auto &binary: binaryList) {
      decodeBinaryCache(binary.second, WRITE_TO_JSON);
    }

    return 0;
  }

  auto app = crow::App<crow::CORSHandler>();
  app.get_middleware<crow::CORSHandler>().global();
  // crow::mustache::set_global_base("static/static");

  CROW_ROUTE(app, "/api/binarylist")
      .methods("GET"_method)([&binary_paths](const crow::request &req) {
        
        auto binaryList = json::list();
        for (const auto &binary_path : binary_paths) {
          // Check if binary_path is a directory or a file
          if (std::filesystem::is_directory(binary_path)) {
            for (const auto &entry :
                 std::filesystem::directory_iterator(binary_path)) {

              if (isParsable(entry.path().string())) {
                auto binary = json({
                    {"name", entry.path().filename().string()},
                    {"executable_path", entry.path().string()},
                });
                binaryList.push_back(binary);
              }
            }
          } else {
            if(!isParsable(binary_path)){
              continue;
            }
            auto binary = json({
                {"name", std::filesystem::path(binary_path).filename().string()},
                {"executable_path", binary_path},
            });
            binaryList.push_back(binary);
          }
        }

        json payload = json({{"binarylist", binaryList}});
        return payload;
      });
  
  CROW_ROUTE(app, "/api/getdisassemblypage/<string>/<int>")
      .methods("POST"_method)([&WRITE_TO_JSON](const crow::request &req,
                                 const std::string order, const int pageNo) {
        auto reqBody = crow::json::load(req.body);
        auto binaryPath = reqBody["path"].s();

        std::vector<BlockInfo> *assembly;
        if (getBlockOrder(order) == MEMORY_ORDER)
          assembly =
              &decodeBinaryCache(binaryPath, WRITE_TO_JSON)->disassembly.memory_order_blocks;
        else
          assembly =
              &decodeBinaryCache(binaryPath, WRITE_TO_JSON)->disassembly.loop_order_blocks;

        auto start = pageNo * BLOCKS_PER_PAGE;
        auto end = start + BLOCKS_PER_PAGE;
        auto is_last = false;
        if (end >= assembly->size()) {
          end = assembly->size();
          is_last = true;
        }
        auto page = std::vector<BlockInfo>(assembly->begin() + start,
                                    assembly->begin() + end);
        auto pageJson = json::list();
        for (const auto &i : page) {
          pageJson.push_back(convertBlockInfo(i));
        }
        auto n_instructions = std::accumulate(
            page.begin(), page.end(), 0,
            [](int sum, const BlockInfo &i) { return sum + i.nInstructions; });
        
        auto result = json({{"end_address", page.back().endAddress},
                     {"is_last", is_last},
                     {"blocks", pageJson},
                     {"n_instructions", n_instructions},
                     {"page_no", pageNo},
                     {"start_address", page.front().startAddress}});
        return result;
      });

  CROW_ROUTE(app, "/api/getdisassemblypagebyaddress/<string>/<int>")
      .methods("POST"_method)([&WRITE_TO_JSON](const crow::request &req, std::string order,
                                 int address) {
        auto reqBody = crow::json::load(req.body);
        auto binaryPath = reqBody["path"].s();

        std::vector<BlockInfo> *assembly;
        if (getBlockOrder(order) == MEMORY_ORDER)
          assembly =
              &decodeBinaryCache(binaryPath, WRITE_TO_JSON)->disassembly.memory_order_blocks;
        else
          assembly =
              &decodeBinaryCache(binaryPath, WRITE_TO_JSON)->disassembly.loop_order_blocks;

        auto start = -1;
        auto pageNo = 0;
        for (int i = 0; i < assembly->size(); i += BLOCKS_PER_PAGE) {
          for (int j = i; j < i + BLOCKS_PER_PAGE; j++) {
            if (assembly->at(j).startAddress <= address &&
                assembly->at(j).endAddress >= address) {
              start = i;
              break;
            }
          }
          if (start != -1)
            break;
          pageNo++;
        }
        if (start == -1)
          start = 0;
        auto end = start + BLOCKS_PER_PAGE;
        auto is_last = false;
        if (end >= assembly->size()) {
          is_last = true;
          end = assembly->size();
        }
        auto page = std::vector<BlockInfo>(assembly->begin() + start,
                                    assembly->begin() + end);
        auto pageJson = json::list();
        for (const auto &i : page) {
          pageJson.push_back(convertBlockInfo(i));
        }
        int n_instructions = std::accumulate(
            page.begin(), page.end(), 0,
            [](int sum, const BlockInfo &i) { return sum + i.nInstructions; });
        auto result = json({{"end_address", page.back().endAddress},
                     {"is_last", is_last},
                     {"blocks", pageJson},
                     {"n_instructions", n_instructions},
                     {"page_no", pageNo},
                     {"start_address", page.front().startAddress}});
        return result;
      });

  CROW_ROUTE(app, "/api/sourcefiles")
      .methods("POST"_method)([&WRITE_TO_JSON](const crow::request &req) {
        auto reqBody = crow::json::load(req.body);
        auto binaryPath = reqBody["path"].s();

        const auto &sourceFiles = decodeBinaryCache(binaryPath, WRITE_TO_JSON)->source_files;
        auto sourceFilesJson = json::list();
        for (const auto &i : sourceFiles) {
          sourceFilesJson.push_back({{"file", i}});
        }
        return json(sourceFilesJson);
      });

  CROW_ROUTE(app, "/api/getminimapdata/<string>")
      .methods("POST"_method)([&WRITE_TO_JSON](const crow::request &req, std::string order) {
        auto reqBody = crow::json::load(req.body);
        auto binaryPath = reqBody["path"].s();

        auto minimap = decodeBinaryCache(binaryPath, WRITE_TO_JSON)->minimap;
        auto payload = json();
        if (getBlockOrder(order) == MEMORY_ORDER) {
          payload = convertMinimapInfo(minimap.memory_order);
        } else {
          payload = convertMinimapInfo(minimap.loop_order);
        }
        return payload;
      });

  CROW_ROUTE(app, "/api/getsourcefile")
      .methods("POST"_method)([&WRITE_TO_JSON](const crow::request &req) {
        const auto &reqBody = crow::json::load(req.body);
        const auto &binaryPath = reqBody["binary_file_path"]["path"].s();
        const auto &sourceFile = reqBody["filepath"]["path"].s();

        const auto &decodedBinary = decodeBinaryCache(binaryPath, WRITE_TO_JSON);
        auto &correspondences = decodedBinary->correspondences[sourceFile];
        auto sourceCodeInfo = std::map<int, std::unordered_set<SourceCodeTags>>();
        if(decodedBinary->sourceCodeInfo.find(sourceFile) != decodedBinary->sourceCodeInfo.end()){
          sourceCodeInfo = decodedBinary->sourceCodeInfo[sourceFile];          
        }

        auto lines = json::list();
        auto ifs = std::ifstream(sourceFile);
        
        for (auto [lineNo, line] = std::tuple{0, std::string()}; std::getline(ifs, line); lineNo++) {
          auto addresses = json::list();
          std::copy(correspondences[lineNo].begin(),
                    correspondences[lineNo].end(),
                    std::back_inserter(addresses));
          auto tags = json::list();
          auto tagsToStr = std::unordered_map<SourceCodeTags, std::string>({
            {SourceCodeTags::INLINE_TAG, "INLINE"},
            {SourceCodeTags::VECTORIZED_TAG, "VECTORIZED"}
          });
          if(sourceCodeInfo.find(lineNo) != sourceCodeInfo.end()){
            for(const auto &tag: sourceCodeInfo[lineNo]){
              tags.push_back(tagsToStr[tag]);
            }
          }
          lines.push_back({
              {"line", line + "\n"},
              {"addresses", addresses},
              {"tags", tags}
          });
        }
        auto payload = json({
            {"lines", std::move(lines)},
        });
        return payload;
      });

  CROW_ROUTE(app, "/api/getdisassemblyblockbyid/<string>")
      .methods("POST"_method)([&WRITE_TO_JSON](const crow::request &req, std::string order) {
        auto reqBody = crow::json::load(req.body);
        auto binaryPath = reqBody["path"].s();
        auto id = reqBody["blockId"].s();
        
        std::vector<BlockInfo> *assembly;
        if (getBlockOrder(order) == MEMORY_ORDER)
          assembly =
              &decodeBinaryCache(binaryPath, WRITE_TO_JSON)->disassembly.memory_order_blocks;
        else
          assembly =
              &decodeBinaryCache(binaryPath, WRITE_TO_JSON)->disassembly.loop_order_blocks;
              
        auto block =
            *std::find_if(assembly->begin(), assembly->end(),
                          [&id](const BlockInfo &i) { return i.name == id; });

        return convertBlockInfo(block);
      });
  

  CROW_ROUTE(app, "/api/getdisassemblyblockbyaddress/<string>")
      .methods("POST"_method)([&WRITE_TO_JSON](const crow::request &req, std::string order) {
        auto reqBody = crow::json::load(req.body);
        auto binaryPath = reqBody["path"].s();
        auto blockStartAddress = reqBody["blockStartAddress"].i();
        
        std::vector<BlockInfo> *assembly;
        if (getBlockOrder(order) == MEMORY_ORDER)
          assembly =
              &decodeBinaryCache(binaryPath, WRITE_TO_JSON)->disassembly.memory_order_blocks;
        else
          assembly =
              &decodeBinaryCache(binaryPath, WRITE_TO_JSON)->disassembly.loop_order_blocks;

        auto block = *std::find_if(assembly->begin(), assembly->end(),
                                   [&blockStartAddress](const BlockInfo &i) {
                                     return i.startAddress == blockStartAddress;
                                   });

        return convertBlockInfo(block);
      });

    CROW_ROUTE(app, "/api/addressrange")
      .methods("POST"_method)([&WRITE_TO_JSON](const crow::request &req) {
        auto reqBody = crow::json::load(req.body);
        auto binaryPath = reqBody["path"].s();

        std::vector<BlockInfo> *assembly =
              &decodeBinaryCache(binaryPath, WRITE_TO_JSON)->disassembly.memory_order_blocks;

        auto minAddress = std::ranges::min_element(assembly->begin(), assembly->end(), [](BlockInfo &a, BlockInfo &b) { return a.startAddress < b.startAddress; })->startAddress;
        auto maxAddress = std::ranges::max_element(assembly->begin(), assembly->end(), [](BlockInfo &a, BlockInfo &b) { return a.startAddress < b.startAddress; })->endAddress;

        return json({
          {"start", minAddress},
          {"end", maxAddress}
        });
      });

  // Handle frontend routes
  CROW_ROUTE(app, "/")
  ([]() {
    auto r = crow::response();
    r.set_static_file_info("templates/index.html");
    return r;
  });

  CROW_ROUTE(app, "/<string>")
  ([](std::string path) {
    path = "templates/" + path;
    if (std::filesystem::exists(path)) {
      auto r = crow::response();
      r.set_static_file_info(path);
      return r;
    } else {
      return crow::response(crow::NOT_FOUND);
    }
  });



  // Preload all binary cache
  // decodeBinaryCache("/api/home/insane/prapti/RAJAPerf/build_ubuntu-gcc-12/bin/raja-perf.exe", WRITE_TO_JSON);

  app.port(port)
      // .multithreaded() // This does not work now because of all the global
      // variables in dyninst_wrapper
      .run();
}