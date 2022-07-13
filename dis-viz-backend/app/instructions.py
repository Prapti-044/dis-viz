
from dataclasses import dataclass, field
from typing import Protocol


class DisassemblyChunk(Protocol):
    start_address: int
    end_address: int
    n_instructions: int
    
    def __len__(self):
        return self.n_instructions
    
@dataclass
class Instruction:
    address: int
    instruction: str


@dataclass
class InstructionBlock(DisassemblyChunk):
    block_number: int
    function_name: str
    instructions: list[Instruction]

    n_instructions: int = field(init=False)
    start_address: int = field(init=False)
    end_address: int = field(init=False)

    def __post_init__(self):
        self.start_address = min(block.instructions[0].address for block in self.blocks if len(block.instructions) > 0)
        self.end_address = max(block.instructions[-1].address for block in self.blocks if len(block.instructions) > 0)
        self.n_instructions = len(block for block in self.blocks)

    def __len__(self):
        return self.n_instructions


@dataclass
class BlockPage:
    start_address: int = field(init=False)
    end_address: int = field(init=False)
    n_instructions: int = field(init=False)

    blocks: list[InstructionBlock]
    
    def __post_init__(self):
        self.start_address = min(block.instructions[0].address for block in self.blocks if len(block.instructions) > 0)
        self.end_address = max(block.instructions[-1].address for block in self.blocks if len(block.instructions) > 0)
        self.n_instructions = sum([len(block) for block in self.blocks])

    def __len__(self):
        return self.n_instructions