cmake_minimum_required(VERSION 3.22...4.0.2)

if(POLICY CMP0167)
    cmake_policy(SET CMP0167 NEW)
endif()

project(DisVizDwarfdump VERSION 0.1)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_EXPORT_COMPILE_COMMANDS 1)
set(CMAKE_CXX_STANDARD_REQUIRED True)
set(CMAKE_BUILD_PARALLEL_LEVEL 8)

if(NOT PROJECT_SOURCE_DIR STREQUAL PROJECT_BINARY_DIR)
    file(GENERATE OUTPUT .gitignore CONTENT "*")
endif()

# External Projects
include(ExternalProject)
set(EXTERNAL_INSTALL_LOCATION ${CMAKE_BINARY_DIR}/external)

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

include_directories(${EXTERNAL_INSTALL_LOCATION}/include)
link_directories(${EXTERNAL_INSTALL_LOCATION}/lib)

if(NOT LIBARCHIVE_FOUND)
    include_directories(${LIBARCHIVE_INCLUDE_DIRS})
endif()

file(GLOB_RECURSE SOURCES CONFIGURE_DEPENDS "${CMAKE_CURRENT_SOURCE_DIR}/src/*.cpp")
add_executable(${PROJECT_NAME} ${SOURCES})

# Boost
set(Boost_USE_STATIC_LIBS ON)
set(Boost_USE_MULTITHREADED ON)
set(Boost_USE_STATIC_RUNTIME OFF)
find_package(Boost 1.70 REQUIRED COMPONENTS program_options)

# Link libarchive
if(LIBARCHIVE_FOUND)
    target_link_libraries(${PROJECT_NAME} PRIVATE ${LIBARCHIVE_LIBRARIES})
    target_include_directories(${PROJECT_NAME} PRIVATE ${LIBARCHIVE_INCLUDE_DIRS})
else()
    target_link_libraries(${PROJECT_NAME} PRIVATE archive)
endif()

target_link_libraries(${PROJECT_NAME} PRIVATE Boost::program_options)

add_dependencies(${PROJECT_NAME} nlohmann_json)

if(NOT LIBARCHIVE_FOUND)
    add_dependencies(${PROJECT_NAME} libarchive)
endif()
