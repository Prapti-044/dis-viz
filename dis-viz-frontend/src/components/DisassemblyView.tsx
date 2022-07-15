import React, { ReactElement }  from 'react';
import { Card, ListGroup } from 'react-bootstrap';
import { codeColors } from '../utils';
import DisassemblyLine from './DisassemblyLine';

import { BlockPage, LineCorrespondence, Function, Variable, DisassemblyLineSelection } from '../types'
import * as api from '../api'

function DisassemblyView({ binaryFilePath, active, setActive, id, lineSelection, page, setNewSelection, dyninstInfo }:{
    binaryFilePath: string,
    active: boolean,
    setActive: (id: number) => void,
    id: number,
    lineSelection: DisassemblyLineSelection,
    page: number,
    setNewSelection: (lineSelection: DisassemblyLineSelection) => void
    dyninstInfo: {
        line_correspondence: LineCorrespondence[],
        functions: Function[]
    }
}) {

    const [isSelecting, setIsSelecting] = React.useState(false);
    const [onGoingSelection, setOnGoingSelection] = React.useState<DisassemblyLineSelection>({
        start_address: -1, end_address: -1
    })
    const [currentPage, setCurrentPage] = React.useState<BlockPage>();

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
                ...onGoingSelection,
                end_address: lineNum<onGoingSelection.start_address?onGoingSelection.start_address:lineNum
            })
        }
    }

    const onMouseUp = (lineNum: number) => {
        setIsSelecting(false);
        setOnGoingSelection({
            ...onGoingSelection,
            end_address: lineNum<onGoingSelection.start_address?onGoingSelection.start_address:lineNum
        })

        setNewSelection(onGoingSelection);
    }

    React.useEffect(() => {
        if (binaryFilePath.length !== 0) {
            if (page === -1 && lineSelection.start_address === -1) {
                page = 0
            }
            if (page !== -1) {
                api.getDisassemblyPage(binaryFilePath, 0).then((blockPage) => {
                    setCurrentPage(blockPage)
                })
            }
            else {
                api.getDisassemblyPageByAddress(binaryFilePath, lineSelection.start_address).then((blockPage) => {
                    setCurrentPage(blockPage)
                })
            }
        }
    }, [binaryFilePath])

    const disassemblyBlockRefs: {[start_address: number]: React.RefObject<HTMLDivElement>} = {}
    currentPage && currentPage.blocks.forEach((block, i) => {
        disassemblyBlockRefs[block.start_address] = React.createRef();

    })

    React.useEffect(() => {
        const firstFocusLine = lineSelection.start_address;
        if(firstFocusLine !== -1) {
            const scrollRef = disassemblyBlockRefs[
                Object.keys(disassemblyBlockRefs).map(Number).reverse().find(key => key <= firstFocusLine )!
            ].current;

            if(scrollRef)
                scrollRef.scrollIntoView({
                    behavior: 'smooth'
                })
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
    if (dyninstInfo) {
        allVars = dyninstInfo.functions.map(f => f.variables).filter(d => d.length !== 0).flat();
    }

    // Remove all other functions than active functions


    // // Hidables
    // if(dyninstInfo) {
    //     const hidables = dyninstInfo["functions"].map(d => d.hidables).filter(d => d && d.length !== 0).flat();
    //     console.log(hidables);
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
                    setActive(id)
            }}/>
            <span className="labels" data-on="Active" data-off="Inactive"></span>
        </label>
        {currentPage ? <div style={{
            ...borderStyle
        }}>
            {currentPage.blocks.map((block, i) => (
                <Card key={i} style={{
                    marginLeft: marginHorizontal,
                    marginRight: marginHorizontal,
                    marginTop: (i > 0 && currentPage.blocks[i-1].function_name === block.function_name)?marginSameVertical:marginDifferentVertical,
                    maxWidth: '400px',
                    textAlign: 'center'
                }}
                ref={disassemblyBlockRefs[Number(Object.keys(disassemblyBlockRefs)[i])]}
                >
                    <Card.Header style={{
                        background: '#ddd',
                        textAlign: 'left',
                        fontSize: '14px',
                        padding: '2px',
                        paddingLeft: '10px'
                    }}>
                        B{i} ({block.function_name})
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
                                selectedLines={lineSelection}
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
            )}</div> :
            <div>
                <h1>Please select a binary file to get disassembly code here.</h1>
            </div>}

            <div className="pagination">
                <button>&laquo;</button>
                <button>1</button>
                <button>&raquo;</button>
            </div>

    </>
}

export default DisassemblyView;

