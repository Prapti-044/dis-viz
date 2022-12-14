FROM ghcr.io/autamus/dyninst:11.0.1
ENV LC_ALL=C.UTF-8
ENV LANG=C.UTF-8
ENV LD_LIBRARY_PATH /opt/view/lib

RUN apt-get update && apt-get install -y software-properties-common && add-apt-repository ppa:deadsnakes/ppa && DEBIAN_FRONTEND=noninteractive apt-get install -y python3.10 gcc g++ libboost-dev yajl-tools git neovim graphviz libtbb2 libtbb-dev libboost-atomic-dev libboost-chrono-dev libboost-date-time-dev libboost-filesystem-dev libboost-system-dev libboost-thread-dev libboost-timer-dev curl xz-utils m4 zlib1g zlib1g-dev fish build-essential libssl-dev wget openmpi-bin python3.10-distutils python3.10-dev && curl -sS https://bootstrap.pypa.io/get-pip.py | python3.10

RUN pip3.10 install -U jupyterlab numpy pandas plotly ipywidgets matplotlib tqdm

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

# Clone Rajaperf
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

# # Install simple-optparser (comment this if optparser is used)
WORKDIR /root/
COPY simple-optparser simple-optparser
WORKDIR /root/simple-optparser
RUN python3.10 setup.py install
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

WORKDIR /samples/multisource
RUN gcc -g -O0 hello.c -o hello-O0
RUN gcc -g -O3 hello.c -o hello-O3
# hello exe is in /samples/multisource/hello

# Copy dis-viz
WORKDIR /jupyter



ENTRYPOINT ["jupyter-lab", "--allow-root", "--ip=0.0.0.0", "--app_dir=/jupyter"]
