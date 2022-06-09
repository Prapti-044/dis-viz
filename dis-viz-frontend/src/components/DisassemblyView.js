import React from 'react';

function DisassemblyView({disassemblyData}) {
    return (
        <div>{JSON.stringify(disassemblyData)}</div>
    )
}

export default DisassemblyView;

