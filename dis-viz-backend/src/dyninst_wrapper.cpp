#include <dyninst_wrapper.hpp>
#include <regex>
#include <unordered_map>
#include <set>
#include <algorithm>
#include <boost/range/adaptor/indexed.hpp>
#include <filesystem>

#include <CodeObject.h>
#include <Function.h>
#include <InstructionDecoder.h>
#include <Symtab.h>

#include <json_converter.hpp>
#include <fstream>

#include <indicators/progress_bar.hpp> // https://github.com/p-ranav/indicators

using std::set, std::vector, std::string, std::map, std::unordered_map, std::ifstream, std::stringstream, std::unique_ptr;

namespace InstructionAPI = Dyninst::InstructionAPI;
namespace ParseAPI = Dyninst::ParseAPI;
namespace SymtabAPI = Dyninst::SymtabAPI;

void setInstructionFlags(const InstructionAPI::Instruction &instr,
                   std::unordered_set<block_flags> &flags) {
  switch (instr.getCategory()) {
#if defined(DYNINST_MAJOR_VERSION) && (DYNINST_MAJOR_VERSION >= 10)
    case InstructionAPI::c_VectorInsn:
      flags.insert(bb_vectorized);
      break;
#endif
    case InstructionAPI::c_CallInsn:
      flags.insert(bb_call);
      break;
    case InstructionAPI::c_SysEnterInsn:
    case InstructionAPI::c_SyscallInsn:
      flags.insert(bb_syscall);
      break;
    default:
      break;
  }
  if (instr.readsMemory()) flags.insert(bb_memory_read);
  if (instr.writesMemory()) flags.insert(bb_memory_write);
}

string print_clean_string(const string &str) {
  static std::regex pattern("[^a-zA-Z0-9 /:;,\\.{}\\[\\]<>~|\\-_+()&\\*=$!#]");
  return regex_replace(str, pattern, "?");
}

string number_to_hex(const unsigned long val) {
  auto stream = stringstream();
  stream << std::nouppercase << std::showbase << std::hex << (unsigned int)val;
  return stream.str();
}

string number_to_hex(const unsigned int val) {
  auto stream = stringstream();
  stream << std::nouppercase << std::showbase << std::hex << val;
  return stream.str();
}

string number_to_hex(const int val) {
  auto stream = stringstream();
  stream << std::nouppercase << std::showbase << std::hex << val;
  return stream.str();
}

string number_to_hex(const long val) {
  auto stream = stringstream();
  stream << std::nouppercase << std::showbase << std::hex << (int)val;
  return stream.str();
}

inline string getRegFromFullName(const string &fullname) {
  return fullname.substr(fullname.rfind("::") + 2);
}

VariableInfo printVar(SymtabAPI::localVar *var) {
  auto name = var->getName();
  auto lineNum = var->getLineNum();
  auto fileName = var->getFileName();

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


LoopEntry printLoopEntry(map<ParseAPI::Block *, string> &block_ids, ParseAPI::LoopTreeNode &lt) {
  auto loop_entry = LoopEntry();

  if (lt.loop) {
    auto backedges = vector<ParseAPI::Edge *>();
    auto blocks = vector<ParseAPI::Block *>();
    lt.loop->getBackEdges(backedges);
    lt.loop->getLoopBasicBlocks(blocks);

    loop_entry.name = lt.name();
    std::vector<ParseAPI::Block *> loop_entry_blocks;
    lt.loop->getLoopEntries(loop_entry_blocks);
    loop_entry.header_block = loop_entry_blocks.size() > 0 ? block_ids[loop_entry_blocks[0]] : "";
    loop_entry.latch_block = "";

    if (!backedges.empty()) {
      for (auto &e : backedges) {
        loop_entry.backedges.emplace_back(
            block_ids[e->src()], block_ids[e->trg()]);
      }
    }
    for (auto &block : blocks) loop_entry.blocks.push_back(block_ids[block]);
  }
  for (auto &i : lt.children) loop_entry.loops.push_back(printLoopEntry(block_ids, *i));
  return loop_entry;
}

bool matchOperands(const vector<signed int> &readSet,
                   const vector<signed int> &writeSet,
                   const vector<InstructionAPI::Operand> &operands) {
  auto readSetMatched = vector<bool>(readSet.size());
  auto writeSetMatched = vector<bool>(writeSet.size());

  for (auto &operand : operands) {
    auto regs = InstructionAPI::Operation_impl::registerSet();
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

// Hidable getFuncBegin(ParseAPI::Function *f) {
//   auto blocks = f->blocks();
//   auto insns = ParseAPI::Block::Insns();
//   (*blocks.begin())->getInsns(insns);

//   auto itm = insns.begin();
//   auto instruction = itm->second;

//   auto operation = instruction.getOperation();
//   if (operation.getID() == e_push) {
//     auto operands = vector<InstructionAPI::Operand>();
//     instruction.getOperands(operands);

//     if (!matchOperands({Dyninst::x86_64::rsp, Dyninst::x86_64::rbp}, {},
//                        operands))
//       return {};
//   } else
//     return {};

//   itm++;
//   itm->first;
//   if (itm == insns.end()) return {};
//   instruction = itm->second;

//   operation = instruction.getOperation();
//   // mov %rsp %rbp
//   if (operation.getID() == e_mov) {
//     auto operands = vector<InstructionAPI::Operand>();
//     instruction.getOperands(operands);
//     if (!matchOperands(
//             {Dyninst::x86_64::rsp},                        // Read Reg
//             {Dyninst::x86_64::rbp, Dyninst::x86_64::rsp},  // Write Reg
//             operands))
//       return {};
//   } else
//     return {};

//   return {"Function Entry", insns.begin()->first, itm->first};
// }

string block_to_name(const ParseAPI::Function *fn, const ParseAPI::Block *block,
                     const int cur_id) {
  return print_clean_string(fn->name() + ": B" + Dyninst::itos(cur_id));
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
  auto blockHeights = vector<int>(); blockHeights.reserve(blocks.size());
  std::transform(blocks.begin(), blocks.end(), std::back_inserter(blockHeights), [](const BlockInfo &b) {
    return b.block_type == BlockInfo::BLOCK_TYPE_NORMAL ? b.nInstructions : 0;
  });
  return blockHeights;
}

vector<bool> getIsBuiltInBlock(const vector<BlockInfo> &blocks) {
  auto systemLocations = vector<string>{
      "/usr/",
  };
  auto isBuiltInBlock = vector<bool>(); isBuiltInBlock.reserve(blocks.size());
  std::transform(
      blocks.begin(), blocks.end(), std::back_inserter(isBuiltInBlock),
      [&systemLocations](const BlockInfo &b) {
        for(const auto &ins: b.instructions) {
          for(const auto &correspondence: ins.correspondence) {
            auto sourceFile = correspondence.first;
            for (const auto &systemLocation : systemLocations) {
              if (sourceFile.size() > systemLocation.size()) {
                if (equal(sourceFile.begin(),
                          sourceFile.begin() + systemLocation.size(),
                          systemLocation.begin()))
                  return true;
              }
            }
          }
        }

        return false;
      });
  return isBuiltInBlock;
}

vector<int> getBlockStartAddresses(const vector<BlockInfo> &blocks) {
  auto blockStartAddresses = vector<int>(); blockStartAddresses.reserve(blocks.size());
  std::transform(blocks.begin(), blocks.end(), std::back_inserter(blockStartAddresses), [](const BlockInfo &b) {
    return b.startAddress;
  });
  return blockStartAddresses;
}

vector<int> getBlockIndents(const vector<BlockInfo> &blocks) {
  auto blockIndents = vector<int>(); blockIndents.reserve(blocks.size());
  std::transform(blocks.begin(), blocks.end(), std::back_inserter(blockIndents), [](const BlockInfo &b) {
    return b.loops.size();
  });
  return blockIndents;
}

void getInlines(const set<SymtabAPI::InlinedFunction*> &inlineFuncs, vector<InlineEntry> &result) {
  for (auto &inlineFunc : inlineFuncs) {
    auto demangleStatus = int();
    const auto name = abi::__cxa_demangle(inlineFunc->getName().c_str(), 0, 0, &demangleStatus);
    auto name_str = name ? string(name) : inlineFunc->getName();
    const auto &ranges = inlineFunc->getRanges();

    auto inlineRanges = vector<std::pair<unsigned long, unsigned long>>();
    for (auto range : ranges)
      inlineRanges.push_back({range.low(), range.high()});

    result.push_back({
        print_clean_string(name_str),
        inlineRanges,
        inlineFunc->getCallsite().first,
        inlineFunc->getCallsite().second,
    });

    free(const_cast<char *>(name));

    auto ic = SymtabAPI::InlineCollection(inlineFunc->getInlines());
    auto next_funcs = set<SymtabAPI::InlinedFunction *>();
    for (auto &j : ic)
      next_funcs.insert(static_cast<SymtabAPI::InlinedFunction *>(j));
    if (!next_funcs.empty())
      getInlines(next_funcs, result);
  }
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

std::tuple<vector<BlockInfo>, vector<BlockInfo>, unordered_map<string, map<int, vector<unsigned long>>>, set<string>, vector<FunctionInfo>> getAssembly(SymtabAPI::Symtab *symtab, const ParseAPI::CodeObject::funclist &funcs) {

  auto bar = indicators::ProgressBar{
    indicators::option::BarWidth{50},
    indicators::option::MaxProgress{funcs.size()},
    indicators::option::Start{" ["},
    indicators::option::Fill{"█"},
    indicators::option::Lead{"█"},
    indicators::option::Remainder{"-"},
    indicators::option::End{"]"},
    indicators::option::PrefixText{"Disassembling"},
    indicators::option::ForegroundColor{indicators::Color::yellow},
    indicators::option::ShowElapsedTime{true},
    indicators::option::ShowRemainingTime{true},
    indicators::option::FontStyles{std::vector<indicators::FontStyle>{indicators::FontStyle::bold}}
  };

  auto addressOrderBlocks = vector<BlockInfo>();
  auto loopOrderBlocks = vector<BlockInfo>();
  auto __visitedBlocks = unordered_map<ParseAPI::Block*, bool>();
  auto source_correspondences = unordered_map<string, map<int, vector<unsigned long>>>();
  auto block_ids = map<ParseAPI::Block *, string>();
  map<ParseAPI::Block *, std::unordered_set<block_flags>> block_flags;
  auto unique_sourcefiles = set<string>();
  auto curr_block_id = 0;
  
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
        icur += instr.size();
        setInstructionFlags(instr, block_flags[block]);
      }
      block_ids[block] = block_to_name(f, block, curr_block_id++);
    }

    // Loops
    auto funcLoops = vector<LoopEntry>();
    auto lt = unique_ptr<ParseAPI::LoopTreeNode>(f->getLoopTree());
    if (lt) {
      funcLoops = printLoopEntry(block_ids, *lt).loops;
    }
    
    // Hidables
    // auto hidables = vector<Hidable>();
    // auto fnBegin = getFuncBegin(f);
    // if (!fnBegin.name.empty()) hidables.push_back(std::move(fnBegin));

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
    if(!topLevelFuncs.empty()) {
      for(auto &topLevelFunc: topLevelFuncs) {
        auto ic = SymtabAPI::InlineCollection(topLevelFunc->getInlines());
        for (auto &funcBase : ic) {
          auto inlineFunc = static_cast<SymtabAPI::InlinedFunction *>(funcBase);          
          if(addresses.find(inlineFunc->getOffset()) == addresses.end()) continue;
          inlineFuncs.insert(inlineFunc);
        }
      }
    }
    auto inlines = vector<InlineEntry>();
    getInlines(inlineFuncs, inlines);
    
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
          call.targetFuncNames.push_back(print_clean_string((*j)->name()));
      }
      calls.push_back(call);
    }
    
    auto funcInfo = FunctionInfo{
      print_clean_string(f->name()),
      f->entry()->start(),
      {},
      {},
      {},
      calls,
      inlines,
      funcLoops,
      {} // hidables
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
          print_clean_string(f->name()),
      };
      funcInfo.basic_blocks.push_back(blockInfo.name);
      blockInfo.flags = block_flags[block];

      // for (const auto &hidable : hidables) {
      //   if (hidable.start >= block->start() && hidable.end <= block->last()) {
      //     blockInfo.hidables.push_back(std::move(hidable)); // maybe gotcha
      //   }
      // }

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
        auto correspondences = unordered_map<string, vector<int> >();
        for (const auto &li : cur_lines) {
          correspondences[print_clean_string(li->getFile())].push_back(li->getLine());
          source_correspondences[print_clean_string(li->getFile())][li->getLine()].push_back(instr.first);
        }


        blockInfo.instructions.push_back({
            instr.first,
            instr.second.format(),
            correspondences,
            getInstructionVariables(funcInfo.localVars, funcInfo.params, instr.second.format())
        });
        
      }

      blockInfo.startAddress = block->start();
      blockInfo.endAddress = block->last();
      blockInfo.nInstructions = blockInfo.instructions.size();
      addLoopHeaderInfo(blockInfo, funcLoops);
      funcBlocks.push_back(std::move(blockInfo));
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
    // move all funcLoopOrderBlocks to loopOrderBlocks
    loopOrderBlocks.insert(loopOrderBlocks.end(), make_move_iterator(funcLoopOrderBlocks.begin()), make_move_iterator(funcLoopOrderBlocks.end()));
    

    
    auto blockI = std::find_if(addressOrderBlocks.begin(), addressOrderBlocks.end(), [&funcBlocks](const BlockInfo &b) {
      return funcBlocks.front().startAddress < b.startAddress;
    });
    addressOrderBlocks.insert(blockI, make_move_iterator(funcBlocks.begin()), make_move_iterator(funcBlocks.end()));
    
    functionInfos.push_back(std::move(funcInfo));
    
    bar.tick();
  }
  return {addressOrderBlocks, loopOrderBlocks, source_correspondences, unique_sourcefiles, functionInfos};
}

auto binaryCacheResult = map<string, BinaryCacheResult*>();

bool isParsable(const string &binaryPath) {
  SymtabAPI::Symtab *symtab;
  return SymtabAPI::Symtab::openFile(symtab, binaryPath);
}

BinaryCacheResult* decodeBinaryCache(const string binaryPath, const bool saveJson) {
  if (binaryCacheResult.find(binaryPath) != binaryCacheResult.end()) return binaryCacheResult.at(binaryPath);

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

  auto [addressOrderBlocks, loopOrderBlocks, correspondence, unique_sourcefiles, functionInfos] = getAssembly(symtab, funcs);
  auto source_files = vector<string>(unique_sourcefiles.begin(),
                                        unique_sourcefiles.end());
  
  binaryCacheResult[binaryPath] = new BinaryCacheResult({
      {addressOrderBlocks, loopOrderBlocks},
      {{
        getBlockHeights(addressOrderBlocks),
        getIsBuiltInBlock(addressOrderBlocks),
        getBlockStartAddresses(addressOrderBlocks),
        getBlockIndents(addressOrderBlocks),
      }, {
        getBlockHeights(loopOrderBlocks),
        getIsBuiltInBlock(loopOrderBlocks),
        getBlockStartAddresses(loopOrderBlocks),
        getBlockIndents(loopOrderBlocks),
      }},
      source_files,
      correspondence,
  });
  
  if(saveJson) {
    auto jsonName = binaryPath.substr(binaryPath.find_last_of("/\\") + 1) + ".json";

    auto path = std::filesystem::current_path() / "json";
    if(!std::filesystem::is_directory(path) || !std::filesystem::exists(path)) {
      std::filesystem::create_directory(path);
    }
    path /= jsonName;
    auto o = std::ofstream(path.string());
    auto j = crow::json::wvalue();
    j["blocks_info"] = convertBinaryCache(binaryCacheResult[binaryPath]);
    
    j["functions"] = convertFunctionInfos(functionInfos);
    
    o << j.dump() << std::endl;
  }
  
  return binaryCacheResult[binaryPath];
}