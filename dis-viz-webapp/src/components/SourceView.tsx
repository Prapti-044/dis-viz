import React, { Suspense, useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { List, useListRef } from 'react-window';
import '../styles/sourceview.css';
import { setSelection, clearHoverHighlight, setHoverHighlight, BinarySelection } from '../features/selections/selectionsSlice';
import * as disvizProcessor from '../disvizProcessor';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import { selectSourceSelection, selectSourceHoverHighlight } from '../features/selections/selectionsSlice';
import { selectBinaryFilePaths } from '../features/binary-data/binaryDataSlice';
import { SOURCE_TAGS } from '../utils';
import { selectAllTagStates } from '../features/tags/tagsSlice';
import SourceLine, { highlightAllLines } from './SourceLine';
import { InlineEntry, CallGraphInfo, MemoryInfo } from '../types';
import { AppDispatch } from '../app/store';
import { CSSProperties, ReactElement } from 'react';

const LINE_HEIGHT = 20; // Fixed line height for virtualization

interface SourceViewProps {
    file_name: string;
}

// Define the props that will be passed to the row component
interface RowData {
    sourceLines: string[];
    highlightedLines: string[];
    correspondenceLines: Set<number>;
    selectedLines: number[];
    hoveredLines: number[];
    lineTags: number[][][];
    lineInlineTrees: { [line: number]: { [binary: string]: InlineEntry[] } };
    lineCallGraphInfo: { [line: number]: { [binary: string]: CallGraphInfo } };
    lineMemoryInfo: { [line: number]: { [binary: string]: MemoryInfo } };
    enabledTags: { [key: string]: boolean };
    validBinaryFilePaths: string[];
    correspondences: { [binaryFilePath: string]: number[][] };
    dispatch: AppDispatch;
    onLineClick: (lineIndex: number) => void;
    onLineMouseEnter: (lineIndex: number) => void;
    onLineMouseLeave: () => void;
}

// Row component props for react-window v2
interface RowRendererProps extends RowData {
    ariaAttributes: {
        "aria-posinset": number;
        "aria-setsize": number;
        role: "listitem";
    };
    index: number;
    style: CSSProperties;
}

// Row component for react-window
const RowRenderer = (props: RowRendererProps): ReactElement | null => {
    const {
        index,
        style,
        sourceLines,
        highlightedLines,
        correspondenceLines,
        selectedLines,
        hoveredLines,
        lineTags,
        lineInlineTrees,
        lineCallGraphInfo,
        lineMemoryInfo,
        enabledTags,
        validBinaryFilePaths,
        correspondences,
        dispatch,
        onLineClick,
        onLineMouseEnter,
        onLineMouseLeave,
    } = props;

    const lineIndex = index;
    const lineContent = sourceLines[lineIndex] || '';
    const highlightedHtml = highlightedLines[lineIndex] || '';
    const hasCorrespondence = correspondenceLines.has(lineIndex);
    const isSelected = selectedLines.includes(lineIndex);
    const isHovered = hoveredLines.includes(lineIndex);
    const tags = lineTags[lineIndex] || [];
    const inlineTree = lineInlineTrees[lineIndex];
    const callGraphInfoForLine = lineCallGraphInfo[lineIndex];
    const memoryInfoForLine = lineMemoryInfo[lineIndex];

    return (
        <SourceLine
            lineIndex={lineIndex}
            lineContent={lineContent}
            highlightedHtml={highlightedHtml}
            hasCorrespondence={hasCorrespondence}
            isSelected={isSelected}
            isHovered={isHovered}
            tags={tags}
            inlineTree={inlineTree}
            callGraphInfo={callGraphInfoForLine}
            memoryInfo={memoryInfoForLine}
            enabledTags={enabledTags}
            validBinaryFilePaths={validBinaryFilePaths}
            correspondences={correspondences}
            dispatch={dispatch}
            onClick={onLineClick}
            onMouseEnter={onLineMouseEnter}
            onMouseLeave={onLineMouseLeave}
            style={style}
        />
    );
};

function SourceView({ file_name }: SourceViewProps) {
    const dispatch = useAppDispatch();
    const thisSelection = useAppSelector(selectSourceSelection).find(selection => selection.source_file === file_name);
    const selectedLines = useMemo(() => thisSelection?.source_lines ?? [], [thisSelection]);
    const binaryFilePaths = useAppSelector(selectBinaryFilePaths);
    // Memoize to prevent new array reference on every render (was causing infinite loop)
    const validBinaryFilePaths = useMemo(() => binaryFilePaths.filter(f => f !== ''), [binaryFilePaths]);
    const mouseHighlight = useAppSelector(selectSourceHoverHighlight);
    const enabledTags = useAppSelector(selectAllTagStates);

    // Source code state
    const [sourceLines, setSourceLines] = useState<string[]>([]);
    const [highlightedLines, setHighlightedLines] = useState<string[]>([]);
    const [correspondences, setCorrespondences] = useState<{ [binaryFilePath: string]: number[][] }>({});
    const [lineTags, setLineTags] = useState<number[][][]>([]); // [line][tag][binary]
    const [lineInlineTrees, setLineInlineTrees] = useState<{ [line: number]: { [binary: string]: InlineEntry[] } }>({});
    const [lineCallGraphInfo, setLineCallGraphInfo] = useState<{ [line: number]: { [binary: string]: CallGraphInfo } }>({});
    const [lineMemoryInfo, setLineMemoryInfo] = useState<{ [line: number]: { [binary: string]: MemoryInfo } }>({});

    // Refs for virtualization
    const listRef = useListRef(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerHeight, setContainerHeight] = useState(600);

    // Compute correspondence lines set
    const correspondenceLines = useMemo(() => {
        const lines = new Set<number>();
        validBinaryFilePaths.forEach((binaryFilePath) => {
            correspondences[binaryFilePath]?.forEach((addresses, lineIndex) => {
                if (addresses.length > 0) {
                    lines.add(lineIndex);
                }
            });
        });
        return lines;
    }, [correspondences, validBinaryFilePaths]);

    // Compute hovered lines for this file
    const hoveredLines = useMemo(() => {
        return mouseHighlight.find(highlight => highlight.source_file === file_name)?.source_lines || [];
    }, [mouseHighlight, file_name]);

    // Load source file
    useEffect(() => {
        if (validBinaryFilePaths.length === 0) {
            setSourceLines([]);
            setHighlightedLines([]);
            setCorrespondences({});
            setLineTags([]);
            setLineInlineTrees({});
            setLineCallGraphInfo({});
            setLineMemoryInfo({});
            return;
        }

        const sourceFile = disvizProcessor.getSourceLines(validBinaryFilePaths, file_name);
        const lines = sourceFile.lines.map(line => line.line);
        setSourceLines(lines);

        // Pre-highlight all lines for better performance
        const highlighted = highlightAllLines(lines);
        setHighlightedLines(highlighted);

        // Extract correspondences and tags
        const tmpCorrespondences: { [binaryFilePath: string]: number[][] } = {};
        const tmpLineTags = Array.from(
            { length: sourceFile.lines.length },
            () => Array.from({ length: SOURCE_TAGS.length }, () => [] as number[])
        );
        const tmpLineInlineTrees: { [line: number]: { [binary: string]: InlineEntry[] } } = {};
        const tmpLineCallGraphInfo: { [line: number]: { [binary: string]: CallGraphInfo } } = {};
        const tmpLineMemoryInfo: { [line: number]: { [binary: string]: MemoryInfo } } = {};

        validBinaryFilePaths.forEach((binaryFilePath, binaryI) => {
            tmpCorrespondences[binaryFilePath] = sourceFile.lines.map(line => line.addresses[binaryFilePath] || []);

            sourceFile.lines.forEach((line, lineI) => {
                if (line.tags[binaryFilePath]) {
                    line.tags[binaryFilePath].forEach(tag => {
                        const tagIndex = SOURCE_TAGS.findIndex(t => t.id === tag);
                        if (tagIndex >= 0) {
                            tmpLineTags[lineI][tagIndex].push(binaryI);
                        }
                    });
                }

                // Extract inline trees
                if (line.inline_tree && line.inline_tree[binaryFilePath] && line.inline_tree[binaryFilePath].length > 0) {
                    if (!tmpLineInlineTrees[lineI]) {
                        tmpLineInlineTrees[lineI] = {};
                    }
                    tmpLineInlineTrees[lineI][binaryFilePath] = line.inline_tree[binaryFilePath];
                }

                // Extract call graph info
                if (line.call_graph_info && line.call_graph_info[binaryFilePath]) {
                    if (!tmpLineCallGraphInfo[lineI]) {
                        tmpLineCallGraphInfo[lineI] = {};
                    }
                    tmpLineCallGraphInfo[lineI][binaryFilePath] = line.call_graph_info[binaryFilePath];
                }

                // Extract memory info
                if (line.memory_info && line.memory_info[binaryFilePath]) {
                    if (!tmpLineMemoryInfo[lineI]) {
                        tmpLineMemoryInfo[lineI] = {};
                    }
                    tmpLineMemoryInfo[lineI][binaryFilePath] = line.memory_info[binaryFilePath];
                }
            });
        });

        setCorrespondences(tmpCorrespondences);
        setLineTags(tmpLineTags);
        setLineInlineTrees(tmpLineInlineTrees);
        setLineCallGraphInfo(tmpLineCallGraphInfo);
        setLineMemoryInfo(tmpLineMemoryInfo);
    }, [validBinaryFilePaths, file_name]);

    // Handle container resize
    useEffect(() => {
        if (!containerRef.current) return;

        const updateHeight = () => {
            if (containerRef.current) {
                setContainerHeight(containerRef.current.clientHeight);
            }
        };

        updateHeight();

        const resizeObserver = new ResizeObserver(updateHeight);
        resizeObserver.observe(containerRef.current);

        return () => resizeObserver.disconnect();
    }, []);

    // Scroll to selected lines when selection changes
    useEffect(() => {
        if (selectedLines.length > 0 && listRef.current) {
            const firstSelectedLine = selectedLines[0];
            listRef.current.scrollToRow({ index: firstSelectedLine, align: 'center' });
        }
    }, [selectedLines, listRef]);

    // Handle line click
    const handleLineClick = useCallback((lineIndex: number) => {
        const addresses: BinarySelection[] = [];
        validBinaryFilePaths.forEach((binaryFilePath) => {
            if (correspondences[binaryFilePath]?.[lineIndex]?.length > 0) {
                addresses.push({
                    binary_file: binaryFilePath,
                    addresses: correspondences[binaryFilePath][lineIndex]
                });
            }
        });

        dispatch(setSelection({
            source_selection: [{
                source_file: file_name,
                source_lines: [lineIndex]
            }],
            binary_selection: addresses
        }));
    }, [dispatch, file_name, correspondences, validBinaryFilePaths]);

    // Handle line hover
    const handleLineMouseEnter = useCallback((lineIndex: number) => {
        const addresses: BinarySelection[] = [];
        validBinaryFilePaths.forEach((binaryFilePath) => {
            if (correspondences[binaryFilePath]?.[lineIndex]?.length > 0) {
                addresses.push({
                    binary_file: binaryFilePath,
                    addresses: correspondences[binaryFilePath][lineIndex]
                });
            }
        });

        if (addresses.length === 0) {
            dispatch(clearHoverHighlight());
            return;
        }

        dispatch(setHoverHighlight({
            source_hover_highlight: [{
                source_file: file_name,
                source_lines: [lineIndex]
            }],
            binary_hover_highlight: addresses
        }));
    }, [dispatch, file_name, correspondences, validBinaryFilePaths]);

    // Handle mouse leave
    const handleLineMouseLeave = useCallback(() => {
        dispatch(clearHoverHighlight());
    }, [dispatch]);

    // Memoize row data to prevent unnecessary re-renders
    const rowData = useMemo<RowData>(() => ({
        sourceLines,
        highlightedLines,
        correspondenceLines,
        selectedLines,
        hoveredLines,
        lineTags,
        lineInlineTrees,
        lineCallGraphInfo,
        lineMemoryInfo,
        enabledTags,
        validBinaryFilePaths,
        correspondences,
        dispatch,
        onLineClick: handleLineClick,
        onLineMouseEnter: handleLineMouseEnter,
        onLineMouseLeave: handleLineMouseLeave,
    }), [
        sourceLines,
        highlightedLines,
        correspondenceLines,
        selectedLines,
        hoveredLines,
        lineTags,
        lineInlineTrees,
        lineCallGraphInfo,
        lineMemoryInfo,
        enabledTags,
        validBinaryFilePaths,
        correspondences,
        dispatch,
        handleLineClick,
        handleLineMouseEnter,
        handleLineMouseLeave,
    ]);

    return (
        <Suspense fallback={<div>Loading source code...</div>}>
            <div
                ref={containerRef}
                className="source-view-container no-text-selection"
                style={{ height: '90vh', overflow: 'hidden', position: 'relative' }}
            >
                {sourceLines.length > 0 ? (
                    <List<RowData>
                        listRef={listRef}
                        defaultHeight={containerHeight}
                        rowCount={sourceLines.length}
                        rowHeight={LINE_HEIGHT}
                        rowComponent={RowRenderer}
                        rowProps={rowData}
                        className="source-view-list"
                    />
                ) : (
                    <div className="source-view-empty">
                        Loading {file_name}...
                    </div>
                )}
            </div>
        </Suspense>
    );
}

export default SourceView;
