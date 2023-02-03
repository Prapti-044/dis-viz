FROM ghcr.io/autamus/dyninst:11.0.1
ENV LC_ALL C.UTF-8
ENV LANG C.UTF-8

RUN  apt-get update && apt-get install -y gcc g++ cmake libboost-dev yajl-tools git vim graphviz libtbb2 libtbb-dev libboost-atomic-dev libboost-chrono-dev libboost-date-time-dev libboost-filesystem-dev libboost-system-dev libboost-thread-dev libboost-timer-dev curl xz-utils m4 zlib1g zlib1g-dev python3-pip libhiredis-dev sudo dwarfdump fish gdb nlohmann-json-dev python-dev

ENV LD_LIBRARY_PATH /opt/view/lib

WORKDIR /root

# docker run --rm -it --entrypoint fish dyninst-dev
