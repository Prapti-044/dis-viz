import React, { useCallback, useMemo, useRef, useEffect, useState, Suspense, CSSProperties, ReactElement, createContext, useContext } from 'react';
import { List, useListRef } from 'react-window';
import { selectBinarySelection, clearHoverHighlight, setHoverHighlight } from '../features/selections/selectionsSlice';
import { selectBinaryFilePaths } from '../features/binary-data/binaryDataSlice';
import { BLOCK_ORDERS, InstructionBlock, Instruction } from '../types';
import * as disvizProcessor from '../disvizProcessor';
import DisassemblyMinimap from './DisassemblyMinimap';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { MinimapType } from '../features/minimap/minimapSlice';
import { isHex, toHex, HIGHLIGHT_COLOR, shortenName, INSTRUCTION_TAGS, findIntelDocs } from '../utils';
import { selectAllTagStates } from '../features/tags/tagsSlice';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { marginHorizontal, LOOP_INDENT_SIZE, BLOCK_MAX_WIDTH } from '../config';
import { AppDispatch } from '../store/store';
import useSelectionWithHistory from '../hooks/useSelectionWithHistory';

import '../styles/disassemblyview.css';

// Constants for virtualization - Variable heights for different row types
const INSTRUCTION_HEIGHT = 24;           // Instructions are compact
const BLOCK_HEADER_HEIGHT = 32;          // Block headers are slightly larger
const PSEUDOLOOP_HEIGHT = 50;            // Pseudoloop blocks are tall
const BLOCK_FOOTER_HEIGHT = 4;           // Just the bottom border
const CONTINUITY_ARROW_HEIGHT = 20;      // Arrow between connected blocks
const MARGIN_SAME_FUNCTION = 8;          // Small gap within same function
const MARGIN_NEW_FUNCTION = 40;          // Large gap for new function

// Constants for back edge rendering
const BACKEDGE_OFFSET_BASE = 60;         // Base horizontal offset from block edge
const BACKEDGE_LEVEL_OFFSET = 25;        // Additional offset per nesting level
const BACKEDGE_ARROW_SIZE = 8;           // Size of arrow head
const MAX_BACKEDGE_LEVELS = 8;           // Maximum supported nesting levels

// Row types for virtualization
type RowType = 
    | { type: 'block-header'; block: InstructionBlock; blockIndex: number; isFirstOfFunction: boolean }
    | { type: 'instruction'; instruction: Instruction; block: InstructionBlock; instructionIndex: number; blockIndex: number; isHidable: boolean; isLastInBlock: boolean }
    | { type: 'pseudoloop'; block: InstructionBlock; blockIndex: number; isFirstOfFunction: boolean }
    | { type: 'block-footer'; block: InstructionBlock; blockIndex: number }
    | { type: 'continuity-arrow'; block: InstructionBlock; blockIndex: number }
    | { type: 'margin'; height: number; blockIndex: number };

// Context for large data to avoid passing through react-window props
interface DisassemblyContextType {
    rows: RowType[];
    allBlocks: InstructionBlock[];
    thisBinarySelection: number[];
    hoveredAddresses: number[];
    blockOrder: BLOCK_ORDERS;
    enabledTags: { [key: string]: boolean };
    dispatch: AppDispatch;
    onLineClick: (instruction: Instruction) => void;
    onLineHover: (instruction: Instruction) => void;
    onLineLeave: () => void;
    onPseudoloopClick: (block: InstructionBlock) => void;
    onJumpClick: (targetBlockName: string) => void;
}

const DisassemblyContext = createContext<DisassemblyContextType | null>(null);

const useDisassemblyContext = () => {
    const context = useContext(DisassemblyContext);
    if (!context) throw new Error('useDisassemblyContext must be used within DisassemblyContext.Provider');
    return context;
};

interface DisassemblyViewProps {
    id: number;
    removeSelf: () => void;
    defaultBinaryFilePath?: string;
    showMinimap?: boolean;
}

// Props passed to row component (minimal - large data comes from context)
interface RowData {
    binaryFilePath: string;
    validBinaryFilePaths: string[];
}

// Row renderer props from react-window v2
interface RowRendererProps extends RowData {
    ariaAttributes: {
        "aria-posinset": number;
        "aria-setsize": number;
        role: "listitem";
    };
    index: number;
    style: CSSProperties;
}

// Back edge data structure
interface BackEdgeInfo {
    sourceBlockIndex: number;
    targetBlockIndex: number;
    sourceBlockName: string;
    targetBlockName: string;
    level: number; // Nesting level for horizontal offset
}

// Props for BackEdgesOverlay
interface BackEdgesOverlayProps {
    backEdges: BackEdgeInfo[];
    rows: RowType[];
    blockToRowIndex: Map<number, number>;
    allBlocks: InstructionBlock[];
    scrollTop: number;
    containerHeight: number;
    containerWidth: number;
}

// Compute cumulative heights for rows up to a given index
function computeRowTop(rows: RowType[], rowIndex: number): number {
    let top = 0;
    for (let i = 0; i < rowIndex && i < rows.length; i++) {
        top += getRowHeightForType(rows[i]);
    }
    return top;
}

// Get row height by type (helper for cumulative calculation)
function getRowHeightForType(row: RowType): number {
    switch (row.type) {
        case 'block-header': return BLOCK_HEADER_HEIGHT;
        case 'instruction': return INSTRUCTION_HEIGHT;
        case 'pseudoloop': return PSEUDOLOOP_HEIGHT;
        case 'block-footer': return BLOCK_FOOTER_HEIGHT;
        case 'continuity-arrow': return CONTINUITY_ARROW_HEIGHT;
        case 'margin': return row.height;
        default: return INSTRUCTION_HEIGHT;
    }
}

// Get block height (header + all instructions + footer)
function getBlockHeight(rows: RowType[], blockIndex: number, blockToRowIndex: Map<number, number>): number {
    const startRowIndex = blockToRowIndex.get(blockIndex);
    if (startRowIndex === undefined) return BLOCK_HEADER_HEIGHT;
    
    let height = 0;
    for (let i = startRowIndex; i < rows.length; i++) {
        const row = rows[i];
        if (row.type === 'margin' && i !== startRowIndex) break; // Next block's margin
        if ((row.type === 'block-header' || row.type === 'pseudoloop') && i !== startRowIndex) break;
        height += getRowHeightForType(row);
    }
    return height;
}

// BackEdgesOverlay component - renders all back edges as a single SVG
const BackEdgesOverlay = React.memo<BackEdgesOverlayProps>(({
    backEdges,
    rows,
    blockToRowIndex,
    allBlocks,
    scrollTop,
    containerHeight,
    containerWidth,
}) => {
    // Pre-compute cumulative heights for all rows
    const rowTops = useMemo(() => {
        const tops: number[] = [0];
        let cumulative = 0;
        for (let i = 0; i < rows.length; i++) {
            cumulative += getRowHeightForType(rows[i]);
            tops.push(cumulative);
        }
        return tops;
    }, [rows]);

    // Visible range in pixels
    const visibleTop = scrollTop;
    const visibleBottom = scrollTop + containerHeight;

    // Filter and compute visible back edges
    const visibleEdges = useMemo(() => {
        if (backEdges.length === 0) return [];
        
        return backEdges.map(edge => {
            const sourceRowIndex = blockToRowIndex.get(edge.sourceBlockIndex);
            const targetRowIndex = blockToRowIndex.get(edge.targetBlockIndex);
            
            if (sourceRowIndex === undefined || targetRowIndex === undefined) return null;

            // Get source and target blocks for loop indent info
            const sourceBlock = allBlocks[edge.sourceBlockIndex];
            const targetBlock = allBlocks[edge.targetBlockIndex];
            if (!sourceBlock || !targetBlock) return null;

            // Get Y positions (top of each block header)
            const sourceTop = rowTops[sourceRowIndex] || 0;
            const targetTop = rowTops[targetRowIndex] || 0;
            
            // Get block heights
            const sourceHeight = getBlockHeight(rows, edge.sourceBlockIndex, blockToRowIndex);
            const targetHeight = getBlockHeight(rows, edge.targetBlockIndex, blockToRowIndex);

            // Source connection: bottom of the source block (last instruction)
            // Target connection: near top of target block header (loop header)
            const sourceY = sourceTop + sourceHeight - BLOCK_FOOTER_HEIGHT - INSTRUCTION_HEIGHT / 2;
            const targetY = targetTop + BLOCK_HEADER_HEIGHT / 2;

            const minY = Math.min(sourceTop, targetTop);
            const maxY = Math.max(sourceTop + sourceHeight, targetTop + targetHeight);

            // Check if edge is visible (either endpoint or the edge itself passes through visible area)
            const isVisible = (minY <= visibleBottom && maxY >= visibleTop);
            if (!isVisible) return null;

            // Calculate X positions based on loop indent
            const sourceLoopIndent = sourceBlock.loops.length * LOOP_INDENT_SIZE;
            const targetLoopIndent = targetBlock.loops.length * LOOP_INDENT_SIZE;

            return {
                ...edge,
                sourceY: sourceY - scrollTop,
                targetY: targetY - scrollTop,
                sourceHeight,
                targetHeight,
                sourceLoopIndent,
                targetLoopIndent,
            };
        }).filter(Boolean) as Array<BackEdgeInfo & { sourceY: number; targetY: number; sourceHeight: number; targetHeight: number; sourceLoopIndent: number; targetLoopIndent: number }>;
    }, [backEdges, blockToRowIndex, rowTops, rows, scrollTop, visibleTop, visibleBottom, allBlocks]);

    // Early return after all hooks are called
    if (visibleEdges.length === 0) return null;

    return (
        <svg
            className="backedges-overlay"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: containerWidth,
                height: containerHeight,
                pointerEvents: 'none',
                zIndex: 5,
                overflow: 'visible',
            }}
        >
            <defs>
                <marker
                    id="backedge-arrow"
                    markerWidth={BACKEDGE_ARROW_SIZE}
                    markerHeight={BACKEDGE_ARROW_SIZE}
                    refX={BACKEDGE_ARROW_SIZE - 1}
                    refY={BACKEDGE_ARROW_SIZE / 2}
                    orient="auto"
                >
                    <polygon
                        points={`0 0, ${BACKEDGE_ARROW_SIZE} ${BACKEDGE_ARROW_SIZE / 2}, 0 ${BACKEDGE_ARROW_SIZE}`}
                        fill="#888"
                    />
                </marker>
            </defs>
            
            {visibleEdges.map((edge, index) => {
                // Calculate X positions accounting for loop indentation
                const sourceBlockEdgeX = marginHorizontal + edge.sourceLoopIndent + BLOCK_MAX_WIDTH;
                const targetBlockEdgeX = marginHorizontal + edge.targetLoopIndent + BLOCK_MAX_WIDTH;
                
                // Use target loop level to determine nesting
                // Inner loops (higher level) → edge closer to blocks (more left)
                // Outer loops (lower level) → edge further from blocks (more right)
                const targetLoopLevel = edge.targetLoopIndent / LOOP_INDENT_SIZE;
                
                // Fixed base X for all edges (rightmost possible block edge assuming no nesting)
                const baseEdgeX = marginHorizontal + BLOCK_MAX_WIDTH;
                
                // Level offset: higher loop level = smaller offset = more left
                // Lower loop level = larger offset = more right
                const levelOffset = (MAX_BACKEDGE_LEVELS - targetLoopLevel) * BACKEDGE_LEVEL_OFFSET;
                const edgeX = baseEdgeX + BACKEDGE_OFFSET_BASE + levelOffset;
                
                // Start and end points
                const startY = edge.sourceY;
                const endY = edge.targetY;

                // Create path: horizontal from source block -> vertical -> horizontal to target block
                const path = `M ${sourceBlockEdgeX} ${startY} 
                       H ${edgeX} 
                       V ${endY} 
                       H ${targetBlockEdgeX + BACKEDGE_ARROW_SIZE + 2}`;

                return (
                    <g key={`${edge.sourceBlockName}-${edge.targetBlockName}-${index}`}>
                        <path
                            d={path}
                            fill="none"
                            stroke="#aaa"
                            strokeWidth="2"
                            markerEnd="url(#backedge-arrow)"
                        />
                        {/* Small circle at source point */}
                        <circle
                            cx={sourceBlockEdgeX}
                            cy={startY}
                            r="3"
                            fill="#aaa"
                        />
                    </g>
                );
            })}
        </svg>
    );
});

// Check if instruction is a jump instruction
function checkJumpInstruction(instr: string): boolean {
    const doc = findIntelDocs(instr.toUpperCase());
    return !!(doc && doc['jumpable']);
}

// Build title for hex number
function buildHexTitle(hexStr: string): string {
    const negative = Array.from('89abcdefABCDEF').some(ch => hexStr.startsWith(ch));
    if (negative) {
        let bigNumber = '1';
        for (let i = 0; i < hexStr.length; i++) bigNumber += '0';
        return '-' + (parseInt(bigNumber, 16) - parseInt(hexStr, 16)).toString();
    }
    return parseInt(hexStr, 16).toString();
}

// Memoized Instruction Line Component
const InstructionLineContent = React.memo<{
    instruction: Instruction;
    block: InstructionBlock;
    nextBlock: InstructionBlock | null;
    isHighlighted: boolean;
    isHovered: boolean;
    isHidable: boolean;
    isLastInBlock: boolean;
    blockOrder: BLOCK_ORDERS;
    enabledTags: { [key: string]: boolean };
    onClick: () => void;
    onHover: () => void;
    onLeave: () => void;
    onJumpClick: (targetBlockName: string) => void;
}>(({
    instruction,
    block,
    nextBlock,
    isHighlighted,
    isHovered,
    isHidable,
    isLastInBlock,
    blockOrder,
    enabledTags,
    onClick,
    onHover,
    onLeave,
    onJumpClick,
}) => {
    const [showDoc, setShowDoc] = useState(false);
    
    let addressStr = instruction.address.toString(16).toUpperCase();
    while (addressStr.length < 4) addressStr = '0' + addressStr;

    const selectionStyle: React.CSSProperties = {
        display: 'block',
        userSelect: 'none',
        textAlign: 'left',
        color: 'black',
        flex: 1,
    };

    if (isHighlighted) {
        selectionStyle.backgroundColor = HIGHLIGHT_COLOR;
        selectionStyle.border = '1px solid grey';
        selectionStyle.cursor = 'pointer';
    }

    const className = `assemblycode${isHovered ? ' hover' : ''}`;

    // Parse instruction tokens
    const tokens = instruction.instruction.split(/([ ,])/g);
    const parsedTokens = tokens.map((token, i) => {
        // Mnemonic
        if (i === 0) {
            const doc = findIntelDocs(token);
            return (
                <span key={`mnemonic-${i}`}>
                    {showDoc && doc && (
                        <div className="tooltipitem">
                            {Object.entries(doc).map(([key, value]) =>
                                value ? (
                                    <p key={key}>
                                        <b>{key}</b>: {String(value)}
                                    </p>
                                ) : null
                            )}
                        </div>
                    )}
                    <mark
                        data-type="mnemonic"
                        onMouseEnter={() => setShowDoc(true)}
                        onMouseLeave={() => setShowDoc(false)}
                    >
                        {token}
                    </mark>
                </span>
            );
        }

        // Register
        if (
            (token.startsWith('%') && token.length === 4) ||
            (token.startsWith('(') && token.endsWith(')') && token[1] === '%' && token.length === 6)
        ) {
            return <mark key={`reg-${i}`} data-type="register">{token}</mark>;
        }

        // Hex number
        if (token.startsWith('$0x')) {
            const title = buildHexTitle(token.slice(3));
            return <span key={`hex-${i}`} className="hex-number" title={title}>{token}</span>;
        }

        // Variable check
        if (instruction.variables) {
            for (const variable of instruction.variables) {
                for (const location of variable.locations) {
                    if (token === location.location) {
                        return (
                            <mark key={`var-${i}`} data-type="variable" data-varname={variable.name}>
                                {token}
                            </mark>
                        );
                    }
                }
            }
        }

        // Jump target (last token of last instruction)
        if (i === tokens.length - 1 && isLastInBlock && nextBlock) {
            const isJump = checkJumpInstruction(tokens[0]);
            const thisNextBlocks = block.next_block_numbers.filter(
                name => block.next_block_numbers.length === 1 || name !== nextBlock.name
            );

            if (thisNextBlocks.length > 0 && isJump) {
                const blockNames = thisNextBlocks.map(b => shortenName(b, 32)).join(' | ');
                const targetBlockName = thisNextBlocks.find(b => b !== nextBlock.name) || thisNextBlocks[0];

                return (
                    <mark key={`jump-${i}`} data-type="jump" data-blockname={blockNames}>
                        <button
                            className="jump-target-button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onJumpClick(targetBlockName);
                            }}
                        >
                            →
                        </button>
                    </mark>
                );
            }
        }

        return token;
    });

    return (
        <div className={className} style={{ display: 'flex', alignItems: 'center', width: '100%', flex: 1 }}>
            {isHidable && <span className="hidablegutter" />}
            <code
                style={{
                    ...selectionStyle,
                    display: 'block',
                    flex: 1,
                    width: '100%',
                    paddingRight: '10px',
                    cursor: 'pointer',
                }}
                onMouseLeave={onLeave}
                onMouseOver={onHover}
                onClick={onClick}
            >
                <span style={{ color: 'grey' }}>0x{addressStr}</span>:{' '}
                {INSTRUCTION_TAGS.map(tag =>
                    enabledTags[tag.id] && instruction.flags?.includes(tag.id) ? (
                        <span
                            key={tag.id}
                            className="disassembly-line-tag"
                            style={{
                                border: `2px solid ${tag.borderColor}`,
                                color: tag.textColor,
                                backgroundColor: tag.color,
                            }}
                        >
                            {tag.shortName}
                        </span>
                    ) : null
                )}
                {parsedTokens}
            </code>
        </div>
    );
}, (prev, next) => {
    return (
        prev.instruction.address === next.instruction.address &&
        prev.isHighlighted === next.isHighlighted &&
        prev.isHovered === next.isHovered
    );
});

// Helper function to get row height based on row type
function getRowHeight(row: RowType): number {
    switch (row.type) {
        case 'block-header':
            return BLOCK_HEADER_HEIGHT;
        case 'instruction':
            return INSTRUCTION_HEIGHT;
        case 'pseudoloop':
            return PSEUDOLOOP_HEIGHT;
        case 'block-footer':
            return BLOCK_FOOTER_HEIGHT;
        case 'continuity-arrow':
            return CONTINUITY_ARROW_HEIGHT;
        case 'margin':
            return row.height;
        default:
            return INSTRUCTION_HEIGHT;
    }
}

// Row component for react-window v2
const RowRenderer = (props: RowRendererProps): ReactElement | null => {
    const { index, style } = props;
    
    // Get large data from context to avoid react-window trying to clone it
    const {
        rows,
        allBlocks,
        thisBinarySelection,
        hoveredAddresses,
        blockOrder,
        enabledTags,
        dispatch,
        onLineClick,
        onLineHover,
        onLineLeave,
        onPseudoloopClick,
        onJumpClick,
    } = useDisassemblyContext();

    const row = rows[index];
    if (!row) return null;

    switch (row.type) {
        // Margin row - just empty space between blocks
        case 'margin': {
            return <div style={style} />;
        }

        case 'block-header': {
            return (
                <div
                    className="disassembly-block-header"
                    style={{
                        ...style,
                        marginLeft: marginHorizontal + row.block.loops.length * LOOP_INDENT_SIZE + 'px',
                        marginRight: marginHorizontal + 'px',
                        maxWidth: BLOCK_MAX_WIDTH + 'px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                    title={row.block.name}
                >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                        {shortenName(row.block.name, 24)}
                    </span>
                    <span style={{ fontStyle: 'italic', fontSize: '14px', marginLeft: '10px', whiteSpace: 'nowrap', color: '#666' }}>
                        {row.block.loops.length > 0 &&
                            `${row.block.is_loop_header ? '⟳ ' : ''}${row.block.loops[row.block.loops.length - 1].name}: ${row.block.loops[row.block.loops.length - 1].loop_count}/${row.block.loops[row.block.loops.length - 1].loop_total}`}
                    </span>
                </div>
            );
        }

        case 'pseudoloop': {
            return (
                <div
                    className="pseudoloop"
                    onClick={() => onPseudoloopClick(row.block)}
                    style={{
                        ...style,
                        marginLeft: marginHorizontal + row.block.loops.length * LOOP_INDENT_SIZE + 'px',
                        marginRight: marginHorizontal + 'px',
                        maxWidth: BLOCK_MAX_WIDTH + 'px',
                        textAlign: 'center',
                        border: '3px dashed #bbb',
                        borderRadius: '4px',
                        padding: '8px 12px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#f8f8f8',
                    }}
                    title={row.block.name}
                >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                        📦 {shortenName(row.block.name, 20)}
                    </span>
                    <span style={{ fontStyle: 'italic', fontSize: '12px', color: '#666' }}>
                        {row.block.loops.length > 0 &&
                            `${row.block.is_loop_header ? '⟳ ' : ''}${row.block.loops[row.block.loops.length - 1].name}: ${row.block.loops[row.block.loops.length - 1].loop_count}/${row.block.loops[row.block.loops.length - 1].loop_total}`}
                        {row.block.instructions.length > 0 && ` (${row.block.instructions.length} instructions)`}
                    </span>
                </div>
            );
        }

        case 'instruction': {
            const isHighlighted = thisBinarySelection.includes(row.instruction.address);
            const isHovered = hoveredAddresses.includes(row.instruction.address);
            const nextBlock = allBlocks[row.blockIndex + 1] ?? null;

            return (
                <div
                    style={{
                        ...style,
                        marginLeft: marginHorizontal + row.block.loops.length * LOOP_INDENT_SIZE + 'px',
                        marginRight: marginHorizontal + 'px',
                        maxWidth: BLOCK_MAX_WIDTH + 'px',
                        borderLeft: '1px solid black',
                        borderRight: '1px solid black',
                        paddingLeft: '10px',
                        boxSizing: 'border-box',
                        background: 'white',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <InstructionLineContent
                        instruction={row.instruction}
                        block={row.block}
                        nextBlock={nextBlock}
                        isHighlighted={isHighlighted}
                        isHovered={isHovered}
                        isHidable={row.isHidable}
                        isLastInBlock={row.isLastInBlock}
                        blockOrder={blockOrder}
                        enabledTags={enabledTags}
                        onClick={() => onLineClick(row.instruction)}
                        onHover={() => onLineHover(row.instruction)}
                        onLeave={onLineLeave}
                        onJumpClick={onJumpClick}
                    />
                </div>
            );
        }

        case 'block-footer': {
            return (
                <div
                    style={{
                        ...style,
                        marginLeft: marginHorizontal + row.block.loops.length * LOOP_INDENT_SIZE + 'px',
                        marginRight: marginHorizontal + 'px',
                        maxWidth: BLOCK_MAX_WIDTH + 'px',
                        borderLeft: '1px solid black',
                        borderRight: '1px solid black',
                        borderBottom: '1px solid black',
                        height: '2px',
                        boxSizing: 'border-box',
                        background: 'white',
                    }}
                />
            );
        }

        case 'continuity-arrow': {
            return (
                <div style={{ ...style, position: 'relative' }}>
                    <i
                        className="continuity-arrow"
                        style={{
                            marginLeft: marginHorizontal + row.block.loops.length * LOOP_INDENT_SIZE + BLOCK_MAX_WIDTH / 2 - 16 + 'px',
                        }}
                    />
                </div>
            );
        }

        default:
            return null;
    }
};

function DisassemblyView({ id, removeSelf, defaultBinaryFilePath, showMinimap = true }: DisassemblyViewProps) {
    const dispatch = useAppDispatch();
    const { setSelectionWithHistory } = useSelectionWithHistory();
    const selections = useAppSelector(selectBinarySelection);
    const binaryFilePaths = useAppSelector(selectBinaryFilePaths);
    const validBinaryFilePaths = useMemo(() => binaryFilePaths.filter(p => p !== ''), [binaryFilePaths]);
    const enabledTags = useAppSelector(selectAllTagStates);

    const [binaryFilePath, setBinaryFilePath] = useState(defaultBinaryFilePath ?? validBinaryFilePaths[0]);
    const thisBinarySelection = useMemo(
        () => selections.find(s => s.binary_file === binaryFilePath)?.addresses ?? [],
        [selections, binaryFilePath]
    );

    const [blockOrder, setBlockOrder] = useState<BLOCK_ORDERS>('memory_order');
    const [jumpAddress, setJumpAddress] = useState('0x0');
    const [jumpValidationError, setJumpValidationError] = useState('');
    const [binaryJumpAddressRange, setBinaryJumpAddressRange] = useState({ start: 0, end: 0 });
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [highlightOption, setHighlightOption] = useState('none');

    // Hover state
    const hoverHighlight = useAppSelector(state => state.selections.binary_hover_highlight);
    const hoveredAddresses = useMemo(() => {
        const highlight = hoverHighlight?.find(h => h.binary_file === binaryFilePath);
        return highlight?.addresses ?? [];
    }, [hoverHighlight, binaryFilePath]);

    // Refs for virtualization
    const listRef = useListRef(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const listContainerRef = useRef<HTMLDivElement>(null);
    const [containerHeight, setContainerHeight] = useState(600);
    const [containerWidth, setContainerWidth] = useState(800);
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });
    // Use ref for scrollTop to avoid state update loops - only trigger re-render via forceUpdate
    const scrollTopRef = useRef(0);
    const [, forceUpdate] = useState(0);

    // Remove self if binary path is invalid
    useEffect(() => {
        if (!validBinaryFilePaths.includes(binaryFilePath) && validBinaryFilePaths.length > 0) {
            setBinaryFilePath(validBinaryFilePaths[0]);
        } else if (validBinaryFilePaths.length === 0) {
            removeSelf();
        }
    }, [validBinaryFilePaths, binaryFilePath, removeSelf]);

    // Load all blocks at once (they're virtualized anyway)
    const [allBlocks, setAllBlocks] = useState<InstructionBlock[]>([]);
    const [minimap, setMinimap] = useState<MinimapType | null>(null);

    useEffect(() => {
        if (!binaryFilePath) return;

        // Get all pages and combine blocks
        const blocks: InstructionBlock[] = [];
        let pageNo = 0;
        let isLast = false;

        while (!isLast) {
            try {
                const page = disvizProcessor.getDisassemblyPage(binaryFilePath, pageNo, blockOrder);
                blocks.push(...page.blocks);
                isLast = page.is_last;
                pageNo++;
            } catch {
                break;
            }
        }

        setAllBlocks(blocks);

        // Get address range
        const range = disvizProcessor.getAddressRange(binaryFilePath);
        setBinaryJumpAddressRange(range);

        // Get minimap data
        const minimapData = disvizProcessor.getMinimapData(binaryFilePath, blockOrder);
        setMinimap(minimapData);
    }, [binaryFilePath, blockOrder]);

    // Flatten blocks into rows for virtualization
    const rows = useMemo<RowType[]>(() => {
        const result: RowType[] = [];
        let prevFunctionName = '';

        allBlocks.forEach((block, blockIndex) => {
            const isFirstOfFunction = prevFunctionName !== block.function_name;
            prevFunctionName = block.function_name;

            // Add margin row before block (represents spacing between blocks)
            // Large margin for new function, small margin for same function
            if (blockIndex > 0) {
                const marginHeight = isFirstOfFunction ? MARGIN_NEW_FUNCTION : MARGIN_SAME_FUNCTION;
                result.push({ type: 'margin', height: marginHeight, blockIndex });
            }

            // Pseudoloop blocks (memory order only - shown as collapsed)
            if (block.block_type === 'pseudoloop' && blockOrder === 'memory_order') {
                result.push({ type: 'pseudoloop', block, blockIndex, isFirstOfFunction });
                return;
            }

            // Block header
            result.push({ type: 'block-header', block, blockIndex, isFirstOfFunction });

            // Instructions
            block.instructions.forEach((instruction, instrIndex) => {
                // Check if this instruction is in a hidable section
                let isHidable = false;

                if (block.hidables) {
                    for (const hidable of block.hidables) {
                        if (hidable.start_address <= instruction.address && instruction.address <= hidable.end_address) {
                            isHidable = true;
                            break;
                        }
                    }
                }

                const isLastInBlock = instrIndex === block.instructions.length - 1;

                result.push({
                    type: 'instruction',
                    instruction,
                    block,
                    instructionIndex: instrIndex,
                    blockIndex,
                    isHidable,
                    isLastInBlock,
                });
            });

            // Block footer (bottom border)
            result.push({ type: 'block-footer', block, blockIndex });

            // Continuity arrow (loop order only)
            if (blockOrder === 'loop_order') {
                const nextBlock = allBlocks[blockIndex + 1];
                if (
                    nextBlock &&
                    block.block_type !== 'pseudoloop' &&
                    block.next_block_numbers.some(
                        name => name === nextBlock.name && nextBlock.block_type !== 'pseudoloop'
                    )
                ) {
                    result.push({ type: 'continuity-arrow', block, blockIndex });
                }
            }
        });

        return result;
    }, [allBlocks, blockOrder]);

    // Map block indices to row indices for scrolling
    const blockToRowIndex = useMemo(() => {
        const map = new Map<number, number>();
        rows.forEach((row, rowIndex) => {
            if (row.type === 'block-header' || row.type === 'pseudoloop') {
                if (!map.has(row.blockIndex)) {
                    map.set(row.blockIndex, rowIndex);
                }
            }
        });
        return map;
    }, [rows]);

    // Create a map of block names to block indices for back edge lookup
    const blockNameToIndex = useMemo(() => {
        const map = new Map<string, number>();
        allBlocks.forEach((block, index) => {
            map.set(block.name, index);
        });
        return map;
    }, [allBlocks]);

    // Compute back edges from block data
    const backEdges = useMemo<BackEdgeInfo[]>(() => {
        const edges: BackEdgeInfo[] = [];
        const processedPairs = new Set<string>(); // Avoid duplicates

        allBlocks.forEach((block, sourceBlockIndex) => {
            if (block.backedges && block.backedges.length > 0) {
                block.backedges.forEach(targetBlockName => {
                    const targetBlockIndex = blockNameToIndex.get(targetBlockName);
                    if (targetBlockIndex !== undefined) {
                        const pairKey = `${sourceBlockIndex}-${targetBlockIndex}`;
                        if (!processedPairs.has(pairKey)) {
                            processedPairs.add(pairKey);
                            edges.push({
                                sourceBlockIndex,
                                targetBlockIndex,
                                sourceBlockName: block.name,
                                targetBlockName,
                                level: block.loops.length, // Use loop nesting level for offset
                            });
                        }
                    }
                });
            }
        });

        return edges;
    }, [allBlocks, blockNameToIndex]);

    // Handle container resize
    useEffect(() => {
        if (!containerRef.current) return;

        const updateSize = () => {
            if (containerRef.current) {
                setContainerHeight(containerRef.current.clientHeight);
                setContainerWidth(containerRef.current.clientWidth);
            }
        };

        updateSize();

        const resizeObserver = new ResizeObserver(updateSize);
        resizeObserver.observe(containerRef.current);

        return () => resizeObserver.disconnect();
    }, []);

    // Compute row tops for scroll position estimation and back edges
    const rowTops = useMemo(() => {
        const tops: number[] = [0];
        let cumulative = 0;
        for (let i = 0; i < rows.length; i++) {
            cumulative += getRowHeightForType(rows[i]);
            tops.push(cumulative);
        }
        return tops;
    }, [rows]);

    // Scroll to selection when it changes
    useEffect(() => {
        if (thisBinarySelection.length === 0 || !listRef.current) return;

        const firstAddr = thisBinarySelection[0];
        
        // Find the row containing this address
        const rowIndex = rows.findIndex(row => {
            if (row.type === 'instruction') {
                return row.instruction.address === firstAddr;
            }
            if (row.type === 'block-header' || row.type === 'pseudoloop') {
                return row.block.start_address <= firstAddr && firstAddr <= row.block.end_address;
            }
            return false;
        });

        if (rowIndex >= 0) {
            listRef.current.scrollToRow({ index: rowIndex, align: 'center' });
        }
    }, [thisBinarySelection, rows, listRef]);

    // Handle line click
    const handleLineClick = useCallback((instruction: Instruction) => {
        const source = disvizProcessor.getSourceFromBinary(binaryFilePath, instruction.address);
        const source_selection = Object.entries(source).map(([source_file, lines]) => ({
            source_file,
            source_lines: lines,
        }));

        // Get function and block info
        let functionName: string | undefined;
        let blockName: string | undefined;
        try {
            const block = disvizProcessor.getDisassemblyBlockByAddress(binaryFilePath, blockOrder, instruction.address);
            functionName = block.function_name;
            blockName = block.name;
        } catch (e) {
            // Block info not available
        }

        setSelectionWithHistory({
            source_selection,
            binary_selection: [{
                binary_file: binaryFilePath,
                addresses: [instruction.address],
            }],
            origin: {
                type: 'disassembly',
                disassemblyId: id,
                address: instruction.address,
            },
            details: {
                functionName,
                blockName,
            },
        });
    }, [binaryFilePath, blockOrder, id, setSelectionWithHistory]);

    // Handle line hover
    const handleLineHover = useCallback((instruction: Instruction) => {
        const source = disvizProcessor.getSourceFromBinary(binaryFilePath, instruction.address);
        const source_selection = Object.entries(source).map(([source_file, lines]) => ({
            source_file,
            source_lines: lines,
        }));
        dispatch(setHoverHighlight({
            source_hover_highlight: source_selection,
            binary_hover_highlight: [{
                binary_file: binaryFilePath,
                addresses: [instruction.address],
            }],
        }));
    }, [binaryFilePath, dispatch]);

    // Handle line leave
    const handleLineLeave = useCallback(() => {
        dispatch(clearHoverHighlight());
    }, [dispatch]);

    // Handle pseudoloop click
    const handlePseudoloopClick = useCallback((block: InstructionBlock) => {
        const selections = disvizProcessor.getSelectionFromBinary_indirect(
            binaryFilePath,
            block.instructions.map(i => i.address),
            validBinaryFilePaths,
            blockOrder
        );
        setSelectionWithHistory({
            ...selections,
            origin: {
                type: 'disassembly',
                disassemblyId: id,
                address: block.start_address,
            },
            details: {
                functionName: block.function_name,
                blockName: block.name,
            },
        });
    }, [binaryFilePath, validBinaryFilePaths, blockOrder, id, setSelectionWithHistory]);

    // Handle jump to block
    const handleJumpClick = useCallback((targetBlockName: string) => {
        try {
            const targetBlock = disvizProcessor.getDisassemblyBlock(binaryFilePath, targetBlockName, blockOrder);
            const source = disvizProcessor.getSourceFromBinary(binaryFilePath, targetBlock.start_address);
            const source_selection = Object.entries(source).map(([source_file, lines]) => ({
                source_file,
                source_lines: lines,
            }));
            setSelectionWithHistory({
                source_selection,
                binary_selection: [{
                    binary_file: binaryFilePath,
                    addresses: [targetBlock.start_address],
                }],
                origin: {
                    type: 'disassembly',
                    disassemblyId: id,
                    address: targetBlock.start_address,
                },
                details: {
                    functionName: targetBlock.function_name,
                    blockName: targetBlock.name,
                },
            });
        } catch (e) {
            console.error('Failed to jump to block:', e);
        }
    }, [binaryFilePath, blockOrder, id, setSelectionWithHistory]);

    // Track visible range for minimap
    const handleRowsRendered = useCallback((
        visibleRows: { startIndex: number; stopIndex: number },
        _allRows: { startIndex: number; stopIndex: number }
    ) => {
        // Estimate scroll position from first visible row
        const estimatedScrollTop = rowTops[visibleRows.startIndex] || 0;
        
        // Only update scrollTop ref and trigger re-render if changed significantly
        // Use threshold of 2 row heights to avoid oscillation loops
        const scrollThreshold = INSTRUCTION_HEIGHT * 2;
        const prevScrollTop = scrollTopRef.current;
        const scrollDiff = Math.abs(estimatedScrollTop - prevScrollTop);
        
        if (scrollDiff > scrollThreshold) {
            scrollTopRef.current = estimatedScrollTop;
            // Trigger re-render for BackEdgesOverlay only when scroll changed significantly
            forceUpdate(n => n + 1);
        }

        // Find block indices for visible rows
        let startBlockIdx = 0;
        let endBlockIdx = 0;

        for (let i = visibleRows.startIndex; i >= 0; i--) {
            const row = rows[i];
            if (row && (row.type === 'block-header' || row.type === 'pseudoloop')) {
                startBlockIdx = row.blockIndex;
                break;
            }
        }

        for (let i = visibleRows.stopIndex; i < rows.length; i++) {
            const row = rows[i];
            if (row && (row.type === 'block-header' || row.type === 'pseudoloop')) {
                endBlockIdx = row.blockIndex;
                break;
            }
        }

        // If we didn't find an end block (at the very end), use the last block's index
        if (endBlockIdx === 0 && rows.length > 0) {
            // Find the last block header in the visible range
            for (let i = Math.min(visibleRows.stopIndex, rows.length - 1); i >= visibleRows.startIndex; i--) {
                const row = rows[i];
                if (row && (row.type === 'block-header' || row.type === 'pseudoloop')) {
                    endBlockIdx = row.blockIndex;
                    break;
                }
            }
        }

        // Only update visibleRange if values changed significantly to prevent oscillation loops
        // Use threshold of ±1 block to avoid oscillation
        setVisibleRange(prev => {
            const startDiff = Math.abs(prev.start - startBlockIdx);
            const endDiff = Math.abs(prev.end - endBlockIdx);
            const significantChange = startDiff > 1 || endDiff > 1;
            
            if (!significantChange) {
                return prev; // Return same reference to prevent re-render
            }
            return { start: startBlockIdx, end: endBlockIdx };
        });
    }, [rows, rowTops]);

    // Handle minimap block click
    const handleMinimapBlockClick = useCallback((blockIndex: number) => {
        const block = allBlocks[blockIndex];
        if (!block) return;

        const source = disvizProcessor.getSourceFromBinary(binaryFilePath, block.start_address);
        const source_selection = Object.entries(source).map(([source_file, lines]) => ({
            source_file,
            source_lines: lines,
        }));
        setSelectionWithHistory({
            source_selection,
            binary_selection: [{
                binary_file: binaryFilePath,
                addresses: block.instructions.map(i => i.address),
            }],
            origin: {
                type: 'disassembly',
                disassemblyId: id,
                address: block.start_address,
            },
            details: {
                functionName: block.function_name,
                blockName: block.name,
            },
        });

        // Scroll to block
        const rowIndex = blockToRowIndex.get(blockIndex);
        if (rowIndex !== undefined && listRef.current) {
            listRef.current.scrollToRow({ index: rowIndex, align: 'center' });
        }
    }, [allBlocks, binaryFilePath, blockToRowIndex, id, setSelectionWithHistory, listRef]);

    // Handle minimap scroll
    const handleMinimapScrollToBlock = useCallback((blockIndex: number) => {
        const rowIndex = blockToRowIndex.get(blockIndex);
        if (rowIndex !== undefined && listRef.current) {
            listRef.current.scrollToRow({ index: rowIndex, align: 'start' });
        }
    }, [blockToRowIndex, listRef]);

    // Handle jump to address
    const handleJumpToAddress = useCallback(() => {
        if (jumpValidationError !== '') return;

        const addr = toHex(jumpAddress);
        
        // Find block containing address
        const blockIndex = allBlocks.findIndex(block => 
            block.start_address <= addr && addr <= block.end_address
        );

        if (blockIndex >= 0) {
            const rowIndex = blockToRowIndex.get(blockIndex);
            if (rowIndex !== undefined && listRef.current) {
                listRef.current.scrollToRow({ index: rowIndex, align: 'center' });
            }
        }
    }, [jumpAddress, jumpValidationError, allBlocks, blockToRowIndex, listRef]);

    // Handle binary file change
    const handleBinaryChange = useCallback((newPath: string) => {
        setBinaryFilePath(newPath);
        setAllBlocks([]);
        setMinimap(null);
        setBlockOrder('memory_order');
        setJumpAddress('0x0');
        setJumpValidationError('');
    }, []);

    // Minimal row props (avoid passing large arrays through react-window)
    const rowData = useMemo<RowData>(() => ({
        binaryFilePath,
        validBinaryFilePaths,
    }), [binaryFilePath, validBinaryFilePaths]);

    // Context value for large data (passed via React Context, not react-window)
    const contextValue = useMemo<DisassemblyContextType>(() => ({
        rows,
        allBlocks,
        thisBinarySelection,
        hoveredAddresses,
        blockOrder,
        enabledTags,
        dispatch,
        onLineClick: handleLineClick,
        onLineHover: handleLineHover,
        onLineLeave: handleLineLeave,
        onPseudoloopClick: handlePseudoloopClick,
        onJumpClick: handleJumpClick,
    }), [
        rows,
        allBlocks,
        thisBinarySelection,
        hoveredAddresses,
        blockOrder,
        enabledTags,
        dispatch,
        handleLineClick,
        handleLineHover,
        handleLineLeave,
        handlePseudoloopClick,
        handleJumpClick,
    ]);

    if (validBinaryFilePaths.length === 0) {
        return (
            <div style={{ padding: '20px' }}>
                <h2>Please load a .disviz file to view disassembly.</h2>
            </div>
        );
    }

    return (
        <Suspense fallback={<div>Loading disassembly...</div>}>
            <div
                ref={containerRef}
                className="disassembly-view-container"
                style={{ height: '100%', overflow: 'hidden', position: 'relative' }}
            >
                {/* Header toolbar */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: showMinimap ? 150 : 0,
                        backgroundColor: '#f1f1f1',
                        padding: '10px',
                        fontWeight: 'bold',
                        zIndex: 20,
                        display: 'flex',
                        flexDirection: 'row',
                        gap: '10px',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                    }}
                >
                    <Form.Group className="d-flex align-items-center gap-2">
                        <Form.Label className="mb-0" style={{ whiteSpace: 'nowrap' }}>Binary:</Form.Label>
                        <Form.Select
                            style={{ width: '180px' }}
                            value={binaryFilePath}
                            onChange={(e) => handleBinaryChange(e.target.value)}
                        >
                            {validBinaryFilePaths.map(path => (
                                <option key={path} value={path}>
                                    {path.split('/').pop()}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="d-flex align-items-center gap-2">
                        <Form.Label className="mb-0" style={{ whiteSpace: 'nowrap' }}>Order:</Form.Label>
                        <Form.Select
                            style={{ width: '150px' }}
                            value={blockOrder}
                            onChange={(e) => setBlockOrder(e.target.value as BLOCK_ORDERS)}
                        >
                            <option value="memory_order">Memory Address</option>
                            <option value="loop_order">Loop Structure</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="d-flex align-items-center gap-2">
                        <Form.Label className="mb-0" style={{ whiteSpace: 'nowrap' }}>Jump:</Form.Label>
                        <Form.Control
                            type="text"
                            value={jumpAddress}
                            placeholder="0x10E59"
                            style={{ width: '100px' }}
                            onChange={(e) => {
                                setJumpAddress(e.target.value);
                                if (
                                    isHex(e.target.value) &&
                                    toHex(e.target.value) >= binaryJumpAddressRange.start &&
                                    toHex(e.target.value) <= binaryJumpAddressRange.end
                                ) {
                                    setJumpValidationError('');
                                } else {
                                    setJumpValidationError('Invalid address');
                                }
                            }}
                            isInvalid={!!jumpValidationError}
                        />
                        <Button onClick={handleJumpToAddress} disabled={!!jumpValidationError}>
                            Go
                        </Button>
                    </Form.Group>

                    <Button onClick={() => setShowDownloadModal(true)}>Download</Button>

                    {showMinimap && (
                        <Form.Group className="d-flex align-items-center gap-2">
                            <Form.Label className="mb-0" style={{ whiteSpace: 'nowrap' }}>Highlight:</Form.Label>
                            <Form.Select
                                style={{ width: '130px' }}
                                value={highlightOption}
                                onChange={(e) => setHighlightOption(e.target.value)}
                            >
                                <option value="none">Default</option>
                                {INSTRUCTION_TAGS.map(tag => (
                                    <option key={tag.id} value={tag.id}>
                                        {tag.fullName}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    )}
                </div>

                {/* Download Modal */}
                <Modal show={showDownloadModal} onHide={() => setShowDownloadModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Download Disassembly</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>Download disassembly of {binaryFilePath.split('/').pop()}?</p>
                        <Form.Check
                            type="checkbox"
                            id="download-with-addresses"
                            label="Include addresses"
                            defaultChecked={false}
                        />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowDownloadModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => {
                                const checkbox = document.getElementById('download-with-addresses') as HTMLInputElement;
                                const blob = disvizProcessor.downloadDisassembly(binaryFilePath, checkbox?.checked ?? false);
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'disassembly.txt';
                                a.click();
                                setShowDownloadModal(false);
                            }}
                        >
                            Download
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* Main virtualized list */}
                {allBlocks.length > 0 ? (
                    <DisassemblyContext.Provider value={contextValue}>
                        {/* List container with back edges overlay */}
                        <div
                            ref={listContainerRef}
                            style={{
                                position: 'absolute',
                                top: '60px',
                                left: 0,
                                width: showMinimap ? 'calc(100% - 150px)' : '100%',
                                height: containerHeight - 60,
                            }}
                        >
                            <List<RowData>
                                listRef={listRef}
                                defaultHeight={containerHeight - 60}
                                rowCount={rows.length}
                                rowHeight={(index: number) => getRowHeight(rows[index])}
                                rowComponent={RowRenderer}
                                rowProps={rowData}
                                onRowsRendered={handleRowsRendered}
                                style={{
                                    paddingRight: '20px',
                                }}
                                className="disassembly-view-list"
                            />
                            
                            {/* Back edges overlay - positioned over the list */}
                            {backEdges.length > 0 && (
                                <BackEdgesOverlay
                                    backEdges={backEdges}
                                    rows={rows}
                                    blockToRowIndex={blockToRowIndex}
                                    allBlocks={allBlocks}
                                    scrollTop={scrollTopRef.current}
                                    containerHeight={containerHeight - 60}
                                    containerWidth={containerWidth - (showMinimap ? 150 : 0)}
                                />
                            )}
                        </div>

                        {showMinimap && minimap && (
                            <DisassemblyMinimap
                                minimap={minimap}
                                totalBlocks={allBlocks.length}
                                visibleStartIndex={visibleRange.start}
                                visibleEndIndex={visibleRange.end}
                                selectedAddresses={thisBinarySelection}
                                onBlockClick={handleMinimapBlockClick}
                                onScrollToBlock={handleMinimapScrollToBlock}
                                width={150}
                                containerHeight={containerHeight}
                                highlightOption={highlightOption}
                            />
                        )}
                    </DisassemblyContext.Provider>
                ) : (
                    <div style={{ padding: '80px 20px', textAlign: 'center' }}>
                        <h3>Loading disassembly...</h3>
                    </div>
                )}
            </div>
        </Suspense>
    );
}

export default React.memo(DisassemblyView);
