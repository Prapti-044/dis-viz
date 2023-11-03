import React from 'react'
import '../styles/disassemblyview.css'

// JSON: https://www.wikitable2json.com/#/API/GetByPage
import inteldocs from '../inteldocs.json'

import openInNewTabImage from "../assets/newtab.png";
import { useAppSelector, useAppDispatch } from '../app/hooks';

import { Instruction, DisassemblyLineSelection, InstructionBlock, BLOCK_ORDERS } from '../types'
import { disLineToId, MAX_FN_SIZE, shortenName } from '../utils'
import { addDisassemblyView } from '../features/selections/selectionsSlice';
import * as api from "../api";
import { selectBinaryFilePath } from '../features/binary-data/binaryDataSlice';

function DisassemblyLine({ block, instruction, isHighlighted, mouseEvents, isSelecting, onGoingSelection, color, disId, isHidable, blockOrder }: {
    block: InstructionBlock,
    instruction: Instruction,
    isHighlighted: boolean,
    mouseEvents: {
        onMouseDown: (lineNumber: number) => void
        onMouseOver: (lineNumber: number) => void
        onMouseUp: (lineNumber: number) => void
    },
    isSelecting: boolean,
    onGoingSelection: DisassemblyLineSelection | null,
    color: string,
    disId: number,
    isHidable: boolean,
    blockOrder: BLOCK_ORDERS,
}) {

    const dispatch = useAppDispatch();
    const binaryFilePath = useAppSelector(selectBinaryFilePath)

    const [showDoc, setShowDoc] = React.useState(false)

    let instruction_address = instruction.address.toString(16).toUpperCase();
    while (instruction_address.length < 4)
        instruction_address = '0' + instruction_address;

    let selectionStyle: { [style: string]: string } = { display: "block", userSelect: "none" }
    if (isHighlighted) {
        selectionStyle.backgroundColor = color;
        selectionStyle.border = "1px solid grey";
        selectionStyle.cursor = "pointer";
    }
    if (isSelecting && instruction.address >= onGoingSelection!.start_address && instruction.address <= onGoingSelection!.end_address) {
        selectionStyle.backgroundColor = "#eee";
        selectionStyle.border = "1px solid grey";
        selectionStyle.cursor = "pointer";
    }

    function parseInstruction(instruction: Instruction, block: InstructionBlock) {
        const tokens = instruction.instruction.split(/([ ,])/g);

        const parsedTokens = tokens.map((token, i) => {
            // The opcode
            if (i === 0) {
                const doc = inteldocs.find(doc => doc["Instruction"] == token.toUpperCase())
                return <span key={instruction.address.toString(16) + "id" + i}>
                    <mark key={i} data-type="mnemonic"
                        onMouseEnter={() => setShowDoc(true)}
                        onMouseLeave={() => setShowDoc(false)}
                    >{token}</mark>
                </span>
            }

            let title = "";
            function addToTitle(val: string) {
                if (val === "") return title
                if (title == "") title = val
                else title += " || " + val
                return title
            }

            // Last token and this is the last instruction of the block
            if (i === tokens.length - 1
                // && block.next_block_numbers.length !== 0 
                && block.instructions[block.instructions.length - 1].address === instruction.address
            ) {
                let nextAddress: number | null = null;
                if (token.startsWith("0x") && token.endsWith("(%rip)")) {
                    const value = token.slice(2).split('(')[0]
                    let finalValue = parseInt(value, 16);
                    if (value.length == 8 && Array.from('89abcdefABCDEF').some(startVal => value.startsWith(startVal))) {
                        let bigNumber = '1'
                        for (let i = 0; i < value.length; i++) bigNumber += '0';
                        finalValue = -parseInt(bigNumber, 16) + parseInt(value, 16)
                    }
                    nextAddress = instruction.address + finalValue
                }
                addToTitle(nextAddress ? "0x" + nextAddress.toString(16).toUpperCase() : "")

                const nextBlock = block.next_block_numbers[0]
                if (nextBlock)
                    return <mark key={i} data-type="jump" data-blockname={shortenName(nextBlock, MAX_FN_SIZE)} title={title}>{token}
                        {/* Set background image of the button with styling */}
                    </mark>
            }

            let variableMarking: React.ReactElement | null = null;

            instruction.variables !== undefined && instruction.variables.forEach(variable => {
                variable.locations.forEach(location => {
                    if (token === location.location) {
                        const regName = '(' + token.split('(')[1]
                        if (Array.from('89abcdefABCDEF').some(startVal => token.startsWith('0x' + startVal))) {
                            const offsetNumber = token.slice(2).split('(')[0]
                            let bigNumber = '1'
                            for (let i = 0; i < offsetNumber.length; i++) bigNumber += '0';
                            const complementNumber = parseInt(bigNumber, 16) - parseInt(offsetNumber, 16)
                            addToTitle('-' + complementNumber.toString() + regName)
                        }
                        else {
                            addToTitle(parseInt(token.slice(3), 16).toString() + regName)
                        }
                        variableMarking = <mark key={i} data-type="variable" data-varname={variable.name} title={title}>{token}</mark>
                        return
                    }
                })
                if (variableMarking) return
            })
            if (variableMarking) return variableMarking

            if ((token.startsWith('%') && token.length === 4) || (token.startsWith('(') && token.endsWith(')') && token[1] === '%' && token.length === 6)) {
                return <mark key={i} data-type="register">{token}</mark>
            }

            if (token.startsWith('$0x')) {
                // https://stackoverflow.com/questions/33629416/how-to-tell-if-hex-value-is-negative
                if (Array.from('89abcdefABCDEF').some(startVal => token.startsWith('$0x' + startVal))) {
                    const offsetNumber = token.slice(3)
                    let bigNumber = '1'
                    for (let i = 0; i < offsetNumber.length; i++) bigNumber += '0';
                    const complementNumber = parseInt(bigNumber, 16) - parseInt(offsetNumber, 16)
                    addToTitle('-' + complementNumber.toString())
                }
                else {
                    addToTitle(parseInt(token.slice(3), 16).toString())
                }
                return <span key={i} className="hex-number" title={title}>{token}</span>
            }

            if (token.startsWith('0x') && token.endsWith(')') && token.length > 6 && token[token.length - 5] === '%' && token[token.length - 6] === '(') {
                if (Array.from('89abcdefABCDEF').some(startVal => token.startsWith('0x' + startVal))) {
                    const offsetNumber = token.slice(2, token.length - 6)
                    let bigNumber = '1'
                    for (let i = 0; i < offsetNumber.length; i++) bigNumber += '0';
                    const complementNumber = parseInt(bigNumber, 16) - parseInt(offsetNumber, 16)
                    addToTitle('-' + complementNumber.toString() + token.slice(token.length - 6))
                }
                else {
                    addToTitle(parseInt(token.slice(2, token.length - 6), 16).toString() + token.slice(token.length - 6))
                }
                return <span key={i} className="hex-number" title={title}>{token}</span>
            }

            return token
        })
        return parsedTokens;
    }

    const parsedTokens = parseInstruction(instruction, block)

    return <div
        id={disLineToId(disId, instruction.address)}
        className={"assemblycode" + ((instruction.correspondence !== undefined && Object.keys(instruction.correspondence).length !== 0) ? " hoverable" : "")}
    >
        {/* {isHidable ? <span className="hidablegutter"></span> : <></>} */}
        <code
            style={{ textAlign: 'left', color: 'black', ...selectionStyle }}
            onMouseDown={(instruction.correspondence !== undefined && Object.keys(instruction.correspondence).length !== 0) ? () => { mouseEvents.onMouseDown(instruction.address) } : () => { }}
            onMouseOver={(instruction.correspondence !== undefined && Object.keys(instruction.correspondence).length !== 0) ? () => { mouseEvents.onMouseOver(instruction.address) } : () => { }}
            onMouseUp={(instruction.correspondence !== undefined && Object.keys(instruction.correspondence).length !== 0) ? () => { mouseEvents.onMouseUp(instruction.address) } : () => { }}
        >

            <span style={{ color: 'grey' }}>0x{instruction_address}</span>:{" "}

            {parsedTokens}
        </code>
    </div>
}

export default DisassemblyLine
