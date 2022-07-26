import React, { ReactElement }  from 'react';
import { Card, ListGroup } from 'react-bootstrap';
import { codeColors } from '../utils';
import DisassemblyLine from './DisassemblyLine';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import { selectSelections, setSourceLineSelection, setActiveDisassemblyView, setDisassemblyLineSelection, selectActiveDisassemblyView } from '../features/selections/selectionsSlice'
import { selectBinaryFilePath, setBinaryFilePath } from '../features/binary-data/binaryDataSlice'


import { LineCorrespondence, Function, Variable, DisassemblyLineSelection, BlockPage } from '../types'
import * as api from '../api'

function DisassemblyView({ id, pageNo }:{
    id: number,
    pageNo: number|null
}) {

    const dispatch = useAppDispatch();
    const selections = useAppSelector(selectSelections)
    const binaryFilePath = useAppSelector(selectBinaryFilePath)!
    const activeDisassemblyView = useAppSelector(selectActiveDisassemblyView)
    const active = activeDisassemblyView === id

    const lineSelection = selections[id]
    if (!lineSelection && !pageNo) {
        pageNo = 1
    }

    const [isSelecting, setIsSelecting] = React.useState(false);
    const [onGoingSelection, setOnGoingSelection] = React.useState<DisassemblyLineSelection|null>(null)
    const [pages, setPages] = React.useState<BlockPage[]>([]);

    const marginHorizontal = '10px'
    const marginSameVertical = '10px'
    const marginDifferentVertical = '100px'

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
        setOnGoingSelection({
            ...onGoingSelection!,
            end_address: lineNum<onGoingSelection!.start_address?onGoingSelection!.start_address:lineNum
        })
        dispatch(setDisassemblyLineSelection({
            binaryFilePath,
            start_address: onGoingSelection!.start_address,
            end_address: onGoingSelection!.end_address,
        }))
    }

    React.useEffect(() => {
        const setAfterFetch = ((page: BlockPage) => {
            setPages([page])
        })
        if(lineSelection) {
            api.getDisassemblyPageByAddress(binaryFilePath, lineSelection!.start_address).then(setAfterFetch)
        }
        else {
            api.getDisassemblyPage(binaryFilePath, pageNo!).then(setAfterFetch)
        }
    }, [pageNo, lineSelection])

    const addNewPage = (newPageNo: number) => {
        api.getDisassemblyPage(binaryFilePath, newPageNo).then(page => {
            let pagesCopy = [...pages]
            pagesCopy.push(page)
            pagesCopy = pagesCopy.sort((page1, page2) => page1.page_no - page2.page_no)
            setPages(pagesCopy)
        })
    }

    const disassemblyBlockRefs = React.useRef<{[start_address: number]: {ref: HTMLDivElement}}>({})
    React.useEffect(() => {
        if (!lineSelection) return;
        const firstFocusLine = lineSelection.start_address;

        const blockAddresses = Object.keys(disassemblyBlockRefs.current).map(parseInt)
        for(const i of blockAddresses) {
            if (i > 0 && blockAddresses[i-1] <= firstFocusLine && firstFocusLine <= blockAddresses[i]) {
                if (!disassemblyBlockRefs.current[blockAddresses[i]]) return;
                const scrollRef = disassemblyBlockRefs.current[blockAddresses[i]].ref;

                scrollRef?.scrollIntoView({
                    behavior: 'smooth'
                })
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

    // Variable Renamer
    let allVars: Variable[] = [];
    // TODO: Get only those variables related to current page
    // if (dyninstInfo) {
    //     allVars = dyninstInfo.functions.map(f => f.variables).filter(d => d.length !== 0).flat();
    // }

    // Remove all other functions than active functions


    // // Hidables
    // if(dyninstInfo) {
    //     const hidables = dyninstInfo["functions"].map(d => d.hidables).filter(d => d && d.length !== 0).flat();
    //     let finalData = [];
    //     for(let i = 0; i<disassemblyData.blocks.length; i++) {
    //         const assembly = disassemblyData.blocks[i]
    //         let hidable = hidables.filter(hiddable => hiddable.start === assembly.id)
    //         let hidableAllLines = hidables.filter(hiddable => hiddable.start <= assembly.id && hiddable.end >= assembly.id);
    //         if(hidable.length !== 0) {
    //             finalData.push({
    //                 "type": "button",
    //                 "lines": hidable
    //             });
    //         }
    //         assembly.type = "line";
    //         assembly.hidden = hidableAllLines.length !== 0;
    //         finalData.push(assembly);
    //     }
    // }

    return <>
        <label className="toggle" style={{
            position: 'absolute',
            top: '10px',
            right: '30px',
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
                    marginLeft: marginHorizontal,
                    marginRight: marginHorizontal,
                    marginTop: (i > 0 && allBlocks[i-1].function_name === block.function_name)?marginSameVertical:marginDifferentVertical,
                    maxWidth: '400px',
                    textAlign: 'center'
                }}
                ref={(thisRef: HTMLDivElement) => {
                    disassemblyBlockRefs.current[block.start_address] = {ref: thisRef}
                }}
                >
                    <Card.Header style={{
                        background: '#ddd',
                        textAlign: 'left',
                        fontSize: '14px',
                        padding: '2px',
                        paddingLeft: '10px'
                    }}>
                        B{block.block_number} ({block.function_name})(page:  <span style={{border: "3px solid red"}}>{pages.find(page => page.blocks[0].start_address === block.start_address)?.page_no}</span>)
                    </Card.Header>

                    <ListGroup variant="flush" style={{
                        paddingLeft: '10px',
                    }}>
                        {block.instructions.map((ins, j) => {
    
                            const variables: Variable[] = [];
                            allVars.forEach(variable => {
                                let found = false;
                                variable.locations.forEach(location => {
                                    if (ins.address >= parseInt(location.start_address.toString(), 16) && ins.address <= parseInt(location.end_address.toString(), 16) && ins.instruction.includes(location.location)) {
                                        variables.push(variable);
                                        // ins.instruction = d.code.replace(location.location, "VAR(" + variable.name + ")");
                                        found = true;
                                        return;
                                    }
                                });
                                if (found) return;
                            });

                            return <DisassemblyLine
                                isHighlighted={lineSelection?ins.address >= lineSelection.start_address && ins.address <= lineSelection.end_address:false}
                                mouseEvents={{ onMouseDown, onMouseOver, onMouseUp }}
                                key={i.toString() + j.toString()}
                                instruction={ins}
                                isSelecting={isSelecting}
                                onGoingSelection={onGoingSelection}
                                color={codeColors[id]}
                                variables={variables}
                            />
                        })}
                    </ListGroup>
                </Card>
            )
            )}
            {pages.length > 0 && !pages[pages.length-1].is_last?<button onClick={e => {addNewPage(pages[pages.length-1].page_no+1)}}>
                Load more
            </button>:<></>}
            </div> :
            <div>
                <h1>Please select a binary file to get disassembly code here.</h1>
            </div>}
    </>
}

export default DisassemblyView;

