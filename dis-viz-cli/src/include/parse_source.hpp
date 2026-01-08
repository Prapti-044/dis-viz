#pragma once
#include <clang-c/Index.h>
#include <string>
#include <set>
#include <vector>

struct LoopData {
  unsigned int line; // 1-based line number from Clang
  std::set<unsigned int> bodyLines; // 1-based line numbers from Clang
};

struct SourceFunctionParam {
  std::string type;
  std::string name;
};

struct SourceFunction {
  unsigned int line; // 1-based line number from Clang
  std::string name;           // Simple function name (e.g., "runSeqVariant")
  std::string className;      // Class name if member function (e.g., "LTIMES"), empty for free functions
  std::string qualifiedName;  // Fully qualified name including namespaces (e.g., "rajaperf::apps::LTIMES::runSeqVariant")
  std::string returnType;
  std::vector<SourceFunctionParam> parameters;
  bool isTemplateSpecialization = false;  // True if this is an explicit template specialization
  bool isPrimaryTemplate = false;         // True if this is a function template (not an instantiation)
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