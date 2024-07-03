#include <iostream>
#include <string>
#include <regex>
#include <unordered_map>
#include <vector>

#include <CodeObject.h>
#include <InstructionDecoder.h>
#include <Symtab.h>

using std::vector, std::string, std::ifstream, std::stringstream, std::cout, std::endl, std::make_unique;

namespace InstructionAPI = Dyninst::InstructionAPI;
namespace ParseAPI = Dyninst::ParseAPI;
namespace SymtabAPI = Dyninst::SymtabAPI;

int main(int argc, char **argv) {

  if (argc != 2) {
    cout << "Usage: " << argv[0] << " <binary>" << endl;
    return 1;
  }

  string filename = argv[1];

  SymtabAPI::Symtab *symtab;
  SymtabAPI::Symtab::openFile(symtab, filename);
  auto sts = make_unique<ParseAPI::SymtabCodeSource>(const_cast<char *>(filename.c_str()));
  auto co = make_unique<ParseAPI::CodeObject>(sts.get());
  co->parse();

  auto funcs = co->funcs();

  // create an Instruction decoder
  auto anyfunc = *funcs.begin();
  auto decoder = InstructionAPI::InstructionDecoder(
      anyfunc->isrc()->getPtrToInstruction(anyfunc->addr()),
      InstructionAPI::InstructionDecoder::maxInstructionLength,
      anyfunc->region()->getArch());

  for (const auto &f : funcs) {
    for (const auto &block : f->blocks()) {
      auto icur = block->start();
      auto iend = block->last();
      while (icur <= iend) {
      auto raw_insnptr =
            (const unsigned char *)f->isrc()->getPtrToInstruction(icur);
        auto instr = decoder.decode(raw_insnptr);
        auto cur_lines = vector<SymtabAPI::Statement::Ptr>();
        symtab->getSourceLines(cur_lines, icur); // getSourceLines should give multiple source lines per instruction.
        for (const auto &line : cur_lines) {
          // 0x1234: push %rbp (main.cpp:10)
          auto sourcePath = line->getFile();
          auto sourceFile = sourcePath.substr(sourcePath.find_last_of("/") + 1);
          cout << "0x" << std::hex << icur << std::dec << ":" << 
          // instr.format() << 
          "\t(" << sourceFile << ":" << line->getLine() << ")" << endl;
        }
        icur += instr.size();
      }
    }
  }
}