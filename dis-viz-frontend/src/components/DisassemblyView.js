import React from 'react';

function DisassemblyView({disassemblyData}) {
    console.log("Loading disassemblyView")
    return (
        <div>{JSON.stringify(disassemblyData)}</div>
    )
}

export default DisassemblyView;

