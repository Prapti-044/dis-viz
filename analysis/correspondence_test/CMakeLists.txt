cmake_minimum_required(VERSION 3.22)
project(Correspondence VERSION 0.1)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_EXPORT_COMPILE_COMMANDS 1)
set(CMAKE_CXX_STANDARD_REQUIRED True)
# set(CMAKE_COLOR_DIAGNOSTICS ON)
set(CMAKE_BUILD_PARALLEL_LEVEL 8)

if(NOT PROJECT_SOURCE_DIR STREQUAL PROJECT_BINARY_DIR)
  # Git auto-ignore out-of-source build directory
  file(GENERATE OUTPUT .gitignore CONTENT "*")
endif()

option(DYNINST_LOCATION "Location of prebuilt dyninst. Leave OFF if you want to build dyninst from github.")

# External Projects
include(ExternalProject)
set(EXTERNAL_INSTALL_LOCATION ${CMAKE_BINARY_DIR}/external)

if(DEFINED ${DYNINST_LOCATION})
    include_directories(${DYNINST_LOCATION}/include)
    link_directories(${DYNINST_LOCATION}/lib)
else()
    ExternalProject_Add(dyninst
        GIT_REPOSITORY https://github.com/dyninst/dyninst
        GIT_TAG aa7b692c2087a105d652954e33642330cd49d048
        CMAKE_ARGS -DCMAKE_INSTALL_PREFIX=${EXTERNAL_INSTALL_LOCATION} -DCMAKE_BUILD_TYPE=Release
    )
endif()

include_directories(${EXTERNAL_INSTALL_LOCATION}/include)
link_directories(${EXTERNAL_INSTALL_LOCATION}/lib)

add_executable(${PROJECT_NAME} main.cpp)

find_package(Boost)
target_include_directories(${PROJECT_NAME} PRIVATE ${Boost_INCLUDE_DIRS})

target_link_libraries(${PROJECT_NAME} PRIVATE
    symtabAPI parseAPI instructionAPI dynElf elf common dynDwarf
    ${Boost_LIBRARIES}
)

if(NOT DEFINED ${DYNINST_LOCATION})
    add_dependencies(${PROJECT_NAME} dyninst)
endif()
