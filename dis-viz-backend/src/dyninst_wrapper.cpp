#include <dyninst_wrapper.hpp>
#include <regex>
#include <unordered_map>
#include <map>
#include <set>
#include <algorithm>
#include <boost/range/adaptor/indexed.hpp>
#include <sstream>

#include <CodeObject.h>
#include <Function.h>
#include <InstructionDecoder.h>
#include <Symtab.h>
#include <registers/x86_64_regs.h>

#include <fstream>
#include <iostream>
#include <functional>

#include <indicators/progress_bar.hpp> // https://github.com/p-ranav/indicators
#include <vector>

#include "include/parse_source.hpp"


using std::set, std::vector, std::string, std::map, std::unordered_map, std::ifstream, std::stringstream, std::unique_ptr;

namespace InstructionAPI = Dyninst::InstructionAPI;
namespace ParseAPI = Dyninst::ParseAPI;
namespace SymtabAPI = Dyninst::SymtabAPI;

// Map instruction flags to source code flags
const std::unordered_map<INSTRUCTION_FLAGS, SOURCE_CODE_FLAGS> INSTRUCTION_FLAGS_TO_SOURCE_CODE_FLAGS = {
  {INST_VECTORIZED, SOURCE_CODE_FLAGS::SOURCE_CODE_VECTORIZED},
  {INST_MEMORY_READ, SOURCE_CODE_FLAGS::SOURCE_CODE_MEMORY_READ}, 
  {INST_MEMORY_WRITE, SOURCE_CODE_FLAGS::SOURCE_CODE_MEMORY_WRITE},
  {INST_CALL, SOURCE_CODE_FLAGS::SOURCE_CODE_CALL},
  {INST_SYSCALL, SOURCE_CODE_FLAGS::SOURCE_CODE_SYSCALL},
  {INST_FP, SOURCE_CODE_FLAGS::SOURCE_CODE_FP},
  {INST_HOISTED, SOURCE_CODE_FLAGS::SOURCE_CODE_HOISTED}
};

const std::vector<string> SYSTEM_LOCATIONS = {"/usr/"};

// Forward declaration
bool isSystemLocation(const string &sourceFile);

// Optimized utility functions
void setInstructionFlags(const InstructionAPI::Instruction &instr, std::unordered_set<INSTRUCTION_FLAGS> &flags) {
  // Use lookup table for better performance
  static const std::unordered_map<InstructionAPI::InsnCategory, INSTRUCTION_FLAGS> categoryMap = {
#if defined(DYNINST_MAJOR_VERSION) && (DYNINST_MAJOR_VERSION >= 10)
    {InstructionAPI::c_VectorInsn, INST_VECTORIZED},
#endif
    {InstructionAPI::c_CallInsn, INST_CALL},
    {InstructionAPI::c_SysEnterInsn, INST_SYSCALL},
    {InstructionAPI::c_SyscallInsn, INST_SYSCALL},
    {InstructionAPI::c_BranchInsn, INST_BRANCH}
  };

  if (auto it = categoryMap.find(instr.getCategory()); it != categoryMap.end()) {
    flags.insert(it->second);
  }
  
  if (instr.readsMemory()) flags.insert(INST_MEMORY_READ);
  if (instr.writesMemory()) flags.insert(INST_MEMORY_WRITE);
}

string demangleName(const string& name) {
  auto demangleStatus = int();
  const auto demangledName = abi::__cxa_demangle(name.c_str(), 0, 0, &demangleStatus);
  return demangledName ? string(demangledName) : name;
}


string print_clean_string(const string &str) {
  static const std::regex pattern("[^a-zA-Z0-9 /:;,\\.{}\\[\\]<>~|\\-_+()&\\*=$!#]");
  return regex_replace(str, pattern, "?");
}

// Templated hex conversion for better performance
template<typename T>
string number_to_hex(T val) {
  std::stringstream stream;
  stream << "0x" << std::hex << static_cast<unsigned long>(val);
  return stream.str();
}

inline string getRegFromFullName(const string &fullname) {
  const auto pos = fullname.rfind("::");
  return pos != string::npos ? fullname.substr(pos + 2) : fullname;
}

// Strip trailing top-level template arguments
string stripTrailingTopLevelTemplate(const string& token) {
  // Ignore trailing whitespace, then ensure we end on '>' (possibly after spaces).
  int end = token.length() - 1;
  while (end >= 0 && std::isspace(token[end])) end--;
  if (end < 0 || token[end] != '>') return token;

  // Walk backwards to find the matching '<' at top level.
  int depth = 0;
  for (int i = end; i >= 0; i--) {
    char c = token[i];
    if (c == '>') depth++;
    else if (c == '<') {
      depth--;
      if (depth == 0) {
        // Remove the matched "<...>" (and any trailing spaces after it).
        string head = token.substr(0, i);
        // Trim trailing spaces
        while (!head.empty() && std::isspace(head.back())) head.pop_back();
        return head;
      }
    }
  }
  // Unbalanced; leave as-is.
  return token;
}

// Extract simplified function name from C++ function signature
string getSimplifiedFunctionName(const string& signature) {
  string s = signature;

  // Special handling for C++ operator functions
  static const std::vector<std::string> operator_names = {
    "operator<<", "operator>>", "operator+", "operator-", "operator*", "operator/", "operator%",
    "operator==", "operator!=", "operator<", "operator<=", "operator>", "operator>=",
    "operator&&", "operator||", "operator!", "operator~", "operator&", "operator|", "operator^",
    "operator=", "operator+=", "operator-=", "operator*=", "operator/=", "operator%=",
    "operator<<=", "operator>>=", "operator&=", "operator|=", "operator^=",
    "operator++", "operator--", "operator()", "operator[]", "operator->", "operator->*",
    "operator,", "operator new", "operator delete", "operator new[]", "operator delete[]"
  };
  
  for (const auto& op_name : operator_names) {
    if (s.find(op_name) != std::string::npos) {
      return op_name;
    }
  }

  // 1) Find the first '(' not inside template args.
  int angleDepth = 0;
  int parenIndex = -1;
  for (size_t i = 0; i < s.length(); i++) {
    char c = s[i];
    if (c == '<') angleDepth++;
    else if (c == '>') angleDepth = std::max(0, angleDepth - 1);
    else if (c == '(' && angleDepth == 0) { parenIndex = i; break; }
  }
  string left = (parenIndex >= 0 ? s.substr(0, parenIndex) : s);

  // 2) Walk backwards from just before '(' to capture the *entire* function token,
  //    including namespaces and any trailing template args, while respecting <...>.
  int i = left.length() - 1;
  while (i >= 0 && std::isspace(left[i])) i--; // skip trailing spaces
  int depth = 0;
  int start = i;
  for (; i >= 0; i--) {
    char c = left[i];
    if (c == '>') { depth++; }
    else if (c == '<') { depth = std::max(0, depth - 1); }
    if (depth == 0 && std::isspace(c)) { start = i + 1; break; }
    start = i;
  }
  string token = left.substr(start);

  // Trim leading/trailing spaces
  token.erase(0, token.find_first_not_of(" \t\r\n"));
  token.erase(token.find_last_not_of(" \t\r\n") + 1);

  // 3) Drop trailing ref/pointer sigils that might cling to the token (rare).
  while (!token.empty() && (token.back() == '&' || token.back() == '*')) {
    token.pop_back();
  }

  // Trim again after removing sigils
  token.erase(0, token.find_first_not_of(" \t\r\n"));
  token.erase(token.find_last_not_of(" \t\r\n") + 1);

  // 4) If the token ends with a top-level <...>, strip exactly that one group.
  token = stripTrailingTopLevelTemplate(token);

  // 5) Keep only the identifier after the last '::'.
  size_t k = token.rfind("::");
  string simple = (k != string::npos ? token.substr(k + 2) : token);

  // Final trim
  simple.erase(0, simple.find_first_not_of(" \t\r\n"));
  simple.erase(simple.find_last_not_of(" \t\r\n") + 1);

  return simple;
}

// Optimized variable location string formatting
template<typename LocationType>
string formatVariableLocation(const LocationType &location) {
  const string regName = getRegFromFullName(location.mr_reg.name());
  const string offsetStr = number_to_hex(location.frameOffset);
  
  switch (location.stClass) {
    case Dyninst::storageAddr:
      return (location.refClass == Dyninst::storageNoRef) 
        ? "$" + offsetStr 
        : "($" + offsetStr + ")";
    
    case Dyninst::storageReg:
      return (location.refClass == Dyninst::storageNoRef)
        ? "%" + regName
        : "(%" + regName + ")";
    
    case Dyninst::storageRegOffset:
      return offsetStr + "(%" + regName + ")";
    
    default:
      return "";
  }
}

VariableInfo printVar(SymtabAPI::localVar *var) {
  const string name = var->getName();
  const int lineNum = var->getLineNum(); // 1-based index from Dyninst
  const string fileName = var->getFileName();

  auto varLocations = vector<VarLocation>();
  auto locations = var->getLocationLists();
  for (auto &location : locations) {
    auto frameOffset = location.frameOffset;
    auto lowPC = location.lowPC;
    auto hiPC = location.hiPC;
    auto hiPC_str = number_to_hex(hiPC);
    auto lowPC_str = number_to_hex(lowPC);

    auto mr_reg = location.mr_reg;
    auto full_regName = mr_reg.name();
    auto regName = getRegFromFullName(full_regName);
    auto finalVarString = string();

    // Match the variable format with the output in the disassembly
    if (location.stClass == Dyninst::storageAddr) {
      if (location.refClass == Dyninst::storageNoRef) {
        finalVarString = "$" + number_to_hex(frameOffset);  // at&t syntax
      } else if (location.refClass == Dyninst::storageRef) {
        finalVarString =
            "($" + number_to_hex(frameOffset) + ")";  // at&t syntax
      }
    } else if (location.stClass == Dyninst::storageReg) {
      if (location.refClass == Dyninst::storageNoRef) {
        finalVarString =
            "%" + getRegFromFullName(location.mr_reg.name());  // at&t syntax
      } else if (location.refClass == Dyninst::storageRef) {
        finalVarString = "(%" + getRegFromFullName(location.mr_reg.name()) +
                         ")";  // at&t syntax
      }
    } else if (location.stClass == Dyninst::storageRegOffset) {
      if (location.refClass == Dyninst::storageNoRef) {
        finalVarString = number_to_hex(frameOffset) + "(%" +
                         getRegFromFullName(location.mr_reg.name()) +
                         ")";  // at&t syntax
      } else if (location.refClass == Dyninst::storageRef) {
        finalVarString = number_to_hex(frameOffset) + "(%" +
                         getRegFromFullName(location.mr_reg.name()) +
                         ")";  // at&t syntax
      }
    }
    varLocations.push_back({lowPC_str, hiPC_str, finalVarString});
  }
  return {print_clean_string(name), fileName, lineNum, varLocations};
}

long totalLoops = 0;

// Optimized loop processing
LoopEntry createLoopEntry(map<ParseAPI::Block *, string> &block_ids, ParseAPI::LoopTreeNode &lt) {
  LoopEntry entry;
  
  if (!lt.loop) {
    // Process children only
    for (auto &child : lt.children) {
      entry.loops.push_back(createLoopEntry(block_ids, *child));
    }
    return entry;
  }
  
  entry.name = lt.name();
  
  // Get loop entries
  std::vector<ParseAPI::Block *> loop_entry_blocks;
  lt.loop->getLoopEntries(loop_entry_blocks);
  entry.header_block = !loop_entry_blocks.empty() ? block_ids[loop_entry_blocks[0]] : "";
  entry.latch_block = "";
  
  totalLoops++;
  
  // Process backedges
  vector<ParseAPI::Edge *> backedges;
  lt.loop->getBackEdges(backedges);
  entry.backedges.reserve(backedges.size());
  for (const auto &edge : backedges) {
    entry.backedges.emplace_back(block_ids[edge->src()], block_ids[edge->trg()]);
  }
  
  // Process blocks
  vector<ParseAPI::Block *> blocks;
  lt.loop->getLoopBasicBlocks(blocks);
  entry.blocks.reserve(blocks.size());
  for (const auto &block : blocks) {
    entry.blocks.push_back(block_ids[block]);
  }
  
  // Process children
  for (auto &child : lt.children) {
    entry.loops.push_back(createLoopEntry(block_ids, *child));
  }
  
  return entry;
}

// Legacy wrapper for compatibility
LoopEntry printLoopEntry(map<ParseAPI::Block *, string> &block_ids, ParseAPI::LoopTreeNode &lt) {
  return createLoopEntry(block_ids, lt);
}

bool matchOperands(const vector<signed int> &readSet,
                   const vector<signed int> &writeSet,
                   const vector<InstructionAPI::Operand> &operands) {
  auto readSetMatched = vector<bool>(readSet.size());
  auto writeSetMatched = vector<bool>(writeSet.size());

  for (auto &operand : operands) {
    auto regs = InstructionAPI::Operation::registerSet();
    if (readSet.size() != 0) {
      operand.getReadSet(regs);
      for (auto &reg : regs) {
        auto found = find(readSet.begin(), readSet.end(), reg.get()->getID());
        if (found == readSet.end()) return false;
        readSetMatched[found - readSet.begin()] = true;
      }
    }
    if (writeSet.size() != 0) {
      operand.getWriteSet(regs);
      for (auto &reg : regs) {
        auto found = find(writeSet.begin(), writeSet.end(), reg.get()->getID());
        if (found == writeSet.end()) return false;
        writeSetMatched[found - writeSet.begin()] = true;
      }
    }
  }

  if (readSet.size() != 0 &&
      !all_of(readSetMatched.begin(), readSetMatched.end(),
              [](bool val) { return val; })) {
    return false;
  }
  if (writeSet.size() != 0 &&
      !all_of(writeSetMatched.begin(), writeSetMatched.end(),
              [](bool val) { return val; })) {
    return false;
  }

  return true;
}

Hidable getFuncBegin(ParseAPI::Function *f) {
  auto blocks = f->blocks();
  auto insns = ParseAPI::Block::Insns();
  (*blocks.begin())->getInsns(insns);

  auto itm = insns.begin();
  auto instruction = itm->second;

  auto operation = instruction.getOperation();
  if (operation.getID() == e_push) {
    vector<InstructionAPI::Operand> operands = instruction.getAllOperands();

    if (!matchOperands({Dyninst::x86_64::rsp, Dyninst::x86_64::rbp}, {},
                       operands))
      return {};
  } else
    return {};

  itm++;
  if (itm == insns.end()) return {};
  instruction = itm->second;

  operation = instruction.getOperation();
  // mov %rsp %rbp
  if (operation.getID() == e_mov) {
    vector<InstructionAPI::Operand> operands = instruction.getAllOperands();
    if (!matchOperands(
            {Dyninst::x86_64::rsp},                        // Read Reg
            {Dyninst::x86_64::rbp, Dyninst::x86_64::rsp},  // Write Reg
            operands))
      return {};
  } else
    return {};

  return {"Function Entry", insns.begin()->first, itm->first};
}

string block_to_name(SymtabAPI::Symtab *symtab, const ParseAPI::Function *fn, const ParseAPI::Block *block,
                     const int cur_id) {
  

  SymtabAPI::Function *symtab_fn = nullptr;
  symtab->getContainingFunction(fn->addr(), symtab_fn);
  
  if (symtab_fn && symtab_fn->pretty_names_begin() != symtab_fn->pretty_names_end()) {
    set<string> unique_names;
    for (auto it = symtab_fn->pretty_names_begin(); it != symtab_fn->pretty_names_end(); ++it) {
      unique_names.insert(*it);
    }
    string pretty_names;
    for (const auto& name : unique_names) {
      if (!pretty_names.empty()) pretty_names += ", ";
      pretty_names += demangleName(name);
    }
    return print_clean_string(pretty_names + ": B" + std::to_string(cur_id));
  }

  return print_clean_string(demangleName(fn->name()) + ": B" + std::to_string(cur_id));
}

vector<VariableInfo> getInstructionVariables(
    const vector<VariableInfo> &localVars, const vector<VariableInfo> &params,
    const string &instructionString) {
  auto allVars = vector<VariableInfo>();
  for (auto &varInfo : localVars) {
    for(const auto &location : varInfo.locations) {
      if(instructionString.find(location.location) != string::npos) {
        allVars.push_back(varInfo);
      }
    }
  }
  for (auto &varInfo : params) {
    for(const auto &location : varInfo.locations) {
      if(instructionString.find(location.location) != string::npos) {
        allVars.push_back(varInfo);
      }
    }
  }
  
  return allVars;
}

void addLoopsToBlocks(vector<BlockInfo> &blocks, const LoopEntry &loop,
                      unordered_map<string, int> &loop_count) {
  for (auto &block : blocks) {
    if (find(loop.blocks.begin(), loop.blocks.end(), block.name) !=
        loop.blocks.end()) {
      auto innerLoopIt = loop.loops.begin();
      for(; innerLoopIt != loop.loops.end(); innerLoopIt++) {
        if (find(innerLoopIt->blocks.begin(), innerLoopIt->blocks.end(),
                      block.name) != innerLoopIt->blocks.end()) {
          break;
        }
      }
      if (innerLoopIt == loop.loops.end()) {
        loop_count[loop.name]++;
      }
      block.loops.push_back({loop.name, loop_count[loop.name], -1});

      for (const auto &backedge : loop.backedges) {
        if (backedge.first == block.name) {
          block.backedges.push_back(backedge.second);
        }
      }
    }
  }
  if (loop.loops.size() > 0) {
    for (const auto &innerLoop : loop.loops) {
      addLoopsToBlocks(blocks, innerLoop, loop_count);
    }
  }
}

vector<unsigned int> getAllBlocksInLoop(const vector<BlockInfo> &funcBlocks, 
                                     const vector<unsigned int> &blocks,
                                     const LoopEntry &loop,
                                     vector<unsigned int> &visitedBlocks) {
  auto blocksInLoop = vector<unsigned int>();
  auto currLoopBlocks = vector<unsigned int>();
  copy_if(blocks.begin(), blocks.end(), back_inserter(currLoopBlocks),
          [&loop ,&funcBlocks](const unsigned int b) {
            return find(loop.blocks.begin(), loop.blocks.end(), funcBlocks[b].name) !=
                   loop.blocks.end();
          });
  for (const auto &block : currLoopBlocks) {
    if (find(visitedBlocks.begin(), visitedBlocks.end(), block) !=
        visitedBlocks.end())
      continue;

    if (loop.loops.size() > 0) {
      auto innerLoopIt = loop.loops.begin();
      for (; innerLoopIt != loop.loops.end(); ++innerLoopIt) {
        const auto &innerLoop = *innerLoopIt;
        if (find(innerLoop.blocks.begin(), innerLoop.blocks.end(),
                 funcBlocks[block].name) != innerLoop.blocks.end()) {
          auto innerLoopBlocks =
              getAllBlocksInLoop(funcBlocks, blocks, innerLoop, visitedBlocks);


          blocksInLoop.insert(blocksInLoop.end(), std::make_move_iterator(innerLoopBlocks.begin()),
                              std::make_move_iterator(innerLoopBlocks.end()));
          break;
        }
      }
      if (innerLoopIt == loop.loops.end()) {
        visitedBlocks.push_back(block);
        blocksInLoop.push_back(block);
      }
    } else {
      visitedBlocks.push_back(block);
      blocksInLoop.push_back(block);
    }
  }
  // find the loop entry block and reorder it to the first place in tmp
  auto header_block_it = std::find_if(blocksInLoop.begin(), blocksInLoop.end(), [&loop,&funcBlocks](const unsigned int b) {
    return loop.header_block == funcBlocks[b].name;
  });
  if(header_block_it != blocksInLoop.end()) {
    auto tmp = vector<unsigned int>();
    tmp.push_back(*header_block_it);
    for(auto &b : blocksInLoop) {
      if(b != *header_block_it) tmp.push_back(b);
    }
    blocksInLoop = std::move(tmp);
  }
  return blocksInLoop;
}

vector<int> getBlockHeights(const vector<BlockInfo> &blocks) {
  vector<int> heights;
  heights.reserve(blocks.size());
  
  std::transform(blocks.begin(), blocks.end(), std::back_inserter(heights),
    [](const BlockInfo &b) {
      return b.block_type == BlockInfo::BLOCK_TYPE_NORMAL ? b.nInstructions : 0;
    });
  
  return heights;
}

vector<vector<string>> getBlockTypes(const vector<BlockInfo> &blocks) {
  vector<vector<string>> types;
  types.reserve(blocks.size());
  
  std::transform(blocks.begin(), blocks.end(), std::back_inserter(types),
    [](const BlockInfo &b) { 
      std::unordered_set<string> typeSet;
      
      for (const auto &inst : b.instructions) {
        for (const auto &flag : inst.flags) {
          switch (flag) {
            case INST_VECTORIZED: typeSet.insert("vectorized"); break;
            case INST_MEMORY_READ: typeSet.insert("memory_read"); break;
            case INST_MEMORY_WRITE: typeSet.insert("memory_write"); break;
            case INST_CALL: typeSet.insert("call"); break;
            case INST_SYSCALL: typeSet.insert("syscall"); break;
            case INST_FP: typeSet.insert("fp"); break;
            default: break;
          }
        }
      }
      
      return vector<string>(typeSet.begin(), typeSet.end());
    });
  
  return types;
}

vector<bool> getIsBuiltInBlock(const vector<BlockInfo> &blocks) {
  vector<bool> isBuiltIn;
  isBuiltIn.reserve(blocks.size());
  
  std::transform(blocks.begin(), blocks.end(), std::back_inserter(isBuiltIn),
    [](const BlockInfo &b) { 
      for (const auto &inst : b.instructions) {
        for (const auto &correspondence : inst.correspondence) {
          for (const auto &systemLocation : SYSTEM_LOCATIONS) {
            if (correspondence.first.size() > systemLocation.size() &&
                correspondence.first.substr(0, systemLocation.size()) == systemLocation) {
              return true;
            }
          }
        }
      }
      return false;
    });
  
  return isBuiltIn;
}

vector<int> getBlockStartAddresses(const vector<BlockInfo> &blocks) {
  vector<int> addresses;
  addresses.reserve(blocks.size());
  
  std::transform(blocks.begin(), blocks.end(), std::back_inserter(addresses),
    [](const BlockInfo &b) { return b.startAddress; });
  
  return addresses;
}

vector<int> getBlockIndents(const vector<BlockInfo> &blocks) {
  vector<int> indents;
  indents.reserve(blocks.size());
  
  std::transform(blocks.begin(), blocks.end(), std::back_inserter(indents),
    [](const BlockInfo &b) { return static_cast<int>(b.loops.size()); });
  
  return indents;
}

// Build a hierarchical tree of inlined functions
InlineEntry createInlineEntry(SymtabAPI::InlinedFunction* inlineFunc) {
  auto name_str = demangleName(inlineFunc->getName());
  const auto &ranges = inlineFunc->getRanges();

  auto inlineRanges = vector<std::pair<unsigned long, unsigned long>>();
  for (auto range : ranges)
    inlineRanges.push_back({range.low(), range.high()});

  InlineEntry entry = {
      print_clean_string(name_str),
      getSimplifiedFunctionName(name_str),
      inlineRanges,
      inlineFunc->getCallsite().first,
      inlineFunc->getCallsite().second, // 1-based index from Dyninst
      {} // children will be filled below
  };

  // Get child inlined functions and create tree structure
  auto ic = SymtabAPI::InlineCollection(inlineFunc->getInlines());
  for (auto &funcBase : ic) {
    auto childInlineFunc = static_cast<SymtabAPI::InlinedFunction *>(funcBase);
    entry.children.push_back(createInlineEntry(childInlineFunc));
  }

  return entry;
}

// Create inline tree from top-level inlined functions
vector<InlineEntry> buildInlineTree(const set<SymtabAPI::InlinedFunction*> &topLevelInlineFuncs) {
  vector<InlineEntry> inlineTree;
  
  for (auto &inlineFunc : topLevelInlineFuncs) {
    inlineTree.push_back(createInlineEntry(inlineFunc));
  }
  
  return inlineTree;
}


void addLoopHeaderInfo(BlockInfo &block, const vector<LoopEntry> &loops) {
  for (const auto &loop : loops) {
    if(loop.header_block == block.name) {
      block.isLoopHeader = true;
    }
  }
  if(!block.isLoopHeader) {
    for (const auto &loop : loops) {
      addLoopHeaderInfo(block, loop.loops);
    }
  }
}

unsigned long getNumberOfLines(const string &file) {
  static std::unordered_map<string, unsigned long> cache;
  
  if (auto it = cache.find(file); it != cache.end()) {
    return it->second;
  }
  
  std::ifstream fileStream(file);
  unsigned long lineCount = std::count(
    std::istreambuf_iterator<char>(fileStream),
    std::istreambuf_iterator<char>(),
    '\n'
  );
  
  cache[file] = lineCount;
  return lineCount;
}


std::tuple<
  vector<BlockInfo>, // Memory Order Blocks
  vector<BlockInfo>, // Loop Order Blocks
  unordered_map<string, map<int, vector<unsigned long>>>, // Source Correspondences
  set<string>, // Unique Source Files
  vector<FunctionInfo>, // Function Infos
  unordered_map<string, SourceCodeInfo> // Source Code Info { file: { line: { tags }, total_lines: int } }
> getAssembly(SymtabAPI::Symtab *symtab, const ParseAPI::CodeObject::funclist &funcs) {

  auto bar = indicators::ProgressBar{
    indicators::option::MaxProgress{funcs.size()},
    indicators::option::PrefixText{"Disassembling"},
    indicators::option::ForegroundColor{indicators::Color::yellow},
  };

  auto addressOrderBlocks = vector<BlockInfo>();
  auto loopOrderBlocks = vector<BlockInfo>();
  auto __visitedBlocks = unordered_map<ParseAPI::Block*, bool>();
  auto source_correspondences = unordered_map<string, map<int, vector<unsigned long>>>(); // { source_file: { line_number: [addresses] } }
  auto block_ids = map<ParseAPI::Block *, string>();
  auto instruction_flags = map<Dyninst::Address, std::unordered_set<INSTRUCTION_FLAGS>>();
  auto unique_sourcefiles = set<string>();
  auto curr_block_id = 0;
  auto sourceCodeInfo = unordered_map<std::string, SourceCodeInfo>(); 
  auto functionInfos = vector<FunctionInfo>();

  // create an Instruction decoder which will convert the binary opcodes to strings
  auto anyfunc = *funcs.begin();
  auto decoder = InstructionAPI::InstructionDecoder(
      anyfunc->isrc()->getPtrToInstruction(anyfunc->addr()),
      InstructionAPI::InstructionDecoder::maxInstructionLength, anyfunc->region()->getArch());
  
  // Prepare all the addresses. This is needed in a separate for loop over function to get all addresses first
  auto addresses = set<unsigned long>();
  for (const auto &f : funcs) {
    for (const auto &block : f->blocks()) {
      auto icur = block->start();
      auto iend = block->last();
      while (icur <= iend) {
        addresses.insert(icur);
        auto raw_insnptr =
            (const unsigned char *)f->isrc()->getPtrToInstruction(icur);
#if defined(DYNINST_MAJOR_VERSION) && (DYNINST_MAJOR_VERSION >= 10)
        auto instr = decoder.decode(raw_insnptr);
#else
        auto ip = decoder.decode(raw_insnptr);
        auto instr = *ip;
#endif
        icur += instr.size();
      }
    }
  }

  // Create block names, unique source files and Inlines
  for (const auto &f : funcs) {
    // Assign block names and get unique source files
    for (const auto &block : f->blocks()) {
      auto icur = block->start();
      auto iend = block->last();
      while (icur <= iend) {
        auto cur_lines = vector<SymtabAPI::Statement::Ptr>();
        symtab->getSourceLines(cur_lines, icur);
        // auto cur_lines = symtab->getSourceLines(icur);
        // if (cur_lines.empty()) continue;
        for(auto &fl : cur_lines) unique_sourcefiles.insert(fl->getFile());

        auto raw_insnptr =
            (const unsigned char *)f->isrc()->getPtrToInstruction(icur);
#if defined(DYNINST_MAJOR_VERSION) && (DYNINST_MAJOR_VERSION >= 10)
        auto instr = decoder.decode(raw_insnptr);
#else
        auto ip = decoder.decode(raw_insnptr);
        auto instr = *ip;
#endif
        setInstructionFlags(instr, instruction_flags[icur]);
        icur += instr.size();
      }
      block_ids[block] = block_to_name(symtab, f, block, curr_block_id++);
    }

    // Loops
    auto funcLoops = vector<LoopEntry>();
    auto lt = unique_ptr<ParseAPI::LoopTreeNode>(f->getLoopTree());
    if (lt) {
      funcLoops = printLoopEntry(block_ids, *lt).loops;
    }
    
    // Hidables
    auto hidables = vector<Hidable>();
    auto fnBegin = getFuncBegin(f);
    if (!fnBegin.name.empty()) hidables.push_back(std::move(fnBegin));

    auto funcBlocks = vector<BlockInfo>();
    
    // Inlines
    auto topLevelFuncs = set<SymtabAPI::FunctionBase*>();
    for(const auto &block: f->blocks()) {
      SymtabAPI::Function *symt_func = nullptr;
      symtab->getContainingFunction(block->start(), symt_func);
      if(!symt_func) continue;
      topLevelFuncs.insert(symt_func);
    }
    auto inlineFuncs = set<SymtabAPI::InlinedFunction*>();
    for(auto &topLevelFunc: topLevelFuncs) {
      auto ic = SymtabAPI::InlineCollection(topLevelFunc->getInlines());
      for (auto &funcBase : ic) {
        auto inlineFunc = static_cast<SymtabAPI::InlinedFunction *>(funcBase);
        
        // Check if any of the inline's address ranges overlap with our function's addresses
        const auto &ranges = inlineFunc->getRanges();
        bool hasOverlap = false;
        for (auto range : ranges) {
          auto rangeStart = range.low();
          auto rangeEnd = range.high();
          // Check if any address in our set falls within this range
          for (auto addr : addresses) {
            if (addr >= rangeStart && addr <= rangeEnd) {
              hasOverlap = true;
              break;
            }
          }
          if (hasOverlap) break;
        }
        
        if (!hasOverlap) continue;
        inlineFuncs.insert(inlineFunc);
      }
    }
    auto inlineTree = buildInlineTree(inlineFuncs);

    // Traverse the inline tree to update sourceCodeInfo
    std::function<void(const vector<InlineEntry>&)> updateSourceCodeInfo = [&](const vector<InlineEntry>& entries) {
      for(const auto &inlineEntry : entries) {
        if(sourceCodeInfo.find(inlineEntry.callsite_file) == sourceCodeInfo.end()) {
          sourceCodeInfo[inlineEntry.callsite_file] = SourceCodeInfo{
            inlineEntry.callsite_file,
            static_cast<int>(getNumberOfLines(inlineEntry.callsite_file)),
            std::map<int, LineInfo>()
          };
        }
        
        auto& lineInfo = sourceCodeInfo[inlineEntry.callsite_file].lines[inlineEntry.callsite_line];
        lineInfo.flags.insert(SOURCE_CODE_FLAGS::SOURCE_CODE_INLINE);
        
        // Add the current inline entry with its complete tree structure to this line
        lineInfo.inlineTree.push_back(inlineEntry);
        
        // Recursively process children
        if (!inlineEntry.children.empty()) {
          updateSourceCodeInfo(inlineEntry.children);
        }
      }
    };
    
    updateSourceCodeInfo(inlineTree);

    // Calls
    auto calls = vector<Call>();
    for (auto &edge : f->callEdges()) {
      if (!edge) continue;
      auto from = edge->src();
      auto to = edge->trg();

      auto call = Call{
        from->lastInsnAddr(),
      };

      if (to && to->start() != (unsigned long)-1)
        call.target = to->start();
      else
        call.target = 0;

      auto funcs = vector<ParseAPI::Function *>();
      to->getFuncs(funcs);
      if (!funcs.empty()) {
        for (auto j = funcs.begin(); j != funcs.end(); j++)
          call.targetFuncNames.push_back(print_clean_string(demangleName((*j)->name())));
      }
      calls.push_back(call);
    }
    
    auto funcInfo = FunctionInfo{
      print_clean_string(demangleName(f->name())),
      f->entry()->start(),
      {},
      {},
      {},
      calls,
      inlineTree,
      funcLoops,
      {},
      false,
      0,  // call_graph_in_degree - will be calculated later
      0,  // call_graph_out_degree - will be calculated later
      {}  // source_info - will be populated later
    };
    
    // Function variables
    SymtabAPI::Function *symt_func = nullptr;
    symtab->getContainingFunction(f->addr(), symt_func);

    auto thisLocalVars = vector<SymtabAPI::localVar *>();
    auto thisParams = vector<SymtabAPI::localVar *>();
    symt_func->getLocalVariables(thisLocalVars);
    symt_func->getParams(thisParams);

    auto localVars = vector<VariableInfo>();
    for (auto var : thisLocalVars) {
      auto varInfo = printVar(var);
      varInfo.var_type = VariableInfo::VAR_TYPE_LOCAL;
      localVars.push_back(std::move(varInfo));
    }
    auto params = vector<VariableInfo>();
    for (auto var : thisParams) {
      auto varInfo = printVar(var);
      varInfo.var_type = VariableInfo::VAR_TYPE_PARAM;
      params.push_back(std::move(varInfo));
    }
    
    funcInfo.localVars = std::move(localVars);
    funcInfo.params = std::move(params);

    for (const auto &block : f->blocks()) {
      auto insns = ParseAPI::Block::Insns();
      block->getInsns(insns);

      auto blockInfo = BlockInfo{
          block_ids[block],
          {},
          print_clean_string(demangleName(f->name())),
      };
      funcInfo.basic_blocks.push_back(blockInfo.name);

      for (const auto &hidable : hidables) {
        if (hidable.start >= block->start() && hidable.end <= block->last()) {
          blockInfo.hidables.push_back(std::move(hidable)); // maybe gotcha
        }
      }

      for (const auto &edge : block->targets()) {
        auto sourcei = block_ids.find(edge->src());
        auto targeti = block_ids.find(edge->trg());
        if (sourcei == block_ids.end() || targeti == block_ids.end()) continue;
        blockInfo.nextBlockNames.push_back(targeti->second);
      }

      for (const auto &instr : insns) {
        // Correspondences
        auto cur_lines = vector<SymtabAPI::Statement::Ptr>();
        symtab->getSourceLines(cur_lines, instr.first);
        // auto cur_lines = symtab->getSourceLines(instr.first);
        auto correspondences = unordered_map<string, vector<int> >();
        for (const auto &li : cur_lines) {
          const auto lineNumber = li->getLine(); // 1-based index from Dyninst
          correspondences[print_clean_string(li->getFile())].push_back(lineNumber);
          source_correspondences[print_clean_string(li->getFile())][lineNumber].push_back(instr.first);
        }

        blockInfo.instructions.push_back({
            instr.first,
            instr.second.format(),
            correspondences,
            getInstructionVariables(funcInfo.localVars, funcInfo.params, instr.second.format()),
            instruction_flags[instr.first],
        });
        
      }

      blockInfo.startAddress = block->start();
      blockInfo.endAddress = block->last();
      blockInfo.nInstructions = blockInfo.instructions.size();
      addLoopHeaderInfo(blockInfo, funcLoops);

      // Populate sourceCodeInfo
      for (const auto &inst: blockInfo.instructions) {
        for (const auto &inst_flag: inst.flags) {
          for (const auto &correspondence: inst.correspondence) {
            auto sourceFile = correspondence.first;
            for (const auto &line: correspondence.second) {
              if (sourceCodeInfo.find(sourceFile) == sourceCodeInfo.end())
                sourceCodeInfo[sourceFile] = SourceCodeInfo{
                  sourceFile,
                  static_cast<int>(getNumberOfLines(sourceFile)),
                  std::map<int, LineInfo>()
                };
              if (auto it = INSTRUCTION_FLAGS_TO_SOURCE_CODE_FLAGS.find(inst_flag); it != INSTRUCTION_FLAGS_TO_SOURCE_CODE_FLAGS.end()) {
                sourceCodeInfo[sourceFile].lines[line].flags.insert(it->second);
              }
            }
          }
        }
      }

      funcBlocks.push_back(std::move(blockInfo));
    }
    
    // Populate sourceCodeInfo with number of lines
    for (const auto &sourceFile : unique_sourcefiles) {
      std::ifstream file(sourceFile);
      std::string line;
      int lineCount = 0;
      while (std::getline(file, line)) {
        lineCount++;
      }
      if (sourceCodeInfo.find(sourceFile) == sourceCodeInfo.end()) {
        sourceCodeInfo[sourceFile] = SourceCodeInfo{
          sourceFile,
          lineCount,
          std::map<int, LineInfo>()
        };
      }
    }

    int maxLoopCount = -1;
    for (const auto &loop : funcLoops) {
      auto loop_count = unordered_map<string, int>();
      addLoopsToBlocks(funcBlocks, loop, loop_count);
      for (auto &block : funcBlocks) {
        if (block.loops.size() > maxLoopCount)
          maxLoopCount = block.loops.size();

        for (auto &loop : block.loops)
          if (loop_count.find(loop.name) != loop_count.end())
            loop.loopTotal = loop_count[loop.name];
      }
    }
    
    std::sort(funcBlocks.begin(), funcBlocks.end(), [](const BlockInfo &a, const BlockInfo &b) {
      return a.startAddress < b.startAddress;
    });
    
    auto processed_loops = vector<string>();
    int idx = 0;
    while (idx+1 < funcBlocks.size()) {
      if (funcBlocks[idx].loops.size() > 0 && find(processed_loops.begin(), processed_loops.end(), funcBlocks[idx].loops.back().name) != processed_loops.end()) {
        idx++;
        continue;
      }
      
      auto blockLoopNames = vector<string>();
      std::transform(funcBlocks[idx].loops.begin(), funcBlocks[idx].loops.end(), std::back_inserter(blockLoopNames), [](const BlockLoopState &l) {
        return l.name;
      });
      auto nextBlockLoopNames = vector<string>();
      std::transform(funcBlocks[idx+1].loops.begin(), funcBlocks[idx+1].loops.end(), std::back_inserter(nextBlockLoopNames), [](const BlockLoopState &l) {
        return l.name;
      });
      
      if( std::all_of(nextBlockLoopNames.begin(), nextBlockLoopNames.end(), [&blockLoopNames](const string &l) {
        return std::find(blockLoopNames.begin(), blockLoopNames.end(), l) != blockLoopNames.end();
      }) && blockLoopNames.size() > nextBlockLoopNames.size()) {
        // Check if this is the last block of this loop
        if(funcBlocks[idx].loops.back().loopCount != funcBlocks[idx].loops.back().loopTotal) {
          auto pseudo_blocks = vector<BlockInfo>();
          auto it = funcBlocks.begin() + (idx + 1);
          for(; it != funcBlocks.end(); it++) {
            if (it->loops.size() > 0 && it->loops.back().name == funcBlocks[idx].loops.back().name && funcBlocks[idx].functionName == it->functionName) {
              auto pseudoBlock = *it;
              pseudoBlock.block_type = BlockInfo::BLOCK_TYPE_PSEUDOLOOP;
              pseudo_blocks.push_back(std::move(pseudoBlock));
              if(pseudo_blocks.back().loops.back().loopCount == pseudo_blocks.back().loops.back().loopTotal) {
                break;
              }
            }
          }
          
          processed_loops.push_back(funcBlocks[idx].loops.back().name);
          idx++;
          auto skips = pseudo_blocks.size();
          funcBlocks.insert(funcBlocks.begin() + idx, make_move_iterator(pseudo_blocks.begin()), make_move_iterator(pseudo_blocks.end()));
          idx += skips;

        }
      }
      idx++; 
    }

    // Loop Order blocks
    auto __visitedBlocks = vector<unsigned int>();
    auto funcLoopOrderBlocks = vector<BlockInfo>();
    for (const auto &block : funcBlocks| boost::adaptors::indexed(0)) {
      if (find(__visitedBlocks.begin(), __visitedBlocks.end(),
                    block.index()) != __visitedBlocks.end())
        continue;
      if (block.value().loops.size() > 0) {
        
        auto blockLoopNames = vector<string>(); blockLoopNames.reserve(funcLoops.size());
        std::transform(block.value().loops.begin(), block.value().loops.end(), std::back_inserter(blockLoopNames), [](const BlockLoopState &l) {
          return l.name;
        });
        auto foundLoop = std::find_if(funcLoops.begin(), funcLoops.end(), [&blockLoopNames](const LoopEntry &l) {
          return std::find(blockLoopNames.begin(), blockLoopNames.end(), l.name) != blockLoopNames.end();
        });
        auto currLoop = (foundLoop != funcLoops.end()) ? *foundLoop : LoopEntry();

        auto currLoopBlocks = vector<unsigned int>();
        for(const auto &b : funcBlocks| boost::adaptors::indexed(0)) {
          if (find(currLoop.blocks.begin(), currLoop.blocks.end(), b.value().name) != currLoop.blocks.end())
            currLoopBlocks.push_back(b.index());
        }
        auto tmp = getAllBlocksInLoop(funcBlocks, currLoopBlocks, currLoop, __visitedBlocks);
        for(auto &b : tmp) funcLoopOrderBlocks.push_back(funcBlocks[b]);
      } else {
        __visitedBlocks.push_back(block.index());
        funcLoopOrderBlocks.push_back(block.value());
      }
    }
    // remove normal blocks if there is a pseudo block
    auto it = funcLoopOrderBlocks.begin();
    while(it != funcLoopOrderBlocks.end()) {
      if(it->block_type == BlockInfo::BLOCK_TYPE_PSEUDOLOOP) {
        // look for all the blocks with the same name and remove them from the beginning
        auto blockName = it->name;
        auto it2 = funcLoopOrderBlocks.begin();
        while(it2 != funcLoopOrderBlocks.end()) {
          if(it2->name == blockName && it2->block_type == BlockInfo::BLOCK_TYPE_NORMAL) {
            it2 = funcLoopOrderBlocks.erase(it2);
          } else {
            it2++;
          }
        }
      }
      it++;
    }

    // Mark as built-in for now - will be updated after source matching
    funcInfo.is_builtin = true;

    // move all funcLoopOrderBlocks to loopOrderBlocks
    loopOrderBlocks.insert(loopOrderBlocks.end(), make_move_iterator(funcLoopOrderBlocks.begin()), make_move_iterator(funcLoopOrderBlocks.end()));
    
    auto blockI = std::find_if(addressOrderBlocks.begin(), addressOrderBlocks.end(), [&funcBlocks](const BlockInfo &b) {
      return funcBlocks.front().startAddress < b.startAddress;
    });
    addressOrderBlocks.insert(blockI, funcBlocks.begin(), funcBlocks.end());

    functionInfos.push_back(std::move(funcInfo));
    
    bar.tick();
  }

  for (const auto &sourceFile : unique_sourcefiles) {
    auto sourceCodeData = parseSourceCode(sourceFile);
    for (const auto &loop : sourceCodeData.loops) {
      if (source_correspondences.find(sourceFile) != source_correspondences.end() &&
          source_correspondences[sourceFile].find(loop.line) != source_correspondences[sourceFile].end()) { // loop.line is 1-based from Clang
        
        auto loopName = string();
        const auto &addresses = source_correspondences[sourceFile][loop.line];
        
        // populate loopName
        for(const auto &address: addresses) {
          // Find the block containing this address
          auto blockIt = std::find_if(addressOrderBlocks.begin(), addressOrderBlocks.end(), [&address](const BlockInfo &block) {
            return block.startAddress <= address && address <= block.endAddress;
          });

          if (blockIt != addressOrderBlocks.end()) {
            if (!blockIt->loops.empty()) {
              auto newLoopName = blockIt->loops.back().name;
              auto newLoopDepth = std::count(newLoopName.begin(), newLoopName.end(), '.');
              auto oldLoopDepth = std::count(loopName.begin(), loopName.end(), '.');
              if (newLoopDepth > oldLoopDepth || loopName.empty()) {
                loopName = newLoopName;
              }
            }
          }
        }
        
        // Find hoisted instructions
        for (const auto &bodyLine : loop.bodyLines) {
          auto bodyLineBlockIt = addressOrderBlocks.end();
          if (source_correspondences.find(sourceFile) != source_correspondences.end() &&
              source_correspondences[sourceFile].find(bodyLine) != source_correspondences[sourceFile].end()) { // bodyLine is 1-based from Clang
            const auto &bodyLineCorrAddresses = source_correspondences[sourceFile][bodyLine];
            for (const auto &bodyLineCorrAddress : bodyLineCorrAddresses) {
              bodyLineBlockIt = std::find_if(addressOrderBlocks.begin(), addressOrderBlocks.end(), [&bodyLineCorrAddress](const BlockInfo &block) {
                return block.startAddress <= bodyLineCorrAddress && bodyLineCorrAddress <= block.endAddress;
              });
              auto bodyLineLoopName = string();
              if (bodyLineBlockIt->loops.size() > 0) {
                bodyLineLoopName = bodyLineBlockIt->loops.back().name;
              }
              if (bodyLineLoopName.empty() || bodyLineLoopName.rfind(loopName, 0) != 0) {
                auto inst = std::find_if(bodyLineBlockIt->instructions.begin(), bodyLineBlockIt->instructions.end(), [&bodyLineCorrAddress](const InstructionInfo &i) {
                  return i.address == bodyLineCorrAddress;
                });
                if (inst != bodyLineBlockIt->instructions.end()) {
                  inst->flags.insert(INST_HOISTED);
                  // Add HOISTED flag to the source code line
                  if (sourceCodeInfo.find(sourceFile) != sourceCodeInfo.end()) {
                    sourceCodeInfo[sourceFile].lines[bodyLine].flags.insert(SOURCE_CODE_HOISTED); // bodyLine is 1-based
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  // Calculate call graph in-degrees and out-degrees
  std::unordered_map<std::string, int> inDegreeMap;
  std::unordered_map<std::string, int> outDegreeMap;
  
  // Initialize all functions with 0 degrees
  for (const auto &funcInfo : functionInfos) {
    inDegreeMap[funcInfo.name] = 0;
    outDegreeMap[funcInfo.name] = 0;
  }
  
  // Calculate out-degrees and in-degrees from call information
  for (const auto &funcInfo : functionInfos) {
    std::unordered_set<std::string> uniqueCallees;
    for (const auto &call : funcInfo.calls) {
      for (const auto &targetFuncName : call.targetFuncNames) {
        uniqueCallees.insert(targetFuncName);
      }
    }
    outDegreeMap[funcInfo.name] = uniqueCallees.size();
    
    // Update in-degrees for called functions
    for (const auto &callee : uniqueCallees) {
      if (inDegreeMap.find(callee) != inDegreeMap.end()) {
        inDegreeMap[callee]++;
      }
    }
  }
  
  // Assign calculated degrees to function infos
  for (auto &funcInfo : functionInfos) {
    funcInfo.call_graph_in_degree = inDegreeMap[funcInfo.name];
    funcInfo.call_graph_out_degree = outDegreeMap[funcInfo.name];
  }
  
  // Integrate source function information
  for (const auto &sourceFile : unique_sourcefiles) {
    auto sourceCodeData = parseSourceCode(sourceFile);
    
    for (const auto &sourceFunc : sourceCodeData.functions) {
      
      bool matched = false;
      FunctionInfo* bestMatch = nullptr;
      
      // Try to match source function to binary function by name
      // Use a scoring system: exact match > simplified match > substring match
      int bestScore = 0;
      
      for (auto &funcInfo : functionInfos) {
        int score = 0;
        auto simplifiedBinaryName = getSimplifiedFunctionName(funcInfo.name);
        
        // Exact match is best
        if (sourceFunc.name == funcInfo.name) {
          score = 3;
        }
        // Simplified name match is second best
        else if (sourceFunc.name == simplifiedBinaryName) {
          score = 2;
        }
        // Substring match (for templates/namespaces) is last resort
        // But only if it's a word boundary match (not in the middle of a word)
        else {
          // Check if source name appears as a complete token in binary name
          // e.g., "start" should NOT match "_start", but should match "ns::start"
          std::string searchPattern = "::" + sourceFunc.name;
          if (funcInfo.name.find(searchPattern) != std::string::npos) {
            score = 1;
          }
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = &funcInfo;
        }
      }
      
      if (bestMatch && bestScore > 0) {
        bestMatch->source_info.file = sourceFile;
        bestMatch->source_info.line = sourceFunc.line;
        bestMatch->source_info.returnType = sourceFunc.returnType;
        bestMatch->source_info.parameters.clear();
        
        for (const auto &param : sourceFunc.parameters) {
          bestMatch->source_info.parameters.push_back({param.type, param.name});
        }
        
        matched = true;
      }
    }
  }
  
  // Update is_builtin status based on source file location
  for (auto &funcInfo : functionInfos) {
    if (!funcInfo.source_info.file.empty()) {
      // Function has source info - check if it's from a system location
      funcInfo.is_builtin = isSystemLocation(funcInfo.source_info.file);
    }
    // If no source_info.file, keep is_builtin=true (external/system function)
  }

  return {addressOrderBlocks, loopOrderBlocks, source_correspondences, unique_sourcefiles, functionInfos, sourceCodeInfo};
}

bool isParsable(const string &binaryPath) {
  SymtabAPI::Symtab *symtab;
  return SymtabAPI::Symtab::openFile(symtab, binaryPath);
}


// Helper function to get current date and time
std::pair<std::string, std::string> getCurrentDateTime() {
    auto now = std::chrono::system_clock::now();
    auto time_t = std::chrono::system_clock::to_time_t(now);
    auto tm = *std::localtime(&time_t);
    
    std::stringstream date_stream, time_stream;
    date_stream << std::put_time(&tm, "%Y-%m-%d");
    time_stream << std::put_time(&tm, "%H:%M:%S");
    
    return {date_stream.str(), time_stream.str()};
}

// Helper function to extract architecture information
std::string extractArchitecture(const std::string& binaryPath) {
    // Try to extract architecture using file command or ELF headers
    // For now, return a placeholder - this can be enhanced with proper binary analysis
    try {
        std::string command = "file " + binaryPath + " 2>/dev/null";
        FILE* pipe = popen(command.c_str(), "r");
        if (pipe) {
            char buffer[1024];
            std::string result;
            while (fgets(buffer, sizeof(buffer), pipe) != nullptr) {
                result += buffer;
            }
            pclose(pipe);
            
            // Parse architecture from file output
            if (result.find("x86-64") != std::string::npos || result.find("x86_64") != std::string::npos) {
                return "x86_64";
            } else if (result.find("i386") != std::string::npos || result.find("80386") != std::string::npos) {
                return "i386";
            } else if (result.find("aarch64") != std::string::npos || result.find("ARM64") != std::string::npos) {
                return "aarch64";
            } else if (result.find("ARM") != std::string::npos) {
                return "arm";
            } else if (result.find("PowerPC") != std::string::npos || result.find("ppc64") != std::string::npos) {
                return "ppc64";
            }
        }
    } catch (...) {
        // Fallback to unknown if file command fails
    }
    return "unknown";
}

// Helper function to extract compiler information
std::pair<std::string, std::vector<std::string>> extractCompilerInfo(const std::string& binaryPath) {
    std::string compiler = "unknown";
    std::vector<std::string> flags;
    
    try {
        // Try to extract compiler information from debug sections
        // This is a simplified implementation - can be enhanced with DWARF parsing
        std::string command = "objdump -s -j .comment " + binaryPath + " 2>/dev/null | grep -v 'Contents of section'";
        FILE* pipe = popen(command.c_str(), "r");
        if (pipe) {
            char buffer[1024];
            std::string result;
            while (fgets(buffer, sizeof(buffer), pipe) != nullptr) {
                result += buffer;
            }
            pclose(pipe);
            
            // Parse compiler from comment section
            if (result.find("GCC") != std::string::npos || result.find("gcc") != std::string::npos) {
                compiler = "gcc";
            } else if (result.find("clang") != std::string::npos || result.find("Clang") != std::string::npos) {
                compiler = "clang";
            } else if (result.find("icc") != std::string::npos || result.find("Intel") != std::string::npos) {
                compiler = "icc";
            }
        }
        
        // Try to extract flags from debug information
        // This is a placeholder - real implementation would parse DWARF debug info
        command = "objdump -g " + binaryPath + " 2>/dev/null | grep -i 'producer\\|compile' | head -5";
        pipe = popen(command.c_str(), "r");
        if (pipe) {
            char buffer[1024];
            while (fgets(buffer, sizeof(buffer), pipe) != nullptr) {
                std::string line(buffer);
                if (line.find("-O") != std::string::npos) {
                    if (line.find("-O0") != std::string::npos) flags.push_back("-O0");
                    else if (line.find("-O1") != std::string::npos) flags.push_back("-O1");
                    else if (line.find("-O2") != std::string::npos) flags.push_back("-O2");
                    else if (line.find("-O3") != std::string::npos) flags.push_back("-O3");
                }
                if (line.find("-g") != std::string::npos) flags.push_back("-g");
                if (line.find("-fPIC") != std::string::npos) flags.push_back("-fPIC");
            }
            pclose(pipe);
        }
    } catch (...) {
        // Fallback if extraction fails
    }
    
    if (flags.empty()) {
        flags.push_back("unknown");
    }
    
    return {compiler, flags};
}


// Helper function to create metadata for binary
BinaryMetadata createBinaryMetadata(const std::string& binaryPath) {
    auto [date, time] = getCurrentDateTime();
    auto architecture = extractArchitecture(binaryPath);
    auto [compiler, flags] = extractCompilerInfo(binaryPath);
    
    return BinaryMetadata{
        .architecture = architecture,
        .analysis_date = date,
        .analysis_time = time,
        .compiler_used = compiler,
        .compiler_flags = flags
    };
}


BinaryDecodeResult* decodeBinary(const string binaryPath) {
  SymtabAPI::Symtab *symtab;
  auto isParsable = SymtabAPI::Symtab::openFile(symtab, binaryPath);
  if (!isParsable) {
    std::cerr << "Error: file " << binaryPath << " can not be parsed" << std::endl;
    return nullptr;
  }
  auto sts = std::make_unique<ParseAPI::SymtabCodeSource>(const_cast<char *>(binaryPath.c_str()));
  auto co = std::make_unique<ParseAPI::CodeObject>(sts.get());
  co->parse();

  auto funcs = co->funcs();
  if (funcs.empty()) {
    std::cerr << "Error: no functions in file" << std::endl;
    return nullptr;
  }

  auto [addressOrderBlocks, loopOrderBlocks, correspondence, unique_sourcefiles, functionInfos, sourceCodeInfo] = getAssembly(symtab, funcs);

  auto source_files = vector<string>(unique_sourcefiles.begin(),
                                        unique_sourcefiles.end());
  
  auto metadata = createBinaryMetadata(binaryPath);

  return new BinaryDecodeResult({
      {addressOrderBlocks, loopOrderBlocks},
      {{
        getBlockHeights(addressOrderBlocks),
        getIsBuiltInBlock(addressOrderBlocks),
        getBlockStartAddresses(addressOrderBlocks),
        getBlockIndents(addressOrderBlocks),
        getBlockTypes(addressOrderBlocks),
      }, {
        getBlockHeights(loopOrderBlocks),
        getIsBuiltInBlock(loopOrderBlocks),
        getBlockStartAddresses(loopOrderBlocks),
        getBlockIndents(loopOrderBlocks),
        getBlockTypes(loopOrderBlocks),
      }},
      source_files,
      correspondence,
      sourceCodeInfo,
      metadata,
      functionInfos
  });
}

// Optimized system check
bool isSystemLocation(const string &sourceFile) {
  return std::any_of(SYSTEM_LOCATIONS.begin(), SYSTEM_LOCATIONS.end(),
    [&sourceFile](const string &systemLocation) {
      return sourceFile.size() > systemLocation.size() &&
             sourceFile.substr(0, systemLocation.size()) == systemLocation;
    });
}