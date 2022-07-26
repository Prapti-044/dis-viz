import { getUrls } from './config'
import { plainToInstance } from 'class-transformer';
import { BlockPage, LineCorrespondence, Function, DyninstInfo, DisassemblyLineSelection } from './types'



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

export async function getSourceLines(sourceFile: string): Promise<string[]> {
    const response = await fetch(
        apiURL + "getsourcefile", {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({path:sourceFile}),
        }
    );
    const result = await response.json();
    return result.result;
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

export async function getSourceCorresponding(filepath: string, source_file: string, start:number, end:number): Promise<DisassemblyLineSelection> {
    const response = await fetch(
        apiURL + "getsourcelinecorrespondence", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({filepath: {path: filepath}, sourceLine: {source_file, start, end}}),
        }
    );
    const result = await response.json();
    return result;
}

export async function getDisassemblyCorresponding(filepath: string, start_address:number, end_address:number): Promise<{
    source_file: string,
    start: number,
    end: number
}[]> {
    const response = await fetch(
        apiURL + "getdisassemblylinecorrespondence", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({start_address, end_address}),
        }
    );
    const result = await response.json();
    return result;
}