import React from 'react'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import '../styles/sourceview.css'
import { LineCorrespondence, Function, SourceLineSelection, SourceViewData } from '../types'
import { codeColors } from '../utils'
import * as api from '../api'

function SourceView({ sourceViewState, setNewSelection }:{
    sourceViewState: SourceViewData,
    setNewSelection: (_: {start: number, end: number}) => void,
}) {

    console.log("From SourceView")

    const [wrapLongLines, setWrapLongLines] = React.useState(false)
    const [isSelecting, setIsSelecting] = React.useState(false)
    const [onGoingSelection, setOnGoingSelection] = React.useState<{start: number, end: number}>({
        start: -1, end: -1
    })
    const [sourceCode, setSourceCode] = React.useState("")

    React.useEffect(() => {
        api.getSourceLines(sourceViewState.file_name).then((result) => {
            let tmpSourceCode = "";
            result.forEach((line) => {
                tmpSourceCode += line;
            })
            setSourceCode(tmpSourceCode);
        })
    }, [sourceViewState.file_name])

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
            lineProps={ (lineNum: number) => {
                let style: {[style: string]: string} = { display: "block", userSelect: "none", marginTop: '0' }

                // Highlight for different disassemblyViewId
                sourceViewState.lineSelections.forEach(lineSelection => {
                    if(lineNum >= lineSelection.start && lineNum <= lineSelection.end) {
                        if (lineSelection.disassemblyViewId)
                            style.backgroundColor = codeColors[lineSelection.disassemblyViewId]
                        else
                            style.backgroundColor = 'lightgray'
                        style.border = "1px solid grey"
                        style.cursor = "pointer"
                    }
                })
                
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
                    setIsSelecting(false)
                    setOnGoingSelection({
                        ...onGoingSelection,
                        end: lineNum<onGoingSelection.start?onGoingSelection.start:lineNum
                    })
                    setNewSelection({...onGoingSelection})
                }

                return { style, onMouseUp, onMouseDown, onMouseOver }
            }}
        >
            {sourceCode}
        </SyntaxHighlighter>

    </>
}

export default SourceView;