#!/bin/bash

# Script to compile all sample inputs and generate disviz files
# Usage: ./generate_disviz.sh --disviz-path <path_to_disviz> --output-dir <output_directory> [--cuda]

set -e  # Exit on error

# Default values
DISVIZ_PATH=""
OUTPUT_DIR=""
COMPILE_CUDA=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --disviz-path)
            DISVIZ_PATH="$2"
            shift 2
            ;;
        --output-dir)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --cuda)
            COMPILE_CUDA=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 --disviz-path <path_to_disviz> --output-dir <output_directory> [--cuda]"
            echo ""
            echo "Required arguments:"
            echo "  --disviz-path PATH    Path to the DisViz executable"
            echo "  --output-dir DIR      Directory to save .disviz output files"
            echo ""
            echo "Optional arguments:"
            echo "  --cuda                Also compile and process CUDA samples (requires nvcc)"
            echo "  --help, -h            Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 --disviz-path <path_to_disviz> --output-dir <output_directory> [--cuda]"
            exit 1
            ;;
    esac
done

# Validate arguments
if [[ -z "$DISVIZ_PATH" ]]; then
    echo "Error: --disviz-path is required"
    echo "Usage: $0 --disviz-path <path_to_disviz> --output-dir <output_directory>"
    exit 1
fi

if [[ -z "$OUTPUT_DIR" ]]; then
    echo "Error: --output-dir is required"
    echo "Usage: $0 --disviz-path <path_to_disviz> --output-dir <output_directory>"
    exit 1
fi

# Check if DisViz executable exists
if [[ ! -x "$DISVIZ_PATH" ]]; then
    echo "Error: DisViz executable not found or not executable at: $DISVIZ_PATH"
    exit 1
fi

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Change to script directory
cd "$SCRIPT_DIR"

# Create bin directory if it doesn't exist
mkdir -p bin

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Compiling all source files..."
echo "=========================================="

# Run the compile script
if [[ -f "compile.sh" ]]; then
    # Allow compile.sh to continue even if some files fail
    set +e
    if [[ "$COMPILE_CUDA" == true ]]; then
        bash compile.sh --cuda
    else
        bash compile.sh
    fi
    compile_exit_code=$?
    set -e
    
    echo ""
    if [[ $compile_exit_code -eq 0 ]]; then
        echo "Compilation complete!"
    else
        echo -e "${YELLOW}Compilation completed with some errors (continuing anyway)${NC}"
    fi
else
    echo "Error: compile.sh not found in $SCRIPT_DIR"
    exit 1
fi

echo ""
echo "=========================================="
echo "Running DisViz on all binaries..."
echo "=========================================="

# Check if bin directory has any files
if [[ ! "$(ls -A bin/)" ]]; then
    echo "Error: No binaries found in bin/ directory"
    exit 1
fi

# Counter for processed files
PROCESSED=0
FAILED=0

# Run DisViz on each binary in the bin directory
for binary in bin/*; do
    if [[ -f "$binary" && -x "$binary" ]]; then
        binary_name=$(basename "$binary")
        
        echo -e "${BLUE}Processing:${NC} $binary_name -> ${binary_name}.disviz"
        
        # Temporarily disable exit on error for this command
        set +e
        disviz_output=$("$DISVIZ_PATH" --binary-paths "$binary" --output-dir "$OUTPUT_DIR" 2>&1)
        exit_code=$?
        set -e
        
        if [[ $exit_code -eq 0 ]]; then
            echo -e "    ${GREEN}✓ Success${NC}"
            ((++PROCESSED))
        else
            echo -e "    ${RED}✗ Failed${NC}"
            if [[ -n "$disviz_output" ]]; then
                echo "$disviz_output" | sed 's/^/    /'
            fi
            ((++FAILED))
        fi
        echo ""
    fi
done

echo "=========================================="
echo "DisViz Generation Summary"
echo "=========================================="
echo -e "Total:      $((PROCESSED + FAILED))"
echo -e "${GREEN}Success:    $PROCESSED${NC}"
if [[ $FAILED -gt 0 ]]; then
    echo -e "${RED}Failed:     $FAILED${NC}"
else
    echo -e "Failed:     $FAILED"
fi
echo -e "${YELLOW}Output dir: $OUTPUT_DIR${NC}"
echo "=========================================="

if [[ $FAILED -gt 0 ]]; then
    exit 1
fi

exit 0

