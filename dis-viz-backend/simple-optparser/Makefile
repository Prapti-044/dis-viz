
test: test.c
	g++ -g -O0 test.c -o test

optparser: optparser.cc
	g++ -std=c++0x -o optparser optparser.cc -L/opt/view/lib -lsymtabAPI -I/opt/view/include -lparseAPI -linstructionAPI -lsymLite -ldynDwarf -ldynElf -lcommon -lelf

simpleopt: simpleopt.cc includes/cxxopts.hpp test
	g++ -std=c++0x -o simpleopt simpleopt.cc -L/opt/view/lib -lsymtabAPI -I/opt/view/include -lparseAPI -linstructionAPI -lsymLite -ldynDwarf -ldynElf -lcommon -lelf

test2.json: optparser test
	./optparser test && mv test.dot test2.dot && mv test.json test2.json

test2.dot: optparser test
	./optparser test && mv test.dot test2.dot && mv test.json test2.json

test.json: simpleopt test
	./simpleopt -b test

test.dot: simpleopt test
	./simpleopt -b test

clean:
	rm -rf test simpleopt *.json optparser