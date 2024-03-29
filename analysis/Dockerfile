FROM ghcr.io/dyninst/amd64/ubuntu-22.04:latest
ENV LC_ALL=C.UTF-8
ENV LANG=C.UTF-8
ENV LD_LIBRARY_PATH /dyninst/install/lib

RUN apt-get update && apt-get install -y software-properties-common && add-apt-repository ppa:deadsnakes/ppa && DEBIAN_FRONTEND=noninteractive apt-get install -y python3.11 gcc gcc-11 g++-11 libboost-dev yajl-tools git neovim graphviz libtbb2 libtbb-dev libboost-atomic-dev libboost-chrono-dev libboost-date-time-dev libboost-filesystem-dev libboost-system-dev libboost-thread-dev libboost-timer-dev curl xz-utils m4 zlib1g zlib1g-dev fish build-essential libssl-dev wget openmpi-bin python3.11-distutils python3.11-dev && curl -sS https://bootstrap.pypa.io/get-pip.py | python3.11

RUN pip3.11 install -U jupyterlab pandas plotly ipywidgets matplotlib tqdm numpy

# Install CMake
WORKDIR /root/cmake
RUN wget https://github.com/Kitware/CMake/releases/download/v3.23.2/cmake-3.23.2.tar.gz
RUN tar -zxvf cmake-3.23.2.tar.gz
WORKDIR /root/cmake/cmake-3.23.2
RUN ./bootstrap
RUN make -j8
RUN make install
WORKDIR /root/
RUN rm -rf /root/cmake

# Clone Rajaperf (RELWITHDEBINFO)
WORKDIR /root/RAJA-PERFSUITE
RUN git clone --recursive https://github.com/llnl/RAJAPerf.git
WORKDIR /root/RAJA-PERFSUITE/RAJAPerf

# Build Rajaperf with debug flags
RUN sed -i 's/-DCMAKE_BUILD_TYPE=Release/-DCMAKE_BUILD_TYPE=RELWITHDEBINFO/g' scripts/ubuntu-builds/ubuntu_gcc.sh
RUN ./scripts/ubuntu-builds/ubuntu_gcc.sh 11
WORKDIR /root/RAJA-PERFSUITE/RAJAPerf/build_ubuntu-gcc-11/
RUN make -j8
# Binary is in /root/RAJA-PERFSUITE/RAJAPerf/build_ubuntu-gcc-7/bin/raja-perf.exe

# Clone Rajaperf (Debug)
WORKDIR /root/RAJA-PERFSUITE-Deb
RUN git clone --recursive https://github.com/llnl/RAJAPerf.git
WORKDIR /root/RAJA-PERFSUITE-Deb/RAJAPerf

# Build Rajaperf with debug flags
RUN sed -i 's/-DCMAKE_BUILD_TYPE=Release/-DCMAKE_BUILD_TYPE=Debug/g' scripts/ubuntu-builds/ubuntu_gcc.sh
RUN ./scripts/ubuntu-builds/ubuntu_gcc.sh 11
WORKDIR /root/RAJA-PERFSUITE-Deb/RAJAPerf/build_ubuntu-gcc-11/
RUN make -j8
# Binary is in /root/RAJA-PERFSUITE-Deb/RAJAPerf/build_ubuntu-gcc-7/bin/raja-perf.exe

# Build lulesh
WORKDIR /root
RUN git clone https://github.com/LLNL/LULESH.git
WORKDIR /root/LULESH
RUN cmake -DCMAKE_BUILD_TYPE=Debug -DWITH_MPI=FALSE -S . -B build
WORKDIR /root/LULESH/build
RUN make
# lulesh exe is in /root/LULESH/build/lulesh2.0

# # Install simple-optparser (comment this if optparser is used)
WORKDIR /root/
COPY simple-optparser simple-optparser
WORKDIR /root/simple-optparser
RUN python3.11 -m pip install .
WORKDIR /
RUN rm -rf /root/simple-optparser

WORKDIR /samples
COPY sample_inputs ./
RUN g++ -g -O0 hello.cpp -o hello-O0
RUN g++ -g -O3 hello.cpp -o hello-O3
# hello exe is in /samples/hello

RUN g++ -g -O0 bubble_sort.cpp -o bubble-O0
RUN g++ -g -O3 bubble_sort.cpp -o bubble-O3
# bubble exe is in /samples/bubble

RUN gcc -g -O0 loop_outer_block.c -o loop_outer_block-O0
RUN gcc -g -O3 loop_outer_block.c -o loop_outer_block-O3
# loop_outer_block exe is in /samples/loop_outer_block

RUN g++ -g -O0 eg1.cpp -o eg1-O0
RUN g++ -g -O3 eg1.cpp -o eg1-O3
# eg1 exe is in /samples/eg1


WORKDIR /samples/multisource
RUN gcc -g -O0 hello.c -o hello-O0
RUN gcc -g -O3 hello.c -o hello-O3
# hello exe is in /samples/multisource/hello

WORKDIR /samples
RUN gcc -g -O0 ifelse.c -o ifelse-O0
RUN gcc -g -O3 ifelse.c -o ifelse-O3
# hello exe is in /samples/ifelse

WORKDIR /jupyter
ENTRYPOINT ["jupyter-lab", "--allow-root", "--ip=0.0.0.0"]
