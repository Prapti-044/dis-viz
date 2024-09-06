import React, { Suspense } from 'react'
import '../styles/sourceview.css'
import { codeColors } from '../utils'
import * as api from '../api'
import { SRC_LINE_TAG } from '../types'
import { useAppSelector, useAppDispatch } from '../app/hooks'
import { selectSelections, setSourceLineSelection, setMouseHighlight, selectHoverHighlight, selectActiveDisassemblyView } from '../features/selections/selectionsSlice'
import { selectBinaryFilePaths } from '../features/binary-data/binaryDataSlice'
import MonacoEditor, { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'

loader.config({ monaco });

const TAGS_TO_LETTERS = {
    'VECTORIZED': {
        letter: 'V',
        color: 'blue',
    },
    'INLINE': {
        letter: 'I',
        color: 'green',
    },
    'NO_TAG': {
        letter: 'X',
        color: 'white',
    }
}

function SourceView({ file_name }:{
    file_name: string,
}) {
    const dispatch = useAppDispatch()
    const selections = useAppSelector(selectSelections)
    const binaryFilePaths = useAppSelector(selectBinaryFilePaths)
    const activeDisassemblyView = useAppSelector(selectActiveDisassemblyView)
    const activeBinaryFilePath = selections[activeDisassemblyView?activeDisassemblyView:-1]?.binaryFilePath || ""
    const validBinaryFilePaths = binaryFilePaths.filter(f => f !== '')
    const mouseHighlight = useAppSelector(selectHoverHighlight)

    const [sourceCode, setSourceCode] = React.useState("")
    const [correspondences, setCorrespondences] = React.useState<{ [binaryFilePath: string]: number[][]}>({})
    const [lineTags, setLineTags] = React.useState<SRC_LINE_TAG[][][]>([])
    const nLineTags = validBinaryFilePaths.length

    const editorRef = React.useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

    const [editorRefUpdated, setEditorRefUpdated] = React.useState(false)
    const [selectionDecorationCollection, setSelectionDecorationCollection] = React.useState<monaco.editor.IEditorDecorationsCollection | null>(null)
    const [correspondenceDecorationCollection, setCorrespondenceDecorationCollection] = React.useState<monaco.editor.IEditorDecorationsCollection | null>(null)
    
    const monacoOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
        lineNumbers: "on",
        lineNumbersMinChars: nLineTags * 3,
        glyphMargin: true, // gap before line numbers
        lineDecorationsWidth: "1ch", // gap after line numbers
        roundedSelection: false,
        readOnly: true, // Disables editing
        readOnlyMessage: undefined, // Disables the read-only message
        linkedEditing: false, // Disables linked editing
        renderValidationDecorations: 'on', 
        scrollbar: {
            vertical: "auto",
        },
        minimap: {
            enabled: true,
            autohide: false,
            size: "proportional",
            showSlider: "always",            
            renderCharacters: true,
            maxColumn: 100,
            scale: 2,
            showRegionSectionHeaders: true,
            showMarkSectionHeaders: true,
        },
        overviewRulerLanes: 2,
        overviewRulerBorder: true, // Disables the overview ruler border
        cursorBlinking: "solid", // eventually cursor will be removed
        mouseStyle: 'default',
        cursorSmoothCaretAnimation: 'off',
        cursorWidth: 0, // Sets cursor width to 0 to make it invisible
        fontLigatures: true,
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        automaticLayout: true,
        wordWrap: 'off',
        colorDecorators: false,
        suggestOnTriggerCharacters: false,
        acceptSuggestionOnCommitCharacter: false,
        acceptSuggestionOnEnter: "off",
        snippetSuggestions: 'none',
        tabCompletion: 'off',
        selectionHighlight: false, // Disables selection highlighting
        occurrencesHighlight: 'off', // Disables occurrence highlighting
        codeLens: false, // Disables code lens
        lightbulb: { enabled: monaco.editor.ShowLightbulbIconMode.Off }, // Disables lightbulb
        folding: true,
        renderLineHighlight: 'none', // Disables line highlighting
        lineHeight: 20,
        letterSpacing: 0,
        showUnused: true,
        bracketPairColorization: { enabled: true, independentColorPoolPerBracketType: true }, 
        dropIntoEditor: { enabled: false },

        selectOnLineNumbers: true,
        disableLayerHinting: true, // Disables layer hinting
        hideCursorInOverviewRuler: true, // Hides cursor in overview ruler
        contextmenu: false, // Disables the context menu
        hover: { enabled: false }, // Disables hover effects
    }

    React.useEffect(() => {
        if (validBinaryFilePaths.length === 0) return
        api.getSourceLines(validBinaryFilePaths, file_name).then(sourceFile => {
            let tmpSourceCode = ""
            sourceFile.lines.map(line => line.line).forEach((line) => {
                tmpSourceCode += line
            })
            const tmpCorrespondences: { [binaryFilePath: string]: number[][] } = {}
            const tmpLineTags: SRC_LINE_TAG[][][] = Array.from({length: sourceFile.lines.length }, () => Array.from({length: nLineTags}, () => []))
            validBinaryFilePaths.forEach((binaryFilePath, binaryI) => {
                tmpCorrespondences[binaryFilePath] = sourceFile.lines.map(line => line.addresses[binaryFilePath])

                sourceFile.lines.forEach((line, lineI) => {
                    line.tags[binaryFilePath].forEach(tag => {
                        tmpLineTags[lineI][binaryI].push(tag)
                    })
                    if (line.tags[binaryFilePath].length === 0) {
                        tmpLineTags[lineI][binaryI].push('NO_TAG')
                    }
                }
            )})
            setSourceCode(tmpSourceCode)
            setCorrespondences(tmpCorrespondences)
            setLineTags(tmpLineTags)
        })
    }, [binaryFilePaths, file_name])
    
    // add decorations for lines with correspondences
    React.useEffect(() => {
        if(editorRef.current === null || correspondenceDecorationCollection === null) return
        if(Object.keys(correspondences).length === 0) return
            
        // pick the lines that have a correspondence
        const linesWithCorrespondences = new Set<number>()
        validBinaryFilePaths.forEach((binaryFilePath) => {
            correspondences[binaryFilePath].forEach((addresses, line) => {
                if (addresses.length > 0) {
                    linesWithCorrespondences.add(line + 1) // make it 1-based
                }
            })
        })
        // add the decorations
        const decorations: monaco.editor.IModelDeltaDecoration[] = [...linesWithCorrespondences].map((line) => ({
            range: new monaco.Range(line, 1, line, 1),
            options: {
                isWholeLine: true,
                lineNumberClassName: 'hasCorrespondence',
                // overviewRuler: {
                //     color: 'lightgreen',
                //     position: monaco.editor.OverviewRulerLane.Full,
                // },
                minimap: {
                    color: '#90EE9088',
                    position: monaco.editor.MinimapPosition.Inline,
                },
                zIndex: 1,
            },
        }))

        // add line number glyph decorations for line tags
        lineTags.forEach((tags, line) => {
            const tagsClass = 'line-tags ' + tags.map((binaryTags, i) => {
                const sortedBinaryTags = [...binaryTags]; sortedBinaryTags.sort();
                return `col-${i+1}-` + sortedBinaryTags.map(t => TAGS_TO_LETTERS[t].letter).join('')
            }).join(" ").replace(/\s+/g, ' ')

            const lineNum = line + 1
            decorations.push({
                range: new monaco.Range(lineNum, 1, lineNum, 1),
                options: {
                    isWholeLine: true,
                    glyphMarginClassName: tagsClass,
                    // overviewRuler: {
                    //     color: tags.includes('VECTORIZED') ? '#007acc' : 'brown',
                    //     position: tags.includes('VECTORIZED') ? monaco.editor.OverviewRulerLane.Left : monaco.editor.OverviewRulerLane.Right,
                    // },
                    zIndex: 2,
                },
            })
        })
        
        correspondenceDecorationCollection.set(decorations)
    }, [editorRefUpdated, correspondences, correspondenceDecorationCollection, lineTags])
    
    // add decoration for selected lines
    React.useEffect(() => {
        if(editorRef.current === null || selectionDecorationCollection === null) return

        // selections
        const decorations: monaco.editor.IModelDeltaDecoration[] = []
        for (const disassemblyViewId in selections) {
            const linesToHighlight = selections[parseInt(disassemblyViewId)]?.source_selection.find(selection => selection.source_file === file_name)?.lines.map(line => line + 1) // make it 1-based
            
            if (linesToHighlight === undefined) continue
            // Create decorations for the specified lines
            decorations.push(...linesToHighlight.map((lineNumber) => ({
                range: new monaco.Range(lineNumber, 1, lineNumber, 1),
                options: {
                    isWholeLine: true,
                    className: `selectedLines-${disassemblyViewId}`,
                    overviewRuler: {
                        color: codeColors[disassemblyViewId],
                        position: monaco.editor.OverviewRulerLane.Full,
                    },
                    minimap: {
                        color: codeColors[disassemblyViewId] + 'FF',
                        position: monaco.editor.MinimapPosition.Inline,
                    },
                    zIndex: 2,
                },
            })))
        }
        
        // mouse highlight
        const linesToHighlight = mouseHighlight.source_selection.find(selection => selection.source_file === file_name)?.lines.map(line => line + 1) // make it 1-based
        if(linesToHighlight !== undefined) {
            // Create decorations for the specified lines
            decorations.push(...linesToHighlight.map((lineNumber) => ({
                range: new monaco.Range(lineNumber, 1, lineNumber, 1),
                options: {
                    isWholeLine: true,
                    className: `mouseHoverHighlight`,
                    overviewRuler: {
                        color: '#000000ff',
                        position: monaco.editor.OverviewRulerLane.Full,
                    },
                    minimap: {
                        color: '#000000ff',
                        position: monaco.editor.MinimapPosition.Inline,
                    },
                    zIndex: 3,
                },
            })))
        }

        selectionDecorationCollection.set(decorations)
    }, [selections, file_name, editorRefUpdated, selectionDecorationCollection, mouseHighlight])
    
    // add decorations for hovered lines
    React.useEffect(() => {
        if(editorRef.current === null || correspondenceDecorationCollection === null || Object.keys(correspondences).length === 0) return
            
        editorRef.current.onMouseMove((e) => {
            if (e.target.type !== monaco.editor.MouseTargetType.CONTENT_TEXT) return
            const lineNumber = e.target.position.lineNumber - 1
            const addresses: { [binaryFilePath: string]: number[] } = {}
            validBinaryFilePaths.forEach((binaryFilePath) => {
                addresses[binaryFilePath] = correspondences[binaryFilePath][lineNumber]
            })
            if (Object.keys(addresses).length === 0) return
            dispatch(setMouseHighlight({
                addresses: addresses,
                source_selection: [{
                    source_file: file_name,
                    lines: [lineNumber]
                }]
            }))
        })
            
        editorRef.current.onDidChangeCursorSelection((e) => {
            const selection = editorRef.current!.getSelection()
            if (selection === null) return
            if (Object.keys(correspondences).length === 0) return
            const startLine = selection.selectionStartLineNumber - 1
            const endLine = selection.endLineNumber - 1
            const finalSelection = {
                start: Math.min(startLine, endLine),
                end: Math.max(startLine, endLine),
            }

            const addresses = new Set<number>()
            for(let i = finalSelection.start; i <= finalSelection.end; i++) {
                correspondences[activeBinaryFilePath][i].forEach(address => {
                    addresses.add(address)
                })
            }
            if (addresses.size === 0) return
            dispatch(setSourceLineSelection({
                binaryFilePath: activeBinaryFilePath,
                addresses: Array.from(addresses),
                source_selection: [{
                    source_file: file_name,
                    lines: Array.from({length: finalSelection.end - finalSelection.start + 1}, (_, i) => i + finalSelection.start)
                }]
            }))
        })
    }, [correspondences, file_name, editorRefUpdated, dispatch, correspondenceDecorationCollection])
    
    // add glyph decorations for line tags
    React.useEffect(() => {
        const glyphMargins = Array.from(document.getElementsByClassName('line-tags'))
        console.log("🚀 ~ glyphMargins:", glyphMargins)
        // line-tags col-1-I col-2-I col-3-X col-4-I col-5-X col-6-X
        glyphMargins.forEach((element) => {
            const classNames = element.classList
            classNames.forEach((className) => {
                if (!className.startsWith('col-')) return
                console.log("🚀 ~ className:", className)
                const thisTags = Object.values(TAGS_TO_LETTERS).map(v => v.letter).filter(l => l !== 'X').join('')
                console.log(String.raw`/^col-(\d+)-([${thisTags}]+)$/`)
                const match =  className.match(
                    new RegExp(String.raw`/^col-(\d+)-([${thisTags}]+)$/`)
                )
                console.log("🚀 ~ match:", match)
                
                if (match) {
                    console.log(match)
                    const col = parseInt(match[1])
                    console.log("🚀 ~ col:", col)
                    const tags = match[2].split('')
                    console.log("🚀 ~ tags:", tags)
                    const color = tags.map(t => Object.values(TAGS_TO_LETTERS).find(v => v.letter === t)!.color).join('')
                    console.log("🚀 ~ color:", color)
                    
                    // Create the tag node and append it to the glyph margin
                    const text = document.createElement('div')
                    text.textContent = tags.join('')
                    console.log("🚀 ~ tags:", tags)
                    text.style.color = color
                    text.style.fontSize = '10px'
                    text.style.fontWeight = 'bold'
                    text.style.textAlign = 'center'
                    text.style.width = '80px'

                    element.appendChild(text)
                }
            })

        })
    })
    
    return <Suspense fallback={<div>Loading source code...</div>}>
        {/* title row */}
        <div className="source-view-title-row" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px',
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: 'white',
            width: nLineTags * 30,
        }}>
            {Array.from({length: nLineTags}, (_, i) => i+1).map(i =>
                <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20px',
                    height: '20px',
                    backgroundColor: 'lightblue',
                    borderRadius: '50%',
                    marginRight: '5px',
                }}>{i}</div>
            )}
        </div>
        <div className='no-text-selection'>
            <MonacoEditor
                height="90vh"
                width="100%"
                language="cpp"
                value={sourceCode}
                options={monacoOptions}
                onMount={(editor, _) => {
                    editorRef.current = editor
                    setEditorRefUpdated(true)
                    setSelectionDecorationCollection(editor.createDecorationsCollection())
                    setCorrespondenceDecorationCollection(editor.createDecorationsCollection())
                }}
                path={file_name}
                saveViewState={false}
                // theme="vs-dark"
                theme="light"
                loading={`Loading ${file_name}...`}
            />
        </div>
    </Suspense>
}

export default SourceView