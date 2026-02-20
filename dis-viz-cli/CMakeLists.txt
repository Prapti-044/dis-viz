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

# Try to find system libarchive first
find_package(PkgConfig QUIET)
if(PkgConfig_FOUND)
    pkg_check_modules(LIBARCHIVE QUIET libarchive)
endif()

if(NOT LIBARCHIVE_FOUND)
    # If system libarchive not found, build minimal version
    ExternalProject_Add(libarchive
        GIT_REPOSITORY https://github.com/libarchive/libarchive
        CMAKE_ARGS 
            -DCMAKE_INSTALL_PREFIX=${EXTERNAL_INSTALL_LOCATION}
            -DENABLE_TEST=OFF 
            -DENABLE_TAR=OFF 
            -DENABLE_CPIO=OFF 
            -DENABLE_CAT=OFF
            -DENABLE_WERROR=OFF
            -DENABLE_ACL=OFF
            -DENABLE_XATTR=OFF
            -DENABLE_ICONV=OFF
            -DENABLE_EXPAT=OFF
            -DENABLE_LIBXML2=OFF
            -DENABLE_LZMA=OFF
            -DENABLE_NETTLE=OFF
            -DENABLE_OPENSSL=OFF
            -DENABLE_PCREPOSIX=OFF
            -DENABLE_LibGCC=OFF
            -DENABLE_CNG=OFF
            -DENABLE_BZip2=ON
            -DENABLE_GZIP=ON
            -DENABLE_ZLIB=ON
    )
    set(LIBARCHIVE_LIBRARIES archive)
    set(LIBARCHIVE_INCLUDE_DIRS ${EXTERNAL_INSTALL_LOCATION}/include)
endif()

if(DEFINED ${DYNINST_LOCATION})
    include_directories(${DYNINST_LOCATION}/include)
    link_directories(${DYNINST_LOCATION}/lib)
else()
    ExternalProject_Add(dyninst
        GIT_REPOSITORY https://github.com/dyninst/dyninst
        GIT_TAG
        # 8788c179e07e9970fff4fe358a98c5b0433999c1 # (19 Feb 2026, Instruction::format() does not give mnemonics)
        # 268b6300b59d507317b6c342ae9588eb6fedf2ac # 13.0.0 (Does not compile at all)
        # 334b6856e28fd34a698ad74aa277f1399a814183 # 12.3.0 (CMAKE < 3.5 Compatibility issue)
        5b6094b656828e785a9ac01ac488582bcea2c9dc # last working one
        CMAKE_ARGS -DCMAKE_INSTALL_PREFIX=${EXTERNAL_INSTALL_LOCATION} -DCMAKE_BUILD_TYPE=Release
    )
endif()

include_directories(${EXTERNAL_INSTALL_LOCATION}/include)
link_directories(${EXTERNAL_INSTALL_LOCATION}/lib)

# Add libarchive include directories if using external build
if(NOT LIBARCHIVE_FOUND)
    include_directories(${LIBARCHIVE_INCLUDE_DIRS})
endif()

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

# Link libarchive
if(LIBARCHIVE_FOUND)
    target_link_libraries(${PROJECT_NAME} PRIVATE ${LIBARCHIVE_LIBRARIES})
    target_include_directories(${PROJECT_NAME} PRIVATE ${LIBARCHIVE_INCLUDE_DIRS})
else()
    target_link_libraries(${PROJECT_NAME} PRIVATE archive)
endif()

target_link_libraries(${PROJECT_NAME} PRIVATE
    symtabAPI parseAPI instructionAPI
    # dynElf dynDwarf 
    elf common 
    Boost::program_options
)

add_dependencies(${PROJECT_NAME}
    indicators nlohmann_json
)

if(NOT LIBARCHIVE_FOUND)
    add_dependencies(${PROJECT_NAME} libarchive)
endif()

if(NOT DEFINED ${DYNINST_LOCATION})
    add_dependencies(${PROJECT_NAME} dyninst)
endif()