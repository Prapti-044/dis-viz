#include <signal.h>

#include <fstream>
#include <iostream>
#include <map>
#include <regex>
#include <set>

#include "CodeObject.h"
#include "Function.h"
#include "InstructionDecoder.h"
#include "Symtab.h"
#include "includes/cxxopts.hpp"
#include "includes/json.hpp"

#define INTERACTIVE_TIMEOUT_S 600
#define MAX_NAME_LENGTH 128

using namespace std;
using namespace Dyninst;
using namespace ParseAPI;
using namespace SymtabAPI;
using namespace InstructionAPI;

using json = nlohmann::json;

// Arguements
bool verbose;
bool interactive;
string binaryPath;
vector<string> functionNames;

typedef enum {
  bb_vectorized,
  bb_memory_read,
  bb_memory_write,
  bb_call,
  bb_syscall,
  bb_fp
} block_flags;

// Globals
map<Block *, int> block_ids;
map<Block *, set<block_flags> > block_to_flags;
set<Address> addresses;
SymtabAPI::Symtab *symtab;
CodeObject::funclist funcs;
map<Block *, unsigned long> block_to_id;

cxxopts::Options options("simpleopt", "The simpleopt takes a binary file and disassembles it and creates a convinient json file.");
void printHelp() { cout << options.help() << endl; }

bool parseArgs(int argc, char **argv) {
  options.add_options()("i,interactive", "Start in Interactive mode",
                        cxxopts::value<bool>()->default_value("false"))(
      "b,binary", "Binary File Path", cxxopts::value<std::string>())(
      "f,functions", "Functions",
      cxxopts::value<vector<string> >()->default_value("null"))(
      "v,verbose", "Verbose output",
      cxxopts::value<bool>()->default_value("false"))("h,help", "Print usage");

  cxxopts::ParseResult result;
  try {
    result = options.parse(argc, argv);
  } catch (cxxopts::option_not_exists_exception e) {
    cout << e.what() << endl;
    printHelp();
    exit(0);
  }

  if (result.count("help")) {
    printHelp();
    exit(0);
  }
  try {
    verbose = result["verbose"].as<bool>();
    interactive = result["interactive"].as<bool>();
    binaryPath = result["binary"].as<std::string>();
    functionNames = result["functions"].as<vector<string> >();
  } catch (cxxopts::option_has_no_value_exception e) {
    printHelp();
    e.what();
    exit(0);
  }
}

void setBlockFlags(Block *block, const Instruction &instr,
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

string print_clean_string(const std::string &str) {
  static regex pattern("[^a-zA-Z0-9 /:;,\\.{}\\[\\]<>~|\\-_+()&\\*=$!#]");
  const size_t len = str.length();
  std::string str2;
  if (len > MAX_NAME_LENGTH) {
    size_t substrlen = (MAX_NAME_LENGTH - 3) / 2;
    str2 = str.substr(0, substrlen) + "..." + str.substr(len - substrlen);
  } else {
    str2 = str;
  }

  return regex_replace(str, pattern, "?");
}

template <typename T>
inline string number_to_hex(T val) {
  stringstream stream;
  stream << hex << val;
  return stream.str();
}

inline string getRegFromFullName(string fullname) {
  return fullname.substr(fullname.rfind("::") + 2);
}

json printVar(localVar *var) {
  string stClassArr[] = {"storageUnset", "storageAddr", "storageReg",
                         "storageRegOffset"};
  string refClassArr[] = {"storageRefUnset", "storageRef", "storageNoRef"};

  string name = var->getName();
  int lineNum = var->getLineNum();
  string fileName = var->getFileName();

  json locations_json = json::array();
  vector<VariableLocation> locations = var->getLocationLists();
  for (auto &location : locations) {
    long frameOffset = location.frameOffset;
    Address lowPC = location.lowPC;
    Address hiPC = location.hiPC;
    string hiPC_str = number_to_hex(hiPC);
    string lowPC_str = number_to_hex(lowPC);

    MachRegister mr_reg = location.mr_reg;
    string full_regName = mr_reg.name();
    string regName = getRegFromFullName(full_regName);
    string finalVarString;

    // Match the variable format with the output in the disassembly
    if (location.stClass == storageAddr) {
      if (location.refClass == storageNoRef) {
        finalVarString = "$0x" + number_to_hex(frameOffset);  // at&t syntax
        // finalVarString = number_to_hex(frameOffset);
      } else if (location.refClass == storageRef) {
        finalVarString =
            "($0x" + number_to_hex(frameOffset) + ")";  // at&t syntax
        // finalVarString = "[" + number_to_hex(frameOffset) + "]";
      }
    } else if (location.stClass == storageReg) {
      if (location.refClass == storageNoRef) {
        finalVarString =
            "%" + getRegFromFullName(location.mr_reg.name());  // at&t syntax
        // finalVarString = getRegFromFullName(location.mr_reg.name());
      } else if (location.refClass == storageRef) {
        finalVarString = "(%" + getRegFromFullName(location.mr_reg.name()) +
                         ")";  // at&t syntax
        // finalVarString = "[" + getRegFromFullName(location.mr_reg.name())
        // +
        // "]";
      }
    } else if (location.stClass == storageRegOffset) {
      if (location.refClass == storageNoRef) {
        finalVarString = "0x" + number_to_hex(frameOffset) + "(%" +
                         getRegFromFullName(location.mr_reg.name()) +
                         ")";  // at&t syntax
        // finalVarString = getRegFromFullName(location.mr_reg.name()) + " +
        // "
        // + number_to_hex(frameOffset);
      } else if (location.refClass == storageRef) {
        finalVarString = "0x" + number_to_hex(frameOffset) + "(%" +
                         getRegFromFullName(location.mr_reg.name()) +
                         ")";  // at&t syntax
        // finalVarString = "[" + getRegFromFullName(location.mr_reg.name())
        // + " + " + number_to_hex(frameOffset) + "]";
      }
    }
    locations_json.push_back({{"start", lowPC_str},
                              {"end", hiPC_str},
                              {"location", finalVarString}});
  }
  return {{"name", print_clean_string(name)},
          {"file", fileName},
          {"line", lineNum},
          {"locations", locations_json}};
}

json printFnVars(FunctionBase *f) {
  json result = json::array();

  vector<localVar *> thisLocalVars;
  vector<localVar *> thisParams;

  f->getLocalVariables(thisLocalVars);
  f->getParams(thisParams);

  set<localVar *> allVars;

  for(auto &thisLocalVar : thisLocalVars)
    allVars.insert(thisLocalVar);
  for(auto &thisParam : thisParams)
    allVars.insert(thisParam);

  for (auto &allVar : allVars) {
    // printVar
    result.push_back(printVar(allVar));
  }

  return result;
}

json printInlineEntries(set<InlinedFunction *> &ifuncs,
                        json result = json::array()) {
  for (auto &ifunc : ifuncs) {
    int status;
    const char *name =
        abi::__cxa_demangle(ifunc->getName().c_str(), 0, 0, &status);
    const char *name_str = name ? name : ifunc->getName().c_str();
    const FuncRangeCollection &ranges = ifunc->getRanges();

    json ranges_json = json::array();
    for (auto range : ranges)
      ranges_json.push_back({{"start", range.low()}, {"end", range.high()}});

    result.push_back({
        {"name", print_clean_string(name_str)},
        {"vars", printFnVars(static_cast<FunctionBase *>(ifunc))},
        {"ranges", ranges_json},
        {"callsite_file", ifunc->getCallsite().first},
        {"callsite_line", ifunc->getCallsite().second},
    });

    free(const_cast<char *>(name));

    SymtabAPI::InlineCollection ic = ifunc->getInlines();
    set<InlinedFunction *> next_funcs;
    for (auto &j : ic)
      next_funcs.insert(static_cast<InlinedFunction *>(j));
    if (!next_funcs.empty())
      printInlineEntries(next_funcs, result);
  }
  return result;
}

json printInlines(ParseAPI::Function *f) {
  set<FunctionBase *> top_level_functions;
  for (const auto &i : f->blocks()) {
    SymtabAPI::Function *symt_func = nullptr;
    symtab->getContainingFunction(i->start(), symt_func);
    if (!symt_func) continue;
    top_level_functions.insert(symt_func);
  }
  if (top_level_functions.empty()) return {};

  set<InlinedFunction *> ifuncs;
  json vars_json = json::array();
  for(auto &i : top_level_functions) {
    json top_level_vars_json = printFnVars(static_cast<FunctionBase *>(i));
    for(auto &vars_i : top_level_vars_json)
      vars_json.push_back(vars_i);

    SymtabAPI::InlineCollection ic = i->getInlines();
    for (auto &j : ic) {
      InlinedFunction *ifunc = static_cast<InlinedFunction *>(j);
      if (addresses.find(ifunc->getOffset()) == addresses.end()) continue;
      ifuncs.insert(ifunc);
    }
  }
  if (ifuncs.empty()) return {{"vars", vars_json}, {"inlines", {}}};

  return {{"vars", vars_json}, {"inlines", printInlineEntries(ifuncs)}};
}

json printLoopEntry(LoopTreeNode *lt) {
  json loop_json = json::object();

  if (lt->loop) {
    vector<Edge *> backedges;
    vector<Block *> blocks;
    lt->loop->getBackEdges(backedges);
    lt->loop->getLoopBasicBlocks(blocks);

    loop_json["name"] = lt->name();

    if (!backedges.empty()) {
      for (auto &e : backedges) {
        loop_json["backedges"].push_back({
            {"from", block_to_id[e->src()]},
            {"to", block_to_id[e->trg()]},
        });
      }
    }
    for (auto &i : blocks)
      loop_json["blocks"].push_back(block_to_id[i]);
  }
  for (auto &i : lt->children)
    loop_json["loops"].push_back(printLoopEntry(i));
  return loop_json;
}

json printParse() {
  json js;

  // setBlockIds()
  unsigned long id = 0;
  for (auto &fun : funcs) {
    ParseAPI::Function::blocklist blocks = fun->blocks();
    for (const auto &i : blocks)
      block_to_id[i] = id++;
  }

  // generateLineInfo()
  set<Statement::Ptr> all_lines;
  vector<Statement::Ptr> cur_lines;
  set<string> unique_sourcefiles;

  for (auto &addri : addresses) {
    cur_lines.clear();
    symtab->getSourceLines(cur_lines, addri);
    if (cur_lines.empty()) continue;
    copy(cur_lines.begin(), cur_lines.end(),
         inserter(all_lines, all_lines.begin()));

    for (auto &fl : cur_lines)
      unique_sourcefiles.insert(fl->getFile());
  }
  for (auto &li : all_lines) {
    js["lines"].push_back({
        {"file", print_clean_string(li->getFile())},
        {"line", li->getLine()},
        {"from", li->startAddr()},
        {"to", li->endAddr()},
    });
  }

  // generateFunctionTable
  for (auto &f : funcs) {
    json basic_blocks = json::array();
    // printFunctionEntry
    auto blocks = f->blocks();



    json hidables = json::array();
    // hidables
    ParseAPI::Block::Insns insns;
    (*blocks.begin())->getInsns(insns);
    auto itm = insns.begin();
    if((itm->second.format() == "push %rbp" &&
      (++itm)->second.format() == "mov %rsp,%rbp")) {

      hidables.push_back({
        {"start", insns.begin()->first},
        {"end", itm->first},
        {"name", "function beginning"}
      });
    }



    for (const auto &block : blocks) {
      json basic_block = json::object();
      // printBlockEntry
      basic_block["id"] = block_to_id[block];
      basic_block["start"] = block->start();
      basic_block["end"] = block->end();


      const set<block_flags> &flags = block_to_flags[block];
      vector<string> jsonFlags;
      for (auto &i : flags) {
        switch (i) {
          case bb_vectorized:
            basic_block["flags"].push_back("vector");
            break;
          case bb_memory_read:
            basic_block["flags"].push_back("memread");
            break;
          case bb_memory_write:
            basic_block["flags"].push_back("memwrite");
            break;
          case bb_call:
            basic_block["flags"].push_back("call");
            break;
          case bb_syscall:
            basic_block["flags"].push_back("syscall");
            break;
          case bb_fp:
            basic_block["flags"].push_back("fp");
            break;
        }
      }

      basic_blocks.push_back(basic_block);
    }

    // printInlines
    json inlines_json = printInlines(f);

    json loops_json;
    LoopTreeNode *lt = f->getLoopTree();
    if (lt) {
      loops_json = printLoopEntry(lt);
    }

    // printCalls
    json calls_json = json::array();
    ParseAPI::Function::edgelist el = f->callEdges();
    ParseAPI::Function::edgelist::iterator i = el.begin();
    for (auto &edge : el) {
      // while (i != el.end()) {
      if (!edge) continue;
      Block *from = edge->src();
      Block *to = edge->trg();

      json call_json = json::object();
      call_json["address"] = from->lastInsnAddr();

      if (to && to->start() != (unsigned long)-1)
        call_json["target"] = to->start();
      else
        call_json["target"] = 0;

      vector<ParseAPI::Function *> funcs;
      to->getFuncs(funcs);
      if (!funcs.empty()) {
        json target_func_json = json::array();
        for (auto j = funcs.begin(); j != funcs.end(); j++)
          target_func_json.push_back(print_clean_string((*j)->name()));
        call_json["target_func"] = target_func_json;
      }
      calls_json.push_back(call_json);
    }

    js["functions"].push_back(json::object({
        {"name", print_clean_string(f->name())},
        {"entry", f->addr()},
        {"basicblocks", basic_blocks},
        {"vars", inlines_json["vars"]},
        {"calls", calls_json},
        {"inlines", inlines_json["inlines"]},
        {"loops", loops_json["loops"]},
        {"hidables", hidables}
    }));
  }

  return js;
}

int main(int argc, char **argv) {
  parseArgs(argc, argv);

  const char *last_slash = strrchr(binaryPath.c_str(), '/');
  string filename;
  if (last_slash)
    filename = string(last_slash + 1);
  else
    filename = binaryPath;

  bool isParsable = SymtabAPI::Symtab::openFile(symtab, binaryPath);
  if (!isParsable) {
    cerr << "Error: file " << binaryPath << " can not be parsed" << endl;
    return -1;
  }
  SymtabCodeSource *sts =
      new SymtabCodeSource(const_cast<char *>(binaryPath.c_str()));
  CodeObject *co = new CodeObject(sts);
  // parse the binary given as a command line arg
  co->parse();

  if (functionNames.size() == 1 && functionNames[0] == "null") {
    funcs = co->funcs();
  } else {
    for (auto &func : co->funcs())
      if (find(functionNames.begin(), functionNames.end(), func->name()) != functionNames.end())
        funcs.insert(func);
  }
  if (funcs.empty()) {
    cerr << "Error: no functions in file";
    return -1;
  }

  // create an Instruction decoder which will convert the binary opcodes to
  // strings
  ParseAPI::Function *anyfunc = *funcs.begin();
  InstructionDecoder decoder(
      anyfunc->isrc()->getPtrToInstruction(anyfunc->addr()),
      InstructionDecoder::maxInstructionLength, anyfunc->region()->getArch());

  int cur_id = 0;

  for (auto &f : funcs) {
    if (f->blocks().empty()) continue;

    for (const auto &block : f->blocks()) {
      Address icur = block->start();
      Address iend = block->last();
      set<block_flags> flags;
      while (icur <= iend) {
        addresses.insert(icur);
        const unsigned char *raw_insnptr =
            (const unsigned char *)f->isrc()->getPtrToInstruction(icur);
#if defined(DYNINST_MAJOR_VERSION) && (DYNINST_MAJOR_VERSION >= 10)
        Instruction instr = decoder.decode(raw_insnptr);
#else
        Instruction::Ptr ip = decoder.decode(raw_insnptr);
        Instruction instr = *ip;
#endif
        icur += instr.size();
        setBlockFlags(block, instr, flags);
      }
      block_ids[block] = cur_id++;
      block_to_flags.insert(make_pair(block, flags));
    }
  }

  json js = printParse();
  ofstream jsonf(filename + ".json");
  jsonf << js.dump();
  jsonf.close();

  return 0;
}
