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

ExternalProject_Add(nlohmann_json
    GIT_REPOSITORY https://github.com/nlohmann/json
    CMAKE_ARGS -DJSON_BuildTests=OFF -DCMAKE_INSTALL_PREFIX=${EXTERNAL_INSTALL_LOCATION}
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

find_package(Boost REQUIRED COMPONENTS program_options)
target_include_directories(${PROJECT_NAME} PRIVATE ${Boost_INCLUDE_DIRS})

target_link_libraries(${PROJECT_NAME} PRIVATE
    symtabAPI parseAPI instructionAPI
    # dynElf dynDwarf 
    elf common 
    ${Boost_LIBRARIES}
)

add_dependencies(${PROJECT_NAME}
    indicators crow nlohmann_json
)
if(NOT DEFINED ${DYNINST_LOCATION})
    add_dependencies(${PROJECT_NAME} dyninst)
endif()