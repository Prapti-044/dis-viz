import React  from 'react';
import { Card, ListGroup } from 'react-bootstrap';
import { codeColors, MAX_FN_SIZE, useForceUpdate } from '../utils';
import DisassemblyLine from './DisassemblyLine';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import { selectSelections, setActiveDisassemblyView, setDisassemblyLineSelection, selectActiveDisassemblyView } from '../features/selections/selectionsSlice'
import { selectBinaryFilePath } from '../features/binary-data/binaryDataSlice'


import { DisassemblyLineSelection, BlockPage, Instruction } from '../types'
import * as api from '../api'
import Minimap from './Minimap';
import HidableDisassembly from './HidableDisassembly';


function useVisibleBlockWindow(ref: React.MutableRefObject<{
    [start_address: number]: HTMLDivElement
}>) {
    const [blockIsVisible, setBlockIsVisible] = React.useState<{blockAddress:number, inside:boolean}[]>([])

    const observer = new IntersectionObserver(entries => {
        const changedBlockAddresses = Object.keys(ref.current)
            .filter(key => entries.map(entry => entry.target).includes(ref.current[parseInt(key)]))

        const newBlockVisibility = structuredClone(blockIsVisible)
        newBlockVisibility.forEach(block => {
            block.inside = false
        })
        changedBlockAddresses.forEach((address, i) => {
            const foundBlock = newBlockVisibility.find(block => block.blockAddress === parseInt(address))
            if (!foundBlock) {
                newBlockVisibility.push({
                    blockAddress: parseInt(address),
                    inside: entries[i].isIntersecting
                })
            }
            else {
                foundBlock.inside = entries[i].isIntersecting
            }
        });

        newBlockVisibility.sort((a, b) => a.blockAddress - b.blockAddress)

        const allKeys = Array.from(new Set([...newBlockVisibility.map(block => block.blockAddress), ...blockIsVisible.map(block => block.blockAddress)]))
        for (const key of allKeys) {
            const newBlock = newBlockVisibility.find(block => block.blockAddress === key)
            const block = blockIsVisible.find(block => block.blockAddress === key)

            if (!block || !newBlock || block.inside !== newBlock.inside) {
                setBlockIsVisible(newBlockVisibility)
                break
            }
        }
    })

    React.useEffect(() => {
        for(const start_address in ref.current) {
            if(ref.current[start_address])
                observer.observe(ref.current[start_address])
        }

        return () => {
            observer.disconnect()
        };
    }, [ref.current[parseInt(Object.keys(ref.current)[0])], observer]);

    const visibleBlocks = blockIsVisible.filter(block => block.inside).map(block => block.blockAddress)
    return {
        start: Math.min(...visibleBlocks),
        end: Math.max(...visibleBlocks)
    }
}



function DisassemblyView({ id }:{
    id: number,
}) {

    const dispatch = useAppDispatch();
    const selections = useAppSelector(selectSelections)
    const binaryFilePath = useAppSelector(selectBinaryFilePath)!
    const activeDisassemblyView = useAppSelector(selectActiveDisassemblyView)
    const active = activeDisassemblyView === id

    const lineSelection = selections[id]

    const [isSelecting, setIsSelecting] = React.useState(false);
    const [onGoingSelection, setOnGoingSelection] = React.useState<DisassemblyLineSelection|null>(null)
    const [pages, setPages] = React.useState<BlockPage[]>([]);

    const marginHorizontal = 10
    const marginSameVertical = 10
    const marginDifferentVertical = 100
    const LOOP_INDENT_SIZE = 26

    const disassemblyBlockRefs = React.useRef<{[start_address: number]: HTMLDivElement}>({})
    const onScreenFirstBlockAddress = useVisibleBlockWindow(disassemblyBlockRefs)

    React.useEffect(() => {
        const setAfterFetch = ((page: BlockPage) => {
            setPages([page])
        })
        if(lineSelection && lineSelection.addresses.length > 0) {
            api.getDisassemblyPageByAddress(binaryFilePath, lineSelection.addresses[0]).then(setAfterFetch)
        }
        else {
            api.getDisassemblyPage(binaryFilePath, 1).then(setAfterFetch)
        }
    }, [lineSelection])

    const addNewPage = (newPageNo: number) => {
        api.getDisassemblyPage(binaryFilePath, newPageNo).then(page => {
            let pagesCopy = [...pages]
            pagesCopy.push(page)
            pagesCopy = pagesCopy.sort((page1, page2) => page1.page_no - page2.page_no)
            setPages(pagesCopy)
        })
    }

    React.useEffect(() => {
        if (!lineSelection || lineSelection.addresses.length == 0) return;
        const firstFocusLine = lineSelection.addresses[0]

        const blockAddresses = Object.keys(disassemblyBlockRefs.current).map(key => parseInt(key, 10))
        for(const i in blockAddresses) {
            const blockAddress = blockAddresses[i]
            if (parseInt(i) > 0 && blockAddresses[parseInt(i)-1] <= firstFocusLine && firstFocusLine <= blockAddress) {
                if (!disassemblyBlockRefs.current[blockAddresses[parseInt(i)-1]]) continue;
                const scrollRef = disassemblyBlockRefs.current[blockAddress];
                setTimeout(() => {
                    scrollRef.scrollIntoView({
                        behavior: 'smooth'
                    })
                }, 100);
                break
            }
        }
    }, [lineSelection])

    const borderStyle: {[style: string]: string} = {}
    if(active) {
        borderStyle.border = '3px solid red'
    }

    const activeRef = React.useRef<HTMLInputElement>(null);
    React.useEffect(() => {
        if(activeRef.current)
            activeRef.current.checked = active;
    }, [active])


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

    let currentHidableName = ""
    const currentHidableInstructions: Instruction[] = []
    let totalHidables = 0

    return <>
        <label className="toggle" style={{
            position: 'absolute',
            top: '10px',
            right: '200px',
            height: '40px',
            zIndex: 10,
        }}>
            <input type="checkbox" ref={activeRef} onChange={(event) => {
                if(event.target.checked)
                    dispatch(setActiveDisassemblyView(id))
                else
                    dispatch(setActiveDisassemblyView(null))
            }}/>
            <span className="labels" data-on="Active" data-off="Inactive"></span>
        </label>
        {pages ?  
        <div style={{
            ...borderStyle,
        }}
        >
            {pages.length > 0 && pages[0].page_no > 1?<button onClick={e => {addNewPage(pages[0].page_no-1)}}>
                Load more
            </button>:<></>}
            {pages.map(page => page.blocks).flat().map((block, i, allBlocks) => (
                <Card key={i} style={{
                    marginLeft: marginHorizontal + block.loop_indents*LOOP_INDENT_SIZE + 'px',
                    marginRight: marginHorizontal + 'px',
                    marginTop: (i > 0 && allBlocks[i-1].function_name === block.function_name)?marginSameVertical:marginDifferentVertical + 'px',
                    maxWidth: '400px',
                    textAlign: 'center'
                }}
                ref={(thisRef: HTMLDivElement) => {
                    disassemblyBlockRefs.current[block.start_address] = thisRef
                }}
                >
                    <Card.Header style={{
                        background: '#ddd',
                        textAlign: 'left',
                        fontSize: '14px',
                        padding: '2px',
                        paddingLeft: '10px'
                    }}>
                        <span title={block.name}> {block.name.length<=MAX_FN_SIZE?block.name:(block.name.slice(0,10)+'...'+block.name.slice(block.name.length-15, block.name.length))} (Loops Indentation: {block.loop_indents})</span>
                        {/* (page:  <span style={{border: "3px solid red"}}>{pages.find(page => page.blocks[0].start_address === block.start_address)?.page_no}</span>) */}
                    </Card.Header>

                    <ListGroup variant="flush" style={{
                        paddingLeft: '10px',
                    }}>
                        {block.instructions.map((ins, j) => {
                            let isHidable = false
                            for(let hidableI = 0; hidableI < block.hidables.length; hidableI++) {
                                const hidable = block.hidables[hidableI]
                                if(hidable.start_address <= ins.address && ins.address <= hidable.end_address) {
                                    isHidable = true;
                                }
                                if(ins.address === hidable.start_address) {
                                    return <>
                                        <HidableDisassembly
                                            key={block.name + id}
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
                                isHighlighted={Object.keys(ins.correspondence).length !== 0 && (lineSelection?lineSelection.addresses.includes(ins.address):false)}
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
                    </ListGroup>
                </Card>
            )
            )}
            {pages.length > 0 && !pages[pages.length-1].is_last?<button onClick={e => {addNewPage(pages[pages.length-1].page_no+1)}}>
                Load more
            </button>:<></>}
            {(onScreenFirstBlockAddress.start && isFinite(onScreenFirstBlockAddress.start))?
            <Minimap
                width={150}
                visibleBlockWindow={onScreenFirstBlockAddress}
            ></Minimap>:<></>}
            </div> :
            <div>
                <h1>Please select a binary file to get disassembly code here.</h1>
            </div>}
    </>
}

export default DisassemblyView;

