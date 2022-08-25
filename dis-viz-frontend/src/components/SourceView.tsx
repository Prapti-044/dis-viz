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

    const dispatch = useAppDispatch();
    const selections = useAppSelector(selectSelections)
    const binaryFilePath = useAppSelector(selectBinaryFilePath)!

    const [wrapLongLines, setWrapLongLines] = React.useState(false)
    const [isSelecting, setIsSelecting] = React.useState(false)
    const [onGoingSelection, setOnGoingSelection] = React.useState<{start: number, end: number}>({
        start: -1, end: -1
    })
    const [sourceCode, setSourceCode] = React.useState("")
    const [correspondences, setCorrespondences] = React.useState<number[][]>([])

    console.log(correspondences)


    React.useEffect(() => {
        api.getSourceLines(binaryFilePath, file_name).then((sourceFile) => {
            let tmpSourceCode = "";
            sourceFile.lines.map(line => line.line).forEach((line) => {
                tmpSourceCode += line;
            })
            setCorrespondences(sourceFile.lines.map(line => line.addresses))
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

                    const addresses = new Set<number>();
                    for(let i = finalSelection.start; i <= finalSelection.end; i++) {
                        correspondences[i].forEach(address => {
                            addresses.add(address)
                        })
                    }
                    dispatch(setSourceLineSelection({
                        addresses: Array.from(addresses),
                        source_selection: [{
                            source_file: file_name,
                            lines: Array.from({length: finalSelection.end - finalSelection.start + 1}, (_, i) => i + finalSelection.start)
                        }]
                    }))
                }

                return {
                    style,
                    onMouseUp:correspondences[lineNum]?.length>0?onMouseUp:()=>{},
                    onMouseDown:correspondences[lineNum]?.length>0?onMouseDown:()=>{},
                    onMouseOver:correspondences[lineNum]?.length>0?onMouseOver:()=>{},
                    'class': correspondences[lineNum]?.length>0?"hoverable":""
                }
            }}
        >
            {sourceCode}
        </SyntaxHighlighter>

    </>
}

export default SourceView;