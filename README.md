# Interactive Visualization of Binary Code for Investigating Compiler Optimizations

This project visualizes binary executable files and maps them back to the source code. It consists of two independent applications:

1. **dis-viz-cli**: A command-line tool that analyzes binary files (compiled with debug flags) using the Dyninst library and generates `.disviz` visualization files.
2. **dis-viz-webapp**: A React-based web application that loads and visualizes `.disviz` files.

## Website Link: [dis-viz.netlify.app](https://dis-viz.netlify.app/)

## Quick Start

### dis-viz-cli (Generate .disviz files)

The CLI tool runs in Docker and provides a complete environment with sample binaries (including RAJAPerf benchmarks).

#### Using Docker (Recommended)

1. Build the Docker image:

```bash
docker build -t dis-viz-cli .
```

2. Run the container with volume mounting to access your source code:

```bash
docker run -it -v /path/to/your/project:/workspace dis-viz-cli
```

3. Inside the container, compile your project with debug flags (-g):

```bash
# Example: Compile a C++ program
g++-13 -g -O3 your_program.cpp -o your_program

# Or use CMake
mkdir build && cd build
cmake -DCMAKE_BUILD_TYPE=RelWithDebInfo ..
make
```

4. Generate the .disviz file using the DisViz command (available in PATH):

```bash
DisViz -b /workspace/your_program -o /workspace/output.disviz
```

__Note: DisViz binary now only supports absolute paths.__

5. The generated `.disviz` file will be available in your mounted volume and can be used with the webapp.

__Note: There are already some pre-compiled sample disviz files in the webapp.__

### dis-viz-webapp (Visualize .disviz files)

The webapp runs locally and loads `.disviz` files from the webapp.

1. Install dependencies using pnpm:

```bash
cd dis-viz-webapp
pnpm install
```

2. Start the development server:

```bash
pnpm start
```

3. Open your browser at `http://localhost:3000` and load your `.disviz` file through the web interface.

## Implementation Details

### dis-viz-cli (CLI Tool)

[Dyninst](https://github.com/dyninst/dyninst) library is used to parse binary files compiled with debug information. The tool extracts:
- Code correspondence between source and assembly
- Function names and basic blocks
- Loop structures
- Register to variable mappings

The parsed data is serialized into `.disviz` files that can be loaded by the webapp.

### dis-viz-webapp (Web Application)

React+Redux+Typescript is used to build the visualization interface. Key components include:
- Basic blocks visualization
- Assembly line viewer
- Source code viewer with correspondence mapping
- File explorer for multi-file projects
- Interactive control flow graphs
