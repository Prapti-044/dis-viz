#pragma once

#include <string>
#include <vector>
#include <unordered_map>
#include <map>
#include <unordered_set>

#define MAX_NAME_LENGTH 128

typedef enum {
  INST_VECTORIZED,
  INST_MEMORY_READ,
  INST_MEMORY_WRITE,
  INST_CALL,
  INST_SYSCALL,
  INST_FP
} INSTRUCTION_FLAGS;

struct VarLocation {
  std::string start;
  std::string end;
  std::string location;
};
struct VariableInfo {
  std::string name;
  std::string file;
  int line;
  std::vector<VarLocation> locations;
  enum {
    VAR_TYPE_LOCAL,
    VAR_TYPE_PARAM,
  } var_type;
};
struct InlineEntry {
  std::string name;
  std::vector<std::pair<unsigned long, unsigned long> > ranges;
  std::string callsite_file;
  unsigned long callsite_line;
};
struct LoopEntry {
  std::string name;
  std::vector<std::pair<std::string, std::string> > backedges;
  std::vector<std::string> blocks;
  std::string header_block;
  std::string latch_block;
  std::vector<LoopEntry> loops;
};
struct Hidable {
  std::string name;
  unsigned long start;
  unsigned long end;
};
struct InstructionInfo {
  unsigned long address;
  std::string instruction;
  std::unordered_map<std::string, std::vector<int> >
      correspondence;  // { source_file: [line_number] }
  std::vector<VariableInfo> variables;
  std::unordered_set<INSTRUCTION_FLAGS> flags;
};
struct BasicBlock {
  std::string id;
  unsigned long start;
  unsigned long end;
};
struct Call {
  unsigned long address;
  unsigned long target;
  std::vector<std::string> targetFuncNames;
};
struct FunctionInfo {
  std::string name;
  unsigned long entry;
  std::vector<std::string> basic_blocks;
  std::vector<VariableInfo> localVars;
  std::vector<VariableInfo> params;
  std::vector<Call> calls;
  std::vector<InlineEntry> inlines;
  std::vector<LoopEntry> loops;
  std::vector<Hidable> hidables;
};
struct BlockLoopState {
  std::string name;
  int loopCount;
  int loopTotal;
};
struct BlockInfo {
  std::string name;
  std::vector<InstructionInfo> instructions;
  std::string functionName;
  std::vector<std::string> nextBlockNames;
  std::vector<BlockLoopState> loops;
  bool isLoopHeader;
  enum {
    BLOCK_TYPE_NORMAL,
    BLOCK_TYPE_PSEUDOLOOP,
  } block_type;
  std::vector<std::string> backedges;
  std::vector<Hidable> hidables;
  int startAddress;
  int endAddress;
  int nInstructions;
};

struct MinimapInfo {
  std::vector<int> block_heights;
  std::vector<bool> built_in_blocks;
  std::vector<int> block_start_address;
  std::vector<int> block_loop_indents;
  std::vector<std::vector<std::string>> block_types;
};

enum SourceCodeTags {
  INLINE_TAG,
  VECTORIZED_TAG
};
struct BinaryCacheResult {
  struct {
    std::vector<BlockInfo> memory_order_blocks;
    std::vector<BlockInfo> loop_order_blocks;
  } disassembly;
  struct {
    MinimapInfo memory_order;
    MinimapInfo loop_order;
  } minimap;
  std::vector<std::string> source_files;
  std::unordered_map<std::string, std::map<int, std::vector<unsigned long>>> correspondences; // { source_file: { line_number: [addresses] } }
  std::unordered_map<std::string, std::map<int, std::unordered_set<SourceCodeTags>>> sourceCodeInfo;
};



bool isParsable(const std::string &binaryPath);
BinaryCacheResult* decodeBinaryCache(std::string binaryPath, const bool saveJson);