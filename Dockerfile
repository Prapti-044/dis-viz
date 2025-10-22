FROM ubuntu:latest

RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y build-essential wget cmake git libboost-all-dev libtbb-dev elfutils libdw-dev libiberty-dev npm libasio-dev \
    && rm -rf /var/lib/apt/lists/*

# All binaries should be in /samples/bin
WORKDIR /samples
RUN mkdir bin

# Build lulesh
WORKDIR /root
RUN git clone https://github.com/LLNL/LULESH.git
WORKDIR /root/LULESH
RUN cmake -DCMAKE_BUILD_TYPE=Debug -DWITH_MPI=FALSE -S . -B build
WORKDIR /root/LULESH/build
RUN make
RUN mv /root/LULESH/build/lulesh2.0 /samples/bin/lulesh2.0-Debug

WORKDIR /samples
COPY sample_inputs .
RUN ./compile.sh && rm -f compile.sh

# Install Crow
WORKDIR /root
RUN wget https://github.com/CrowCpp/Crow/releases/download/v1.0%2B5/crow-v1.0+5.deb && \
    dpkg -i crow-v1.0+5.deb && \
    rm crow-v1.0+5.deb
    
WORKDIR /App
COPY dis-viz-backend/src src
COPY dis-viz-backend/CMakeLists.txt .
RUN mkdir build
WORKDIR /App/build
RUN cmake ..
RUN make -j"$(nproc)"

WORKDIR /App
COPY dis-viz-frontend frontend
WORKDIR /App/frontend
RUN npm install
RUN BUILD_PATH="/App/build/templates" npm run build

WORKDIR /App/build
EXPOSE 8080
ENTRYPOINT ["./DisViz", "-b", "/samples/bin"]
