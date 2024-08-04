import React, { Suspense } from 'react'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import '../styles/sourceview.css'
import { codeColors } from '../utils'
import * as api from '../api'
import { useAppSelector, useAppDispatch } from '../app/hooks'
import { selectSelections, setSourceLineSelection, setMouseHighlight, selectHoverHighlight } from '../features/selections/selectionsSlice'
import { selectBinaryFilePath } from '../features/binary-data/binaryDataSlice'
import MonacoEditor, { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'

loader.config({ monaco });

function SourceView({ file_name }:{
    file_name: string,
}) {
    const dispatch = useAppDispatch()
    const selections = useAppSelector(selectSelections)
    const binaryFilePath = useAppSelector(selectBinaryFilePath)!
    const mouseHighlight = useAppSelector(selectHoverHighlight)

    const [sourceCode, setSourceCode] = React.useState("")
    const [correspondences, setCorrespondences] = React.useState<number[][]>([])
    const [lineTags, setLineTags] = React.useState<string[][]>([])

    const editorRef = React.useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

    const [editorRefUpdated, setEditorRefUpdated] = React.useState(false)
    const [selectionDecorationCollection, setSelectionDecorationCollection] = React.useState<monaco.editor.IEditorDecorationsCollection | null>(null)
    const [correspondenceDecorationCollection, setCorrespondenceDecorationCollection] = React.useState<monaco.editor.IEditorDecorationsCollection | null>(null)
    
    const monacoOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
        lineNumbers: "on",
        lineNumbersMinChars: 3,
        glyphMargin: true, // gap before line numbers
        // lineDecorationsWidth: "10ch", // gap after line numbers
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
        // folding: false, // Disables folding
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
        api.getSourceLines(binaryFilePath, file_name).then(sourceFile => {
            let tmpSourceCode = ""
            sourceFile.lines.map(line => line.line).forEach((line) => {
                tmpSourceCode += line
            })
            setCorrespondences(sourceFile.lines.map(line => line.addresses))
            setSourceCode(tmpSourceCode)
            setLineTags(sourceFile.lines.map(line => line.tags))
        })
    }, [binaryFilePath, file_name])
    
    // add decorations for lines with correspondences
    React.useEffect(() => {
        if(editorRef.current === null || correspondenceDecorationCollection === null) return
            
        // pick the lines that have a correspondence
        const linesWithCorrespondences: number[] = []
        correspondences.forEach((addresses, line) => {
            if(addresses.length > 0) {
                linesWithCorrespondences.push(line + 1) // make it 1-based
            }
        })
        // add the decorations
        const decorations: monaco.editor.IModelDeltaDecoration[] = linesWithCorrespondences.map((line) => ({
            range: new monaco.Range(line, 1, line, 1),
            options: {
                isWholeLine: true,
                lineNumberClassName: 'hasCorrespondence',
                overviewRuler: {
                    color: 'lightgreen',
                    position: monaco.editor.OverviewRulerLane.Full,
                },
                minimap: {
                    color: '#90EE9088',
                    position: monaco.editor.MinimapPosition.Inline,
                },
                zIndex: 1,
            },
        }))
        
        correspondenceDecorationCollection.set(decorations)
    }, [editorRefUpdated, correspondences, correspondenceDecorationCollection])
    
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
                    className: `selectedLines-${disassemblyViewId}`, // Add a custom class for highlighting
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
                    className: 'mouseHoverHighlight', // Add a custom class for highlighting
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selections, file_name, editorRefUpdated, selectionDecorationCollection, mouseHighlight])
    
    // add decorations for hovered lines
    React.useEffect(() => {
        if(editorRef.current === null || correspondenceDecorationCollection === null || correspondences.length === 0) return
            
        editorRef.current.onMouseMove((e) => {
            if (e.target.type !== monaco.editor.MouseTargetType.CONTENT_TEXT) return
            const lineNumber = e.target.position.lineNumber - 1
            const addresses = correspondences[lineNumber]
            if (addresses.length === 0) return
            console.log("addresses", addresses)
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
            if (correspondences.length === 0) return
            const startLine = selection.selectionStartLineNumber - 1
            const endLine = selection.endLineNumber - 1
            const finalSelection = {
                start: Math.min(startLine, endLine),
                end: Math.max(startLine, endLine),
            }

            const addresses = new Set<number>()
            for(let i = finalSelection.start; i <= finalSelection.end; i++) {
                correspondences[i].forEach(address => {
                    addresses.add(address)
                })
            }
            if (addresses.size === 0) return
            dispatch(setSourceLineSelection({
                addresses: Array.from(addresses),
                source_selection: [{
                    source_file: file_name,
                    lines: Array.from({length: finalSelection.end - finalSelection.start + 1}, (_, i) => i + finalSelection.start)
                }]
            }))
        })

    }, [correspondences, file_name, editorRefUpdated, dispatch])
    

    return <Suspense fallback={<div>Loading source code...</div>}>
        <div className='no-text-selection'>
            <MonacoEditor
                height="100vh"
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