import React from 'react'
import '../styles/disassemblyview.css'

import { Instruction, DisassemblyLineSelection, Variable } from '../types'

function DisassemblyLine({ instruction, isHighlighted, mouseEvents, isSelecting, onGoingSelection, color, variables }:{
    instruction: Instruction,
    isHighlighted: boolean,
    mouseEvents: {
        onMouseDown: (lineNumber: number) => void
        onMouseOver: (lineNumber: number) => void
        onMouseUp: (lineNumber: number) => void
    },
    isSelecting: boolean,
    onGoingSelection: DisassemblyLineSelection|null,
    color: string,
    variables: Variable[]
}) {



    let instruction_address = instruction.address.toString(16).toUpperCase();
    while (instruction_address.length < 4)
        instruction_address = '0' + instruction_address;

    let selectionStyle: {[style: string]: string} = { display: "block", userSelect: "none" }
    if(isHighlighted) {
        selectionStyle.backgroundColor = color;
        selectionStyle.border = "1px solid grey";
        selectionStyle.cursor = "pointer";
    }
    if(isSelecting && instruction.address >= onGoingSelection!.start_address && instruction.address <= onGoingSelection!.end_address) {
        selectionStyle.backgroundColor = "#eee";
        selectionStyle.border = "1px solid grey";
        selectionStyle.cursor = "pointer";
    }

    function parseInstruction(instruction: Instruction) {
        const tokens = instruction.instruction.split(/([ ,])/g);

        const parsedTokens = tokens.map((token, i) => {
            if (i === 0) {
                return <mark key={i} data-type="mnemonic">{token}</mark>
            }

            let variableMarking: React.ReactElement | null = null;

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

    const parsedTokens = parseInstruction(instruction)

    return <code
            style={{ textAlign: 'left', color: 'black', ...selectionStyle }}
            className={"assemblycode"+(Object.keys(instruction.correspondence).length!==0?" hoverable":"")}
            onMouseDown={Object.keys(instruction.correspondence).length!==0?() => {mouseEvents.onMouseDown(instruction.address)}:()=>{}}
            onMouseOver={Object.keys(instruction.correspondence).length!==0?() => {mouseEvents.onMouseOver(instruction.address)}:()=>{}}
            onMouseUp={Object.keys(instruction.correspondence).length!==0?() => {mouseEvents.onMouseUp(instruction.address)}:()=>{}}
        >

        <span style={{ color: 'grey'}}>0x{instruction_address}</span>:{" "}

        {parsedTokens}

    </code>
}

export default DisassemblyLine