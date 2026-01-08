#pragma once

#include <string>
#include <vector>
#include <unordered_map>
#include <map>
#include <unordered_set>
#include "parse_source.hpp"

#define MAX_NAME_LENGTH 128

typedef enum {
  INST_VECTORIZED,
  INST_MEMORY_READ,
  INST_MEMORY_WRITE,
  INST_CALL,
  INST_SYSCALL,
  INST_BRANCH,
  INST_FP,
  INST_HOISTED
} INSTRUCTION_FLAGS;

struct VarLocation {
  std::string start;
  std::string end;
  std::string location;
};
struct VariableInfo {
  std::string name;
  std::string type; // Type name (e.g. "int", "double")
  std::string file;
  int line; // 1-based line number
  std::vector<VarLocation> locations;
  enum {
    VAR_TYPE_LOCAL,
    VAR_TYPE_PARAM,
  } var_type;
};
struct InlineEntry {
  std::string name;
  std::string simplified_name;
  std::vector<std::pair<unsigned long, unsigned long> > ranges;
  std::string callsite_file;
  unsigned long callsite_line; // 1-based line number
  std::vector<InlineEntry> children;
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
      correspondence;  // { source_file: [line_number] } - line_number is 1-based
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
  bool is_builtin; // True if target is a system/built-in function
};

struct SourceFunctionInfo {
  std::string file; // Source file where function is defined
  unsigned int line; // 1-based line number
  std::string returnType;
  std::vector<SourceFunctionParam> parameters;
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
  bool is_builtin;
  int call_graph_in_degree;  // Number of functions calling this function
  int call_graph_out_degree; // Number of functions this function calls
  SourceFunctionInfo source_info; // Information from source code parsing
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

typedef enum {
  SOURCE_CODE_INLINE,
  SOURCE_CODE_VECTORIZED,
  SOURCE_CODE_MEMORY_READ,
  SOURCE_CODE_MEMORY_WRITE,
  SOURCE_CODE_CALL,
  SOURCE_CODE_SYSCALL,
  SOURCE_CODE_FP,
  SOURCE_CODE_HOISTED
} SOURCE_CODE_FLAGS;

struct LineInfo {
  std::unordered_set<SOURCE_CODE_FLAGS> flags;
  std::vector<InlineEntry> inlineTree; // Hierarchical inline functions affecting this line
};

struct SourceCodeInfo {
  std::string file;
  int total_lines;
  std::map<int, LineInfo> lines; // map key is 1-based line number
};

struct BinaryMetadata {
  std::string architecture;
  std::string analysis_date;
  std::string analysis_time;
  std::string compiler_used;
  std::vector<std::string> compiler_flags;
};

struct BinaryDecodeResult {
  struct {
    std::vector<BlockInfo> memory_order_blocks;
    std::vector<BlockInfo> loop_order_blocks;
  } disassembly;
  struct {
    MinimapInfo memory_order;
    MinimapInfo loop_order;
  } minimap;
  std::vector<std::string> source_files;
  std::unordered_map<std::string, std::map<int, std::vector<unsigned long>>> correspondences; // { source_file: { line_number: [addresses] } } - line_number is 1-based
  std::unordered_map<std::string, SourceCodeInfo> sourceCodeInfo;
  BinaryMetadata metadata;
  std::vector<FunctionInfo> functionInfos;
};

std::string getSimplifiedFunctionName(const std::string& signature);

bool isParsable(const std::string &binaryPath);
BinaryDecodeResult* decodeBinary(std::string binaryPath);