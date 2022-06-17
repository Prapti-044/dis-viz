import React from 'react';
import { Card, ListGroup } from 'react-bootstrap';
import DisassemblyLine from './DisassemblyLine';



function DisassemblyView({ disassemblyData, selectedLines, setSelectedLines }) {

    const [isSelecting, setIsSelecting] = React.useState(false);
    const [onGoingSelection, setOnGoingSelection] = React.useState({
        start: -1, end: -1
    });

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
        setSelectedLines(onGoingSelection)
    }

    return <>{disassemblyData ? <div>
        {disassemblyData.blocks.map((block, i) => (
                <Card key={i} style={{
                    marginLeft: marginHorizontal,
                    marginRight: marginHorizontal,
                    marginTop: marginVertical,
                    marginBottom: marginVertical,
                    maxWidth: '350px',
                    textAlign: 'center'
                }}>
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
                        {block['B'+i].map((ins, j) => {
                            return <DisassemblyLine selectedLines={selectedLines} mouseEvents={{onMouseDown, onMouseOver, onMouseUp}} key={i.toString()+j.toString()} instruction={ins} isSelecting={isSelecting} onGoingSelection={onGoingSelection} />
                        })}
                    </ListGroup>

                </Card>
            )
        )}</div> :
        <div></div>}
    </>
}

export default DisassemblyView;

