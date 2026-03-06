---
name: disviz-debug
description: Analyze and debug DisViz JSON output. Use when verifying disassembly output, checking source-to-assembly correspondences, investigating function/loop analysis, or comparing against llvm-dwarfdump.
---

# Debugging DisViz Output

## Quick Analysis Commands

### Generate debug JSON:
```bash
dis-viz-cli/build/DisViz -b <binary> -o /tmp/ --json-only
```

### Inspect with jq:
```bash
# List all functions
cat /tmp/<binary>.data.json | jq '.functionInfos[].name'

# Get specific function details
cat /tmp/<binary>.data.json | jq '.functionInfos[] | select(.name == "main")'

# Check source file mappings
cat /tmp/<binary>.data.json | jq '.source_code_info[].file'
```

## Cross-Checking with llvm-dwarfdump

For verifying DisViz output is correct, compare against llvm-dwarfdump:

```bash
# Get DWARF debug info
llvm-dwarfdump --debug-info sample_inputs/bin/<binary>

# Get line info (source correspondences)
llvm-dwarfdump --debug-line sample_inputs/bin/<binary>

# Verify subprogram (function) addresses
llvm-dwarfdump --debug-info sample_inputs/bin/<binary> | grep -A5 "DW_TAG_subprogram"
```

See the `llvm-dwarfdump` skill for detailed commands.
