import React, { Suspense } from 'react'
import '../styles/sourceview.css'
import { setSelection } from '../features/selections/selectionsSlice'
import * as api from '../api'
import { SRC_LINE_TAG } from '../types'
import { useAppSelector, useAppDispatch } from '../app/hooks'
import { selectSelection } from '../features/selections/selectionsSlice'
import { selectBinaryFilePaths } from '../features/binary-data/binaryDataSlice'
import { HIGHLIGHT_COLOR } from '../utils'
import MonacoEditor, { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'

loader.config({ monaco });

const TAG_WIDTH = 20
const TAGS = [
    {
        name: 'VECTORIZED',
        letter: 'v',
        color: ['#FAFAFA', '#69f4f4', '#00ffff'],
    },
    {
        name: 'INLINE',
        letter: 'i',
        color: ['#FAFAFA', '#c49935', '#9b7e1d'],
    },
    {
        name: 'MEMORY_READ',
        letter: 'r',
        color: ['#FAFAFA', '#a38eb3', '#75499c'],
    },
    {
        name: 'MEMORY_WRITE',
        letter: 'w',
        color: ['#FAFAFA', '#a3acea', '#576bf0'],
    },
    {
        name: 'CALL',
        letter: 'c',
        color: ['#FAFAFA', '#d494b0', '#c058a1'],
    },
    {
        name: 'SYSCALL',
        letter: 's',
        color: ['#FAFAFA', '#7c7dbb', '#4d50ad'],
    },
    {
        name: 'FP',
        letter: 'f',
        color: ['#FAFAFA', '#d88e4d', '#d96d20'],
    },
    {
        name: 'HOISTED',
        letter: 'h',
        color: ['#FAFAFA', '#f6d9ce', '#f6d9ce'],
    },
]
const TAG_BG_COLORS = ['#eeeeee', '#e68200', '#7e4801']

function SourceView({ file_name }: {
    file_name: string,
}) {
    const dispatch = useAppDispatch()
    const thisSelection = useAppSelector(selectSelection).source_selection.filter(selection => selection.source_file === file_name)[0]
    const selectedLines = React.useMemo(() => thisSelection?.source_lines ?? [], [thisSelection])
    const binaryFilePaths = useAppSelector(selectBinaryFilePaths)
    const validBinaryFilePaths = binaryFilePaths.filter(f => f !== '')
    // const mouseHighlight = useAppSelector(selectHoverHighlight)
    const [tagsNeedUpdate, setTagsNeedUpdate] = React.useState(false)

    const [sourceCode, setSourceCode] = React.useState("")
    const [correspondences, setCorrespondences] = React.useState<{ [binaryFilePath: string]: number[][] }>({})
    const [lineTags, setLineTags] = React.useState<number[][][]>([]) // [line][tag][binary]

    const editorRef = React.useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

    const [editorRefUpdated, setEditorRefUpdated] = React.useState(false)
    const [selectionDecorationCollection, setSelectionDecorationCollection] = React.useState<monaco.editor.IEditorDecorationsCollection | null>(null)
    const [correspondenceDecorationCollection, setCorrespondenceDecorationCollection] = React.useState<monaco.editor.IEditorDecorationsCollection | null>(null)

    const monacoOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
        lineNumbers: "on",
        lineNumbersMinChars: TAGS.length * TAG_WIDTH * 0.115,
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
            const tmpLineTags = Array.from({ length: sourceFile.lines.length }, () => Array.from({ length: TAGS.length }, () => [] as number[])) // [line][tag][binary]
            validBinaryFilePaths.forEach((binaryFilePath, binaryI) => {
                tmpCorrespondences[binaryFilePath] = sourceFile.lines.map(line => line.addresses[binaryFilePath])

                sourceFile.lines.forEach((line, lineI) => {
                    line.tags[binaryFilePath].forEach(tag => {
                        tmpLineTags[lineI][TAGS.findIndex(t => t.name === tag)].push(binaryI)
                    })
                })
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
                //     color: HIGHLIGHT_COLOR,
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
            const tagClasses = ['line-tags']
            
            tags.forEach((binaries, i) => {
                const tagLetter = TAGS[i].letter
                tagClasses.push(`${tagLetter}${binaries.join('')}`);
            })

            const lineNum = line + 1
            decorations.push({
                range: new monaco.Range(lineNum, 1, lineNum, 1),
                options: {
                    isWholeLine: true,
                    glyphMarginClassName: tagClasses.join(' '),
                    zIndex: 2,
                },
            })
        })

        correspondenceDecorationCollection.set(decorations)
    }, [editorRefUpdated, correspondences, correspondenceDecorationCollection, lineTags])

    // add decoration for selected lines
    React.useEffect(() => {
        if (editorRef.current === null || selectionDecorationCollection === null) return
            

        const decorations: monaco.editor.IModelDeltaDecoration[] = selectedLines.map(l => l + 1).map((lineNumber) => ({
            range: new monaco.Range(lineNumber, 1, lineNumber, 1),
            options: {
                isWholeLine: true,
                className: 'selected-line',
                overviewRuler: {
                    color: HIGHLIGHT_COLOR,
                    position: monaco.editor.OverviewRulerLane.Full,
                },
                minimap: {
                    color: HIGHLIGHT_COLOR,
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
        api.getSourceAndBinaryCorrespondencesFromSelection(binaryFilePath, addresses, validBinaryFilePaths, 'memory_order').then(selections => {
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
    
    // update tags when scrolling
    React.useEffect(() => {
        if (editorRef.current === null) return

        const disposable = editorRef.current.onDidScrollChange(() => {
            setTagsNeedUpdate(prev => !prev)
        })

        return () => {
            disposable.dispose()
        }
    }, [editorRef.current])

    // add glyph decorations for line tags
    React.useEffect(() => {
        const glyphMargins = Array.from(document.getElementsByClassName('line-tags') as HTMLCollectionOf<HTMLDivElement>)
        // line-tags v1 i f12 c2

        // clear all existing tags
        glyphMargins.forEach((element) => {
            while (element.firstChild)
                element.removeChild(element.firstChild)
        })
        glyphMargins.forEach((element) => {
            element.style.width = `${TAGS.length * TAG_WIDTH * 0.9}px`
            element.style.display = 'flex'
            element.style.justifyContent = 'flex-start'
            element.style.alignItems = 'center'
            element.style.gap = '5px'
            element.style.marginLeft = '10px'
            const classNames = element.classList
            
            // classNames is like v1 i f12 c2
            classNames.forEach((className) => {
                if (!className.match(new RegExp(`^[${TAGS.map(v => v.letter).join('')}]\\d*$`))) return
                    
                const thisTagLetter = className[0]
                const thisTagBinaries = className.slice(1).split('')

                const text = document.createElement('div')
                text.textContent = thisTagLetter
                text.style.color = '#00000000'
                text.style.backgroundColor = TAGS.find(tag => tag.letter === thisTagLetter)?.color[thisTagBinaries.length]!
                text.style.width = `${TAG_WIDTH * 0.8}px`
                text.style.height = `${15}px`
                text.style.borderRadius = '5%'
                text.style.display = 'flex'
                text.style.alignItems = 'center'
                text.style.justifyContent = 'center'
                
                // Add hover effect to show binary indices
                text.addEventListener('mouseenter', () => {
                    text.textContent = thisTagBinaries.join(',')
                    text.style.color = '#000000'
                })

                text.addEventListener('mouseleave', () => {
                    text.textContent = thisTagLetter
                    text.style.color = '#00000000'
                })
                element.appendChild(text)
            })
        })
    }, [lineTags, binaryFilePaths, tagsNeedUpdate])

    return <Suspense fallback={<div>Loading source code...</div>}>
        {/* title row */}
        <div className="source-view-title-row" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px',
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: 'white',
            width: TAGS.length * TAG_WIDTH,
        }}>
            {TAGS.map(tag =>
                <div key={tag.letter} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: TAG_WIDTH,
                    height: TAG_WIDTH,
                    backgroundColor: tag.color[1],
                    borderRadius: '30%',
                    marginRight: '5px',
                }}><b>{tag.letter.toUpperCase()}</b></div>
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