import { getUrls } from './config'
import { plainToInstance } from 'class-transformer';
import { BlockPage, SourceFile, InstructionBlock, BLOCK_ORDERS } from './types'
import { MinimapType } from './features/minimap/minimapSlice';



const apiURL = getUrls().backend + '/api/'

export async function getSourceFiles(filepath: string) : Promise<string[]> {
    const response = await fetch(
        apiURL + "sourcefiles", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({path:filepath}),
        }
    );
    const result = await response.json();
    return result.map((d: {'file': string}) => d.file);
}

export async function getMinimapData(filepath: string, order: BLOCK_ORDERS) : Promise<MinimapType> {
    const response = await fetch(
        apiURL + "getminimapdata/" + order, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({path:filepath}),
        }
    );
    const result = await response.json();

    return {
        blockHeights: result.block_heights,
        builtInBlock: result.built_in_block,
        blockStartAddress: result.block_start_address,
        blockLoopIndents: result.block_loop_indents,
        blockTypes: result.block_types,
    };
}

export async function getAddressRange(filepath: string) : Promise<{start: number, end: number}> {
    const response = await fetch(
        apiURL + "addressrange", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({path:filepath}),
        }
    );
    const result = await response.json();
    return result;
}

export async function getSourceLines(binaryFile: string, sourceFile: string): Promise<SourceFile> {
    const response = await fetch(
        apiURL + "getsourcefile", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({filepath: {path:sourceFile}, binary_file_path: {path:binaryFile}}),
        }
    );
    const result = await response.json();
    return result;
}

export async function getDisassemblyPage(filepath: string, pageNo: number, order: BLOCK_ORDERS): Promise<BlockPage> {
    const response = await fetch(
        apiURL + "getdisassemblypage/" + order + '/' + pageNo, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({path:filepath}),
        }
    );
    const result: Object = await response.json();
    const blockPage = await plainToInstance(BlockPage, result, { excludeExtraneousValues: true })
    return blockPage;
}

export async function getDisassemblyBlock(filepath: string, blockId: string, order: BLOCK_ORDERS): Promise<InstructionBlock> {
    const response = await fetch(
        apiURL + "getdisassemblyblockbyid/" + order, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                path: filepath,
                blockId: blockId,
            }),
        }
    );
    const result: Object = await response.json();
    const block = await plainToInstance(InstructionBlock, result, { excludeExtraneousValues: true })
    return block;
}

export async function getDisassemblyPageByAddress(filepath: string, startAddress: number, order: BLOCK_ORDERS): Promise<BlockPage> {
    const response = await fetch(
        apiURL + "getdisassemblypagebyaddress/" + order + "/" + startAddress, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({path:filepath}),
        }
    );
    const result: Object = await response.json();
    const blockPage = await plainToInstance(BlockPage, result, { excludeExtraneousValues: true })
    return blockPage;
}

export async function getDisassemblyDot(filepath: string): Promise<string>{
    const response = await fetch(
        apiURL + "getdisassemblydot", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({path:filepath}),
        }
    );
    const result = await response.json();
    return result.dot.dot;
}

export async function getBinaryList(): Promise<{
    executable_path: string,
    name: string
}[]>{
    const response = await fetch(apiURL + "binarylist");
    const result = await response.json();
    return result.binarylist;
}