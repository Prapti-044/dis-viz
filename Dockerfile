FROM ubuntu:latest

RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y software-properties-common build-essential wget cmake git libboost-all-dev libtbb-dev elfutils libdw-dev libiberty-dev \
    && rm -rf /var/lib/apt/lists/*

# Install GCC 13.1.0 (the default one is 9.3.0)
RUN add-apt-repository ppa:ubuntu-toolchain-r/test -y \
    && apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y gcc-13 g++-13 \
    && rm -rf /var/lib/apt/lists/*

# All binaries should be in /samples/bin
WORKDIR /samples
RUN mkdir bin


WORKDIR /root/RAJA-PERFSUITE
RUN git clone --recursive https://github.com/llnl/RAJAPerf.git

WORKDIR /root/RAJA-PERFSUITE/RAJAPerf/bin
RUN CC=gcc-13 CXX=g++-13 cmake -D CMAKE_CXX_FLAGS="${CMAKE_CXX_FLAGS} -g -O3" ..
RUN make -j8
RUN mv bin/raja-perf.exe /samples/bin/Rajaperf-O3-gcc13


WORKDIR /root/RAJA-PERFSUITE
RUN rm -rf bin
WORKDIR /root/RAJA-PERFSUITE/RAJAPerf/bin
RUN CC=gcc-13 CXX=g++-13 cmake -D CMAKE_CXX_FLAGS="${CMAKE_CXX_FLAGS} -g -O0" ..
RUN make -j8
RUN mv bin/raja-perf.exe /samples/bin/Rajaperf-O0-gcc13


WORKDIR /root/RAJA-PERFSUITE/RAJAPerf
RUN rm -rf bin
WORKDIR /root/RAJA-PERFSUITE/RAJAPerf/bin
RUN CC=gcc-11 CXX=g++-11 cmake -D CMAKE_CXX_FLAGS="${CMAKE_CXX_FLAGS} -g -O0" ..
RUN make -j8
RUN mv bin/raja-perf.exe /samples/bin/Rajaperf-O0-gcc11


WORKDIR /root/RAJA-PERFSUITE/RAJAPerf
RUN rm -rf bin
WORKDIR /root/RAJA-PERFSUITE/RAJAPerf/bin
RUN CC=gcc-11 CXX=g++-11 cmake -D CMAKE_CXX_FLAGS="${CMAKE_CXX_FLAGS} -g -O3" ..
RUN make -j8
RUN mv bin/raja-perf.exe /samples/bin/Rajaperf-O3-gcc11

# Copy all sample inputs
COPY sample_inputs /samples/sample_inputs

# Compile sample bubble_sort
RUN g++-13 -g -O3 /samples/sample_inputs/bubble_sort.cpp -o /samples/bin/BubbleSort-O3-gcc13

# Install Crow
WORKDIR /root
RUN wget https://github.com/CrowCpp/Crow/releases/download/v1.0%2B5/crow-v1.0+5.deb && \
    dpkg -i crow-v1.0+5.deb && \
    rm crow-v1.0+5.deb
    
# Build DisViz CLI
WORKDIR /App
COPY dis-viz-cli/src src
COPY dis-viz-cli/CMakeLists.txt .
RUN mkdir build
WORKDIR /App/build
RUN cmake -DCMAKE_BUILD_TYPE=Release ..
RUN make -j8

# Add DisViz to PATH
RUN ln -s /App/build/DisViz /usr/local/bin/DisViz

# Set working directory to /workspace for user projects
WORKDIR /workspace

# Start with bash shell
CMD ["/bin/bash"]
