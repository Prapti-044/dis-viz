#include "semantic_analysis.hpp"

#include <algorithm>
#include <cctype>
#include <sstream>
#include <unordered_map>
#include <unordered_set>

using json = nlohmann::json;

namespace disviz_semantic {

namespace {

// --- Vocabulary (embedded in JSON; mirror in webapp semanticTypes.ts) ---

constexpr const char* kRegionKinds[] = {
    "function_entry",       "call_site",           "inlined_call_region",
    "loop_region",          "loop_header",         "straightline_compute_region",
    "memory_access_region", "branch_region",       "return_region"};

std::string trim(std::string s) {
  while (!s.empty() && std::isspace(static_cast<unsigned char>(s.front()))) s.erase(s.begin());
  while (!s.empty() && std::isspace(static_cast<unsigned char>(s.back()))) s.pop_back();
  return s;
}

std::string toLower(std::string s) {
  for (char& ch : s) ch = static_cast<char>(std::tolower(static_cast<unsigned char>(ch)));
  return s;
}

std::pair<std::string, std::string> splitOpcodeOperands(const std::string& instruction) {
  const std::string t = trim(instruction);
  if (t.empty()) return {"", ""};
  const size_t sp = t.find(' ');
  if (sp == std::string::npos) return {toLower(t), ""};
  return {toLower(t.substr(0, sp)), trim(t.substr(sp + 1))};
}

std::vector<std::string> rawInstructionFlags(const std::unordered_set<INSTRUCTION_FLAGS>& flags) {
  std::vector<std::string> result;
  for (const auto& flag : flags) {
    switch (flag) {
      case INST_VECTORIZED: result.emplace_back("VECTORIZED"); break;
      case INST_MEMORY_READ: result.emplace_back("MEMORY_READ"); break;
      case INST_MEMORY_WRITE: result.emplace_back("MEMORY_WRITE"); break;
      case INST_CALL: result.emplace_back("CALL"); break;
      case INST_SYSCALL: result.emplace_back("SYSCALL"); break;
      case INST_FP: result.emplace_back("FP"); break;
      case INST_HOISTED: result.emplace_back("HOISTED"); break;
      case INST_BRANCH: result.emplace_back("BRANCH"); break;
      case INST_INLINE: result.emplace_back("INLINE"); break;
    }
  }
  return result;
}

json normalizeFlagsJson(const std::unordered_set<INSTRUCTION_FLAGS>& flags) {
  auto base = rawInstructionFlags(flags);
  json arr = json::array();
  bool mem = false;
  for (const auto& f : base) {
    if (f == "MEMORY_READ" || f == "MEMORY_WRITE") mem = true;
    else arr.push_back(f);
  }
  if (mem) arr.push_back("MEMORY");
  return arr;
}

bool simdMnemonic(const std::string& op) {
  static const std::unordered_set<std::string> kSimd{
      "movd",    "movq",    "movaps",  "movups",  "movapd",  "movupd",  "movdqa",  "movdqu",
      "pshufd",  "pshuflw", "pshufhw", "pcmpeqb", "pcmpeqw", "pcmpeqd", "pcmpeqq", "paddb",
      "paddw",   "paddd",   "paddq",   "subps",   "subpd",   "addps",   "addpd",   "mulps",
      "mulpd",   "divps",   "divpd",   "sqrtps",  "sqrtpd",  "minps",   "maxps",   "ucomiss",
      "ucomisd", "comiss",  "comisd",  "cvtsi2ss", "cvtsi2sd", "cvtss2si", "cvtsd2si"};
  if (kSimd.count(op)) return true;
  if (op.size() >= 2 && op[0] == 'p' && std::isalpha(static_cast<unsigned char>(op[1]))) return true;
  if (!op.empty() && op[0] == 'v') return true;  // AVX
  return false;
}

json instructionFamilies(const std::string& opcode, const std::string& operands,
                         const std::unordered_set<INSTRUCTION_FLAGS>& flags) {
  json fam = json::array();
  const std::string opand = toLower(operands);
  if (opand.find("%xmm") != std::string::npos || opand.find("%ymm") != std::string::npos ||
      opand.find("%zmm") != std::string::npos) {
    fam.push_back("simd_reg");
  }
  if (simdMnemonic(opcode)) fam.push_back("simd_op");

  if (opcode == "cmp" || opcode == "cmpb" || opcode == "cmpw" || opcode == "cmpl" || opcode == "cmpq")
    fam.push_back("compare");
  if (opcode == "test" || opcode == "testb" || opcode == "testl" || opcode == "testq")
    fam.push_back("compare");

  if (opcode.size() >= 2 && opcode[0] == 'j' && opcode != "jmp") fam.push_back("branch_conditional");
  if (opcode == "jmp" || opcode == "jmpq") fam.push_back("branch_unconditional");

  if (opcode == "call" || opcode == "callq") fam.push_back("call");
  if (opcode == "ret" || opcode == "retq") fam.push_back("return");

  if (flags.count(INST_MEMORY_READ) || flags.count(INST_MEMORY_WRITE)) fam.push_back("memory_op");

  return fam;
}

void aggregateInstructionCorrespondence(const InstructionInfo& ins, const std::string& primaryFile, int& minLine,
                                        int& maxLine, bool& any) {
  for (const auto& [file, lines] : ins.correspondence) {
    if (!primaryFile.empty() && file != primaryFile) continue;
    for (int ln : lines) {
      if (!any) {
        minLine = maxLine = ln;
        any = true;
      } else {
        minLine = std::min(minLine, ln);
        maxLine = std::max(maxLine, ln);
      }
    }
  }
}

void enrichBlockJson(json& bj, const BlockInfo& block,
                   const std::unordered_map<std::string, std::vector<std::string>>& preds,
                   const std::unordered_map<std::string, std::string>& canonId,
                   const std::string& primaryFile, bool emit_instruction_semantic_extras) {
  const auto pit = preds.find(block.name);
  json predArr = json::array();
  if (pit != preds.end()) {
    for (const auto& p : pit->second) predArr.push_back(p);
  }
  bj["predecessor_block_names"] = std::move(predArr);

  const auto cit = canonId.find(block.name);
  if (cit != canonId.end()) bj["canonical_block_id"] = cit->second;

  int minL = 0, maxL = 0;
  bool anyLine = false;
  for (const auto& ins : block.instructions) {
    aggregateInstructionCorrespondence(ins, primaryFile, minL, maxL, anyLine);
  }
  if (anyLine) {
    bj["source_line_span"] = json{{"file", primaryFile.empty() ? nullptr : json(primaryFile)},
                                  {"line_start", minL},
                                  {"line_end", maxL}};
  } else {
    bj["source_line_span"] = nullptr;
  }

  if (!emit_instruction_semantic_extras) return;

  json& instrs = bj["instructions"];
  for (size_t i = 0; i < block.instructions.size() && i < instrs.size(); ++i) {
    const auto& ins = block.instructions[i];
    json& ij = instrs[i];
    const auto [opc, ops] = splitOpcodeOperands(ins.instruction);
    ij["opcode"] = opc;
    ij["operands"] = ops;
    ij["normalized_flags"] = normalizeFlagsJson(ins.flags);
    ij["families"] = instructionFamilies(opc, ops, ins.flags);

    json corr = json::object();
    for (const auto& [f, lines] : ins.correspondence) {
      json ln = json::array();
      for (int l : lines) ln.push_back(l);
      corr[f] = std::move(ln);
    }
    if (!corr.empty()) ij["source_line_refs"] = std::move(corr);
  }
}

bool blockHasOpcodePrefix(const BlockInfo& b, const std::vector<std::string>& prefixes) {
  for (const auto& ins : b.instructions) {
    const auto [op, _] = splitOpcodeOperands(ins.instruction);
    for (const auto& p : prefixes) {
      if (op == p) return true;
    }
  }
  return false;
}

bool blockHasFlag(const BlockInfo& b, INSTRUCTION_FLAGS f) {
  for (const auto& ins : b.instructions) {
    if (ins.flags.count(f)) return true;
  }
  return false;
}

json collectLoopSourceSpan(const LoopEntry& loop, const std::unordered_map<std::string, const BlockInfo*>& byName,
                           const std::string& primaryFile) {
  int minL = 0, maxL = 0;
  bool any = false;
  for (const auto& bn : loop.blocks) {
    auto it = byName.find(bn);
    if (it == byName.end()) continue;
    for (const auto& ins : it->second->instructions) {
      aggregateInstructionCorrespondence(ins, primaryFile, minL, maxL, any);
    }
  }
  if (!any) return json::object({{"file", primaryFile.empty() ? nullptr : json(primaryFile)}});
  return json{{"file", primaryFile.empty() ? nullptr : json(primaryFile)}, {"line_start", minL}, {"line_end", maxL}};
}

std::string loopBodyFingerprint(const LoopEntry& loop,
                                const std::unordered_map<std::string, const BlockInfo*>& byName) {
  std::ostringstream oss;
  for (const auto& bn : loop.blocks) {
    auto it = byName.find(bn);
    if (it == byName.end()) continue;
    for (const auto& ins : it->second->instructions) {
      const auto [op, _] = splitOpcodeOperands(ins.instruction);
      oss << op << ';';
    }
  }
  std::string s = oss.str();
  if (s.size() > 256) s.resize(256);
  return s;
}

std::unordered_set<std::string> variableNamesInLoop(const LoopEntry& loop,
                                                    const std::unordered_map<std::string, const BlockInfo*>& byName) {
  std::unordered_set<std::string> names;
  for (const auto& bn : loop.blocks) {
    auto it = byName.find(bn);
    if (it == byName.end()) continue;
    for (const auto& ins : it->second->instructions) {
      for (const auto& v : ins.variables) names.insert(v.name);
    }
  }
  return names;
}

void emitLoopSignatureRecursive(json& arr, const LoopEntry& loop, const FunctionInfo& func,
                                const std::unordered_map<std::string, const BlockInfo*>& byName,
                                const std::string& primaryFile, int depth) {
  json sig{{"name", loop.name},
           {"header_block", loop.header_block},
           {"latch_block", loop.latch_block},
           {"blocks", loop.blocks},
           {"depth", depth},
           {"source_span", collectLoopSourceSpan(loop, byName, primaryFile)},
           {"body_fingerprint", loopBodyFingerprint(loop, byName)}};
  json vnames = json::array();
  for (const auto& n : variableNamesInLoop(loop, byName)) vnames.push_back(n);
  sig["variable_names"] = std::move(vnames);
  arr.push_back(std::move(sig));
  for (const auto& child : loop.loops) emitLoopSignatureRecursive(arr, child, func, byName, primaryFile, depth + 1);
}

json buildVariableRoleHints(const FunctionInfo& func) {
  json facts = json::object();
  json params = json::array();
  for (const auto& p : func.source_info.parameters) params.push_back(p.name);
  facts["parameter_names"] = std::move(params);
  json locals = json::array();
  for (const auto& v : func.localVars) locals.push_back(v.name);
  facts["local_variable_names"] = std::move(locals);
  json heur = json::object();
  return json{{"facts", std::move(facts)}, {"heuristics", std::move(heur)}};
}

bool loopHasFactVectorized(const LoopEntry& loop, const std::unordered_map<std::string, const BlockInfo*>& byName) {
  for (const auto& bn : loop.blocks) {
    auto it = byName.find(bn);
    if (it == byName.end()) continue;
    for (const auto& ins : it->second->instructions) {
      if (ins.flags.count(INST_VECTORIZED)) return true;
      const auto [op, ops] = splitOpcodeOperands(ins.instruction);
      json fam = instructionFamilies(op, ops, ins.flags);
      for (const auto& f : fam) {
        if (f == "simd_op" || f == "simd_reg") return true;
      }
    }
  }
  return false;
}

bool loopHeuristicCompareSwap(const LoopEntry& loop, const std::unordered_map<std::string, const BlockInfo*>& byName) {
  bool cmp = false, br = false, mem = false;
  for (const auto& bn : loop.blocks) {
    auto it = byName.find(bn);
    if (it == byName.end()) continue;
    for (const auto& ins : it->second->instructions) {
      const auto [op, ops] = splitOpcodeOperands(ins.instruction);
      json fam = instructionFamilies(op, ops, ins.flags);
      for (const auto& f : fam) {
        if (f == "compare") cmp = true;
        if (f == "branch_conditional") br = true;
        if (f == "memory_op") mem = true;
      }
    }
  }
  return cmp && br && mem;
}

bool loopHasInline(const LoopEntry& loop, const std::unordered_map<std::string, const BlockInfo*>& byName) {
  for (const auto& bn : loop.blocks) {
    auto it = byName.find(bn);
    if (it == byName.end()) continue;
    if (blockHasFlag(*it->second, INST_INLINE)) return true;
  }
  return false;
}

std::string canonBlockIdFor(const FunctionInfo& func, const std::string& blockName) {
  for (size_t i = 0; i < func.basic_blocks.size(); ++i) {
    if (func.basic_blocks[i] == blockName) return func.name + "#" + std::to_string(i);
  }
  return {};
}

json buildRegionsForFunction(const FunctionInfo& func, const std::unordered_map<std::string, const BlockInfo*>& byName,
                             const std::string& primaryFile) {
  json regions = json::array();
  int rid = 0;
  auto nextId = [&](const char* suffix) {
    return func.name + "/R" + std::to_string(rid++) + "_" + suffix;
  };

  if (!func.basic_blocks.empty()) {
    const auto& entryName = func.basic_blocks.front();
    json canon = json::array();
    auto ce = canonBlockIdFor(func, entryName);
    if (!ce.empty()) canon.push_back(ce);
    json ob = json::array();
    ob.push_back(entryName);
    json src = json::object();
    auto it = byName.find(entryName);
    if (it != byName.end()) {
      int mn = 0, mx = 0;
      bool any = false;
      for (const auto& ins : it->second->instructions)
        aggregateInstructionCorrespondence(ins, primaryFile, mn, mx, any);
      if (any)
        src = json{{"file", primaryFile.empty() ? nullptr : json(primaryFile)}, {"line_start", mn}, {"line_end", mx}};
    }
    regions.push_back(json{{"region_id", nextId("entry")},
                           {"kind", "function_entry"},
                           {"subkind", nullptr},
                           {"canonical_block_ids", std::move(canon)},
                           {"original_block_names", std::move(ob)},
                           {"source", src},
                           {"features",
                            json{{"facts", json{{"n_blocks", 1}}}, {"heuristics", json::object()}}}});
  }

  std::function<void(const LoopEntry&, int)> emitLoop = [&](const LoopEntry& loop, int depth) {
    json canon = json::array();
    json ob = json::array();
    for (const auto& bn : loop.blocks) {
      ob.push_back(bn);
      std::string c = canonBlockIdFor(func, bn);
      if (!c.empty()) canon.push_back(c);
    }
    const bool factVec = loopHasFactVectorized(loop, byName);
    const bool factInl = loopHasInline(loop, byName);
    const bool heurCs = loopHeuristicCompareSwap(loop, byName);
    std::string subkind;
    if (factVec && heurCs)
      subkind = "simd_compare_swap_loop";
    else if (factVec)
      subkind = "vectorized_loop";
    else if (heurCs)
      subkind = "scalar_compare_swap_loop";
    else
      subkind = "generic_loop";

    json facts;
    facts["n_blocks"] = static_cast<int>(loop.blocks.size());
    facts["loop_depth"] = depth;
    facts["vectorized"] = factVec;
    facts["has_inline_instruction"] = factInl;
    json heur;
    heur["compare_swap_pattern"] = heurCs;
    json feats;
    feats["facts"] = std::move(facts);
    feats["heuristics"] = std::move(heur);

    regions.push_back(json{{"region_id", nextId("loop")},
                           {"kind", "loop_region"},
                           {"subkind", subkind},
                           {"canonical_block_ids", std::move(canon)},
                           {"original_block_names", std::move(ob)},
                           {"source", collectLoopSourceSpan(loop, byName, primaryFile)},
                           {"loop_name", loop.name},
                           {"features", std::move(feats)}});

    if (!loop.header_block.empty()) {
      auto hit = byName.find(loop.header_block);
      if (hit != byName.end()) {
        json hCanon = json::array();
        std::string hc = canonBlockIdFor(func, loop.header_block);
        if (!hc.empty()) hCanon.push_back(hc);
        regions.push_back(json{{"region_id", nextId("hdr")},
                               {"kind", "loop_header"},
                               {"subkind", nullptr},
                               {"canonical_block_ids", std::move(hCanon)},
                               {"original_block_names", json::array({loop.header_block})},
                               {"source", json::object()},
                               {"features", json{{"facts", json{{"n_blocks", 1}}}, {"heuristics", json::object()}}}});
      }
    }
    for (const auto& ch : loop.loops) emitLoop(ch, depth + 1);
  };

  for (const auto& loop : func.loops) emitLoop(loop, 1);

  for (const auto& bn : func.basic_blocks) {
    auto it = byName.find(bn);
    if (it == byName.end()) continue;
    if (blockHasOpcodePrefix(*it->second, {"ret", "retq"})) {
      json canon = json::array();
      std::string c = canonBlockIdFor(func, bn);
      if (!c.empty()) canon.push_back(c);
      regions.push_back(json{{"region_id", nextId("ret")},
                             {"kind", "return_region"},
                             {"subkind", nullptr},
                             {"canonical_block_ids", std::move(canon)},
                             {"original_block_names", json::array({bn})},
                             {"source", json::object()},
                             {"features", json{{"facts", json{{"n_blocks", 1}}}, {"heuristics", json::object()}}}});
    }
    if (blockHasFlag(*it->second, INST_CALL)) {
      json canon = json::array();
      std::string c = canonBlockIdFor(func, bn);
      if (!c.empty()) canon.push_back(c);
      regions.push_back(json{{"region_id", nextId("call")},
                             {"kind", "call_site"},
                             {"subkind", nullptr},
                             {"canonical_block_ids", std::move(canon)},
                             {"original_block_names", json::array({bn})},
                             {"source", json::object()},
                             {"features", json{{"facts", json{{"n_blocks", 1}, {"has_call", true}}},
                                               {"heuristics", json::object()}}}});
    }
    if (blockHasFlag(*it->second, INST_INLINE)) {
      json canon = json::array();
      std::string c = canonBlockIdFor(func, bn);
      if (!c.empty()) canon.push_back(c);
      regions.push_back(json{{"region_id", nextId("inl")},
                             {"kind", "inlined_call_region"},
                             {"subkind", nullptr},
                             {"canonical_block_ids", std::move(canon)},
                             {"original_block_names", json::array({bn})},
                             {"source", json::object()},
                             {"features", json{{"facts", json{{"n_blocks", 1}, {"has_inline", true}}},
                                               {"heuristics", json::object()}}}});
    }
  }

  return regions;
}

}  // namespace

void applySemanticToJson(json& root, const BinaryDecodeResult& res, bool emit_instruction_semantic_extras) {
  std::unordered_map<std::string, std::vector<std::string>> preds;
  std::unordered_map<std::string, const BlockInfo*> byName;
  for (const auto& b : res.disassembly.memory_order_blocks) {
    byName[b.name] = &b;
    for (const auto& nxt : b.nextBlockNames) preds[nxt].push_back(b.name);
  }

  std::unordered_map<std::string, std::string> canonId;
  for (const auto& f : res.functionInfos) {
    for (size_t i = 0; i < f.basic_blocks.size(); ++i) canonId[f.basic_blocks[i]] = f.name + "#" + std::to_string(i);
  }

  json vocab_regions = json::array();
  for (const char* k : kRegionKinds) vocab_regions.push_back(k);

  json semantic_functions = json::array();

  auto& blocks = root.at("disassembly").at("blocks");
  for (auto it = blocks.begin(); it != blocks.end(); ++it) {
    const std::string name = it.key();
    auto bit = byName.find(name);
    if (bit == byName.end()) continue;
    const BlockInfo& block = *bit->second;
    const FunctionInfo* funcPtr = nullptr;
    for (const auto& f : res.functionInfos) {
      if (f.name == block.functionName) {
        funcPtr = &f;
        break;
      }
    }
    std::string primaryFile = funcPtr ? funcPtr->source_info.file : "";
    enrichBlockJson(it.value(), block, preds, canonId, primaryFile, emit_instruction_semantic_extras);
  }

  for (const auto& func : res.functionInfos) {
    if (func.is_builtin) continue;
    std::string primaryFile = func.source_info.file;
    json loop_sigs = json::array();
    for (const auto& loop : func.loops) emitLoopSignatureRecursive(loop_sigs, loop, func, byName, primaryFile, 1);

    json funcJson{{"name", func.name},
                  {"source_file", func.source_info.file},
                  {"source_line", func.source_info.line},
                  {"variable_role_hints", buildVariableRoleHints(func)},
                  {"loop_signatures", std::move(loop_sigs)},
                  {"regions", buildRegionsForFunction(func, byName, primaryFile)}};
    semantic_functions.push_back(std::move(funcJson));
  }

  root["semantic"] = json{{"schema_version", kSemanticSchemaVersion},
                          {"vocabulary", json{{"region_kinds", std::move(vocab_regions)}}},
                          {"functions", std::move(semantic_functions)}};
}

}  // namespace disviz_semantic
