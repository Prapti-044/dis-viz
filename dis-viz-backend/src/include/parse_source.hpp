#pragma once
#include <clang-c/Index.h>
#include <string>
#include <set>
#include <vector>

struct LoopData {
  unsigned int line;
  std::set<unsigned int> bodyLines;
};

struct SourceFunctionParam {
  std::string type;
  std::string name;
};

struct SourceFunction {
  unsigned int line;
  std::string name;
  std::string returnType;
  std::vector<SourceFunctionParam> parameters;
};

struct SourceCodeData {
  std::vector<LoopData> loops;
  std::vector<SourceFunction> functions;
};

void printAST(CXCursor cursor, const std::string &filePath, unsigned int depth = 0);
void getLoopBodyLines(CXCursor cursor, std::vector<unsigned int> &bodyLines);
void getLoops(CXCursor cursor, const std::string &filePath, std::vector<LoopData> &loops);
void getFunctions(CXCursor cursor, const std::string &filePath, std::vector<SourceFunction> &functions);
SourceCodeData parseSourceCode(const std::string &filePath);