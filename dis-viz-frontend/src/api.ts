import { getUrls } from './config'
import { plainToInstance } from 'class-transformer';
import { BlockPage, LineCorrespondence, Function, DyninstInfo, DisassemblyLineSelection, SourceFile } from './types'



const apiURL = getUrls().backend + '/'


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

export async function getDisassemblyPage(filepath: string, pageNo: number): Promise<BlockPage> {
    const response = await fetch(
        apiURL + "getdisassemblypage/" + pageNo, {
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

export async function getDisassemblyPageByAddress(filepath: string, startAddress: number): Promise<BlockPage> {
    const response = await fetch(
        apiURL + "getdisassemblypagebyaddress/" + startAddress, {
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

export async function getDyninstInfo(filepath: string): Promise<DyninstInfo>{
    const response = await fetch(
        apiURL + "getdyninstinfo", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({path:filepath}),
        }
    );
    const result: {'line_correspondence': Object[], 'functions': Object[]} = await response.json();
    

    return {
        line_correspondence: await plainToInstance(LineCorrespondence, result.line_correspondence, { excludeExtraneousValues: true }),
        functions: await plainToInstance(Function, result.functions, { excludeExtraneousValues: true }),
    }
}

export async function getBinaryList(): Promise<{
    executable_path: string,
    name: string
}[]>{
    const response = await fetch(apiURL + "binarylist");
    const result = await response.json();
    return result.binarylist;
}