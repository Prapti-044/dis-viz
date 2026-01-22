import React from "react";
import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
import { BLOCK_ORDERS, BlockPage, InstructionBlock } from "../types";
import { selectBinaryFilePaths } from "../features/binary-data/binaryDataSlice";
import { shortenName, HIGHLIGHT_COLOR } from "../utils";
import DisassemblyLine from "./DisassemblyLine";
import HidableDisassembly from "./HidableDisassembly";
import * as disvizProcessor from "../disvizProcessor";
import BackEdge from "./BackEdge";
import { marginHorizontal, LOOP_INDENT_SIZE, BLOCK_MAX_WIDTH, marginSameVertical, marginDifferentVertical } from '../config';
import { useAppSelector } from '../app/hooks';
import useSelectionWithHistory from '../hooks/useSelectionWithHistory';



function DisassemblyBlock({ binaryFilePath, block, i, allBlocks, id, pages, disassemblyBlockRefs, addressSelection, backedgeTargets, drawPseudo, blockOrder }: { 
    binaryFilePath: string,
    block: InstructionBlock, 
    i: number,
    allBlocks: InstructionBlock[],
    id: number,
    pages: BlockPage[],
    disassemblyBlockRefs: React.MutableRefObject<{
        [start_address: number]: { div: HTMLDivElement, idx: number }
    }>,
    addressSelection: boolean[],
    backedgeTargets: HTMLDivElement[],
    drawPseudo: 'full'|'none'|'short',
    blockOrder: BLOCK_ORDERS,
}) {
    const { setSelectionWithHistory } = useSelectionWithHistory();
    const thisBlockRef = React.useRef<{ ref? : HTMLDivElement }>({})
    const pageIdx = pages.findIndex(page => page.start_address <= block.start_address && block.start_address <= page.end_address)
    const binaryFilePaths = useAppSelector(selectBinaryFilePaths)
    const validBinaryFilePaths = binaryFilePaths.filter(binaryFilePath => binaryFilePath !== "")
    
    function setThisSelection(addresses: number[]) {
        const selections = disvizProcessor.getSelectionFromBinary_indirect(binaryFilePath, addresses, validBinaryFilePaths, blockOrder)
        setSelectionWithHistory({
            ...selections,
            origin: {
                type: 'disassembly',
                disassemblyId: id,
                address: block.start_address,
            },
            details: {
                functionName: block.function_name,
                blockName: block.name,
            },
        })
    }


    let nextBlockI = i + 1
    let nextBlock = allBlocks[nextBlockI]
    while (nextBlock?.block_type === 'pseudoloop' && allBlocks.length > nextBlockI + 1) {
        nextBlockI++
        nextBlock = allBlocks[nextBlockI]
    }
    
    return <>
        <Card className={block.block_type==='normal'?'':'pseudoloop'} onClick={() => {
            if (block.block_type==='pseudoloop' && drawPseudo!=='full') {
                setThisSelection(block.instructions.map(instruction => instruction.address))
            }
        }}
            // key={i}
            style={{
                marginLeft: marginHorizontal + block.loops.length * LOOP_INDENT_SIZE + 'px',
                marginRight: marginHorizontal + 'px',
                marginTop: (i > 0 && allBlocks[i - 1].function_name === block.function_name) ? marginSameVertical : marginDifferentVertical + 'px',
                maxWidth: BLOCK_MAX_WIDTH + 'px',
                textAlign: 'center',
                border: block.block_type==='normal'?'1px solid black':'3px dashed lightgray',
            }}
            ref={(thisRef: HTMLDivElement) => {
                disassemblyBlockRefs.current[block.start_address] = { div: thisRef, idx: pages.slice(0, pageIdx).reduce((total,p) => total + p.blocks.length, 0)+i }
                thisBlockRef.current.ref = thisRef
            }}
        >
            {block.block_type === 'pseudoloop' && drawPseudo === 'short' && 
            <span style={{
                paddingTop: '10px',
                paddingBottom: '10px',
                paddingLeft: '10px',
                paddingRight: '10px', 
                fontSize: '14px'
            }} title={block.name}>
            <span style={{float: 'left'}}>
                {shortenName(block.name, 22)}
                {/* {block.backedges.length>0?<span style={{color: 'red'}}>|({block.backedges.map(backedge => backedge.split(': ')[1])})</span>:''} */}
            </span>
            <span style= {{ float: 'right', fontStyle: 'italic'}}>
                {/* {block.loops.length > 0 && `${block.loops[block.loops.length-1].name}: ${block.loops[block.loops.length-1].loop_count}/${block.loops[block.loops.length-1].loop_total}`} */}
                {block.loops.length > 0 && `${block.is_loop_header?'(loop_header) ':''}${block.loops[block.loops.length-1].name}: ${block.loops[block.loops.length-1].loop_count}/${block.loops[block.loops.length-1].loop_total}`}
            </span> </span>}

            {(block.block_type === 'normal' || (block.block_type === 'pseudoloop' && drawPseudo === 'full')) && <>
            <Card.Header style={{
                background: '#ddd',
                textAlign: 'left',
                fontSize: '14px',
                padding: '2px',
                paddingLeft: '10px'
            }}>
               {/* TODO: filter the backedges that are not in current page */}
               {false &&
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
                            
                        }}
                    />
                </svg> }
                <span title={block.name}>
                    <span>
                        {shortenName(block.name, 24)}
                    </span>
                    <span style={{
                        float: 'right',
                        marginRight: '16px',
                        fontStyle: 'italic',
                    }}>
                        
                        {block.loops.length > 0 && `${block.is_loop_header?'(loop_header) ':''}${block.loops[block.loops.length-1].name}: ${block.loops[block.loops.length-1].loop_count}/${block.loops[block.loops.length-1].loop_total}`}
                    </span>
                </span>
                {/* (page:  <span style={{border: "3px solid red"}}>{pages.find(page => page.blocks[0].start_address === block.start_address)?.page_no}</span>) */}
            </Card.Header>
            <ListGroup variant="flush" style={{
                paddingLeft: '10px',
            }}>
                {block.instructions.map((ins, j) => {
                    let isHidable = false
                    if (block.hidables) {
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
                                        binaryFilePath={binaryFilePath}
                                        block={block}
                                        isHighlighted={addressSelection[j]}
                                        key={i.toString() + j.toString()}
                                        instruction={ins}
                                        color={HIGHLIGHT_COLOR}
                                        disId={id}
                                        isHidable={isHidable}
                                        blockOrder={blockOrder}
                                        nextBlock={nextBlock}
                                    />
                                </>
                            }
                        }
                    }

                    return (<DisassemblyLine
                        binaryFilePath={binaryFilePath}
                        block={block}
                        isHighlighted={addressSelection[j]}
                        key={i.toString() + j.toString()}
                        instruction={ins}
                        color={HIGHLIGHT_COLOR}
                        disId={id}
                        isHidable={isHidable}
                        blockOrder={blockOrder}
                        nextBlock={nextBlock}
                    />)
                }
                )}
            </ListGroup>
            </>}
            {backedgeTargets.map((backedgeTarget,i) => <BackEdge
                key={i}
                source={thisBlockRef.current.ref}
                target={backedgeTarget}
                level={block.loops.length}
            />)}
        </Card>
    </>
}

export default DisassemblyBlock;