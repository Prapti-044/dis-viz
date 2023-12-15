#include <iostream>
#include <string>
#include <regex>
#include <unordered_map>
#include <vector>

#include <CodeObject.h>
#include <InstructionDecoder.h>
#include <Symtab.h>

using std::set, std::vector, std::string, std::unordered_map, std::ifstream, std::stringstream, std::unique_ptr, std::cout, std::endl, std::make_unique;

namespace InstructionAPI = Dyninst::InstructionAPI;
namespace ParseAPI = Dyninst::ParseAPI;
namespace SymtabAPI = Dyninst::SymtabAPI;

// Helper function
string print_clean_string(const string &str) {
  static std::regex pattern("[^a-zA-Z0-9 /:;,\\.{}\\[\\]<>~|\\-_+()&\\*=$!#]");
  return regex_replace(str, pattern, "?");
}

// Helper function
string block_to_name(const ParseAPI::Function *fn, const ParseAPI::Block *block,
                     const int cur_id) {
  return print_clean_string(fn->name() + ": B" + Dyninst::itos(cur_id));
}

// Loops through each loop and prints the backedges
void printBackedges(unordered_map<const ParseAPI::Block *, string> &block_ids,
                    ParseAPI::LoopTreeNode &lt) {
  if (lt.loop) {
    auto backedges = vector<ParseAPI::Edge *>();
    auto blocks = vector<ParseAPI::Block *>();
    lt.loop->getBackEdges(backedges);
    lt.loop->getLoopBasicBlocks(blocks);

    // cout << "Loop " << lt.name() << endl;

    // print all block id from blocks
    // cout << "Blocks: " << endl;
    // for (auto &b : blocks) {
    //   cout << "    " << block_ids[b] << endl;
    // }

    // print loop entry and latch block
    vector<ParseAPI::Block *> loop_entry_blocks;
    lt.loop->getLoopEntries(loop_entry_blocks);
    // for (auto &b : loop_entry_blocks) {
    //   cout << "  Entry: " << block_ids[b] << endl;
    // }
    if(loop_entry_blocks.size() > 1) {
      cout << "  Entry: " << block_ids[loop_entry_blocks[0]] << endl;
    }

    // // print backedges
    // for (auto &e : backedges) {
    //   cout << "Backedge: " << block_ids[e->src()] << " -> "
    //             << block_ids[e->trg()] << endl;
    // }
  }
  for (auto &i : lt.children)
    printBackedges(block_ids, *i);

}

int main() {
  auto block_ids = unordered_map<const ParseAPI::Block *, string>();
  auto curr_block_id = 0;
  string filename = "test";

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

  // Prepare all the addresses.
  auto addresses = set<unsigned long>();
  for (const auto &f : funcs) {
    for (const auto &block : f->blocks()) {
      auto icur = block->start();
      auto iend = block->last();
      while (icur <= iend) {
        addresses.insert(icur);
        auto raw_insnptr =
            (const unsigned char *)f->isrc()->getPtrToInstruction(icur);
        auto instr = decoder.decode(raw_insnptr);
        icur += instr.size();
      }
    }
  }

  // Create basic block names
  for (const auto &f : funcs) {
    for (const auto &block : f->blocks()) {
      auto icur = block->start();
      auto iend = block->last();
      while (icur <= iend) {
        auto raw_insnptr =
            (const unsigned char *)f->isrc()->getPtrToInstruction(icur);
        auto instr = decoder.decode(raw_insnptr);
        icur += instr.size();
      }
      block_ids[block] = block_to_name(f, block, curr_block_id++);
    }
  }
  
  // print all blocks and their instructions
  // for (const auto &f : funcs) {
  //   for (const auto &block : f->blocks()) {
  //     cout << "Block: " << block_ids[block] << endl;
  //     auto icur = block->start();
  //     auto iend = block->last();
  //     while (icur <= iend) {
  //       auto raw_insnptr =
  //           (const unsigned char *)f->isrc()->getPtrToInstruction(icur);
  //       auto instr = decoder.decode(raw_insnptr);
  //       //print address
  //       cout << "  " << std::hex << icur << std::dec << ": ";
  //       cout << "  " << instr.format() << endl;
  //       icur += instr.size();
  //     }
  //     cout << endl;
  //   }
  // }

  // cout << endl;
  // cout << endl;
  // cout << endl;
  // cout << endl;
  // cout << "Loops" << endl;

  // Print backedges for each loop
  for (auto func : funcs) {
    auto lt = unique_ptr<ParseAPI::LoopTreeNode>(func->getLoopTree());
    if (lt) {
      printBackedges(block_ids, *lt);
    }
  }
}