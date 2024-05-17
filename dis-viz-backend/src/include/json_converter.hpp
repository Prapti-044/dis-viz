#include <dyninst_wrapper.hpp>
#include <crow/json.h>

crow::json::wvalue convertMinimapInfo(const MinimapInfo &minimap);
crow::json::wvalue convertBlockInfo(const BlockInfo &block);
crow::json::wvalue convertBinaryCache(const BinaryCacheResult *res);
crow::json::wvalue convertFunctionInfos(const std::vector<FunctionInfo> &funcInfos);