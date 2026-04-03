# DisViz — guidance for AI assistants

DisViz maps **debug-built binaries** to **source** and visualizes **assembly**, **basic blocks**, **loops**, and **register–variable** relationships. The repo has two parts that communicate only through the **`.disviz`** file format.

## Layout

| Path | Role |
|------|------|
| `dis-viz-cli/` | C++20 CMake project; produces the `DisViz` executable (Dyninst + JSON serialization). |
| `dis-viz-webapp/` | Next.js (React, Redux Toolkit, TypeScript, MUI) app that loads `.disviz` and renders the UI. |
| `Dockerfile` | Ubuntu image with toolchain, builds RAJAPerf samples, compiles DisViz CLI; `DisViz` on `PATH`. |
| `README.md` | User-facing quick start, Docker steps, and feature overview. |

CLI entry and core logic live under `dis-viz-cli/src/` (`main.cpp`, `dyninst_wrapper.*`, `parse_source.*`).

## CLI (`dis-viz-cli`)

- **Build** (from repo root): `cd dis-viz-cli && mkdir -p build && cd build && cmake .. && make -j$(nproc)` → binary at `dis-viz-cli/build/DisViz`. After normal source edits (not `CMakeLists.txt`), `cd dis-viz-cli/build && make -j$(nproc)` is enough.
- **Dependencies**: CMake fetches or uses system packages (Dyninst, nlohmann/json, indicators, libarchive as needed). See `CMakeLists.txt` for `DYNINST_LOCATION` and external projects.
- **Usage**: `DisViz` expects **absolute paths** for the binary and output, e.g. `DisViz -b /abs/path/to/binary -o /abs/path/out.disviz`. Input binaries should be built with debug info (`-g`, e.g. `RelWithDebInfo`).

## Webapp (`dis-viz-webapp`)

- **Package manager**: `pnpm` (not npm/yarn by project convention).
- **Install**: `cd dis-viz-webapp && pnpm install`.
- **Local development**: `pnpm dev` (Next.js dev server; typically http://localhost:3000).
- **Production-style run**: `pnpm build` then `pnpm start`.
- **Lint**: `pnpm lint`.
- Sample or demo `.disviz` assets may live under `dis-viz-webapp/public/` (e.g. snapshots).

## End-to-end workflow

1. Compile the target with debug symbols.
2. Run `DisViz` on the binary to emit a `.disviz` file.
3. Open the webapp and load that file (or use bundled samples).

Hosted reference: [dis-viz.netlify.app](https://dis-viz.netlify.app/).

## When editing

- **CLI behavior / format changes**: change C++ under `dis-viz-cli/` and ensure the webapp’s loaders/parsers still match the emitted JSON (search for `.disviz` handling and types in `dis-viz-webapp/`).
- **UI / visualization**: focus on `dis-viz-webapp/`; keep Redux state and components consistent with existing patterns (MUI, rc-dock, Graphviz WASM, etc.).

## Cursor skills

Repository skills under `.cursor/skills/` include **disviz-build** (CLI build commands) and **disviz-debug** / **llvm-dwarfdump** for validating disassembly and DWARF against expectations.
