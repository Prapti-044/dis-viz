import React from 'react'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import '../styles/sourceview.css'
import { codeColors } from '../utils'
import * as api from '../api'
import { useAppSelector, useAppDispatch } from '../app/hooks';
import { selectActiveDisassemblyView, selectSelections, setSourceLineSelection } from '../features/selections/selectionsSlice'
import { selectBinaryFilePath } from '../features/binary-data/binaryDataSlice'

function SourceView({ file_name }:{
    file_name: string,
}) {

    const dispatch = useAppDispatch();
    const selections = useAppSelector(selectSelections)
    const binaryFilePath = useAppSelector(selectBinaryFilePath)!

    const [wrapLongLines, setWrapLongLines] = React.useState(false)
    const [isSelecting, setIsSelecting] = React.useState(false)
    const [onGoingSelection, setOnGoingSelection] = React.useState<{start: number, end: number}>({
        start: -1, end: -1
    })
    const [sourceCode, setSourceCode] = React.useState("")
    const [hasCorrespondence, setHasCorrespondence] = React.useState<{[lineNum: number]: boolean}>({})



    React.useEffect(() => {
        api.getSourceLines(binaryFilePath, file_name).then(({ source, has_correspondence }) => {
            let tmpSourceCode = "";
            source.forEach((line) => {
                tmpSourceCode += line;
            })
            setHasCorrespondence(has_correspondence)
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
                    lines: number[],
                    disassemblyViewId: number
                }[] = []
                for(const disassemblyViewId in selections) {
                    const thisLines = selections[parseInt(disassemblyViewId)]?.source_selection.find(selection => selection.source_file === file_name)?.lines
                    if (thisLines) {
                        thisSelections.push({
                            lines: thisLines,
                            disassemblyViewId: parseInt(disassemblyViewId)
                        })
                    }
                }
                thisSelections.forEach(({lines, disassemblyViewId}) => {
                    if(lines.includes(lineNum)) {
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
                    const finalSelection = {
                        ...onGoingSelection,
                        end: lineNum<onGoingSelection.start?onGoingSelection.start:lineNum
                    }
                    setOnGoingSelection(finalSelection)
                    api.getSourceCorresponding(binaryFilePath, file_name, finalSelection.start, finalSelection.end).then(newDisLine => {
                        console.log("From response api")
                        console.log("    Source selection", finalSelection)
                        console.log("    disLines", newDisLine)
                        dispatch(setSourceLineSelection({
                            addresses: newDisLine.addresses,
                            source_selection: [{
                                source_file: file_name,
                                lines: Array.from({length: finalSelection.end - finalSelection.start + 1}, (_, i) => i + finalSelection.start)
                            }]
                        }))
                    })
                }

                return {
                    style,
                    onMouseUp:hasCorrespondence[lineNum]?onMouseUp:()=>{},
                    onMouseDown:hasCorrespondence[lineNum]?onMouseDown:()=>{},
                    onMouseOver:hasCorrespondence[lineNum]?onMouseOver:()=>{},
                    'class': hasCorrespondence[lineNum]?"hoverable":""
                }
            }}
        >
            {sourceCode}
        </SyntaxHighlighter>

    </>
}

export default SourceView;