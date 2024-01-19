# Interactive Visualization of Binary Code for Investigating Compiler Optimizations

This project visualizes binary executable files and maps it back to the source code. I used Dyninst library that can decompile binary files compiled with Debug flags. The implementation details are listed below.

__Due to requirement of a high power back-end, I hosted this on Google Cloud Platform (GCP) and shared the demo link below.__

## [Video Link](https://youtu.be/JzdskO-FHIU)
## [Website Demo Link](https://binary-viz-project-eq3fvozioa-uc.a.run.app)

## Quick Start

To run the project, you can either use the recommended docker, or locally build and run it.

### Run in a Docker
Make sure your docker is installed with proper permissions. To install docker, follow the [official documentations](https://docs.docker.com/engine/install/). After you have docker set up, run the following command:

```bash
cd final-project-binaryviz 			# cd into root of the project
docker build -t dis-viz .  			# build the docker from Dockerfile
docker run -p 8080:8080/tcp dis-viz	# run the docker at port 8080
```

### Run in local machine

1. [Install crow.cpp](https://crowcpp.org/master/) and make sure it is in your include path
2. Run the following command to build the cpp modules

```bash
cd final-project-binaryviz
./build.sh
```
3. Compile a c program with -g (debug flag). There are several sample c files in `./sample_inputs/` folder, you can run `compile.sh` to compile them all to `bin` directory.

```bash
gcc -g hello.c -o hello
```

4. Run the binary to launch the visualization

```bash
cd dis-viz-backend/build/
./DisViz -b /path/to/your/binary/file
```

This should run a server on localhost port 80.

## Background and Motivation

A complex task in analyzing binary code involves navigating through numerous lines of assembly code, requiring considerable time and effort to correlate them with their source code. Understanding compiler performance, particularly the optimization of loops, poses a challenge. To simplify this process, a web-based tool is being developed to facilitate the analysis of binary code alongside its corresponding source code, to comprehend compiler optimizations more efficiently.

This project addresses the limitations of existing source-to-assembly mapping tools, such as Godbolt's Compiler Explorer, which are more suited for single-source file projects. The researcher's background in large binary analysis and data visualization for High-Performance Computing (HPC) has driven this project, aiming to provide an interactive tool to facilitate the correlation between large binaries and their source code, aiding programmers in understanding compiler optimizations.

## Project Objectives

The goal is to establish a correlation between source code and its assembly counterpart through visualization. The focus is on understanding compiler optimizations, specifically the changes made in assembly code for optimization purposes. When analyzing large-scale binary files, the tool aids in navigating assembly code, and clarifying the connection between assembly and source code lines. The primary aim of the visualization tool is to uncover how the compiler optimizes code for improved performance.

### Primary Questions I am trying to answer

1. How can we make a simple clear visualization that will match the source and assembly code lines?
1. What changes does the compiler make in the assembly code for optimization purposes?
1. How many numbers of instructions are correlated to each of the lines in the source file?
1. How can we identify loops in the assembly code that correspond to the loops in the source code?
1. How can we identify the variables of source code in the assembly code?


### Benefits

The visualization interface will help the programmers navigate through the assembly or source codes faster. How the compiler executes the instructions can be understood by looking at the visualization of the assembly code.We know, the program execution time depends mostly on the loops. Quickly detecting the loops in the assembly code through this visualization will help the programmers work on the program execution time. Visualizing the register with its corresponding variables will help the programmers decode the instructions register value a lot faster.

## Data

To examine the correlation between source and assembly, we'll compile source files with the Debug flag, ensuring assembly code retains source information. Large kernel files, chosen for their ability to generate substantial binaries, will be sourced from benchmark kernel set websites:

- [Coral-2 Benchmark](https://gitlab.com/arm-hpc/benchmarks/coral-2)
- [ECP Proxy Apps Suite](https://proxyapps.exascaleproject.org/ecp-proxy-apps-suite/)

Most of the binary files on this website use a CMakeFile for building instructions. According to the provided documentation, we will compile the binary files. 

An example of the commands for compiling a binary file, [Rajaperf](https://gitlab.com/arm-hpc/benchmarks/coral-2/RAJAPerf) from the benchmark kernel sets is given below:

```bash
git clone --recursive https://gitlab.com/arm-hpc/benchmarks/coral-2/RAJAPerf.git
mkdir build && cd build
cmake ..
make j12
```

After building the Rajaperf binary using the above commands, it can be taken as input into the visualization tool.


## Data Preprocessing

The binary file, compiled with the Debug flag, is inputted into the Dyninst API, a Binary Analysis and Modification Framework. Dyninst generates information about the binary, providing access to local variables. The resulting assembly code termed as termed "Disassembly" code was obtained by decompiling the binary file with the help of Dyninst.

To visualize the disassembly code we will require particular information from the Dyninst API. The information which is planned to derive from the data is given below:

**Code Correspondence**:  The mapping between source and assembly code

**Function names**: The names that are present in each instruction block are obtained

**Disassembled Code**: The instructions in the assembly code that are used to compile the binary file. The instructions include address range, opcodes, and operands.

**Basic Block**: It is a straight line code sequence that has no branches in and out branches except for the entry and at the end respectively. 
Basic Block is a set of statements that always executes one after other, in a sequence. 

**Loop structures**: The distinct instructions in the assembly code that are part of a particular loop in the source code.

**Register to Variable Translations**: The registers in the assembly code that have particular variable names from the source code.

Although Dyninst gives a variety of information, for this project we will require the above-mentioned four data. After retrieving data from Dyninst, we preprocess it by converting addresses to hexadecimal format, as they are initially in decimal. Function names are sometimes mangled, encoding them for linker separation. To visualize function names accurately, demangling is performed. For project execution details, refer to the repository's readme.

Some sample preprocessed dataset are given with the release in json format.

## Implementation Details

### Front-end

React+Redux+Typescript is used to build the front-end of the visualization. Each of the components are visual elements like basic blocks, assembly lines, source code lines, file explorer etc. Bootstrap is used for styling in some places.

### Back-end

[Dyninst](https://github.com/dyninst/dyninst) library is used to parse binary files. Then the parsed objects are converted to json response format and hosted as API using [Crow.cpp](https://crowcpp.org/master/) server library.

## Conclusion

In conclusion, this project addresses the challenging task of understanding compiler optimizations in large binary code by developing a web-based visualization tool. By surpassing the limitations of existing tools and focusing on clear visualizations, the project aims to streamline the correlation between source and assembly code. The benefits include faster code navigation, improved comprehension of compiler execution, and rapid identification of critical program elements. Overall, this project presents a promising solution for programmers dealing with intricate compiler optimizations in substantial binaries.