#pragma once

#include <nlohmann/json.hpp>
#include "dyninst_wrapper.hpp"

namespace disviz_semantic {

/// Current embedded semantic schema; bump when JSON shape changes.
constexpr int kSemanticSchemaVersion = 1;

/// Adds top-level "semantic" object and enriches disassembly.blocks in-place.
/// When @p emit_instruction_semantic_extras is false (default for web), per-instruction opcode/operands/
/// normalized_flags/families/source_line_refs are omitted to shrink JSON; block-level spans and semantic
/// regions are unchanged.
void applySemanticToJson(nlohmann::json& root, const BinaryDecodeResult& res,
                        bool emit_instruction_semantic_extras = false);

}  // namespace disviz_semantic
