import React from 'react';

function SourceView({ selectedSourceFile, sourceData }) {
    console.log("Loading SourceView");

    return (
        <div>{sourceData}</div>
    )
}

export default SourceView;