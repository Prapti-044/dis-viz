import React from 'react';
import { Card, ListGroup } from 'react-bootstrap';

function DisassemblyView({ disassemblyData }) {

    const marginHorizontal = '10px'
    const marginVertical = '50px'

    return <>{disassemblyData ? <div>
        {disassemblyData.blocks.map((block, i) => {
            return (
                <Card style={{
                    marginLeft: marginHorizontal,
                    marginRight: marginHorizontal,
                    marginTop: marginVertical,
                    marginBottom: marginVertical,
                    maxWidth: '350px',
                    textAlign: 'center'
                }}>
                    <Card.Header style={{
                        background: '#ddd',
                        textAlign: 'left'
                    }}>B{i} ({block.function_name})</Card.Header>
                    <ListGroup variant="flush">
                        {block['B'+i].map((ins, j) => {
                            let instruction_address = ins.address.toString(16).toUpperCase();
                            while (instruction_address.length < 4)
                                instruction_address = '0' + instruction_address;
                            return <ListGroup.Item style={{ textAlign: 'left' }}>0x{instruction_address}: {ins.instruction}</ListGroup.Item>
                        })}
                    </ListGroup>

                </Card>
            );
        })}</div> :
        <div></div>}
    </>
}

export default DisassemblyView;

