#include <dyninst_wrapper.hpp>
#include <crow/json.h>

// crow::json::wvalue convertVariableInfo(const VariableInfo &var);
crow::json::wvalue convertMinimapInfo(const MinimapInfo &minimap);
// crow::json::wvalue convertInstructionInfo(const InstructionInfo &instruction);
// crow::json::wvalue convertBlockLoopState(const BlockLoopState &loopState);
crow::json::wvalue convertBlockInfo(const BlockInfo &block);
crow::json::wvalue convertBinaryCache(const BinaryCacheResult *res);