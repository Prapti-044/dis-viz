import { Expose, Type } from "class-transformer";

export class Instruction {
    @Expose() instruction: string;
    @Expose() address: number;

    constructor(instruction: string, address: number) {
        this.instruction = instruction
        this.address = address
    }

    from(json_data: {instruction: string; address: number}) {
        return new Instruction(json_data.instruction, json_data.address)
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

export class InstructionBlock extends AddressRange {
    @Expose() block_number: number
    @Type(() => Instruction)
    @Expose() instructions: Instruction[]
    @Expose() function_name: string

    constructor(block_number: number, instructions: Instruction[], function_name: string, start_address: number, end_address: number, n_instructions: number) {
        super(start_address, end_address, n_instructions)
        this.block_number = block_number
        this.instructions = instructions
        this.function_name = function_name
    }

}


export class BlockLink {
    @Expose() source: number
    @Expose() target: number

    constructor(source: number, target: number) {
        this.source = source
        this.target = target
    }

    getBlockFromNumber(blocks: InstructionBlock[]) {
        return {
            source: blocks.find(block => block.block_number === this.source),
            target: blocks.find(block => block.block_number === this.source),
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



enum BlockFlag {
    MEMREAD,
    MEMWRITE,
    CALL,
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
    @Expose() blocks: number[]
    @Expose() backedges: {'start_address':number, 'end_address': number}[]
    @Type(() => Loop)
    @Expose() loops: Loop[] | null
    @Expose() name: string

    constructor(blocks: number[], backedges: {'start_address':number, 'end_address': number}[], loops: Loop[] | null, name: string) {
        this.blocks = blocks
        this.backedges = backedges
        this.loops = loops
        this.name = name
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

export type SourceSelection = {
    start: number,
    end: number,
    id: number
}

export type SourceViewData = {
    file_name: string,
    lineSelection: {
        start_line: number,
        end_line: number,
    } | null
    opened: boolean
}

export type DyninstInfo = {
    line_correspondence: LineCorrespondence[],
    functions: Function[]
}