cmake_minimum_required(VERSION 3.22...4.0.2)

# Set policy for FindBoost module deprecation
if(POLICY CMP0167)
    cmake_policy(SET CMP0167 NEW)
endif()

project(DisViz VERSION 0.1)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_EXPORT_COMPILE_COMMANDS 1)
set(CMAKE_CXX_STANDARD_REQUIRED True)
# set(CMAKE_COLOR_DIAGNOSTICS ON)
set(CMAKE_BUILD_PARALLEL_LEVEL 8)

if(NOT PROJECT_SOURCE_DIR STREQUAL PROJECT_BINARY_DIR)
    file(GENERATE OUTPUT .gitignore CONTENT "*")
endif()

option(DYNINST_LOCATION "Location of prebuilt dyninst. Leave OFF if you want to build dyninst from github.")

include_directories(${CMAKE_CURRENT_SOURCE_DIR}/src/include)

# External Projects
include(ExternalProject)
set(EXTERNAL_INSTALL_LOCATION ${CMAKE_BINARY_DIR}/external)

ExternalProject_Add(indicators
    GIT_REPOSITORY https://github.com/p-ranav/indicators
    CMAKE_ARGS -DCMAKE_INSTALL_PREFIX=${EXTERNAL_INSTALL_LOCATION}
)

ExternalProject_Add(nlohmann_json
    GIT_REPOSITORY https://github.com/nlohmann/json
    CMAKE_ARGS -DJSON_BuildTests=OFF -DJSON_Install=ON -DCMAKE_INSTALL_PREFIX=${EXTERNAL_INSTALL_LOCATION}
)

if(DEFINED ${DYNINST_LOCATION})
    include_directories(${DYNINST_LOCATION}/include)
    link_directories(${DYNINST_LOCATION}/lib)
else()
    ExternalProject_Add(dyninst
        GIT_REPOSITORY https://github.com/dyninst/dyninst
        GIT_TAG 7dd349f4c60b717ac1134b91374ee729be319180
        CMAKE_ARGS -DCMAKE_INSTALL_PREFIX=${EXTERNAL_INSTALL_LOCATION} -DCMAKE_BUILD_TYPE=Release
    )
endif()

include_directories(${EXTERNAL_INSTALL_LOCATION}/include)
link_directories(${EXTERNAL_INSTALL_LOCATION}/lib)

file(GLOB_RECURSE SOURCES CONFIGURE_DEPENDS "${CMAKE_CURRENT_SOURCE_DIR}/src/*.cpp")
add_executable(${PROJECT_NAME} ${SOURCES})

# Modern Boost configuration
set(Boost_USE_STATIC_LIBS ON)
set(Boost_USE_MULTITHREADED ON)
set(Boost_USE_STATIC_RUNTIME OFF)

find_package(Boost 1.70 REQUIRED COMPONENTS program_options)

# Find Clang
find_path(CLANG_INCLUDE_DIR clang-c/Index.h
    PATHS
    /usr/lib/llvm/include
    /usr/local/include
    /usr/include/llvm
    /usr/include
    /usr/local/opt/llvm/include  # For macOS with Homebrew
)

find_library(CLANG_LIBRARY
    NAMES clang libclang
    PATHS
    /usr/lib
    /usr/lib/llvm/lib
    /usr/local/lib
    /usr/local/opt/llvm/lib  # For macOS with Homebrew
)

if(NOT CLANG_INCLUDE_DIR OR NOT CLANG_LIBRARY)
    message(FATAL_ERROR "Could not find libclang")
endif()

target_include_directories(${PROJECT_NAME} PRIVATE ${CLANG_INCLUDE_DIR})
target_link_libraries(${PROJECT_NAME} PRIVATE ${CLANG_LIBRARY})

target_link_libraries(${PROJECT_NAME} PRIVATE
    symtabAPI parseAPI instructionAPI
    # dynElf dynDwarf 
    elf common 
    Boost::program_options
)

add_dependencies(${PROJECT_NAME}
    indicators nlohmann_json
)
if(NOT DEFINED ${DYNINST_LOCATION})
    add_dependencies(${PROJECT_NAME} dyninst)
endif()