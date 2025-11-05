# Interactive Visualization of Binary Code for Investigating Compiler Optimizations

This project visualizes binary executable files and maps it back to the source code. I used the Dyninst library that can decompile binary files compiled with Debug flags. The implementation details are listed below.

__Figure: Overview of the Binary Visualization Tool, DisViz shows source-to-assembly correspondence.__

![Binary Visualization Interface](.github/teaser.png)

__The demonstration of the tool, DisViz is shown in the video link below.__

## [Video Link](https://youtu.be/RVfb3yhSeI4)

## Quick Start

To run the project, you can either use the recommended Docker image or build and run it locally.

### Run in a Docker
Ensure your Docker is installed with the proper permissions. To install Docker, follow the [official documentation](https://docs.docker.com/engine/install/). After you have Docker set up, run the following command:

```bash
cd dis-viz 			                      # cd into root of the project
docker build -t dis-viz .  		      	# build the docker from Dockerfile
docker run -p 8080:8080/tcp dis-viz  	# run the docker at port 8080
```

### Run on Local machine

1. [Install crow.cpp](https://crowcpp.org/master/) and make sure it is in your include path
2. Run the following command to build the cpp modules

```bash
cd dis-viz
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

## Binary file (Input Data)

To load the binary into the tool, we'll compile the source files with the Debug flag, ensuring that the assembly code retains source information. A large kernel file, chosen for its ability to generate substantial binaries and used in the video, is obtained from [Rajaperf](https://gitlab.com/arm-hpc/benchmarks/coral-2/RAJAPerf).

Most binary files utilize a CMake file for building instructions. According to the provided documentation, we will compile the **Rajaperf** binary file. 

The commands for compiling a binary file,  from the benchmark kernel sets, are given below:

```bash
mkdir RAJA-PERFSUITE
cd RAJA-PERFSUITE
git clone --recursive https://github.com/llnl/RAJAPerf.git
```

You can create your own build directory and run CMake with your own arguments from there.

```bash
mkdir build && cd build
cmake ..
make -j12
```

## Running the suite

The suite is run by invoking the executable in the bin directory in the build space. For example, giving it no options:

```bash
./bin/raja-perf.exe
```

Note: Most options appear in both long and short forms for ease of use.
To see available options along with a brief description of each, pass the --help or -h option:

```bash
./bin/raja-perf.exe --help
```

or

```bash
./bin/raja-perf.exe -h
```

To see available options along with a brief description of each, pass the --help or -h option:
```bash
./bin/raja-perf.exe
```
After building the Rajaperf binary using the above commands, it can be taken as input into the visualization tool.

## Implementation Details

### Front-end

React+Redux+Typescript is used to build the front-end of the visualization. Each of the components are visual elements like basic blocks, assembly lines, source code lines, file explorer etc. Bootstrap is used for styling in some places.

### Back-end

[Dyninst](https://github.com/dyninst/dyninst) library is used to parse binary files. Then the parsed objects are converted to json response format and hosted as API using [Crow.cpp](https://crowcpp.org/master/) server library.
