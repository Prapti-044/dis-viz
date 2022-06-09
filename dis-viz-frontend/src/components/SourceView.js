import React from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';


function SourceView({ sourceData}) {

    // TODO: While converting from flex to new tile library, use tooltip buttons as settings for using line numbers
    const [useLineNumbers, setUseLineNumbers] = React.useState(false);
    const [wrapLongLines, setWrapLongLines] = React.useState(false);

    const [selectedLines, setSelectedLines] = React.useState({
        start: -1,
        end: -1
    });

    let sourceCode = "";
    sourceData.forEach((line) => {
        console.log(line);
        sourceCode += line;
    })

    return <>
        <div>
            <label>
                <input type="checkbox"
                    checked={useLineNumbers}
                    onChange={(event) => {setUseLineNumbers(event.target.checked)}}
                />
                Line Numbers
            </label>
            <label>
                <input type="checkbox"
                    checked={wrapLongLines}
                    onChange={(event) => {setWrapLongLines(event.target.checked)}}
                />
                Wrapping
            </label>
        </div>
        <SyntaxHighlighter
            language="c++"
            style={docco}
            showLineNumbers={useLineNumbers}
            useInlineLineNumbers
            wrapLines
            wrapLongLines={wrapLongLines}
        >
            {sourceCode}
        </SyntaxHighlighter>

    </>
}

export default SourceView;