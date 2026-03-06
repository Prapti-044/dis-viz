---
name: disviz-build
description: Build the DisViz CLI tool from source. Use when needing to compile DisViz, rebuild after code changes, or set up the development environment.
---

# Building DisViz CLI

## Quick Build

Build DisViz with CMake (from the repository root):

```bash
cd dis-viz-cli && mkdir -p build && cd build && cmake .. && make -j$(nproc)
```

The executable will be at: `dis-viz-cli/build/DisViz`

## Rebuild After Changes

After modifying source files (dont use it when CMakeLists.txt is changed):

```bash
cd dis-viz-cli/build && make -j$(nproc)
```