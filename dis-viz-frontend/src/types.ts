import 'reflect-metadata' // Import needed for class-transformer
import { Expose, Type } from "class-transformer";


export type BLOCK_ORDERS = 'memory_order' | 'loop_order'

export type SRC_LINE_TAG = 'VECTORIZED' | 'INLINE' | 'NO_TAG'

export class SourceLine {
    @Expose() line: string;
    @Expose() addresses: { [binaryFilePath: string]: number[] };
    @Expose() tags: { [binaryFilePath: string]: SRC_LINE_TAG[] };

    constructor(line: string, addresses: { [binaryFilePath: string]: number[] }, tags: { [binaryFilePath: string]: SRC_LINE_TAG[] }) {
        this.line = line
        this.addresses = addresses
        this.tags = tags
    }
}

export class SourceFile {
    @Expose() lines: SourceLine[];

    constructor(lines: SourceLine[]) {
        this.lines = lines
    }
}

export type InstructionFlag = 
    "INST_VECTORIZED" |
    "INST_MEMORY_READ" |
    "INST_MEMORY_WRITE" |
    "INST_CALL" |
    "INST_SYSCALL" |
    "INST_FP"

export class Instruction {
    @Expose() instruction: string
    @Expose() address: number
    @Expose() variables: Variable[]
    @Expose() correspondence: {
        [source_file: string]: number[]
    }
    @Expose() flags: InstructionFlag[] = []

    constructor(instruction: string, address: number, variables: Variable[] = [], correspondence: { [source_file: string]: number[] } = {}, flags: InstructionFlag[] = []) {
        this.instruction = instruction
        this.address = address
        this.variables = variables === undefined ? [] : variables
        this.correspondence = correspondence === undefined ? {} : correspondence
        this.flags = flags === undefined ? [] : flags
    }
}

export class AddressRange {
    @Expose() start_address: number
    @Expose() end_address: number
    @Expose() n_instructions: number

    constructor(start_address: number, end_address: number, n_instructions: number) {
        this.start_address = start_address
        this.end_address = end_address
        this.n_instructions = n_instructions
    }

    get length(): number {
        return this.n_instructions
    }
}

export class Hidable {
    @Expose() name: string
    @Expose() start_address: number
    @Expose() end_address: number

    constructor(name: string, start_address: number, end_address: number) {
        this.name = name
        this.start_address = start_address
        this.end_address = end_address
    }
}


export class InstructionBlock extends AddressRange {
    @Expose() name: string
    @Type(() => Instruction)
    @Expose() instructions: Instruction[]
    @Expose() function_name: string
    @Expose() next_block_numbers: string[]
    @Expose() hidables: Hidable[]
    @Expose() loops: {
        name: string,
        loop_count: number,
        loop_total: number,
    }[]
    @Expose() block_type: "pseudoloop" | "normal"
    @Expose() backedges: string[]
    @Expose() is_loop_header: boolean = false

    constructor(name: string, instructions: Instruction[], function_name: string, start_address: number, end_address: number, n_instructions: number, next_block_numbers: string[], hidables: Hidable[], loops: { name: string, loop_count: number, loop_total: number }[], block_type: "pseudoloop" | "normal", backedges: string[], is_loop_header: boolean = false) {
        super(start_address, end_address, n_instructions)
        this.name = name
        this.instructions = instructions
        this.function_name = function_name
        this.next_block_numbers = next_block_numbers
        this.hidables = hidables === undefined ? [] : hidables
        this.loops = loops === undefined ? [] : loops
        this.block_type = block_type
        this.backedges = backedges === undefined ? [] : backedges
        this.is_loop_header = is_loop_header
    }

}


export class BlockLink {
    @Expose() source: string
    @Expose() target: string

    constructor(source: string, target: string) {
        this.source = source
        this.target = target
    }

    getBlockFromNumber(blocks: InstructionBlock[]) {
        return {
            source: blocks.find(block => block.name === this.source),
            target: blocks.find(block => block.name === this.source),
        }
    }
}

export class BlockPage extends AddressRange {
    @Type(() => InstructionBlock)
    @Expose() blocks: InstructionBlock[]
    @Expose() page_no: number
    @Expose() is_last: boolean

    constructor(blocks: InstructionBlock[], page_no: number, is_last: boolean = false, start_address: number, end_address: number, n_instructions: number) {
        super(start_address, end_address, n_instructions)
        this.blocks = blocks
        this.page_no = page_no
        this.is_last = is_last
    }
}


export class LineCorrespondence extends AddressRange {
    @Expose() source_file: string
    @Expose() source_line: number

    constructor(source_file: string, source_line: number, start_address: number, end_address: number, n_instructions: number) {
        super(start_address, end_address, n_instructions)
        this.source_file = source_file
        this.source_line = source_line
    }
}

export class VariableLocation extends AddressRange{
    @Expose() location: string

    constructor(location: string, start_address: number, end_address: number, n_instructions: number) {
        super(start_address, end_address, n_instructions)
        this.location = location
    }
}

export class Variable {
    @Expose() name: string
    @Expose() source_file: string
    @Expose() source_line: number
    @Type(() => VariableLocation)
    @Expose() locations: VariableLocation[]


	constructor(name: string, source_file: string, source_line: number, locations: VariableLocation[]) {
        this.name = name
        this.source_file = source_file
        this.source_line = source_line
        this.locations = locations
	}

}


export class Loop {
    @Expose() blocks: string[]
    @Expose() backedges: {'start_address':number, 'end_address': number}[]
    @Type(() => Loop)
    @Expose() loops: Loop[] | null
    @Expose() name: string

    constructor(blocks: string[], backedges: {'start_address':number, 'end_address': number}[], loops: Loop[] | null, name: string) {
        this.blocks = blocks
        this.backedges = backedges
        this.loops = loops
        this.name = name
    }
}

export class Function {
    @Expose() name: string
    @Type(() => Variable)
    @Expose() variables: Variable[]
    @Type(() => Loop)
    @Expose() loops: Loop[]
    @Type(() => Hidable)
    @Expose() hidables: Hidable[]

    constructor( name: string, variables: Variable[], loops: Loop[], hidables: Hidable[]) {
        this.name = name
        this.variables = variables
        this.loops = loops
        this.hidables = hidables
    }
}

export type DisassemblyLineSelection = {
    start_address: number, end_address: number
}

export type SourceLineSelection = {
    start: number,
    end: number,
    disassemblyViewId: number|null
}

export type SourceViewData = {
    file_name: string,
    lineSelections: SourceLineSelection[]
    status: "opened" | "closed"
}

export type DyninstInfo = {
    line_correspondence: LineCorrespondence[],
    functions: Function[]
}
