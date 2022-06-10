import React from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import '../styles/sourceview.css'


function SourceView({ sourceData, selectedLines, setSelectedLines }) {

    // TODO: While converting from flex to new tile library, use tooltip buttons as settings for using line numbers
    const [useLineNumbers, setUseLineNumbers] = React.useState(true);
    const [wrapLongLines, setWrapLongLines] = React.useState(false);
    const [isSelecting, setIsSelecting] = React.useState(false);
    const [onGoingSelection, setOnGoingSelection] = React.useState({
        start: -1, end: -1
    });

    let sourceCode = "";
    sourceData.forEach((line) => {
        sourceCode += line;
    })

    return <>
        <div>
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
            showInlineLineNumbers
            wrapLines
            wrapLongLines={wrapLongLines}
            codeTagProps={{
                className: "codesegment"
            }}
            lineProps={ lineNum => {
                let style = { display: "block", userSelect: "none" }
                if(isSelecting?(lineNum >= onGoingSelection.start && lineNum <= onGoingSelection.end):(lineNum >= selectedLines.start && lineNum <= selectedLines.end)) {
                    style.backgroundColor = "#eee";
                    style.border = "1px solid grey";
                    style.cursor = "pointer";
                }

                let className = "codeline";

                const onMouseDown = () => {
                    setIsSelecting(true);
                    setOnGoingSelection({
                        start: lineNum,
                        end: lineNum
                    })
                }

                const onMouseOver = () => {
                    if(isSelecting) {
                        setOnGoingSelection({
                            ...onGoingSelection,
                            end: lineNum<onGoingSelection.start?onGoingSelection.start:lineNum
                        })
                    }
                }

                const onMouseUp = () => {
                    setIsSelecting(false);
                    setOnGoingSelection({
                        ...onGoingSelection,
                        end: lineNum<onGoingSelection.start?onGoingSelection.start:lineNum
                    })
                    setSelectedLines(onGoingSelection)
                }

                return { style, 'class':className, onMouseUp, onMouseDown, onMouseOver }
            }}
        >
            {sourceCode}
        </SyntaxHighlighter>

    </>
}

export default SourceView;