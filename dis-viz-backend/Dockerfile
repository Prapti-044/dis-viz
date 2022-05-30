FROM ghcr.io/autamus/dyninst:11.0.1
ENV LC_ALL=C.UTF-8
ENV LANG=C.UTF-8
ENV LD_LIBRARY_PATH /opt/view/lib

RUN  apt-get update && apt-get install -y gcc g++ libboost-dev yajl-tools git neovim graphviz libtbb2 libtbb-dev libboost-atomic-dev libboost-chrono-dev libboost-date-time-dev libboost-filesystem-dev libboost-system-dev libboost-thread-dev libboost-timer-dev curl xz-utils m4 zlib1g zlib1g-dev python3-pip fish build-essential libssl-dev wget openmpi-bin

# Install CMake
RUN mkdir /root/cmake
WORKDIR /root/cmake
RUN wget https://github.com/Kitware/CMake/releases/download/v3.23.2/cmake-3.23.2.tar.gz
RUN tar -zxvf cmake-3.23.2.tar.gz
WORKDIR /root/cmake/cmake-3.23.2
RUN ./bootstrap
RUN make -j8
RUN make install
WORKDIR /root/
RUN rm -rf /root/cmake

# # Install simple-optparser (comment this if optparser is used)
WORKDIR /root/
RUN git clone https://github.com/Prapti-044/simple-optparser.git
WORKDIR /root/simple-optparser
RUN python3 setup.py install
WORKDIR /
RUN rm -rf /root/simple-optparser

# Clone Rajaperf
WORKDIR /root/
RUN mkdir RAJA-PERFSUITE
WORKDIR /root/RAJA-PERFSUITE
RUN git clone --recursive https://github.com/llnl/RAJAPerf.git
WORKDIR /root/RAJA-PERFSUITE/RAJAPerf

# Build Rajaperf with debug flags
RUN sed -i 's/-DCMAKE_BUILD_TYPE=Release/-DCMAKE_BUILD_TYPE=Debug/g' scripts/ubuntu-builds/ubuntu_gcc.sh
RUN ./scripts/ubuntu-builds/ubuntu_gcc.sh 7
WORKDIR /root/RAJA-PERFSUITE/RAJAPerf/build_ubuntu-gcc-7/
RUN make -j8
# RUN make test
# Binary is in /root/RAJA-PERFSUITE/RAJAPerf/build_ubuntu-gcc-7/bin/raja-perf.exe

# Build lulesh
WORKDIR /root
RUN git clone https://github.com/LLNL/LULESH.git
WORKDIR /root/LULESH
RUN cmake -DCMAKE_BUILD_TYPE=Debug -DWITH_MPI=FALSE -S . -B build
WORKDIR /root/LULESH/build
RUN make
# lulesh exe is in /root/LULESH/build/lulesh2.0

# Copy dis-viz
WORKDIR /App
COPY . .
RUN g++ -g -o0 sample_inputs/hello.cpp -o sample_inputs/hello
RUN pip3 install --no-cache-dir --upgrade -r requirements.txt

EXPOSE 80
ENTRYPOINT ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "80"]
