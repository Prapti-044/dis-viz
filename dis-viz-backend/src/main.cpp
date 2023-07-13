#include <boost/program_options/option.hpp>
#include <boost/program_options/value_semantic.hpp>
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
#include <boost/program_options.hpp>

using json = crow::json::wvalue;
namespace po = boost::program_options;

#define BLOCKS_PER_PAGE 50

// TODO: Handle POST body format verification

enum BLOCK_ORDER { MEMORY_ORDER, LOOP_ORDER };

BLOCK_ORDER getBlockOrder(std::string order) {
  if (order == "memory_order")
    return MEMORY_ORDER;
  else
    return LOOP_ORDER;
}

int main(int argc, char *argv[]) {
  bool WRITE_TO_JSON;
  std::vector<std::string> binary_paths;
  std::string binary_paths_file;
  int port;

  po::options_description desc("Allowed options");
  desc.add_options()
    ("help", "produce help message")
    ("save-json,j", po::bool_switch(&WRITE_TO_JSON), "Save the json from dyninst")
    ("binary-paths,b", po::value<std::vector<std::string>>(&binary_paths),"The paths to binary files to visualize")
    ("binary-paths-file,bf", po::value<std::string>(&binary_paths_file), "A file containing the paths to binary files to visualize")
    ("port,p", po::value<int>(&port)->default_value(8080), "The port to run the server on")
  ;
  
  // TODO: Make binary-paths also a positional argument
  // po::positional_options_description p; p.add("binary-paths,b", -1);

  po::variables_map vm;
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
    std::ifstream binary_paths_file_stream(binary_paths_file);
    std::string line;
    while(std::getline(binary_paths_file_stream, line)){
      binary_paths.push_back(line);
    }
  }


  crow::App<crow::CORSHandler> app;
  app.get_middleware<crow::CORSHandler>().global();
  // crow::mustache::set_global_base("static/static");

  CROW_ROUTE(app, "/api/binarylist")
      .methods("GET"_method)([&binary_paths](const crow::request &req) {
        
        json::list binaryList;
        for (const auto &binary_path : binary_paths) {
          // Check if binary_path is a directory or a file
          if (std::filesystem::is_directory(binary_path)) {
            for (const auto &entry :
                 std::filesystem::directory_iterator(binary_path)) {

              if (isParsable(entry.path().string())) {
                json binary({
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
            json binary({
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

        int start = pageNo * BLOCKS_PER_PAGE;
        int end = start + BLOCKS_PER_PAGE;
        bool is_last = false;
        if (end > assembly->size()) {
          end = assembly->size();
          is_last = true;
        }
        std::vector<BlockInfo> page(assembly->begin() + start,
                                    assembly->begin() + end);
        json::list pageJson;
        for (const auto &i : page) {
          pageJson.push_back(convertBlockInfo(i));
        }
        int n_instructions = std::accumulate(
            page.begin(), page.end(), 0,
            [](int sum, const BlockInfo &i) { return sum + i.nInstructions; });
        json result({{"end_address", page.back().endAddress},
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

        int start = -1;
        int pageNo = 0;
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
        int end = start + BLOCKS_PER_PAGE;
        bool is_last = false;
        if (end > assembly->size()) {
          is_last = true;
          end = assembly->size();
        }
        std::vector<BlockInfo> page(assembly->begin() + start,
                                    assembly->begin() + end);
        json::list pageJson;
        for (const auto &i : page) {
          pageJson.push_back(convertBlockInfo(i));
        }
        int n_instructions = std::accumulate(
            page.begin(), page.end(), 0,
            [](int sum, const BlockInfo &i) { return sum + i.nInstructions; });
        json result({{"end_address", page.back().endAddress},
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
        json::list sourceFilesJson;
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
        json payload;
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

        std::ifstream ifs(sourceFile);
        auto correspondences =
            decodeBinaryCache(binaryPath, WRITE_TO_JSON)->correspondences[sourceFile];
        json::list lines;
        for (auto [lineNo, line] = std::tuple{0, std::string()};
             std::getline(ifs, line); lineNo++) {
          json::list addresses;
          std::copy(correspondences[lineNo].begin(),
                    correspondences[lineNo].end(),
                    std::back_inserter(addresses));
          lines.push_back({
              {"line", line + "\n"},
              {"addresses", addresses},
          });
        }
        json result({
            {"lines", std::move(lines)},
        });
        return result;
      });

  CROW_ROUTE(app, "/api/getdisassemblyblockbyid/<string>/<string>")
      .methods("POST"_method)([&WRITE_TO_JSON](const crow::request &req, std::string order,
                                 std::string id) {
        auto reqBody = crow::json::load(req.body);
        auto binaryPath = reqBody["path"].s();

        std::vector<BlockInfo> *result;
        if (getBlockOrder(order) == MEMORY_ORDER)
          result =
              &decodeBinaryCache(binaryPath, WRITE_TO_JSON)->disassembly.memory_order_blocks;
        else
          result =
              &decodeBinaryCache(binaryPath, WRITE_TO_JSON)->disassembly.loop_order_blocks;

        BlockInfo block;
        for (const auto &i : *result) {
          if (i.name == id) {
            block = i;
            break;
          }
        }
        return convertBlockInfo(block);
      });

  // Handle frontend routes
  CROW_ROUTE(app, "/")
  ([]() {
    auto page = crow::mustache::load_text("index.html");
    return page;
  });

  CROW_ROUTE(app, "/<string>")
  ([](std::string path) {
    path = "templates/" + path;
    bool path_exists = std::filesystem::exists(path);
    if (path_exists) {
      crow::response r;
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