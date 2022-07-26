import React from 'react'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import '../styles/sourceview.css'
import { codeColors } from '../utils'
import * as api from '../api'
import { useAppSelector, useAppDispatch } from '../app/hooks';
import { selectSelections, setSourceLineSelection } from '../features/selections/selectionsSlice'
import { selectBinaryFilePath } from '../features/binary-data/binaryDataSlice'

function SourceView({ file_name }:{
    file_name: string,
}) {

    console.log("From SourceView")
    const dispatch = useAppDispatch();
    const selections = useAppSelector(selectSelections)
    const binaryFilePath = useAppSelector(selectBinaryFilePath)!

    const [wrapLongLines, setWrapLongLines] = React.useState(false)
    const [isSelecting, setIsSelecting] = React.useState(false)
    const [onGoingSelection, setOnGoingSelection] = React.useState<{start: number, end: number}>({
        start: -1, end: -1
    })
    const [sourceCode, setSourceCode] = React.useState("")



    React.useEffect(() => {
        api.getSourceLines(file_name).then((result) => {
            let tmpSourceCode = "";
            result.forEach((line) => {
                tmpSourceCode += line;
            })
            setSourceCode(tmpSourceCode);
        })
    }, [file_name])

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
                const thisSelections: {
                    start_line: number,
                    end_line: number,
                    disassemblyViewId: number
                }[] = []
                for(const disassemblyViewId in selections) {
                    const thisSource = selections[parseInt(disassemblyViewId)]?.source_selection.find(selection => selection.source_file === file_name)
                    if (thisSource) {
                        thisSelections.push({
                            start_line: thisSource.start_line,
                            end_line: thisSource.end_line,
                            disassemblyViewId: parseInt(disassemblyViewId)
                        })
                    }
                }
                thisSelections.forEach(({start_line, end_line, disassemblyViewId}) => {
                    if(lineNum >= start_line && lineNum <= end_line) {
                        style.backgroundColor = codeColors[disassemblyViewId]
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
                    dispatch(setSourceLineSelection({
                        binaryFilePath,
                        file_name,
                        start_line: onGoingSelection.start,
                        end_line: onGoingSelection.end
                    }))
                }

                return { style, onMouseUp, onMouseDown, onMouseOver }
            }}
        >
            {sourceCode}
        </SyntaxHighlighter>

    </>
}

export default SourceView;