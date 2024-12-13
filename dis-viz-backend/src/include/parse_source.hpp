#pragma once
#include <clang-c/Index.h>
#include <string>
#include <set>
#include <vector>

struct LoopData {
  unsigned int line;
  std::set<unsigned int> bodyLines;
};

struct SourceCodeData {
  std::vector<LoopData> loops;
};

void printAST(CXCursor cursor, const std::string &filePath, unsigned int depth = 0);
void getLoopBodyLines(CXCursor cursor, std::vector<unsigned int> &bodyLines);
void getLoops(CXCursor cursor, const std::string &filePath, std::vector<LoopData> &loops);
SourceCodeData parseSourceCode(const std::string &filePath);