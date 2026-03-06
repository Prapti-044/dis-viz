#!/bin/bash

# Script to compile all sample inputs
# Usage: ./compile.sh [--cuda]
#   --cuda: Also compile CUDA samples (requires nvcc)

set -e  # Exit on error

# Parse command line arguments
COMPILE_CUDA=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --cuda)
            COMPILE_CUDA=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [--cuda]"
            echo "  --cuda: Also compile CUDA samples (requires nvcc)"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--cuda]"
            exit 1
            ;;
    esac
done

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Create bin directory if it doesn't exist
mkdir -p bin

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counter for compilation stats
TOTAL=0
SUCCESS=0
FAILED=0

# Function to compile a file
compile_file() {
    local compiler=$1
    local flags=$2
    local source=$3
    local output=$4
    local opt_level=$5
    
    ((++TOTAL))
    echo -e "${BLUE}[${TOTAL}] Compiling:${NC} $(basename "$source") (${opt_level})"
    echo -e "    ${YELLOW}Command:${NC} $compiler $flags $source -o $output"
    
    # Temporarily disable exit on error for this command
    set +e
    local compile_output
    compile_output=$($compiler $flags "$source" -o "$output" 2>&1)
    local exit_code=$?
    set -e
    
    if [[ $exit_code -eq 0 ]]; then
        echo -e "    ${GREEN}✓ Success${NC}"
        ((++SUCCESS))
    else
        echo -e "    ${RED}✗ Failed${NC}"
        if [[ -n "$compile_output" ]]; then
            echo "$compile_output" | sed 's/^/    /'
        fi
        ((++FAILED))
    fi
    
    # Always return success so the script continues with set -e
    return 0
}

echo "=========================================="
echo "Compiling Sample Inputs"
echo "=========================================="
echo ""

# C++ samples - bubble_sort.cpp
echo -e "${YELLOW}>>> bubble_sort.cpp${NC}"
compile_file "g++" "-g -O0" "bubble_sort.cpp" "bin/bubble-O0" "O0"
compile_file "g++" "-g -O3" "bubble_sort.cpp" "bin/bubble-O3" "O3"
echo ""

# C++ samples - comprehensive_code.cpp
echo -e "${YELLOW}>>> comprehensive_code.cpp${NC}"
compile_file "g++" "-g -O3" "comprehensive_code.cpp" "bin/comprehensive_code-O3" "O3"
echo ""

# CUDA samples (optional)
if [[ "$COMPILE_CUDA" == true ]]; then
    echo -e "${YELLOW}>>> vec_add.cu (CUDA)${NC}"
    
    # Check if nvcc is available
    if command -v nvcc &> /dev/null; then
        compile_file "nvcc" "-g -G -O0" "vec_add.cu" "bin/vec_add-O0" "O0"
        compile_file "nvcc" "-g -G -O3" "vec_add.cu" "bin/vec_add-O3" "O3"
        echo ""
    else
        echo -e "    ${RED}✗ nvcc not found in PATH${NC}"
        echo -e "    ${YELLOW}Skipping CUDA compilation${NC}"
        echo ""
        ((TOTAL+=2))
        ((FAILED+=2))
    fi
else
    echo -e "${YELLOW}Skipping CUDA samples (use --cuda to enable)${NC}"
    echo ""
fi

# Print summary
echo "=========================================="
echo "Compilation Summary"
echo "=========================================="
echo -e "Total:   $TOTAL"
echo -e "${GREEN}Success: $SUCCESS${NC}"
if [[ $FAILED -gt 0 ]]; then
    echo -e "${RED}Failed:  $FAILED${NC}"
else
    echo -e "Failed:  $FAILED"
fi
echo "=========================================="

# Exit with error if any compilation failed
if [[ $FAILED -gt 0 ]]; then
    exit 1
fi

exit 0
