const apiURL = "http://0.0.0.0:80/"
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

export async function getDisassembly() {
    const response = await fetch(apiURL + "getdisassembly");
    const result = await response.json();
    return result;
}

export async function getDisassemblyDot() {
    const response = await fetch(apiURL + "getdisassemblydot");
    const result = await response.json();
    return result.dot;
}