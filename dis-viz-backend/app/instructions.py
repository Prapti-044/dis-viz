from dataclasses import dataclass, field
from enum import Enum, auto

@dataclass
class VariableLocation:
    location: str
    start_address: int
    end_address: int

@dataclass
class Variable:
    name: str
    source_file: str
    source_line: int
    locations: list[VariableLocation]


@dataclass
class SourceLine:
    line: str
    addresses: list[int]

@dataclass
class SourceFile:
    lines: list[SourceLine]

@dataclass
class Instruction:
    address: int
    instruction: str
    correspondence: dict[str,list[int]] # { source_file: [line_number] }
    variables: list[Variable]

@dataclass
class AddressRange:
    start_address: int = field(init=False)
    end_address: int = field(init=False)
    n_instructions: int = field(init=False)

    def __len__(self):
        return self.n_instructions

@dataclass
class Hidable:
    name: str
    start_address: int
    end_address: int

@dataclass
class InstructionBlock(AddressRange):
    name: str
    function_name: str
    instructions: list[Instruction]
    loop_indents: int = field(init=False)

    hidables: list[Hidable] = field(init=False)
    next_block_numbers: list[str] = field(init=False)
    start_address: int = field(init=False)
    end_address: int = field(init=False)
    n_instructions: int = field(init=False)


    def __post_init__(self):
        self.start_address = min(instruction.address for instruction in self.instructions)
        self.end_address = max(instruction.address for instruction in self.instructions)
        self.n_instructions = len(self.instructions)
        self.next_block_numbers = []
        self.hidables = []
        self.loop_indents = 0

@dataclass
class BlockLink:
    source: str
    target: str

    def get_block_from_number(self, blocks: list[InstructionBlock]):
        return {
            'source': next(block for block in blocks if block.name == self.source),
            'target': next(block for block in blocks if block.name == self.target),
        }


@dataclass
class BlockPage(AddressRange):
    blocks: list[InstructionBlock]
    page_no: int
    is_last: bool = False
    
    def __post_init__(self):
        self.start_address = min(block.instructions[0].address for block in self.blocks if len(block.instructions) > 0)
        self.end_address = max(block.instructions[-1].address for block in self.blocks if len(block.instructions) > 0)
        self.n_instructions = sum([len(block) for block in self.blocks])


@dataclass
class LineCorrespondence:
    source_file: str
    source_line: int

    start_address: int
    end_address: int

class BlockFlag(Enum):
    MEMREAD = auto()
    MEMWRITE = auto()
    CALL = auto()

@dataclass
class Loop:
    blocks: list[str]
    backedges: list[dict[str, int]]
    loops: list['Loop'] | None
    name: str


@dataclass
class Function:
    name: str
    variables: list[Variable]
    loops: list[Loop]
    hidables: list[Hidable]