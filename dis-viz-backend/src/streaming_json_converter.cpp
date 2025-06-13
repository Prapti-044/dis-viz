#include <streaming_json_converter.hpp>
#include <algorithm>

// StreamingJsonWriter implementation
void StreamingJsonWriter::startObject() {
    stream << "{";
    first_item = true;
}

void StreamingJsonWriter::endObject() {
    stream << "}";
}

void StreamingJsonWriter::startArray(const std::string& key) {
    if (!first_item) stream << ",";
    stream << "\"" << key << "\":[";
    first_item = true;
}

void StreamingJsonWriter::endArray() {
    stream << "]";
}

void StreamingJsonWriter::writeKey(const std::string& key) {
    if (!first_item) stream << ",";
    stream << "\"" << key << "\":";
    first_item = false;
}

void StreamingJsonWriter::writeValue(const json& value) {
    stream << value.dump();
}

void StreamingJsonWriter::writeKeyValue(const std::string& key, const json& value) {
    writeKey(key);
    writeValue(value);
}

void StreamingJsonWriter::nextItem() {
    first_item = false;
}

void StreamingJsonWriter::reset() {
    first_item = true;
}

// Individual conversion functions
void writeVariableInfo(StreamingJsonWriter& writer, const VariableInfo& var) {
    writer.startObject();
    writer.writeKeyValue("name", var.name);
    writer.writeKeyValue("source_file", var.file);
    writer.writeKeyValue("source_line", var.line);
    
    // Locations array
    auto locations = json::array();
    for (const auto& location : var.locations) {
        json loc;
        loc["start_address"] = location.start;
        loc["end_address"] = location.end;
        loc["location"] = location.location;
        locations.push_back(loc);
    }
    writer.writeKeyValue("locations", locations);
    
    writer.writeKeyValue("var_type", var.var_type);
    writer.endObject();
}

void writeInstructionInfo(StreamingJsonWriter& writer, const InstructionInfo& instruction) {
    writer.startObject();
    writer.writeKeyValue("address", instruction.address);
    writer.writeKeyValue("instruction", instruction.instruction);
    
    if (!instruction.correspondence.empty()) {
        writer.writeKey("correspondence");
        json correspondence;
        for (const auto& entry : instruction.correspondence) {
            correspondence[entry.first] = entry.second;
        }
        writer.writeValue(correspondence);
    }
    
    if (!instruction.variables.empty()) {
        writer.writeKey("variables");
        writer.stream << "[";
        bool first = true;
        for (const auto& var : instruction.variables) {
            if (!first) writer.stream << ",";
            writeVariableInfo(writer, var);
            first = false;
        }
        writer.stream << "]";
    }
    
    writer.endObject();
}

void writeBlockInfo(StreamingJsonWriter& writer, const BlockInfo& block) {
    writer.startObject();
    writer.writeKeyValue("name", block.name);
    writer.writeKeyValue("function_name", block.functionName);
    
    // Write instructions array
    writer.writeKey("instructions");
    writer.stream << "[";
    bool first = true;
    for (const auto& instruction : block.instructions) {
        if (!first) writer.stream << ",";
        writeInstructionInfo(writer, instruction);
        first = false;
    }
    writer.stream << "]";
    
    // Write loops array
    writer.writeKey("loops");
    auto loops = json::array();
    for (const auto& loop : block.loops) {
        json loopJson;
        loopJson["name"] = loop.name;
        loopJson["loop_count"] = loop.loopCount;
        loopJson["loop_total"] = loop.loopTotal;
        loops.push_back(loopJson);
    }
    writer.writeValue(loops);
    
    // Block type
    if (block.block_type == BlockInfo::BLOCK_TYPE_NORMAL) {
        writer.writeKeyValue("block_type", "normal");
    } else if (block.block_type == BlockInfo::BLOCK_TYPE_PSEUDOLOOP) {
        writer.writeKeyValue("block_type", "pseudoloop");
    }
    
    writer.writeKeyValue("backedges", block.backedges);
    
    // Hidables
    if (!block.hidables.empty()) {
        writer.writeKey("hidables");
        auto hidables = json::array();
        for (const auto& hidable : block.hidables) {
            json hidableJson;
            hidableJson["name"] = hidable.name;
            hidableJson["start_address"] = hidable.start;
            hidableJson["end_address"] = hidable.end;
            hidables.push_back(hidableJson);
        }
        writer.writeValue(hidables);
    }
    
    writer.writeKeyValue("next_block_numbers", block.nextBlockNames);
    writer.writeKeyValue("start_address", block.startAddress);
    writer.writeKeyValue("end_address", block.endAddress);
    writer.writeKeyValue("n_instructions", block.nInstructions);
    writer.writeKeyValue("is_loop_header", block.isLoopHeader);
    
    // Flags
    auto flags = json::array();
    for (const auto& flag : block.flags) {
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
    writer.writeKeyValue("flags", flags);
    
    writer.endObject();
}

void writeCall(StreamingJsonWriter& writer, const Call& call) {
    writer.startObject();
    writer.writeKeyValue("address", call.address);
    writer.writeKeyValue("target", call.target);
    writer.writeKeyValue("target_func_names", call.targetFuncNames);
    writer.endObject();
}

void writeInline(StreamingJsonWriter& writer, const InlineEntry& inlineEntry) {
    writer.startObject();
    writer.writeKeyValue("name", inlineEntry.name);
    
    auto ranges = json::array();
    for (const auto& range : inlineEntry.ranges) {
        json rangeJson;
        rangeJson["start"] = range.first;
        rangeJson["end"] = range.second;
        ranges.push_back(rangeJson);
    }
    writer.writeKeyValue("ranges", ranges);
    
    writer.writeKeyValue("callsite_file", inlineEntry.callsite_file);
    writer.writeKeyValue("callsite_line", inlineEntry.callsite_line);
    writer.endObject();
}

void writeLoopEntry(StreamingJsonWriter& writer, const LoopEntry& loop) {
    writer.startObject();
    writer.writeKeyValue("name", loop.name);
    
    auto backedges = json::array();
    for (const auto& backedge : loop.backedges) {
        json backedgeJson;
        backedgeJson["from"] = backedge.first;
        backedgeJson["to"] = backedge.second;
        backedges.push_back(backedgeJson);
    }
    writer.writeKeyValue("backedges", backedges);
    writer.writeKeyValue("blocks", loop.blocks);
    
    // Write nested loops
    writer.writeKey("loops");
    writer.stream << "[";
    bool first = true;
    for (const auto& innerLoop : loop.loops) {
        if (!first) writer.stream << ",";
        writeLoopEntry(writer, innerLoop);
        first = false;
    }
    writer.stream << "]";
    
    writer.endObject();
}

void writeHidable(StreamingJsonWriter& writer, const Hidable& hidable) {
    writer.startObject();
    writer.writeKeyValue("name", hidable.name);
    writer.writeKeyValue("start", hidable.start);
    writer.writeKeyValue("end", hidable.end);
    writer.endObject();
}

void writeFunctionInfo(StreamingJsonWriter& writer, const FunctionInfo& funcInfo) {
    writer.startObject();
    writer.writeKeyValue("name", funcInfo.name);
    writer.writeKeyValue("entry", funcInfo.entry);
    writer.writeKeyValue("basic_blocks", funcInfo.basic_blocks);
    
    // Local variables
    if (!funcInfo.localVars.empty()) {
        writer.writeKey("localVars");
        writer.stream << "[";
        bool first = true;
        for (const auto& var : funcInfo.localVars) {
            if (!first) writer.stream << ",";
            writeVariableInfo(writer, var);
            first = false;
        }
        writer.stream << "]";
    }
    
    // Parameters
    if (!funcInfo.params.empty()) {
        writer.writeKey("params");
        writer.stream << "[";
        bool first = true;
        for (const auto& param : funcInfo.params) {
            if (!first) writer.stream << ",";
            writeVariableInfo(writer, param);
            first = false;
        }
        writer.stream << "]";
    }
    
    // Calls
    if (!funcInfo.calls.empty()) {
        writer.writeKey("calls");
        writer.stream << "[";
        bool first = true;
        for (const auto& call : funcInfo.calls) {
            if (!first) writer.stream << ",";
            writeCall(writer, call);
            first = false;
        }
        writer.stream << "]";
    }
    
    // Inlines
    if (!funcInfo.inlines.empty()) {
        writer.writeKey("inlines");
        writer.stream << "[";
        bool first = true;
        for (const auto& inline_entry : funcInfo.inlines) {
            if (!first) writer.stream << ",";
            writeInline(writer, inline_entry);
            first = false;
        }
        writer.stream << "]";
    }
    
    // Loops
    if (!funcInfo.loops.empty()) {
        writer.writeKey("loops");
        writer.stream << "[";
        bool first = true;
        for (const auto& loop : funcInfo.loops) {
            if (!first) writer.stream << ",";
            writeLoopEntry(writer, loop);
            first = false;
        }
        writer.stream << "]";
    }
    
    // Hidables
    if (!funcInfo.hidables.empty()) {
        writer.writeKey("hidables");
        writer.stream << "[";
        bool first = true;
        for (const auto& hidable : funcInfo.hidables) {
            if (!first) writer.stream << ",";
            writeHidable(writer, hidable);
            first = false;
        }
        writer.stream << "]";
    }
    
    writer.endObject();
}

void writeMinimapInfo(StreamingJsonWriter& writer, const MinimapInfo& minimap) {
    writer.startObject();
    writer.writeKeyValue("block_heights", minimap.block_heights);
    
    auto built_in_blocks = json::array();
    for (bool is_built_in : minimap.built_in_blocks) {
        built_in_blocks.push_back(is_built_in);
    }
    writer.writeKeyValue("built_in_block", built_in_blocks);
    
    writer.writeKeyValue("block_start_address", minimap.block_start_address);
    writer.writeKeyValue("block_loop_indents", minimap.block_loop_indents);
    writer.endObject();
}

// Main streaming functions
void writeBinaryCacheStreaming(StreamingJsonWriter& writer, const BinaryCacheResult* res) {
    writer.startObject();
    
    // Write memory_order_blocks
    writer.writeKey("memory_order_blocks");
    writer.stream << "[";
    bool first = true;
    for (const auto& block : res->disassembly.memory_order_blocks) {
        if (!first) writer.stream << ",";
        writeBlockInfo(writer, block);
        first = false;
    }
    writer.stream << "]";
    
    // Write loop_order_blocks
    writer.writeKey("loop_order_blocks");
    writer.stream << "[";
    first = true;
    for (const auto& block : res->disassembly.loop_order_blocks) {
        if (!first) writer.stream << ",";
        writeBlockInfo(writer, block);
        first = false;
    }
    writer.stream << "]";
    
    writer.writeKeyValue("source_files", res->source_files);
    
    writer.endObject();
}

void writeFunctionInfosStreaming(StreamingJsonWriter& writer, const std::vector<FunctionInfo>& funcInfos) {
    writer.stream << "[";
    bool first = true;
    for (const auto& funcInfo : funcInfos) {
        if (!first) writer.stream << ",";
        writeFunctionInfo(writer, funcInfo);
        first = false;
    }
    writer.stream << "]";
}

void writeCompleteJsonStreaming(std::ofstream& output, const BinaryCacheResult* res, const std::vector<FunctionInfo>& funcInfos) {
    StreamingJsonWriter writer(output);
    writer.startObject();
    
    // Write blocks_info
    writer.writeKey("blocks_info");
    writeBinaryCacheStreaming(writer, res);
    
    // Write functions
    writer.writeKey("functions");
    writeFunctionInfosStreaming(writer, funcInfos);
    
    writer.endObject();
    output << std::endl;
} 