#ifndef SIMPLEOPT
#define SIMPLEOPT


#include <signal.h>

#include <fstream>
#include <iostream>
#include <map>
#include <regex>
#include <set>

#include <CodeObject.h>
#include <Function.h>
#include <InstructionDecoder.h>
#include <Symtab.h>

#include <json.hpp>
#include "includes/cxxopts.hpp"

int decode(std::string);
nlohmann::json printParse();
std::string writeDOT();
nlohmann::json printSourceFiles();
nlohmann::json getAssembly();

#endif