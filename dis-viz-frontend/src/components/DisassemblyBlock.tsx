import React from "react";
import { Card, ListGroup } from "react-bootstrap";
import { DisIdSelections, setDisassemblyLineSelection } from "../features/selections/selectionsSlice";
import { BlockPage, DisassemblyLineSelection, InstructionBlock } from "../types";
import { MAX_FN_SIZE, codeColors } from "../utils";
import DisassemblyLine from "./DisassemblyLine";
import HidableDisassembly from "./HidableDisassembly";
import { useAppSelector, useAppDispatch } from '../app/hooks';
import * as api from "../api";
import { selectBinaryFilePath } from '../features/binary-data/binaryDataSlice';
import { addDisassemblyView } from '../features/selections/selectionsSlice';
import {ReactComponent as BackedgeLogo} from '../assets/backedge.svg';

const marginHorizontal = 10
const marginSameVertical = 10
const marginDifferentVertical = 100
const LOOP_INDENT_SIZE = 26



function DisassemblyBlock({ block, i, allBlocks, id, pages, disassemblyBlockRefs, lineSelection, block_type }: { 
    block: InstructionBlock, 
    i: number,
    allBlocks: InstructionBlock[],
    id: number,
    pages: BlockPage[],
    disassemblyBlockRefs: React.MutableRefObject<{
        [start_address: number]: HTMLDivElement
    }>,
    lineSelection: DisIdSelections|null,
    block_type: 'pseudoloop'|'normal'
}) {
    
    const [isSelecting, setIsSelecting] = React.useState(false);
    const [onGoingSelection, setOnGoingSelection] = React.useState<DisassemblyLineSelection|null>(null)
    const binaryFilePath = useAppSelector(selectBinaryFilePath)
    const dispatch = useAppDispatch();

    const onMouseDown = (lineNum: number) => {
        setIsSelecting(true);
        setOnGoingSelection({
            start_address: lineNum,
            end_address: lineNum
        })
    }

    const onMouseOver = (lineNum: number) => {
        if(isSelecting) {
            setOnGoingSelection({
                ...onGoingSelection!,
                end_address: lineNum<onGoingSelection!.start_address?onGoingSelection!.start_address:lineNum
            })
        }
    }

    const onMouseUp = (lineNum: number) => {
        setIsSelecting(false);
        const finalSelection = {
            ...onGoingSelection!,
            end_address: lineNum<onGoingSelection!.start_address?onGoingSelection!.start_address:lineNum,
        }
        setOnGoingSelection(finalSelection)

        const selectedDisassemblyLines = pages
            .filter(page => (
                (page.start_address <= finalSelection.start_address && finalSelection.start_address <= page.end_address && page.end_address >= finalSelection.start_address) ||
                (page.start_address >= finalSelection.start_address && page.start_address <= finalSelection.end_address)
            ))
            .map(page => page.blocks)
            .flat()
            .filter(block => (
                (block.start_address <= finalSelection.start_address && finalSelection.start_address <= block.end_address && block.end_address >= finalSelection.start_address) ||
                (block.start_address >= finalSelection.start_address && block.start_address <= finalSelection.end_address)
            ))
            .map(block => block.instructions)
            .flat()
            .filter(instruction => finalSelection.start_address <= instruction.address && instruction.address <= finalSelection.end_address)

        const selectedSourceLines: {
            [source_file: string]: Set<number>,
        } = {}
        selectedDisassemblyLines.forEach(line => {
            Object.entries(line.correspondence).forEach(([source_file, lines]) => {
                if (!(source_file in selectedSourceLines)) {
                    selectedSourceLines[source_file] = new Set()
                }
                lines.forEach(line => {
                    selectedSourceLines[source_file].add(line)
                })
            })
        })

        dispatch(setDisassemblyLineSelection({
            disIdSelections: {
                addresses: selectedDisassemblyLines.map(instruction => instruction.address),
                source_selection: Object.entries(selectedSourceLines).map(([source_file, lines]) => ({
                    source_file,
                    lines: Array.from(lines)
                }))
            },
            disassemblyViewId: id,
        }))
    }

    return (
        <Card className={block_type=='normal'?'':'pseudoloop'} onClick={() => {
            if (block_type=='pseudoloop') {
                dispatch(setDisassemblyLineSelection({
                    disassemblyViewId: id,
                    disIdSelections: {
                        addresses: block.instructions.map(instruction => instruction.address),
                        source_selection: block.instructions
                            .map(instruction => Object.keys(instruction.correspondence)
                                .map(source_file => ({
                                    source_file,
                                    lines: instruction.correspondence[source_file]
                                }))
                            ).flat()
                    }
                }))
            }
        }}
            key={i} style={{
                marginLeft: marginHorizontal + block.loops.length * LOOP_INDENT_SIZE + 'px',
                marginRight: marginHorizontal + 'px',
                marginTop: (i > 0 && allBlocks[i - 1].function_name === block.function_name) ? marginSameVertical : marginDifferentVertical + 'px',
                maxWidth: '400px',
                textAlign: 'center',
                border: block_type=='normal'?'1px solid black':'3px dashed lightgray',
            }}
            ref={(thisRef: HTMLDivElement) => {
                disassemblyBlockRefs.current[block.start_address] = thisRef
            }}
        >
            {block.block_type === 'pseudoloop' && 
            <span style={{
                paddingTop: '10px',
                paddingBottom: '10px',
                paddingLeft: '10px',
                paddingRight: '10px', 
                fontSize: '14px'
            }}>
            <span style={{float: 'left'}}>
                {block.name.length-7 <= MAX_FN_SIZE ? block.name : (block.name.slice(0, 10) + '...' + block.name.slice(block.name.length - 15 - 7, block.name.length-7))}
            </span>
            <span style= {{ float: 'right', fontStyle: 'italic'}}>
                {block.loops.length > 0 && `${block.loops[block.loops.length-1].name}: ${block.loops[block.loops.length-1].loop_count}/${block.loops[block.loops.length-1].loop_total}`}
            </span> </span>}

            {block.block_type !== 'pseudoloop' &&
            <Card.Header style={{
                background: '#ddd',
                textAlign: 'left',
                fontSize: '14px',
                padding: '2px',
                paddingLeft: '10px'
            }}>
               {/* {block.backedges.length > 0 &&
                 <svg className="backedge">
                    <title>{block.backedges[0]}</title>
                    <path id="sauce"
                        d="M4.918342,-2.160804l-1.793342,-2.214196v1.25a5,5,0,0,0,-6.476131,7.003769a4.294744,4.294744,0,0,1,6.476131,-5.128769v1.25l1.755653,-1.988065Z" 
                        vectorEffect="non-scaling-stroke"
                        fill= "rosybrown"
                        stroke= "black"
                        strokeWidth= "1px"
                        transform="translate(25, 80) scale(5, -5) rotate(90)" 
                        
                    />
                    <path className="block"
                        d="M3,1l-1,-3.5h-6v7h6Z" 
                        vectorEffect="non-scaling-stroke"
                        pointerEvents="all"
                        fill= "rosybrown"
                        stroke= "black"
                        strokeWidth= "1px"
                        transform="translate(25, 30) rotate(-90) scale(5,5)"
                        onClick={(e) => {
                            api.getDisassemblyBlock(binaryFilePath, block.backedges[0]).then(block => {
                                dispatch(setDisassemblyLineSelection({
                                    disassemblyViewId: id,
                                    disIdSelections: {
                                        addresses: block.instructions.map(instruction => instruction.address),
                                        source_selection: block.instructions
                                            .map(instruction => Object.keys(instruction.correspondence)
                                                .map(source_file => ({
                                                    source_file,
                                                    lines: instruction.correspondence[source_file]
                                                }))
                                            ).flat()
                                    }
                                }))
                            })
                            
                        }}
                    />
                </svg> } */}
                <span title={block.name}>
                    <span>
                        {block.name.length <= MAX_FN_SIZE ? block.name : (block.name.slice(0, 10) + '...' + block.name.slice(block.name.length - 15, block.name.length))}
                    </span>
                    <span style={{
                        float: 'right',
                        marginRight: '16px',
                        fontStyle: 'italic',
                    }}>
                        
                        {block.loops.length > 0 && `${block.loops[block.loops.length-1].name}: ${block.loops[block.loops.length-1].loop_count}/${block.loops[block.loops.length-1].loop_total}`}
                    </span>
                </span>
                {/* (page:  <span style={{border: "3px solid red"}}>{pages.find(page => page.blocks[0].start_address === block.start_address)?.page_no}</span>) */}
            </Card.Header>}
            {block.block_type !== 'pseudoloop' &&
            <ListGroup variant="flush" style={{
                paddingLeft: '10px',
            }}>
                {block.instructions.map((ins, j) => {
                    let isHidable = false
                    for (let hidableI = 0; hidableI < block.hidables.length; hidableI++) {
                        const hidable = block.hidables[hidableI]
                        if (hidable.start_address <= ins.address && ins.address <= hidable.end_address) {
                            isHidable = true;
                        }
                        if (ins.address === hidable.start_address) {
                            return <>
                                <HidableDisassembly
                                    key={i.toString() + j.toString() + 'hidable'}
                                    name={hidable.name}
                                    block={block}
                                    disId={id}
                                ></HidableDisassembly>
                                <DisassemblyLine
                                    block={block}
                                    isHighlighted={Object.keys(ins.correspondence).length !== 0 && (lineSelection ? lineSelection.addresses.includes(ins.address) : false)}
                                    mouseEvents={{ onMouseDown, onMouseOver, onMouseUp }}
                                    key={i.toString() + j.toString()}
                                    instruction={ins}
                                    isSelecting={isSelecting}
                                    onGoingSelection={onGoingSelection}
                                    color={codeColors[id]}
                                    disId={id}
                                    isHidable={isHidable}
                                />
                            </>
                        }
                    }

                    return (<DisassemblyLine
                        block={block}
                        isHighlighted={Object.keys(ins.correspondence).length !== 0 && (lineSelection ? lineSelection.addresses.includes(ins.address) : false)}
                        mouseEvents={{ onMouseDown, onMouseOver, onMouseUp }}
                        key={i.toString() + j.toString()}
                        instruction={ins}
                        isSelecting={isSelecting}
                        onGoingSelection={onGoingSelection}
                        color={codeColors[id]}
                        disId={id}
                        isHidable={isHidable}
                    />)
                }
                )}
            </ListGroup>}
            
        </Card>
    );
}

export default DisassemblyBlock;