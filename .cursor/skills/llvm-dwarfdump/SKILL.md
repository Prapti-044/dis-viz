---
name: llvm-dwarfdump
description: Use llvm-dwarfdump to analyze DWARF debug information in binaries. Use when verifying DisViz output, checking debug symbols, inspecting source line mappings, or investigating function/variable debug info.
---

# Using llvm-dwarfdump for Binary Analysis

## Quick Commands

### Check if binary has debug info:
```bash
llvm-dwarfdump --debug-info sample_inputs/bin/<binary> | head -50
```

### Get source line mappings:
```bash
llvm-dwarfdump --debug-line sample_inputs/bin/<binary>
```

### List all functions (subprograms):
```bash
llvm-dwarfdump --debug-info sample_inputs/bin/<binary> | grep -A10 "DW_TAG_subprogram"
```

## Common Analysis Commands

### 1. Full DWARF dump
```bash
llvm-dwarfdump sample_inputs/bin/<binary>
```

### 2. Debug info section only
```bash
llvm-dwarfdump --debug-info sample_inputs/bin/<binary>
```

### 3. Line number mappings
```bash
llvm-dwarfdump --debug-line sample_inputs/bin/<binary>
```

### 4. Compile units
```bash
llvm-dwarfdump --debug-info sample_inputs/bin/<binary> | grep -A5 "DW_TAG_compile_unit"
```

### 5. Variables and parameters
```bash
llvm-dwarfdump --debug-info sample_inputs/bin/<binary> | grep -B2 -A8 "DW_TAG_variable\|DW_TAG_formal_parameter"
```

### 6. Inlined functions
```bash
llvm-dwarfdump --debug-info sample_inputs/bin/<binary> | grep -B2 -A10 "DW_TAG_inlined_subroutine"
```

## Cross-Checking DisViz Output

### Verify function addresses
```bash
# Get function low/high PC from DWARF
llvm-dwarfdump --debug-info sample_inputs/bin/<binary> | grep -A15 "DW_TAG_subprogram" | grep -E "DW_AT_name|DW_AT_low_pc|DW_AT_high_pc"

# Compare with DisViz JSON
cat /tmp/<binary>.data.json | jq '.functionInfos[] | {name, entry}'
```

### Verify source line mappings
```bash
# Get line table from DWARF
llvm-dwarfdump --debug-line sample_inputs/bin/<binary>

# Compare with DisViz correspondences
cat /tmp/<binary>.data.json | jq '.source_code_info[] | .lines[] | {line, correspondences}'
```

### Verify inline info
```bash
# Get inlined subroutines from DWARF  
llvm-dwarfdump --debug-info sample_inputs/bin/<binary> | grep -B5 -A15 "DW_TAG_inlined_subroutine"

# Compare with DisViz
cat /tmp/<binary>.data.json | jq '.functionInfos[] | select(.inlines | length > 0) | {name, inlines}'
```

## Useful Filters

### Find specific function
```bash
llvm-dwarfdump --debug-info sample_inputs/bin/<binary> | grep -A20 'DW_AT_name.*"main"'
```

### Get address ranges for functions
```bash
llvm-dwarfdump --debug-info sample_inputs/bin/<binary> | grep -E "DW_AT_(low_pc|high_pc|ranges)"
```

### Check compilation flags
```bash
llvm-dwarfdump --debug-info sample_inputs/bin/<binary> | grep "DW_AT_producer"
```

## Output Sections Reference

| Section | Flag | Contains |
|---------|------|----------|
| `.debug_info` | `--debug-info` | Functions, variables, types |
| `.debug_line` | `--debug-line` | Source line mappings |
| `.debug_abbrev` | `--debug-abbrev` | Abbreviation tables |
| `.debug_str` | `--debug-str` | String table |
| `.debug_ranges` | `--debug-ranges` | Address ranges |
| `.debug_loc` | `--debug-loc` | Location lists |

## Example Workflow: Verify DisViz Function Analysis

```bash
# 1. Compile test binary
g++ -g -O3 sample_inputs/bubble_sort.cpp -o sample_inputs/bin/bubble-test

# 2. Get function info from DWARF
llvm-dwarfdump --debug-info sample_inputs/bin/bubble-test | grep -A15 "DW_TAG_subprogram"

# 3. Generate DisViz JSON
dis-viz-cli/build/DisViz -b sample_inputs/bin/bubble-test -o /tmp/ --json-only

# 4. Compare function lists
echo "=== DWARF Functions ===" 
llvm-dwarfdump --debug-info sample_inputs/bin/bubble-test | grep 'DW_AT_name' | grep -v "DW_AT_linkage"

echo "=== DisViz Functions ==="
cat /tmp/bubble-test.data.json | jq -r '.functionInfos[].name'
```
