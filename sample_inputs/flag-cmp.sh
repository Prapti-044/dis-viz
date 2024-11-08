#!/bin/bash

# Usage: ./compile_to <source_file> <optimization_level> <output_dir> [optional_flags...]
# Example: ./compile_to main.cpp -O2 ./bin code_hoist loop_unroll

# Check if at least three arguments are passed
if [ $# -lt 3 ]; then
  echo "Usage: $0 <source_file> <optimization_level> <output_dir> [optional_flags...]"
  exit 1
fi

# Input variables
SOURCE_FILE=$1
OPTIMIZATION_LEVEL=$2
OUTPUT_DIR=$3
OUTPUT_FILE=${SOURCE_FILE%.*} # Extract filename without extension
shift 3

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

OUTPUT_FILE_NAME="$OUTPUT_DIR/$OUTPUT_FILE$OPTIMIZATION_LEVEL"

# Default g++ command with source file and optimization level
COMMAND="g++ $SOURCE_FILE $OPTIMIZATION_LEVEL -g"

FLAGS=()
NOFLAGS=()

# Parse optional flags
for FLAG in "$@"; do
  FLAGS+=("-f$FLAG")
  NOFLAGS+=("-fno-$FLAG")
done

COMMAND_WITH_FLAGS="$COMMAND ${FLAGS[@]} -o $OUTPUT_FILE_NAME-flags"
echo $COMMAND_WITH_FLAGS
$COMMAND_WITH_FLAGS
COMMAND_WITH_NOFLAGS="$COMMAND ${NOFLAGS[@]} -o $OUTPUT_FILE_NAME-noflags"
echo $COMMAND_WITH_NOFLAGS
$COMMAND_WITH_NOFLAGS

# also compile to other optimization levels
echo "Compiling to other optimization levels"
g++ $SOURCE_FILE -O0 -g -o "$OUTPUT_DIR/$OUTPUT_FILE-O0"
g++ $SOURCE_FILE -O1 -g -o "$OUTPUT_DIR/$OUTPUT_FILE-O1"
g++ $SOURCE_FILE -O2 -g -o "$OUTPUT_DIR/$OUTPUT_FILE-O2"
g++ $SOURCE_FILE -O3 -g -o "$OUTPUT_DIR/$OUTPUT_FILE-O3"
