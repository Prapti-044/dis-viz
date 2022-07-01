import React from 'react';
import { Card, ListGroup } from 'react-bootstrap';
import { codeColors } from '../utils';
import DisassemblyLine from './DisassemblyLine';



function DisassemblyView({ disassemblyData, active, setActive, viewState, setNewSelection, dyninstInfo }) {

    if(viewState === undefined) {
        viewState = {id: -1, lineSelection: {start:-1, end:-1}}
        setNewSelection = (lineSelection) => {}
    }

    const [isSelecting, setIsSelecting] = React.useState(false);
    const [onGoingSelection, setOnGoingSelection] = React.useState({
        start: -1, end: -1
    })

    const marginHorizontal = '10px'
    const marginVertical = '50px'
                

    const onMouseDown = (lineNum) => {
        setIsSelecting(true);
        setOnGoingSelection({
            start: lineNum,
            end: lineNum
        })
    }

    const onMouseOver = (lineNum) => {
        if(isSelecting) {
            setOnGoingSelection({
                ...onGoingSelection,
                end: lineNum<onGoingSelection.start?onGoingSelection.start:lineNum
            })
        }
    }

    const onMouseUp = (lineNum) => {
        setIsSelecting(false);
        setOnGoingSelection({
            ...onGoingSelection,
            end: lineNum<onGoingSelection.start?onGoingSelection.start:lineNum
        })

        setNewSelection(onGoingSelection);
    }

    const disassemblyBlockRefs = {}
    disassemblyData && disassemblyData.blocks.forEach((block, i) => {
        disassemblyBlockRefs[block['B'+i][0].address] = React.createRef();
    })

    React.useEffect(() => {
        const firstFocusLine = viewState.lineSelection.start;
        if(firstFocusLine !== -1) {
            const scrollRef = disassemblyBlockRefs[
                Object.keys(disassemblyBlockRefs).findLast(key => key <= firstFocusLine )
            ].current;

            scrollRef.scrollIntoView({
                behavior: 'smooth'
            })
        }

    }, [viewState])

    const borderStyle = {}
    if(active) {
        borderStyle.border = '3px solid red'
    }

    const activeRef = React.useRef(null);

    React.useEffect(() => {
        activeRef.current.checked = active;
    }, [active])



    // Variable Renamer
    let allVars = [];
    if (dyninstInfo) {
        allVars = dyninstInfo["functions"].map(f => f.vars).filter(d => d.length !== 0).flat();
        console.log(disassemblyData)
        console.log(allVars)
    }


    // Hidables
    // const hidables = dyninstInfo["functions"].map(d => d.hidables).filter(d => d && d.length !== 0).flat();
    // let finalData = [];
    // for(let i = 0; i<assemblyArray.length; i++) {
    //     const assembly = assemblyArray[i];
    //     let hidable = hidables.filter(hiddable => hiddable.start === assembly.id);
    //     let hidableAllLines = hidables.filter(hiddable => hiddable.start <= assembly.id && hiddable.end >= assembly.id);
    //     if(hidable.length !== 0) {
    //     finalData.push({
    //         "type": "button",
    //         "lines": hidable
    //     });
    //     }
    //     assembly.type = "line";
    //     assembly.hidden = hidableAllLines.length !== 0;
    //     finalData.push(assembly);
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
                    setActive(viewState.id)
            }}/>
            <span className="labels" data-on="Active" data-off="Inactive"></span>
        </label>
        {disassemblyData ? <div style={{
            ...borderStyle
        }}>
            {disassemblyData.blocks.map((block, i) => (
                <Card key={i} style={{
                    marginLeft: marginHorizontal,
                    marginRight: marginHorizontal,
                    marginTop: marginVertical,
                    marginBottom: marginVertical,
                    maxWidth: '400px',
                    textAlign: 'center'
                }}
                ref={disassemblyBlockRefs[Object.keys(disassemblyBlockRefs)[i]]}
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
                        {block['B' + i].map((ins, j) => {
    
                            const variables = [];
                            allVars.forEach(variable => {
                                let found = false;
                                variable.locations.forEach(location => {
                                    if (ins.address >= parseInt(location.start, 16) && ins.address <= parseInt(location.end, 16) && ins.instruction.includes(location.location)) {
                                        variables.push(variable);
                                        // ins.instruction = d.code.replace(location.location, "VAR(" + variable.name + ")");
                                        found = true;
                                        return;
                                    }
                                });
                                if (found) return;
                            });

                            return <DisassemblyLine
                                selectedLines={viewState.lineSelection}
                                mouseEvents={{ onMouseDown, onMouseOver, onMouseUp }}
                                key={i.toString() + j.toString()}
                                instruction={ins}
                                isSelecting={isSelecting}
                                onGoingSelection={onGoingSelection}
                                color={codeColors[viewState.id]}
                                variables={variables}
                            />
                        })}
                    </ListGroup>

                </Card>
            )
            )}</div> :
            <div></div>}

            <div className="pagination">
                <button>&laquo;</button>
                <button>1</button>
                <button>&raquo;</button>
            </div>

    </>
}

export default DisassemblyView;

