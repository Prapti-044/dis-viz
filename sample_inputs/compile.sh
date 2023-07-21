#!/bin/sh

g++ -g -O0 hello.cpp -o bin/hello-O0
g++ -g -O3 hello.cpp -o bin/hello-O3

g++ -g -O0 bubble_sort.cpp -o bin/bubble-O0
g++ -g -O3 bubble_sort.cpp -o bin/bubble-O3

gcc -g -O0 loop_outer_block.c -o bin/loop_outer_block-O0
gcc -g -O3 loop_outer_block.c -o bin/loop_outer_block-O3

g++ -g -O0 eg1.cpp -o bin/eg1-O0
g++ -g -O3 eg1.cpp -o bin/eg1-O3

gcc -g -O0 multisource/hello.c -o bin/multisource-O0
gcc -g -O3 multisource/hello.c -o bin/multisource-O3

gcc -g -O0 ifelse.c -o bin/ifelse-O0
gcc -g -O3 ifelse.c -o bin/ifelse-O3

nvcc -g -G -O0 vec_add.cu -o bin/vec_add-O0
nvcc -g -G -O3 vec_add.cu -o bin/vec_add-O3

g++ -g -O0 inlines/file2.cpp -o bin/inlines-O0
g++ -g -O3 inlines/file2.cpp -o bin/inlines-O3

