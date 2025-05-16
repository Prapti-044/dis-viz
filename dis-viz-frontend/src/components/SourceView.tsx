import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import '../styles/sourceview.css'
import { setSelection, clearHoverHighlight, setHoverHighlight, clearSelection, BinarySelection } from '../features/selections/selectionsSlice'
import * as api from '../api'
import { useAppSelector, useAppDispatch } from '../app/hooks'
import { selectSourceSelection, selectSourceHoverHighlight } from '../features/selections/selectionsSlice'
import { selectBinaryFilePaths } from '../features/binary-data/binaryDataSlice'
import { HIGHLIGHT_COLOR, SOURCE_TAGS } from '../utils'
import MonacoEditor, { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import { selectAllTagStates } from '../features/tags/tagsSlice'
loader.config({ monaco });

function SourceView({ file_name }: {
    file_name: string,
}) {
    const dispatch = useAppDispatch()
    const thisSelection = useAppSelector(selectSourceSelection).find(selection => selection.source_file === file_name)
    const selectedLines = React.useMemo(() => thisSelection?.source_lines ?? [], [thisSelection])
    const binaryFilePaths = useAppSelector(selectBinaryFilePaths)
    const validBinaryFilePaths = binaryFilePaths.filter(f => f !== '')
    const mouseHighlight = useAppSelector(selectSourceHoverHighlight)

    const [sourceCode, setSourceCode] = React.useState("")
    const [correspondences, setCorrespondences] = React.useState<{ [binaryFilePath: string]: number[][] }>({})
    const [lineTags, setLineTags] = React.useState<number[][][]>([]) // [line][tag][binary]
    const enabledTags = useAppSelector(selectAllTagStates);
    
    const editorRef = React.useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

    const [editorRefUpdated, setEditorRefUpdated] = React.useState(false)
    const [selectionDecorationCollection, setSelectionDecorationCollection] = React.useState<monaco.editor.IEditorDecorationsCollection | null>(null)
    const [correspondenceDecorationCollection, setCorrespondenceDecorationCollection] = React.useState<monaco.editor.IEditorDecorationsCollection | null>(null)
    const [tagsDecorationCollection, setTagsDecorationCollection] = React.useState<monaco.editor.IEditorDecorationsCollection | null>(null)

    const monacoOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
        lineNumbers: "on",
        lineNumbersMinChars: 1,
        glyphMargin: true, // gap before line numbers
        lineDecorationsWidth: 1 + "ch",
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
        codeLens: true, // Enable CodeLens
        lightbulb: { enabled: monaco.editor.ShowLightbulbIconMode.Off }, // Disables lightbulb
        folding: false,
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
            const tmpLineTags = Array.from({ length: sourceFile.lines.length }, () => Array.from({ length: SOURCE_TAGS.length }, () => [] as number[])) // [line][tag][binary]
            validBinaryFilePaths.forEach((binaryFilePath, binaryI) => {
                tmpCorrespondences[binaryFilePath] = sourceFile.lines.map(line => line.addresses[binaryFilePath])

                sourceFile.lines.forEach((line, lineI) => {
                    line.tags[binaryFilePath].forEach(tag => {
                        tmpLineTags[lineI][SOURCE_TAGS.findIndex(t => t.id === tag)].push(binaryI)
                    })
                })
            })
            setSourceCode(tmpSourceCode)
            setCorrespondences(tmpCorrespondences)
            setLineTags(tmpLineTags)
        })
    }, [binaryFilePaths, file_name])

    // add decorations for lines with correspondences and tags
    React.useEffect(() => {
        if (editorRef.current === null || correspondenceDecorationCollection === null || tagsDecorationCollection === null) return
        if (Object.keys(correspondences).length === 0) return

        const editor = editorRef.current;

        // Keep track of current widgets
        const currentWidgets = new Set<string>();

        // Function to create and position widgets
        function createAndPositionWidgets() {
            // Remove existing widgets
            const widgetIds = lineTags.map((_, line) => `tags.line.${line}`);
            widgetIds.forEach(id => {
                if (currentWidgets.has(id)) {
                    try {
                        const dummyElement = document.createElement('div');
                        editor.removeContentWidget({
                            getId: () => id,
                            getDomNode: () => dummyElement,
                            getPosition: () => null
                        });
                        currentWidgets.delete(id);
                    } catch (e) {
                        // Widget might not exist yet
                    }
                }
            });

            // Add content widgets for tags
            lineTags.forEach((tags, line) => {
                // Only create widget if there are enabled tags
                if (tags.every(binaries => binaries.length === 0 || !enabledTags[SOURCE_TAGS[tags.indexOf(binaries)].id])) {
                    return;
                }

                const widgetId = `tags.line.${line}`;
                if (currentWidgets.has(widgetId)) {
                    return; // Skip if widget already exists
                }

                const contentWidget: monaco.editor.IContentWidget = {
                    allowEditorOverflow: true,
                    getId: function () {
                        return widgetId;
                    },
                    getDomNode: function () {
                        const container = document.createElement('div');
                        container.style.width = '100%';  // Make container full width
                        const root = ReactDOM.createRoot(container);
                        root.render(
                            <div className="right-tags-wrapper">
                                <div className="right-tags">
                                    {tags.map((binaries, tagIndex) =>
                                        binaries.length > 0 && enabledTags[SOURCE_TAGS[tagIndex].id] && (
                                            <div key={tagIndex + line.toString()} className="right-tags-container" 
                                                style={{
                                                    border: `2px solid ${SOURCE_TAGS[tagIndex].borderColor}`,
                                                    color: SOURCE_TAGS[tagIndex].textColor,
                                                    backgroundColor: SOURCE_TAGS[tagIndex].color,
                                                    fontFamily: 'Consolas',
                                                }}>
                                                <div className="right-tag">
                                                    <span className="right-tag-name">{SOURCE_TAGS[tagIndex].shortName}</span>
                                                    {validBinaryFilePaths.length > 1 && (
                                                        <div className="right-tag-binaries">
                                                            {validBinaryFilePaths.map((binaryPath, binaryIndex) => (
                                                                <div
                                                                    className={`right-tag-binary ${tags[tagIndex].includes(binaryIndex) ? 'active' : 'inactive'}`}
                                                                    key={`${line}-${tagIndex}-${binaryIndex}`}
                                                                    title={binaryPath.split('/').pop()}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        );
                        return container;
                    },
                    getPosition: function () {
                        return {
                            position: {
                                lineNumber: line + 1,
                                column: 0
                            },
                            preference: [monaco.editor.ContentWidgetPositionPreference.EXACT]
                        };
                    }
                };
                editor.addContentWidget(contentWidget);
                currentWidgets.add(widgetId);
            });
        }

        // Create initial widgets
        createAndPositionWidgets();

        // Add resize listener with debounce
        let resizeTimeout: NodeJS.Timeout;
        const disposable = editor.onDidLayoutChange(() => {
            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }
            resizeTimeout = setTimeout(() => {
                createAndPositionWidgets();
            }, 100); // Debounce resize events
        });

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
                const tagLetter = SOURCE_TAGS[i].shortName
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

        return () => {
            disposable.dispose();
            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }
            // Clean up all widgets on unmount
            currentWidgets.forEach(id => {
                try {
                    const dummyElement = document.createElement('div');
                    editor.removeContentWidget({
                        getId: () => id,
                        getDomNode: () => dummyElement,
                        getPosition: () => null
                    });
                } catch (e) {
                    // Widget might already be removed
                }
            });
        };
    }, [editorRefUpdated, correspondences, correspondenceDecorationCollection, lineTags, tagsDecorationCollection, enabledTags]);

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
                linesDecorationsClassName: 'selection-line-button',
                beforeContentClassName: 'selection-button-container',
            },
        }))

        // mouse highlight
        const linesToHighlight = mouseHighlight.find(highlight => highlight.source_file === file_name)?.source_lines.map(line => line + 1) || [] // make it 1-based

        if (linesToHighlight.length > 0) {
            // Create decorations for the specified lines
            decorations.push(...linesToHighlight.map((lineNumber) => ({
                range: new monaco.Range(lineNumber, 1, lineNumber, 1),
                options: {
                    isWholeLine: true,
                    className: `mouseHoverHighlight`,
                    overviewRuler: {
                        color: '#00000088',
                        position: monaco.editor.OverviewRulerLane.Full,
                    },
                    minimap: {
                        color: '#00000088',
                        position: monaco.editor.MinimapPosition.Inline,
                    },
                    zIndex: 3,
                },
            })))
        }
        selectionDecorationCollection.set(decorations)
    }, [selectedLines, file_name, editorRefUpdated, selectionDecorationCollection, mouseHighlight])

    // add decorations for hovered lines
    React.useEffect(() => {
        if (editorRef.current === null || correspondenceDecorationCollection === null || Object.keys(correspondences).length === 0) return

        editorRef.current.onMouseMove((e) => {
            if (e.target.type !== monaco.editor.MouseTargetType.CONTENT_TEXT) {
                // Clear hover highlights when mouse is not over text
                dispatch(clearHoverHighlight())
                return
            }
            
            const lineNumber = e.target.position.lineNumber - 1
            const addresses: BinarySelection[] = []
            validBinaryFilePaths.forEach((binaryFilePath) => {
                if (correspondences[binaryFilePath][lineNumber].length > 0) {
                    addresses.push({
                        binary_file: binaryFilePath,
                        addresses: correspondences[binaryFilePath][lineNumber]
                    })
                }
            })
            
            // Only update if there are addresses to highlight
            if (addresses.length === 0) {
                dispatch(clearHoverHighlight())
                return
            }

            // Update source hover highlight
            dispatch(setHoverHighlight({
                source_hover_highlight: [{
                    source_file: file_name,
                    source_lines: [lineNumber]
                }],
                binary_hover_highlight: addresses
            }))
        })
        
        editorRef.current.onDidChangeCursorPosition((e) => {
            const selection = editorRef.current!.getPosition()?.lineNumber
            if (!selection || Object.keys(correspondences).length === 0) return
            const lineNumber = selection - 1

            const addresses: BinarySelection[] = []
            validBinaryFilePaths.forEach((binaryFilePath) => {
                if (correspondences[binaryFilePath][lineNumber].length > 0) {
                    addresses.push({
                        binary_file: binaryFilePath,
                        addresses: correspondences[binaryFilePath][lineNumber]
                    })
                }
            })
            dispatch(setSelection({
                source_selection: [{
                    source_file: file_name,
                    source_lines: [lineNumber]
                }],
                binary_selection: addresses
            }))
        })

        // Handle the click on the selection line button
        function handleSelectionButtonClick(lineNumber: number, file: string, element: HTMLElement | null) {
            const binaryFilePath = validBinaryFilePaths[0]
            api.getSelectionFromBinary_indirect(binaryFilePath, correspondences[binaryFilePath][lineNumber], validBinaryFilePaths, 'memory_order').then(selections => {
                dispatch(setSelection(selections))
            })
            
            // Add clicked class to the button element
            if (element) {
                if (element.classList.contains('selection-button-container')) {
                    element.classList.add('clicked');
                } else if (element.parentElement?.classList.contains('selection-button-container')) {
                    element.parentElement.classList.add('clicked');
                }
            }
        }

        // Add click handler for selection buttons
        const disposable = editorRef.current.onMouseDown((e) => {
            if (e.target.element?.classList.contains('selection-button-container') || 
                e.target.element?.parentElement?.classList.contains('selection-button-container')) {
                const lineNumber = e.target.position?.lineNumber;
                if (lineNumber) {
                    handleSelectionButtonClick(lineNumber - 1, file_name, e.target.element);
                }
            }
        });

        return () => {
            disposable.dispose();
        };
    }, [correspondences, file_name, editorRefUpdated, dispatch, correspondenceDecorationCollection, tagsDecorationCollection])

    return <Suspense fallback={<div>Loading source code...</div>}>
        {/* title row */}
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
                    setTagsDecorationCollection(editor.createDecorationsCollection())
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