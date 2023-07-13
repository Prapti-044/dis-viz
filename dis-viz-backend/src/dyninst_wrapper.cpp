#include <dyninst_wrapper.hpp>
#include <regex>
#include <unordered_map>
#include <set>
#include <algorithm>
#include <boost/range/adaptor/indexed.hpp>

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

void setBlockFlags(const ParseAPI::Block *block, const InstructionAPI::Instruction &instr,
                   set<block_flags> &flags) {
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
  stringstream stream;
  stream << std::nouppercase << std::showbase << std::hex << (unsigned int)val;
  return stream.str();
}

string number_to_hex(const unsigned int val) {
  stringstream stream;
  stream << std::nouppercase << std::showbase << std::hex << val;
  return stream.str();
}

string number_to_hex(const int val) {
  stringstream stream;
  stream << std::nouppercase << std::showbase << std::hex << val;
  return stream.str();
}

string number_to_hex(const long val) {
  stringstream stream;
  stream << std::nouppercase << std::showbase << std::hex << (int)val;
  return stream.str();
}

inline string getRegFromFullName(const string &fullname) {
  return fullname.substr(fullname.rfind("::") + 2);
}

VariableInfo printVar(SymtabAPI::localVar *var) {
  string name = var->getName();
  int lineNum = var->getLineNum();
  string fileName = var->getFileName();

  vector<VarLocation> varLocations;
  vector<Dyninst::VariableLocation> locations = var->getLocationLists();
  for (auto &location : locations) {
    long frameOffset = location.frameOffset;
    Dyninst::Address lowPC = location.lowPC;
    Dyninst::Address hiPC = location.hiPC;
    string hiPC_str = number_to_hex(hiPC);
    string lowPC_str = number_to_hex(lowPC);

    Dyninst::MachRegister mr_reg = location.mr_reg;
    string full_regName = mr_reg.name();
    string regName = getRegFromFullName(full_regName);
    string finalVarString;

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
  LoopEntry loop_entry;

  if (lt.loop) {
    vector<ParseAPI::Edge *> backedges;
    vector<ParseAPI::Block *> blocks;
    lt.loop->getBackEdges(backedges);
    lt.loop->getLoopBasicBlocks(blocks);

    loop_entry.name = lt.name();

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
  vector<bool> readSetMatched(readSet.size());
  vector<bool> writeSetMatched(writeSet.size());

  for (auto &operand : operands) {
    InstructionAPI::Operation_impl::registerSet regs;
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
  ParseAPI::Block::Insns insns;
  (*blocks.begin())->getInsns(insns);

  auto itm = insns.begin();
  auto instruction = itm->second;

  auto operation = instruction.getOperation();
  if (operation.getID() == e_push) {
    vector<InstructionAPI::Operand> operands;
    instruction.getOperands(operands);

    if (!matchOperands({Dyninst::x86_64::rsp, Dyninst::x86_64::rbp}, {},
                       operands))
      return {};
  } else
    return {};

  itm++;
  itm->first;
  if (itm == insns.end()) return {};
  instruction = itm->second;

  operation = instruction.getOperation();
  // mov %rsp %rbp
  if (operation.getID() == e_mov) {
    vector<InstructionAPI::Operand> operands;
    instruction.getOperands(operands);
    if (!matchOperands(
            {Dyninst::x86_64::rsp},                        // Read Reg
            {Dyninst::x86_64::rbp, Dyninst::x86_64::rsp},  // Write Reg
            operands))
      return {};
  } else
    return {};

  return {"Function Entry", insns.begin()->first, itm->first};
}

string block_to_name(const ParseAPI::Function *fn, const ParseAPI::Block *block,
                     const int cur_id) {
  return print_clean_string(fn->name() + ": B" + Dyninst::itos(cur_id));
}

vector<VariableInfo> getInstructionVariables(
    SymtabAPI::Symtab *symtab,
    Dyninst::Offset instructionAddress) {
  SymtabAPI::Function *symt_func = nullptr;
  symtab->getContainingFunction(instructionAddress, symt_func);

  vector<SymtabAPI::localVar *> thisLocalVars;
  vector<SymtabAPI::localVar *> thisParams;
  symt_func->getLocalVariables(thisLocalVars);
  symt_func->getParams(thisParams);
  
  vector<VariableInfo> allVars;
  for (auto var : thisLocalVars) {
    VariableInfo varInfo = printVar(var);
    varInfo.var_type = VariableInfo::VAR_TYPE_LOCAL;
    allVars.push_back(std::move(varInfo));
  }
  for (auto var : thisParams) {
    VariableInfo varInfo = printVar(var);
    varInfo.var_type = VariableInfo::VAR_TYPE_PARAM;
    allVars.push_back(std::move(varInfo));
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
  vector<unsigned int> blocksInLoop;

  vector<unsigned int> currLoopBlocks;
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
  return blocksInLoop;
}

vector<int> getBlockHeights(const vector<BlockInfo> &blocks) {
  vector<int> blockHeights; blockHeights.reserve(blocks.size());
  std::transform(blocks.begin(), blocks.end(), std::back_inserter(blockHeights), [](const BlockInfo &b) {
    return b.block_type == BlockInfo::BLOCK_TYPE_NORMAL ? b.nInstructions : 0;
  });
  return blockHeights;
}

vector<bool> getIsBuiltInBlock(const vector<BlockInfo> &blocks) {
  vector<string> systemLocations = {
      "/usr/",
  };
  vector<bool> isBuiltInBlock; isBuiltInBlock.reserve(blocks.size());
  std::transform(
      blocks.begin(), blocks.end(), std::back_inserter(isBuiltInBlock),
      [&systemLocations](const BlockInfo &b) {
        for(const auto &ins: b.instructions) {
          for(const auto &correspondence: ins.correspondence) {
            string sourceFile = correspondence.first;
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
  vector<int> blockStartAddresses; blockStartAddresses.reserve(blocks.size());
  std::transform(blocks.begin(), blocks.end(), std::back_inserter(blockStartAddresses), [](const BlockInfo &b) {
    return b.startAddress;
  });
  return blockStartAddresses;
}

vector<int> getBlockIndents(const vector<BlockInfo> &blocks) {
  vector<int> blockIndents; blockIndents.reserve(blocks.size());
  std::transform(blocks.begin(), blocks.end(), std::back_inserter(blockIndents), [](const BlockInfo &b) {
    return b.loops.size();
  });
  return blockIndents;
}

std::tuple<vector<BlockInfo>, vector<BlockInfo>, unordered_map<string, map<int, vector<unsigned long>>>, set<string>> getAssembly(SymtabAPI::Symtab *symtab, const ParseAPI::CodeObject::funclist &funcs) {

  indicators::ProgressBar bar{
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

  vector<BlockInfo> addressOrderBlocks;
  vector<BlockInfo> loopOrderBlocks;
  unordered_map<ParseAPI::Block*, bool> __visitedBlocks;
  unordered_map<string, map<int, vector<unsigned long>>> source_correspondences;
  map<ParseAPI::Block *, string> block_ids;
  set<string> unique_sourcefiles;
  int curr_block_id = 0;

  // create an Instruction decoder which will convert the binary opcodes to strings
  ParseAPI::Function *anyfunc = *funcs.begin();
  InstructionAPI::InstructionDecoder decoder(
      anyfunc->isrc()->getPtrToInstruction(anyfunc->addr()),
      InstructionAPI::InstructionDecoder::maxInstructionLength, anyfunc->region()->getArch());
  

  for (const auto &f : funcs) {
    // Assign block names and get unique source files
    for (const auto &block : f->blocks()) {
      Dyninst::Address icur = block->start();
      Dyninst::Address iend = block->last();
      while (icur <= iend) {
        vector<SymtabAPI::Statement::Ptr> cur_lines;
        symtab->getSourceLines(cur_lines, icur);
        // if (cur_lines.empty()) continue;
        for(auto &fl : cur_lines) unique_sourcefiles.insert(fl->getFile());

        const unsigned char *raw_insnptr =
            (const unsigned char *)f->isrc()->getPtrToInstruction(icur);
#if defined(DYNINST_MAJOR_VERSION) && (DYNINST_MAJOR_VERSION >= 10)
        InstructionAPI::Instruction instr = decoder.decode(raw_insnptr);
#else
        InstructionAPI::Instruction::Ptr ip = decoder.decode(raw_insnptr);
        InstructionAPI::Instruction instr = *ip;
#endif
        icur += instr.size();
      }
      block_ids[block] = block_to_name(f, block, curr_block_id++);
    }

    // Loops
    vector<LoopEntry> funcLoops;
    auto lt = unique_ptr<ParseAPI::LoopTreeNode>(f->getLoopTree());
    if (lt) {
      funcLoops = printLoopEntry(block_ids, *lt).loops;
    }
    
    // Hidables
    vector<Hidable> hidables;
    Hidable fnBegin = getFuncBegin(f);
    if (!fnBegin.name.empty()) hidables.push_back(std::move(fnBegin));
    vector<BlockInfo> funcBlocks;

    for (const auto &block : f->blocks()) {
      ParseAPI::Block::Insns insns;
      block->getInsns(insns);

      BlockInfo blockInfo{
          block_ids[block],
          {},
          print_clean_string(f->name()),
      };

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
        vector<SymtabAPI::Statement::Ptr> cur_lines;
        symtab->getSourceLines(cur_lines, instr.first);
        unordered_map<string, vector<int> > correspondences;
        for (const auto &li : cur_lines) {
          correspondences[print_clean_string(li->getFile())].push_back(li->getLine());
          source_correspondences[print_clean_string(li->getFile())][li->getLine()].push_back(instr.first);
        }


        auto vars = getInstructionVariables(symtab, instr.first);
        blockInfo.instructions.push_back({
            instr.first, instr.second.format(), correspondences, vars});
      }

      blockInfo.startAddress = block->start();
      blockInfo.endAddress = block->last();
      blockInfo.nInstructions = blockInfo.instructions.size();

      funcBlocks.push_back(std::move(blockInfo));
    }
    
    int maxLoopCount = -1;
    for (const auto &loop : funcLoops) {
      unordered_map<string, int> loop_count;
      addLoopsToBlocks(funcBlocks, loop, loop_count);
      for (auto &block : funcBlocks) {
        if (block.loops.size() > maxLoopCount)
          maxLoopCount = block.loops.size();

        for (auto &loop : block.loops)
          if (loop_count.find(loop.name) != loop_count.end())
            loop.loopTotal = loop_count[loop.name];
      }
    }
    vector<unsigned int> __visitedBlocks;
    for (const auto &block : funcBlocks| boost::adaptors::indexed(0)) {
      if (find(__visitedBlocks.begin(), __visitedBlocks.end(),
                    block.index()) != __visitedBlocks.end())
        continue;
      if (block.value().loops.size() > 0) {
        
        vector<string> blockLoopNames; blockLoopNames.reserve(funcLoops.size());
        std::transform(block.value().loops.begin(), block.value().loops.end(), std::back_inserter(blockLoopNames), [](const BlockLoopState &l) {
          return l.name;
        });
        auto foundLoop = std::find_if(funcLoops.begin(), funcLoops.end(), [&blockLoopNames](const LoopEntry &l) {
          return std::find(blockLoopNames.begin(), blockLoopNames.end(), l.name) != blockLoopNames.end();
        });
        auto currLoop = (foundLoop != funcLoops.end()) ? *foundLoop : LoopEntry();

        vector<unsigned int> currLoopBlocks;
        for(const auto &b : funcBlocks| boost::adaptors::indexed(0)) {
          if (find(currLoop.blocks.begin(), currLoop.blocks.end(), b.value().name) != currLoop.blocks.end())
            currLoopBlocks.push_back(b.index());
        }
        auto tmp = getAllBlocksInLoop(funcBlocks, currLoopBlocks, currLoop, __visitedBlocks);
        for(auto &b : tmp) loopOrderBlocks.push_back(funcBlocks[b]);
      } else {
        __visitedBlocks.push_back(block.index());
        loopOrderBlocks.push_back(block.value());
      }
    }
    
    std::sort(funcBlocks.begin(), funcBlocks.end(), [](const BlockInfo &a, const BlockInfo &b) {
      return a.startAddress < b.startAddress;
    });
    
    vector<string> processed_loops;
    int idx = 0;
    while (idx+1 < funcBlocks.size()) {
      if (funcBlocks[idx].loops.size() > 0 && find(processed_loops.begin(), processed_loops.end(), funcBlocks[idx].loops.back().name) != processed_loops.end()) {
        idx++;
        continue;
      }
      
      vector<string> blockLoopNames;
      std::transform(funcBlocks[idx].loops.begin(), funcBlocks[idx].loops.end(), std::back_inserter(blockLoopNames), [](const BlockLoopState &l) {
        return l.name;
      });
      vector<string> nextBlockLoopNames;
      std::transform(funcBlocks[idx+1].loops.begin(), funcBlocks[idx+1].loops.end(), std::back_inserter(nextBlockLoopNames), [](const BlockLoopState &l) {
        return l.name;
      });
      
      if( std::all_of(nextBlockLoopNames.begin(), nextBlockLoopNames.end(), [&blockLoopNames](const string &l) {
        return std::find(blockLoopNames.begin(), blockLoopNames.end(), l) != blockLoopNames.end();
      }) && blockLoopNames.size() > nextBlockLoopNames.size()) {
        // Check if this is the last block of this loop
        if(funcBlocks[idx].loops.back().loopCount != funcBlocks[idx].loops.back().loopTotal) {
          vector<BlockInfo> pseudo_blocks;
          auto it = funcBlocks.begin() + (idx + 1);
          for(; it != funcBlocks.end(); it++) {
            if (it->loops.size() > 0 && it->loops.back().name == funcBlocks[idx].loops.back().name && funcBlocks[idx].functionName == it->functionName) {
              BlockInfo pseudoBlock = *it;
              pseudoBlock.block_type = BlockInfo::BLOCK_TYPE_PSEUDOLOOP;
              pseudo_blocks.push_back(std::move(pseudoBlock));
              if(pseudo_blocks.back().loops.back().loopCount == pseudo_blocks.back().loops.back().loopTotal) {
                break;
              }
            }
          }
          
          processed_loops.push_back(funcBlocks[idx].loops.back().name);
          idx++;
          int skips = pseudo_blocks.size();
          funcBlocks.insert(funcBlocks.begin() + idx, make_move_iterator(pseudo_blocks.rbegin()), make_move_iterator(pseudo_blocks.rend()));
          idx += skips;

        }
      }
      idx++; 
    }
    addressOrderBlocks.insert(addressOrderBlocks.end(), make_move_iterator(funcBlocks.begin()), make_move_iterator(funcBlocks.end()));
    
    bar.tick();
  }
  return {addressOrderBlocks, loopOrderBlocks, source_correspondences, unique_sourcefiles};
}

map<string, BinaryCacheResult*> binaryCacheResult;

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

  auto [addressOrderBlocks, loopOrderBlocks, correspondence, unique_sourcefiles] = getAssembly(symtab, funcs);
  vector<string> source_files(unique_sourcefiles.begin(),
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
    string jsonName = binaryPath.substr(binaryPath.find_last_of("/\\") + 1) + ".json";
    std::ofstream o(jsonName);
    
    crow::json::wvalue j = convertBinaryCache(binaryCacheResult[binaryPath]);
    
    o << j.dump() << std::endl;
  }
  
  return binaryCacheResult[binaryPath];
}