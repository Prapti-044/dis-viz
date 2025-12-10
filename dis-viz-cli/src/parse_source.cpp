#include "include/parse_source.hpp"
#include <iostream>
#include <vector>

// Function to print the AST recursively
void printAST(CXCursor cursor, const std::string &filePath, unsigned int depth) {
  CXSourceLocation location = clang_getCursorLocation(cursor);

  CXString cursorKind =
      clang_getCursorKindSpelling(clang_getCursorKind(cursor));
  CXString cursorSpelling = clang_getCursorSpelling(cursor);

  unsigned int line, column;
  CXFile file;
  clang_getSpellingLocation(location, &file, &line, &column, nullptr);
  auto fileNameStr = std::string();

  if (file) {
    fileNameStr = clang_getCString(clang_getFileName(file));

    if (fileNameStr != filePath)
      return;
  }

  clang_disposeString(cursorKind);
  clang_disposeString(cursorSpelling);

  // Recursively print children
  struct VisitorData {
    const std::string &filePath;
    unsigned int depth;
  };

  VisitorData data{filePath, depth};

  clang_visitChildren(
      cursor,
      [](CXCursor c, CXCursor parent,
         CXClientData client_data) -> CXChildVisitResult {
        auto *data = static_cast<VisitorData *>(client_data);
        printAST(c, data->filePath, data->depth + 1);
        return CXChildVisit_Continue;
      },
      &data);
}

void getLoopBodyLines(CXCursor cursor, std::set<unsigned int> &bodyLines) {
  auto location = clang_getCursorLocation(cursor);
  unsigned int line, column;
  CXFile file;
  clang_getSpellingLocation(location, &file, &line, &column, nullptr);

  bodyLines.insert(line);

  clang_visitChildren(
      cursor,
      [](CXCursor c, CXCursor parent,
         CXClientData client_data) -> CXChildVisitResult {
        auto *lines = static_cast<std::set<unsigned int>*>(client_data);
        getLoopBodyLines(c, *lines);
        return CXChildVisit_Continue;
      },
      &bodyLines);
}

void getLoops(CXCursor cursor, const std::string &filePath, std::vector<LoopData> &loops) {
  auto location = clang_getCursorLocation(cursor);
  auto kind = clang_getCursorKind(cursor);
  auto cursorKind = clang_getCursorKindSpelling(kind);
  auto cursorSpelling = clang_getCursorSpelling(cursor);

  unsigned int line, column;
  CXFile file;
  clang_getSpellingLocation(location, &file, &line, &column, nullptr);
  auto fileNameStr = std::string();
  if (file) {
    fileNameStr = clang_getCString(clang_getFileName(file));

    if (fileNameStr != filePath)
      return;
  }
  
  if (kind == CXCursor_ForStmt || kind == CXCursor_WhileStmt || kind == CXCursor_DoStmt) {
    loops.push_back(LoopData{line, std::set<unsigned int>()});
    getLoopBodyLines(cursor, loops.back().bodyLines);
    loops.back().bodyLines.erase(line);
  }

  clang_disposeString(cursorKind);
  clang_disposeString(cursorSpelling);

  struct LoopVisitorData {
    const std::string& filePath;
    std::vector<LoopData>& loops;
  };

  LoopVisitorData visitorData{filePath, loops};

  clang_visitChildren(
      cursor,
      [](CXCursor c, CXCursor parent,
         CXClientData client_data) -> CXChildVisitResult {
        auto* data = static_cast<LoopVisitorData*>(client_data);
        getLoops(c, data->filePath, data->loops);
        return CXChildVisit_Continue;
      },
      &visitorData);
}

void getFunctions(CXCursor cursor, const std::string &filePath, std::vector<SourceFunction> &functions) {
  auto location = clang_getCursorLocation(cursor);
  auto kind = clang_getCursorKind(cursor);

  unsigned int line, column;
  CXFile file;
  clang_getSpellingLocation(location, &file, &line, &column, nullptr);
  auto fileNameStr = std::string();
  if (file) {
    fileNameStr = clang_getCString(clang_getFileName(file));

    if (fileNameStr != filePath)
      return;
  }
  
  // Check if this is a function declaration or definition
  // Include constructors, destructors, methods, and regular functions
  if (kind == CXCursor_FunctionDecl || 
      kind == CXCursor_CXXMethod || 
      kind == CXCursor_Constructor ||
      kind == CXCursor_Destructor ||
      kind == CXCursor_FunctionTemplate) {
    CXString funcName = clang_getCursorSpelling(cursor);
    CXType returnType = clang_getCursorResultType(cursor);
    CXString returnTypeStr = clang_getTypeSpelling(returnType);
    
    SourceFunction func;
    func.line = line;
    func.name = clang_getCString(funcName);
    
    // For constructors and destructors, return type might be invalid
    std::string returnTypeString = clang_getCString(returnTypeStr);
    if (kind == CXCursor_Constructor) {
      func.returnType = "<constructor>";
    } else if (kind == CXCursor_Destructor) {
      func.returnType = "<destructor>";
    } else if (returnTypeString.empty() || returnTypeString == "Invalid") {
      func.returnType = "void";
    } else {
      func.returnType = returnTypeString;
    }
    
    // Get function parameters
    int numArgs = clang_Cursor_getNumArguments(cursor);
    for (int i = 0; i < numArgs; i++) {
      CXCursor argCursor = clang_Cursor_getArgument(cursor, i);
      CXString argName = clang_getCursorSpelling(argCursor);
      CXType argType = clang_getCursorType(argCursor);
      CXString argTypeStr = clang_getTypeSpelling(argType);
      
      SourceFunctionParam param;
      param.name = clang_getCString(argName);
      param.type = clang_getCString(argTypeStr);
      
      func.parameters.push_back(param);
      
      clang_disposeString(argName);
      clang_disposeString(argTypeStr);
    }
    
    functions.push_back(func);
    
    clang_disposeString(funcName);
    clang_disposeString(returnTypeStr);
  }

  struct FunctionVisitorData {
    const std::string& filePath;
    std::vector<SourceFunction>& functions;
  };

  FunctionVisitorData visitorData{filePath, functions};

  clang_visitChildren(
      cursor,
      [](CXCursor c, CXCursor parent,
         CXClientData client_data) -> CXChildVisitResult {
        auto* data = static_cast<FunctionVisitorData*>(client_data);
        getFunctions(c, data->filePath, data->functions);
        return CXChildVisit_Continue;
      },
      &visitorData);
}

SourceCodeData parseSourceCode(const std::string &filePath) {
  CXIndex index = clang_createIndex(0, 0);

  // Parse the source code from file
  CXTranslationUnit translationUnit = clang_parseTranslationUnit(
      index, filePath.c_str(), nullptr, 0, nullptr, 0, CXTranslationUnit_None);

  if (!translationUnit) {
    std::cerr << "Failed to parse the translation unit." << std::endl;
    return SourceCodeData();
  }

  CXCursor rootCursor = clang_getTranslationUnitCursor(translationUnit);

  // printAST(rootCursor, filePath, 0);
  std::vector<LoopData> loops;
  std::vector<SourceFunction> functions;
  getLoops(rootCursor, filePath, loops);
  getFunctions(rootCursor, filePath, functions);
  
  clang_disposeTranslationUnit(translationUnit);
  clang_disposeIndex(index);

  return SourceCodeData{loops, functions};
}