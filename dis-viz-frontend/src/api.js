import { getUrls } from './config'

const apiURL = getUrls().backend + '/'

export async function openExe(filepath) {
    const response = await fetch(
        apiURL + "open", {
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

export async function getSourceFiles(filepath) {
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
    return result.map(d => d.file);
}

export async function getSourceLines(sourceFile) {
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

export async function getDisassembly(filepath) {
    const response = await fetch(
        apiURL + "getdisassembly", {
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

export async function getDisassemblyDot(filepath) {
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
    return result.dot;
}

export async function getDyninstInfo(filepath) {
    const response = await fetch(
        apiURL + "getdyninstinfo", {
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

export async function getBinaryList() {
    const response = await fetch(apiURL + "binarylist");
    const result = await response.json();
    return result.binarylist;
}