cmake_minimum_required(VERSION 3.22)
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

ExternalProject_Add(crow
    GIT_REPOSITORY https://github.com/CrowCpp/Crow
    CMAKE_ARGS -DCROW_BUILD_EXAMPLES=OFF -DCROW_BUILD_TESTS=OFF -DCMAKE_INSTALL_PREFIX=${EXTERNAL_INSTALL_LOCATION}
)

if(DEFINED ${DYNINST_LOCATION})
    include_directories(${DYNINST_LOCATION}/include)
    link_directories(${DYNINST_LOCATION}/lib)
else()
    ExternalProject_Add(dyninst
        GIT_REPOSITORY https://github.com/dyninst/dyninst
        GIT_TAG 2b70b8d4a1e58540cea7c72370af363a1b7259c6
        CMAKE_ARGS -DCMAKE_INSTALL_PREFIX=${EXTERNAL_INSTALL_LOCATION} -DCMAKE_BUILD_TYPE=Release
    )
endif()

include_directories(${EXTERNAL_INSTALL_LOCATION}/include)
link_directories(${EXTERNAL_INSTALL_LOCATION}/lib)

file(GLOB_RECURSE SOURCES CONFIGURE_DEPENDS "${CMAKE_CURRENT_SOURCE_DIR}/src/*.cpp")
add_executable(${PROJECT_NAME} ${SOURCES})

find_package(Boost REQUIRED COMPONENTS program_options)
target_include_directories(${PROJECT_NAME} PRIVATE ${Boost_INCLUDE_DIRS})

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
    symtabAPI parseAPI instructionAPI dynElf elf common dynDwarf 
    ${Boost_LIBRARIES}
)

add_dependencies(${PROJECT_NAME}
    indicators crow
)
if(NOT DEFINED ${DYNINST_LOCATION})
    add_dependencies(${PROJECT_NAME} dyninst)
endif()