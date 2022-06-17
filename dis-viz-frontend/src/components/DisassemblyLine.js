import React from 'react'
import '../styles/disassemblyview.css'

function DisassemblyLine({ instruction, selectedLines, mouseEvents, isSelecting, onGoingSelection }) {
    let instruction_address = instruction.address.toString(16).toUpperCase();
    while (instruction_address.length < 4)
        instruction_address = '0' + instruction_address;

    let selectionStyle = { display: "block", userSelect: "none" }
    if(isSelecting?(instruction.address >= onGoingSelection.start && instruction.address <= onGoingSelection.end):(instruction.address >= selectedLines.start && instruction.address <= selectedLines.end)) {
        selectionStyle.backgroundColor = "#eee";
        selectionStyle.border = "1px solid grey";
        selectionStyle.cursor = "pointer";
    }

    return <code
            style={{ textAlign: 'left', color: 'black', ...selectionStyle }}
            className="assemblycode"
            onMouseDown={() => {mouseEvents.onMouseDown(instruction.address)}}
            onMouseOver={() => {mouseEvents.onMouseOver(instruction.address)}}
            onMouseUp={() => {mouseEvents.onMouseUp(instruction.address)}}
        >
        <span style={{ color: 'grey'}}>0x{instruction_address}</span>:{" "}
        {instruction.instruction.split(' ').map((word, i) => <span key={i} style={{
                fontStyle: i===0?'italic':'bold',
                color: i===0?'maroon':'black'
            }}>{word} </span>)}
    </code>
}

export default DisassemblyLine