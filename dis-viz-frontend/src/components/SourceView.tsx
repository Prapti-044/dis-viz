import React, { Suspense } from 'react'
import '../styles/sourceview.css'
import { setSelection } from '../features/selections/selectionsSlice'
import * as api from '../api'
import { SRC_LINE_TAG } from '../types'
import { useAppSelector, useAppDispatch } from '../app/hooks'
import { selectSelection } from '../features/selections/selectionsSlice'
import { selectBinaryFilePaths } from '../features/binary-data/binaryDataSlice'
import MonacoEditor, { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'

loader.config({ monaco });

const TAGS_TO_LETTERS = {
    'VECTORIZED': {
        letter: 'v',
        box_color: 'cyan',
        text_color: 'black',
    },
    'INLINE': {
        letter: 'i',
        box_color: 'green',
        text_color: 'white',
    },
    'NO_TAG': {
        letter: '-',
        box_color: '#f5f5f5',
        text_color: '#fefefe',
    }
}

function SourceView({ file_name }: {
    file_name: string,
}) {
    const dispatch = useAppDispatch()
    const thisSelection = useAppSelector(selectSelection).source_selection.filter(selection => selection.source_file === file_name)[0]
    console.log("thisSelection", thisSelection)
    console.log("thisSelection.lines", thisSelection?.source_lines)
    const selectedLines = React.useMemo(() => thisSelection?.source_lines ?? [], [thisSelection])
    console.log("selectedLines", selectedLines)
    const binaryFilePaths = useAppSelector(selectBinaryFilePaths)
    const validBinaryFilePaths = binaryFilePaths.filter(f => f !== '')
    // const mouseHighlight = useAppSelector(selectHoverHighlight)
    const [tagsNeedUpdate, setTagsNeedUpdate] = React.useState(false)

    const [sourceCode, setSourceCode] = React.useState("")
    const [correspondences, setCorrespondences] = React.useState<{ [binaryFilePath: string]: number[][] }>({})
    const [lineTags, setLineTags] = React.useState<SRC_LINE_TAG[][][]>([])
    const nLineTags = validBinaryFilePaths.length

    const editorRef = React.useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

    const [editorRefUpdated, setEditorRefUpdated] = React.useState(false)
    const [selectionDecorationCollection, setSelectionDecorationCollection] = React.useState<monaco.editor.IEditorDecorationsCollection | null>(null)
    const [correspondenceDecorationCollection, setCorrespondenceDecorationCollection] = React.useState<monaco.editor.IEditorDecorationsCollection | null>(null)

    const monacoOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
        lineNumbers: "on",
        lineNumbersMinChars: nLineTags * 4,
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
            const tmpLineTags: SRC_LINE_TAG[][][] = Array.from({ length: sourceFile.lines.length }, () => Array.from({ length: nLineTags }, () => []))
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
                )
            })
            setSourceCode(tmpSourceCode)
            setCorrespondences(tmpCorrespondences)
            setLineTags(tmpLineTags)
        })
    }, [binaryFilePaths, file_name])

    // add decorations for lines with correspondences
    React.useEffect(() => {
        if (editorRef.current === null || correspondenceDecorationCollection === null) return
        if (Object.keys(correspondences).length === 0) return

        // pick the lines that have a correspondence
        const linesWithCorrespondences = new Set<number>()
        validBinaryFilePaths.forEach((binaryFilePath) => {
            correspondences[binaryFilePath].forEach((addresses, line) => {
                if (addresses.length > 0) {
                    linesWithCorrespondences.add(line + 1) // make it 1-based
                }
            })
        })
        const decorations: monaco.editor.IModelDeltaDecoration[] = [...linesWithCorrespondences].map((line) => ({
            range: new monaco.Range(line, 1, line, 1),
            options: {
                isWholeLine: true,
                lineNumberClassName: 'hasCorrespondence',
                // overviewRuler: {
                //     color: 'lightgreen',
                //     position: monaco.editor.OverviewRulerLane.Full,
                // },
                // minimap: {
                //     color: '#90EE9088',
                //     position: monaco.editor.MinimapPosition.Inline,
                // },
                zIndex: 1,
            },
        }))

        // add line number glyph decorations for line tags
        lineTags.forEach((tags, line) => {
            const tagsClass = 'line-tags ' + tags.map((binaryTags, i) => {
                const sortedBinaryTags = [...binaryTags]; sortedBinaryTags.sort();
                return `col-${i + 1}-` + sortedBinaryTags.map(t => TAGS_TO_LETTERS[t].letter).join('')
            }).join(" ").replace(/\s+/g, ' ')

            const lineNum = line + 1
            decorations.push({
                range: new monaco.Range(lineNum, 1, lineNum, 1),
                options: {
                    isWholeLine: true,
                    glyphMarginClassName: tagsClass,
                    zIndex: 2,
                },
            })
        })

        correspondenceDecorationCollection.set(decorations)
    }, [editorRefUpdated, correspondences, correspondenceDecorationCollection, lineTags])

    // add decoration for selected lines
    React.useEffect(() => {
        if (editorRef.current === null || selectionDecorationCollection === null) return
            
        console.log(selectedLines)

        const decorations: monaco.editor.IModelDeltaDecoration[] = selectedLines.map(l => l + 1).map((lineNumber) => ({
            range: new monaco.Range(lineNumber, 1, lineNumber, 1),
            options: {
                isWholeLine: true,
                className: 'selected-line',
                overviewRuler: {
                    color: 'lightgreen',
                    position: monaco.editor.OverviewRulerLane.Full,
                },
                minimap: {
                    color: 'lightgreen',
                    position: monaco.editor.MinimapPosition.Inline,
                },
                zIndex: 2,
            },
        }))

        // mouse highlight
        // const linesToHighlight = mouseHighlight.source_selection.find(selection => selection.source_file === file_name)?.lines.map(line => line + 1) // make it 1-based
        // if (linesToHighlight !== undefined) {
        //     // Create decorations for the specified lines
        //     decorations.push(...linesToHighlight.map((lineNumber) => ({
        //         range: new monaco.Range(lineNumber, 1, lineNumber, 1),
        //         options: {
        //             isWholeLine: true,
        //             className: `mouseHoverHighlight`,
        //             overviewRuler: {
        //                 color: '#000000ff',
        //                 position: monaco.editor.OverviewRulerLane.Full,
        //             },
        //             minimap: {
        //                 color: '#000000ff',
        //                 position: monaco.editor.MinimapPosition.Inline,
        //             },
        //             zIndex: 3,
        //         },
        //     })))
        // }
        selectionDecorationCollection.set(decorations)
        setTagsNeedUpdate(i => !i)
    }, [selectedLines, file_name, editorRefUpdated, selectionDecorationCollection
        // mouseHighlight
    ])

    function setThisSelection(binaryFilePath: string, addresses: number[]) {
        console.log(binaryFilePath, addresses, validBinaryFilePaths)
        api.getSourceAndBinaryCorrespondencesFromSelection(binaryFilePath, addresses, validBinaryFilePaths, 'memory_order').then(selections => {
            console.log(selections)
            dispatch(setSelection(selections))
        })
    }

    // add decorations for hovered lines
    React.useEffect(() => {
        if (editorRef.current === null || correspondenceDecorationCollection === null || Object.keys(correspondences).length === 0) return

        // editorRef.current.onMouseMove((e) => {
        //     if (e.target.type !== monaco.editor.MouseTargetType.CONTENT_TEXT) return
        //     const lineNumber = e.target.position.lineNumber - 1
        //     const addresses: { [binaryFilePath: string]: number[] } = {}
        //     validBinaryFilePaths.forEach((binaryFilePath) => {
        //         addresses[binaryFilePath] = correspondences[binaryFilePath][lineNumber]
        //     })
        //     if (Object.values(addresses).every(addresses => addresses.length === 0)) return
        //     dispatch(setMouseHighlight({
        //         addresses: addresses,
        //         source_selection: [{
        //             source_file: file_name,
        //             lines: [lineNumber]
        //         }]
        //     }))
        // })

        editorRef.current.onDidChangeCursorSelection((e) => {
            const selection = editorRef.current!.getSelection()
            if (selection === null || selection.startLineNumber > sourceCode.split('\n').length - 1) return
            if (Object.keys(correspondences).length === 0) return
            const startLine = selection.selectionStartLineNumber - 1
            const endLine = selection.endLineNumber - 1
            const finalSelection = {
                start: Math.min(startLine, endLine),
                end: Math.max(startLine, endLine),
            }
            
            const binaryFilePath = validBinaryFilePaths[0]
            const addresses: number[] = []
            for (let i = finalSelection.start; i <= finalSelection.end; i++) {
                correspondences[binaryFilePath][i].forEach(address => {
                    addresses.push(address)
                })
            }
            setThisSelection(binaryFilePath, addresses)
        })
    }, [correspondences, file_name, editorRefUpdated, dispatch, correspondenceDecorationCollection])

    // add glyph decorations for line tags
    React.useEffect(() => {
        const glyphMargins = Array.from(document.getElementsByClassName('line-tags') as HTMLCollectionOf<HTMLDivElement>)
        // line-tags col-1-I col-2-I col-3-X col-4-I col-5-X col-6-X

        // clear all existing tags
        glyphMargins.forEach((element) => {
            while (element.firstChild) {
                element.removeChild(element.firstChild)
            }
        })
        glyphMargins.forEach((element) => {
            element.style.width = `${nLineTags * 30}px`
            const classNames = element.classList
            classNames.forEach((className) => {
                if (!className.startsWith('col-')) return
                const thisTags = Object.values(TAGS_TO_LETTERS).map(v => v.letter).join('')
                const match = className.match(
                    new RegExp(String.raw`^col-(\d+)-([${thisTags}]+)$`)
                )

                if (match) {
                    const col = parseInt(match[1])
                    const tags = match[2].split('')
                    const box_color = tags.map(t => Object.values(TAGS_TO_LETTERS).find(v => v.letter === t)?.box_color || 'grey').join('')
                    const text_color = tags.map(t => Object.values(TAGS_TO_LETTERS).find(v => v.letter === t)?.text_color || 'black').join('')

                    // Create the tag glyph with rounded corners square and the tag text, the background color is the tag color
                    const text = document.createElement('div')
                    text.textContent = tags.join('')
                    text.style.backgroundColor = box_color
                    text.style.color = text_color
                    if (tags.some(tag => tag !== '-')) {
                        text.style.border = '1px solid black'
                    }

                    element.appendChild(text)
                }
            })

        })
    }, [lineTags, binaryFilePaths, nLineTags, tagsNeedUpdate])

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
            {Array.from({ length: nLineTags }, (_, i) => i + 1).map(i =>
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