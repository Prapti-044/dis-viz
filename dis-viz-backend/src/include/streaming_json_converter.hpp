#pragma once

#include <dyninst_wrapper.hpp>
#include <nlohmann/json.hpp>
#include <fstream>
#include <iostream>

using json = nlohmann::json;

// Streaming JSON writer class for memory efficiency
class StreamingJsonWriter {
public:
    std::ofstream& stream;
    bool first_item;
    
    StreamingJsonWriter(std::ofstream& output_stream) : stream(output_stream), first_item(true) {}
    
    void startObject();
    void endObject();
    void startArray(const std::string& key);
    void endArray();
    void writeKey(const std::string& key);
    void writeValue(const json& value);
    void writeKeyValue(const std::string& key, const json& value);
    void nextItem();
    void reset();
};

// Individual conversion functions that work with streaming
void writeVariableInfo(StreamingJsonWriter& writer, const VariableInfo& var);
void writeInstructionInfo(StreamingJsonWriter& writer, const InstructionInfo& instruction);
void writeBlockInfo(StreamingJsonWriter& writer, const BlockInfo& block);
void writeCall(StreamingJsonWriter& writer, const Call& call);
void writeInline(StreamingJsonWriter& writer, const InlineEntry& inlineEntry);
void writeLoopEntry(StreamingJsonWriter& writer, const LoopEntry& loop);
void writeHidable(StreamingJsonWriter& writer, const Hidable& hidable);
void writeFunctionInfo(StreamingJsonWriter& writer, const FunctionInfo& funcInfo);
void writeMinimapInfo(StreamingJsonWriter& writer, const MinimapInfo& minimap);

// Main streaming functions
void writeBinaryCacheStreaming(StreamingJsonWriter& writer, const BinaryCacheResult* res);
void writeFunctionInfosStreaming(StreamingJsonWriter& writer, const std::vector<FunctionInfo>& funcInfos);
void writeCompleteJsonStreaming(std::ofstream& output, const BinaryCacheResult* res, const std::vector<FunctionInfo>& funcInfos); 