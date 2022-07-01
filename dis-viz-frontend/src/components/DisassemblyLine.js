import React from 'react'
import '../styles/disassemblyview.css'

function DisassemblyLine({ instruction, selectedLines, mouseEvents, isSelecting, onGoingSelection, color, variables }) {



    let instruction_address = instruction.address.toString(16).toUpperCase();
    while (instruction_address.length < 4)
        instruction_address = '0' + instruction_address;

    let selectionStyle = { display: "block", userSelect: "none" }
    if(instruction.address >= selectedLines.start && instruction.address <= selectedLines.end) {
        selectionStyle.backgroundColor = color;
        selectionStyle.border = "1px solid grey";
        selectionStyle.cursor = "pointer";
    }
    if(isSelecting && instruction.address >= onGoingSelection.start && instruction.address <= onGoingSelection.end) {
        selectionStyle.backgroundColor = "#eee";
        selectionStyle.border = "1px solid grey";
        selectionStyle.cursor = "pointer";
    }

    function parseInstruction(instruction) {
        const tokens = instruction.split(/([ ,])/g);

        const parsedTokens = tokens.map((token, i) => {
            if (i === 0) {
                return <mark key={i} data-type="mnemonic">{token}</mark>
            }

            let variableMarking = null;

            variables.forEach(variable => {
                variable.locations.forEach(location => {
                    if (token === location.location) {
                        variableMarking = <mark key={i} data-type="variable" data-varname={variable.name}>{token}</mark>
                        return
                    }
                });
                if(variableMarking) return
            })
            if(variableMarking) return variableMarking

            if ((token.startsWith('%') && token.length === 4) || (token.startsWith('(') && token.endsWith(')') && token[1] === '%' && token.length === 6)) {
                return <mark key={i} data-type="register">{token}</mark>
            }

            if (token.startsWith('$0x')) {
                // https://stackoverflow.com/questions/33629416/how-to-tell-if-hex-value-is-negative
                if(Array.from('89abcdefABCDEF').some(startVal => token.startsWith('$0x'+startVal))) {
                    const offsetNumber = token.slice(3)
                    let bigNumber = '1'
                    for(let i = 0; i<offsetNumber.length; i++) bigNumber += '0';
                    const complementNumber = parseInt(bigNumber, 16) - parseInt(offsetNumber, 16)
                    return <span key={i} className="hex-number" title={'-'+complementNumber.toString()}>{token}</span>
                }
                else {
                    return <span key={i} className="hex-number" title={parseInt(token.slice(3), 16).toString()}>{token}</span>
                }
            }

            if (token.startsWith('0x') && token.endsWith(')') && token.length > 6 && token[token.length - 5] === '%' && token[token.length - 6] === '(') {
                if(Array.from('89abcdefABCDEF').some(startVal => token.startsWith('0x'+startVal))) {
                    const offsetNumber = token.slice(2, token.length-6)
                    let bigNumber = '1'
                    for(let i = 0; i<offsetNumber.length; i++) bigNumber += '0';
                    const complementNumber = parseInt(bigNumber, 16) - parseInt(offsetNumber, 16)
                    return <span key={i} className="hex-number" title={'-'+complementNumber.toString()+token.slice(token.length-6)}>{token}</span>
                }
                else {
                    return <span key={i} className="hex-number" title={parseInt(token.slice(2,token.length-6), 16).toString()+token.slice(token.length-6)}>{token}</span>
                }
            }

            return token
        })
        return parsedTokens;
    }

    const parsedTokens = parseInstruction(instruction.instruction)

    return <code
            style={{ textAlign: 'left', color: 'black', ...selectionStyle }}
            className="assemblycode"
            onMouseDown={() => {mouseEvents.onMouseDown(instruction.address)}}
            onMouseOver={() => {mouseEvents.onMouseOver(instruction.address)}}
            onMouseUp={() => {mouseEvents.onMouseUp(instruction.address)}}
        >

        <span style={{ color: 'grey'}}>0x{instruction_address}</span>:{" "}

        {parsedTokens}

        {/* {instruction.instruction.split(' ').map((word, i) => <span key={i} style={{
                fontStyle: i===0?'italic':'bold',
                color: i===0?'maroon':'black'
            }}>{word} </span>)} */}
    </code>
}

export default DisassemblyLine