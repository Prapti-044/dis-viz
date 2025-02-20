#include <dyninst_wrapper.hpp>
#include <crow/json.h>

crow::json::wvalue convertMinimapInfo(const MinimapInfo &minimap);
crow::json::wvalue convertBlockInfo(const BlockInfo &block);
crow::json::wvalue convertBinaryCache(const BinaryCacheResult *res);
crow::json::wvalue convertFunctionInfos(const std::vector<FunctionInfo> &funcInfos);
crow::json::wvalue convertSourceCodeInfo(const std::unordered_map<std::string, std::map<int, std::unordered_set<SOURCE_CODE_FLAGS>>> &sourceCodeInfo);