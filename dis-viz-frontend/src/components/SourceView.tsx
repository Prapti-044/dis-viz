import React from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import '../styles/sourceview.css'
import { LineCorrespondence, Function, SourceSelection } from '../types';
import { codeColors } from '../utils';

function SourceView({ sourceData, setNewSelection, dyninstInfo, lineSelections, activeDisassemblyView }:{
    sourceData: string[],
    setNewSelection: (selection: SourceSelection) => void,
    dyninstInfo: {
        line_correspondence: LineCorrespondence[],
        functions: Function[],
    },
    lineSelections: SourceSelection[]
    activeDisassemblyView: number
}) {

    const [wrapLongLines, setWrapLongLines] = React.useState(false);
    const [isSelecting, setIsSelecting] = React.useState(false);
    const [onGoingSelection, setOnGoingSelection] = React.useState<SourceSelection>({
        start: -1, end: -1, id: -1
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
            showLineNumbers
            showInlineLineNumbers
            wrapLines
            wrapLongLines={wrapLongLines}
            codeTagProps={{
                className: "codesegment"
            }}
            lineProps={ lineNum => {
                let style: {[style: string]: string} = { display: "block", userSelect: "none", marginTop: '0' }

                // Highlight for different disassemblyViewId
                for(let i in lineSelections) {
                    if(lineNum >= lineSelections[i].start && lineNum <= lineSelections[i].end) {
                        style.backgroundColor = codeColors[lineSelections[i].id];
                        style.border = "1px solid grey";
                        style.cursor = "pointer";
                    }
                }
                
                if(isSelecting && lineNum >= onGoingSelection.start && lineNum <= onGoingSelection.end) {
                    style.backgroundColor = "#eee";
                    style.border = "1px solid grey";
                    style.cursor = "pointer";
                }

                const onMouseDown = () => {
                    setIsSelecting(true);
                    setOnGoingSelection({
                        start: lineNum,
                        end: lineNum,
                        id: activeDisassemblyView
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
                    setNewSelection({...onGoingSelection, id: activeDisassemblyView})
                }

                return { style, onMouseUp, onMouseDown, onMouseOver }
            }}
        >
            {sourceCode}
        </SyntaxHighlighter>

    </>
}

export default SourceView;