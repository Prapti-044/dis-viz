import React from 'react'
import '../styles/disassemblyview.css'

import openInNewTabImage from "../assets/newtab.png";
import { useAppSelector, useAppDispatch } from '../app/hooks';
import { selectBinaryHoverHighlight, clearHoverHighlight, setHoverHighlight } from '../features/selections/selectionsSlice';

import { Instruction, InstructionBlock, BLOCK_ORDERS } from '../types'
import { disLineToId, MAX_FN_SIZE, shortenName, findIntelDocs } from '../utils'
import { selectAllTagStates } from '../features/tags/tagsSlice'
import * as disvizProcessor from "../disvizProcessor";
import { INSTRUCTION_TAGS } from '../utils'
import useSelectionWithHistory from '../hooks/useSelectionWithHistory'


function isJumpInstruction(instr: string) {
    const doc = findIntelDocs(instr.toUpperCase());
    if (doc && doc["jumpable"]) return true;
    return false;
}

function DisassemblyLine({ binaryFilePath, block, instruction, isHighlighted, color, disId, isHidable, blockOrder, nextBlock }: {
    binaryFilePath: string,
    block: InstructionBlock,
    instruction: Instruction,
    isHighlighted: boolean,
    color: string,
    disId: number,
    isHidable: boolean,
    blockOrder: BLOCK_ORDERS,
    nextBlock: InstructionBlock | null
}) {

    const dispatch = useAppDispatch();
    const { setSelectionWithHistory } = useSelectionWithHistory();

    const [showDoc, setShowDoc] = React.useState(false)
    
    const enabledTags = useAppSelector(selectAllTagStates);

    let instruction_address = instruction.address.toString(16).toUpperCase();
    while (instruction_address.length < 4)
        instruction_address = '0' + instruction_address;

    let selectionStyle: { [style: string]: string } = { display: "block", userSelect: "none" }
    if (isHighlighted) {
        selectionStyle.backgroundColor = color;
        selectionStyle.border = "1px solid grey";
        selectionStyle.cursor = "pointer";
    }

    function setThisSelection() {
        const source = disvizProcessor.getSourceFromBinary(binaryFilePath, instruction.address)
        const source_selection = Object.entries(source).map(([source_file, lines]) => ({
            source_file,
            source_lines: lines
        }))
        setSelectionWithHistory({
            source_selection,
            binary_selection: [{
                binary_file: binaryFilePath,
                addresses: [instruction.address]
            }],
            origin: {
                type: 'disassembly',
                disassemblyId: disId,
                address: instruction.address,
            },
            details: {
                functionName: block.function_name,
                blockName: block.name,
            },
        })
    }

    function parseInstruction(instruction: Instruction, block: InstructionBlock) {
        const tokens = instruction.instruction.split(/([ ,])/g);

        const parsedTokens = tokens.map((token, i) => {
            // The opcode
            if (i === 0) {
                const doc = findIntelDocs(token);
                return <span key={"inteldocspan" + instruction.address.toString(16)}>
                    {showDoc && doc ? <div className="tooltipitem" key={"inteldocdiv" + instruction.address.toString(16)}>
                        {Object.entries(doc).map(([key, value]) => value ?
                            <p key={"inteldoc" + instruction.address.toString(16) + key} >
                                <b> {key} </b> : {value}
                            </p> : <></>)}
                    </div> : <></>}
                    <mark key={i} data-type="mnemonic"
                        onMouseEnter={() => setShowDoc(true)}
                        onMouseLeave={() => setShowDoc(false)}
                    >{token}</mark>
                </span>
            }

            let title = "";
            function addToTitle(val: string) {
                if (val === "") return title
                if (title === "") title = val
                else title += " || " + val
                return title
            }

            // Last token and this is the last instruction of the block
            if (i === tokens.length - 1
                && block.instructions[block.instructions.length - 1].address === instruction.address
            ) {
                let nextAddress: number | null = null;
                if (token.startsWith("0x") && token.endsWith("(%rip)")) {
                    const value = token.slice(2).split('(')[0]
                    let finalValue = parseInt(value, 16);
                    if (value.length === 8 && Array.from('89abcdefABCDEF').some(startVal => value.startsWith(startVal))) {
                        let bigNumber = '1'
                        for (let i = 0; i < value.length; i++) bigNumber += '0';
                        finalValue = -parseInt(bigNumber, 16) + parseInt(value, 16)
                    }
                    nextAddress = instruction.address + finalValue
                }
                addToTitle(nextAddress ? "0x" + nextAddress.toString(16).toUpperCase() : "")
                
                // const nextBlock = block.next_block_numbers[0]
                // if (block.next_block_numbers.length > 0 && block.next_block_numbers[0] === nextBlock?.name)
                //     if(block.next_block_numbers[1])
                //         return <mark key={i} data-type="jump" data-blockname={shortenName(block.next_block_numbers[1], MAX_FN_SIZE)} title={title}>

                const thisNextBlocks = block.next_block_numbers.filter(jmpNextBlock => block.next_block_numbers.length === 1 || (nextBlock && jmpNextBlock !== nextBlock.name))
                if (nextBlock && thisNextBlocks.length > 0 && isJumpInstruction(tokens[0]))
                    return <mark
                        key={"jump" + i}
                        data-type="jump"
                        data-blockname={thisNextBlocks.map(jmpNextBlock => shortenName(jmpNextBlock, MAX_FN_SIZE)).join(' | ')}
                        title={title}
                    > 
                        {/* {token} */}
                        
                        <button style={{
                            backgroundImage: `url(${openInNewTabImage})`,
                            border: "none",
                            backgroundSize: "contain",
                            backgroundRepeat: "no-repeat",
                            width: "18px",
                            height: "18px",
                            position: "relative",
                            top: "2px",
                            left: "5px",
                        }} onClick={() => {
                            const targetBlock = disvizProcessor.getDisassemblyBlock(binaryFilePath, block.next_block_numbers.filter(jmpNextBlock => jmpNextBlock !== nextBlock.name)[0], blockOrder)
                            const source = disvizProcessor.getSourceFromBinary(binaryFilePath, targetBlock.start_address)
                            const source_selection = Object.entries(source).map(([source_file, lines]) => ({
                                source_file,
                                source_lines: lines
                            }))
                            setSelectionWithHistory({
                                source_selection,
                                binary_selection: [{
                                    binary_file: binaryFilePath,
                                    addresses: [targetBlock.start_address]
                                }],
                                origin: {
                                    type: 'disassembly',
                                    disassemblyId: disId,
                                    address: targetBlock.start_address,
                                },
                                details: {
                                    functionName: targetBlock.function_name,
                                    blockName: targetBlock.name,
                                },
                            })
                        }} className="opennewbutton"> </button>
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
                        variableMarking = <mark key={"variable" + i} data-type="variable" data-varname={variable.name} title={title}>{token}</mark>
                        return
                    }
                })
                if (variableMarking) return
            })
            if (variableMarking) return variableMarking

            if ((token.startsWith('%') && token.length === 4) || (token.startsWith('(') && token.endsWith(')') && token[1] === '%' && token.length === 6)) {
                return <mark key={"register" + i} data-type="register">{token}</mark>
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
                return <span key={"hex-number" + i} className="hex-number" title={title}>{token}</span>
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
                return <span key={"hex-number" + i} className="hex-number" title={title}>{token}</span>
            }

            return token
        })
        return parsedTokens;
    }

    const parsedTokens = parseInstruction(instruction, block)
    
    // Add selector for hover state
    const binaryHoverHighlight = useAppSelector(selectBinaryHoverHighlight);
    const isMouseHovered = React.useMemo(() => {
        return binaryHoverHighlight?.some(highlight => 
            highlight.binary_file === binaryFilePath && 
            highlight.addresses.includes(instruction.address)
        );
    }, [binaryHoverHighlight, binaryFilePath, instruction.address]);
    
    const handleMouseOver = () => {
        const source = disvizProcessor.getSourceFromBinary(binaryFilePath, instruction.address)
        const source_selection = Object.entries(source).map(([source_file, lines]) => ({
            source_file,
            source_lines: lines
        }))
        dispatch(setHoverHighlight({
            source_hover_highlight: source_selection,
            binary_hover_highlight: [{
                binary_file: binaryFilePath,
                addresses: [instruction.address]
            }]
        }))
    }

    return <div
        key={disLineToId(disId, instruction.address)}
        id={disLineToId(disId, instruction.address)}
        className={"assemblycode" + (isMouseHovered ? " hover" : "")}
    >
        {isHidable ? <span className="hidablegutter"></span> : <></>}
        <code
            style={{ textAlign: 'left', color: 'black', ...selectionStyle }}
            onMouseLeave={() => {
                dispatch(clearHoverHighlight())
            }}
            onMouseOver={() => {
                handleMouseOver()
            }}
            onClick={() => {
                setThisSelection()
            }}
        >
            <span style={{ color: 'grey' }}>0x{instruction_address}</span>:{" "}
            {INSTRUCTION_TAGS.map(tag => (
                enabledTags[tag.id] && instruction.flags.includes(tag.id) ?
                    <span key={tag.id+instruction_address} className='disassembly-line-tag' style={{
                        border: `2px solid ${tag.borderColor}`,
                        color: tag.textColor,
                        backgroundColor: tag.color,
                        fontFamily: 'Roboto Condensed',
                        padding: '9px 4px',
                    }}>{tag.shortName}</span>
                : <></>
            ))}
            {parsedTokens}
        </code>
    </div>
}

export default DisassemblyLine
