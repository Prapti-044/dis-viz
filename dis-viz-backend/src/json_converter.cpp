#include <json_converter.hpp>

using json = crow::json::wvalue;

json convertVariableInfo(const VariableInfo &var) {
  auto result = json();
  result["name"] = var.name;
  result["source_file"] = var.file;
  result["source_line"] = var.line;
  auto locations = json::list();
  for (const auto &i : var.locations) {
    auto location = json();
    location["start_address"] = i.start;
    location["end_address"] = i.end;
    location["location"] = i.location;
    locations.push_back(location);
  }
  result["locations"] = std::move(locations);
  result["var_type"] = var.var_type;
  return result;
}

json convertMinimapInfo(const MinimapInfo &minimap) {
  auto result = json();
  result["block_heights"] = minimap.block_heights;
  auto built_in_block = json::list();
  for (const auto &i : minimap.built_in_blocks)
    built_in_block.push_back(i ? true : false);
  result["built_in_block"] = std::move(built_in_block);
  result["block_start_address"] = minimap.block_start_address;
  result["block_loop_indents"] = minimap.block_loop_indents;
  return result;
}

json convertInstructionInfo(const InstructionInfo &instruction) {
  auto result = json();
  result["address"] = instruction.address;
  result["instruction"] = instruction.instruction;

  if (instruction.correspondence.size() > 0) {
    result["correspondence"] = json({});
    for (const auto &i : instruction.correspondence)
      result["correspondence"][i.first] = i.second;
  }

  if (instruction.variables.size() > 0) {
    auto variables = json::list();
    for (const auto &i : instruction.variables)
      variables.push_back(convertVariableInfo(i));

    result["variables"] = std::move(variables);
  }

  return result;
}

json convertBlockLoopState(const BlockLoopState &loopState) {
  return json({
      {"name", loopState.name},
      {"loop_count", loopState.loopCount},
      {"loop_total", loopState.loopTotal},
  });
}
json convertBlockInfo(const BlockInfo &block) {
  auto result = json();
  result["name"] = block.name;
  result["function_name"] = block.functionName;
  auto instructions = json::list();
  std::transform(block.instructions.begin(), block.instructions.end(),
                 std::back_inserter(instructions), convertInstructionInfo);
  result["instructions"] = std::move(instructions);
  auto loops = json::list();
  std::transform(block.loops.begin(), block.loops.end(),
                 std::back_inserter(loops), convertBlockLoopState);
  result["loops"] = std::move(loops);
  if (block.block_type == BlockInfo::BLOCK_TYPE_NORMAL)
    result["block_type"] = "normal";
  else if (block.block_type == BlockInfo::BLOCK_TYPE_PSEUDOLOOP)
    result["block_type"] = "pseudoloop";
  result["backedges"] = block.backedges;

  if (block.hidables.size() > 0) {
    auto hidables = json::list();
    for (const auto &i : block.hidables)
      hidables.push_back({
          {"name", i.name},
          {"start_address", i.start},
          {"end_address", i.end},
      });

    result["hidables"] = std::move(hidables);
  }
  result["next_block_numbers"] = block.nextBlockNames;
  result["start_address"] = block.startAddress;
  result["end_address"] = block.endAddress;
  result["n_instructions"] = block.nInstructions;

  auto flags = std::vector<std::string>();
  for (const auto &flag : block.flags) {
    switch (flag) {
    case bb_vectorized:
      flags.push_back("vector");
      break;
    case bb_memory_read:
      flags.push_back("memread");
      break;
    case bb_memory_write:
      flags.push_back("memwrite");
      break;
    case bb_call:
      flags.push_back("call");
      break;
    case bb_syscall:
      flags.push_back("syscall");
      break;
    case bb_fp:
      flags.push_back("fp");
      break;
    }
  }
  result["flags"] = flags;

  return result;
}

json convertBinaryCache(const BinaryCacheResult *res) {
  auto result = json();
  auto memory_order_blocks = std::vector<json>();
  auto loop_order_blocks = std::vector<json>();
  for (const auto &i : res->disassembly.memory_order_blocks)
    memory_order_blocks.push_back(convertBlockInfo(i));
  for (const auto &i : res->disassembly.loop_order_blocks)
    loop_order_blocks.push_back(convertBlockInfo(i));

  result["memory_order_blocks"] = std::move(memory_order_blocks);
  result["loop_order_blocks"] = std::move(loop_order_blocks);
  result["source_files"] = res->source_files;

  return result;
}

json convertCall(const Call &call) {
  auto result = json();
  result["address"] = call.address;
  result["target"] = call.target;
  result["target_func_names"] = call.targetFuncNames;
  return result;
}

json convertInline(const InlineEntry &inlineEntry) {
  auto result = json();
  result["name"] = inlineEntry.name;
  auto rangesJson = json::list();
  for (auto &range : inlineEntry.ranges) {
    rangesJson.push_back({{"start", range.first}, {"end", range.second}});
  }
  result["ranges"] = std::move(rangesJson);
  result["callsite_file"] = inlineEntry.callsite_file;
  result["callsite_line"] = inlineEntry.callsite_line;
  return result;
}

json convertLoopEntry(const LoopEntry &loop) {
  auto result = json();
  result["name"] = loop.name;
  auto backedges = json::list();
  for (auto &backedge : loop.backedges) {
    backedges.push_back({{"from", backedge.first}, {"to", backedge.second}});
  }
  result["backedges"] = std::move(backedges);
  result["blocks"] = loop.blocks;

  auto innerLoopsJson = json::list();
  for (auto &innerLoop : loop.loops) {
    innerLoopsJson.push_back(convertLoopEntry(innerLoop));
  }
  result["loops"] = std::move(innerLoopsJson);
  return result;
}

json convertHidable(const Hidable &hidable) {
  auto result = json();
  result["name"] = hidable.name;
  result["start"] = hidable.start;
  result["end"] = hidable.end;
  return result;
}

json convertFunctionInfos(const std::vector<FunctionInfo> &funcInfos) {
  auto result = json::list();
  for (const auto &funcInfo : funcInfos) {
    auto funcInfoJson = json();
    funcInfoJson["name"] = funcInfo.name;
    funcInfoJson["entry"] = funcInfo.entry;

    // TODO: Add all fields
    funcInfoJson["basic_blocks"] = funcInfo.basic_blocks;

    if (funcInfo.localVars.size() > 0) {
      auto vars = json::list();
      for (auto &var : funcInfo.localVars) {
        vars.push_back(convertVariableInfo(var));
      }
      funcInfoJson["localVars"] = std::move(vars);
    }
    if (funcInfo.params.size() > 0) {
      auto vars = json::list();
      for (auto &var : funcInfo.params) {
        vars.push_back(convertVariableInfo(var));
      }
      funcInfoJson["params"] = std::move(vars);
    }

    if (funcInfo.calls.size() > 0) {
      auto calls = json::list();
      for (auto &call : funcInfo.calls) {
        calls.push_back(convertCall(call));
      }
      funcInfoJson["calls"] = std::move(calls);
    }

    if (funcInfo.inlines.size() > 0) {
      auto inlines = json::list();
      for (auto &inlineEntry : funcInfo.inlines) {
        inlines.push_back(convertInline(inlineEntry));
      }
      funcInfoJson["inlines"] = std::move(inlines);
    }

    if (funcInfo.loops.size() > 0) {
      auto loops = json::list();
      for (auto &loop : funcInfo.loops) {
        loops.push_back(convertLoopEntry(loop));
      }
      funcInfoJson["loops"] = std::move(loops);
    }
    if (funcInfo.hidables.size() > 0) {
      auto hidables = json::list();
      for (auto &hidable : funcInfo.hidables) {
        hidables.push_back(convertHidable(hidable));
      }
      funcInfoJson["hidables"] = std::move(hidables);
    }
    result.push_back(funcInfoJson);
  }

  return result;
}