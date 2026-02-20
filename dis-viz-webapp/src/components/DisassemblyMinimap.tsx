import React from 'react';
import { HIGHLIGHT_COLOR, hexToHSL, INSTRUCTION_TAGS } from '../utils';
import { MinimapType } from '../features/minimap/minimapSlice';

interface DisassemblyMinimapProps {
    minimap: MinimapType;
    totalBlocks: number;
    visibleStartIndex: number;
    visibleEndIndex: number;
    selectedAddresses: number[];
    onBlockClick: (blockIndex: number) => void;
    onScrollToBlock: (blockIndex: number) => void;
    width?: number;
    containerHeight: number;
    highlightOption?: string;
}

const MINIMAP_PADDING_TOP = 20;
const MINIMAP_PADDING_BOTTOM = 10;
const BRUSH_BORDER_RADIUS = 3;
const BLOCK_LINE_WIDTH = 60;
const BLOCK_LINE_LEFT = 20;
const LOOP_INDENT_SIZE = 6;
const HIDDEN_ARROW_LEN = 20;
const BLOCK_GAP = 2;

const DisassemblyMinimap: React.FC<DisassemblyMinimapProps> = ({
    minimap,
    totalBlocks,
    visibleStartIndex,
    visibleEndIndex,
    selectedAddresses,
    onBlockClick,
    onScrollToBlock,
    width = 120,
    containerHeight,
    highlightOption = 'none',
}) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const brushRef = React.useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const dragStartY = React.useRef(0);
    const dragStartScrollIndex = React.useRef(0);

    // Calculate the available height for drawing
    const availableHeight = containerHeight - MINIMAP_PADDING_TOP - MINIMAP_PADDING_BOTTOM;

    // Calculate cumulative heights for positioning
    const cumulativeHeights = React.useMemo(() => {
        const heights: number[] = [0];
        let total = 0;
        for (let i = 0; i < minimap.blockHeights.length; i++) {
            const h = Math.max(1, minimap.blockHeights[i]);
            total += h + BLOCK_GAP;
            heights.push(total);
        }
        return heights;
    }, [minimap.blockHeights]);

    const totalContentHeight = cumulativeHeights[cumulativeHeights.length - 1] || 1;

    // Scale factor if content is taller than available space
    const scaleFactor = totalContentHeight > availableHeight ? availableHeight / totalContentHeight : 1;

    // Convert block index to Y position
    const blockToY = React.useCallback((blockIndex: number): number => {
        const clampedIndex = Math.max(0, Math.min(blockIndex, minimap.blockHeights.length - 1));
        return MINIMAP_PADDING_TOP + (cumulativeHeights[clampedIndex] || 0) * scaleFactor;
    }, [cumulativeHeights, scaleFactor, minimap.blockHeights.length]);

    // Convert Y position to block index
    const yToBlock = React.useCallback((y: number): number => {
        const scaledY = (y - MINIMAP_PADDING_TOP) / scaleFactor;
        // Binary search for the block
        let low = 0, high = cumulativeHeights.length - 2;
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            if (cumulativeHeights[mid] <= scaledY && scaledY < cumulativeHeights[mid + 1]) {
                return mid;
            } else if (scaledY < cumulativeHeights[mid]) {
                high = mid - 1;
            } else {
                low = mid + 1;
            }
        }
        return Math.max(0, Math.min(totalBlocks - 1, low));
    }, [cumulativeHeights, scaleFactor, totalBlocks]);

    // Find which blocks contain selected addresses
    const selectedBlockIndices = React.useMemo(() => {
        const indices = new Set<number>();
        if (selectedAddresses.length === 0) return indices;

        for (let i = 0; i < minimap.blockStartAddress.length; i++) {
            const blockStart = minimap.blockStartAddress[i];
            const blockEnd = i < minimap.blockStartAddress.length - 1 
                ? minimap.blockStartAddress[i + 1] 
                : Infinity;
            
            for (const addr of selectedAddresses) {
                if (addr >= blockStart && addr < blockEnd) {
                    indices.add(i);
                    break;
                }
            }
        }
        return indices;
    }, [selectedAddresses, minimap.blockStartAddress]);

    // Check if selection is outside visible area
    const { hasHiddenAbove, hasHiddenBelow } = React.useMemo(() => {
        let above = false, below = false;
        selectedBlockIndices.forEach(idx => {
            if (idx < visibleStartIndex) above = true;
            if (idx > visibleEndIndex) below = true;
        });
        return { hasHiddenAbove: above, hasHiddenBelow: below };
    }, [selectedBlockIndices, visibleStartIndex, visibleEndIndex]);

    // Draw the minimap
    const draw = React.useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw all blocks
        for (let i = 0; i < minimap.blockHeights.length; i++) {
            const blockHeight = Math.max(1, minimap.blockHeights[i]);
            const y = blockToY(i);
            const x = BLOCK_LINE_LEFT + (minimap.blockLoopIndents[i] || 0) * LOOP_INDENT_SIZE;
            const scaledHeight = Math.max(1, blockHeight * scaleFactor);

            // Determine block color
            let strokeStyle = minimap.builtInBlock[i] ? '#e0e0e0' : '#aaaaaa';

            // Check if block is selected
            if (selectedBlockIndices.has(i)) {
                const { h, s, l } = hexToHSL(HIGHLIGHT_COLOR);
                strokeStyle = minimap.builtInBlock[i]
                    ? `hsl(${Math.max(h - 10, 0)}, ${s}%, ${l}%)`
                    : `hsl(${h}, ${s}%, ${Math.max(l - 20, 0)}%)`;
            }

            // Check highlight option
            if (highlightOption !== 'none') {
                const tag = INSTRUCTION_TAGS.find(t => t.id === highlightOption);
                const tagToBlockType: Record<string, string[]> = {
                    'VECTORIZED': ['vectorized'],
                    'MEMORY': ['memory_read', 'memory_write'],
                    'SYSCALL': ['syscall'],
                    'CALL': ['call'],
                    'INLINE': ['inline'],
                    'FP': ['floating_point'],
                    'HOISTED': ['hoisted'],
                    'BRANCH': ['branch']
                };

                const blockTypes = tagToBlockType[highlightOption];
                if (tag && blockTypes && minimap.blockTypes[i]) {
                    const hasType = blockTypes.some(bt => minimap.blockTypes[i].includes(bt as any));
                    if (hasType) {
                        strokeStyle = tag.color;
                    }
                }
            }

            // Draw pseudoloop blocks differently
            const isPseudo = minimap.blockHeights[i] === 0;

            ctx.beginPath();
            if (isPseudo) {
                ctx.setLineDash([3, 3]);
            } else {
                ctx.setLineDash([]);
            }

            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = Math.max(1, scaledHeight);
            ctx.moveTo(x, y + scaledHeight / 2);
            ctx.lineTo(x + BLOCK_LINE_WIDTH, y + scaledHeight / 2);
            ctx.stroke();
        }

        // Draw arrows for hidden selections
        if (hasHiddenAbove) {
            ctx.beginPath();
            ctx.strokeStyle = HIGHLIGHT_COLOR;
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            const arrowY = MINIMAP_PADDING_TOP;
            ctx.moveTo(BLOCK_LINE_LEFT + BLOCK_LINE_WIDTH / 2, arrowY + HIDDEN_ARROW_LEN);
            ctx.lineTo(BLOCK_LINE_LEFT + BLOCK_LINE_WIDTH / 2, arrowY);
            ctx.lineTo(BLOCK_LINE_LEFT + BLOCK_LINE_WIDTH / 2 - 6, arrowY + 8);
            ctx.moveTo(BLOCK_LINE_LEFT + BLOCK_LINE_WIDTH / 2, arrowY);
            ctx.lineTo(BLOCK_LINE_LEFT + BLOCK_LINE_WIDTH / 2 + 6, arrowY + 8);
            ctx.stroke();
        }

        if (hasHiddenBelow) {
            ctx.beginPath();
            ctx.strokeStyle = HIGHLIGHT_COLOR;
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            const arrowY = containerHeight - MINIMAP_PADDING_BOTTOM;
            ctx.moveTo(BLOCK_LINE_LEFT + BLOCK_LINE_WIDTH / 2, arrowY - HIDDEN_ARROW_LEN);
            ctx.lineTo(BLOCK_LINE_LEFT + BLOCK_LINE_WIDTH / 2, arrowY);
            ctx.lineTo(BLOCK_LINE_LEFT + BLOCK_LINE_WIDTH / 2 - 6, arrowY - 8);
            ctx.moveTo(BLOCK_LINE_LEFT + BLOCK_LINE_WIDTH / 2, arrowY);
            ctx.lineTo(BLOCK_LINE_LEFT + BLOCK_LINE_WIDTH / 2 + 6, arrowY - 8);
            ctx.stroke();
        }
    }, [
        minimap,
        blockToY,
        scaleFactor,
        selectedBlockIndices,
        highlightOption,
        hasHiddenAbove,
        hasHiddenBelow,
        containerHeight,
    ]);

    // Update brush position
    const updateBrush = React.useCallback(() => {
        if (!brushRef.current || isDragging) return;

        const brushTop = blockToY(visibleStartIndex);
        const brushBottom = blockToY(Math.min(visibleEndIndex + 1, totalBlocks));
        const brushHeight = Math.max(30, brushBottom - brushTop);

        brushRef.current.style.top = `${brushTop}px`;
        brushRef.current.style.height = `${brushHeight}px`;
    }, [visibleStartIndex, visibleEndIndex, isDragging, blockToY, totalBlocks]);

    // Draw on mount and when dependencies change
    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = width;
        canvas.height = containerHeight;

        draw();
        updateBrush();
    }, [draw, updateBrush, width, containerHeight]);

    // Handle canvas click
    const handleCanvasClick = React.useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const y = e.clientY - rect.top;
        const blockIndex = yToBlock(y);
        onBlockClick(blockIndex);
    }, [yToBlock, onBlockClick]);

    // Handle brush drag
    const handleBrushMouseDown = React.useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        dragStartY.current = e.clientY;
        dragStartScrollIndex.current = visibleStartIndex;
    }, [visibleStartIndex]);

    React.useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaY = e.clientY - dragStartY.current;
            const deltaBlocks = Math.round(deltaY / (scaleFactor * 2)); // Adjust sensitivity
            const visibleBlockCount = visibleEndIndex - visibleStartIndex;
            const newStartBlock = Math.max(
                0,
                Math.min(
                    totalBlocks - visibleBlockCount,
                    dragStartScrollIndex.current + deltaBlocks
                )
            );

            // Update brush position directly during drag for responsive feedback
            if (brushRef.current) {
                const brushTop = blockToY(newStartBlock);
                const brushBottom = blockToY(Math.min(newStartBlock + visibleBlockCount + 1, totalBlocks));
                const brushHeight = Math.max(30, brushBottom - brushTop);
                brushRef.current.style.top = `${brushTop}px`;
                brushRef.current.style.height = `${brushHeight}px`;
            }

            onScrollToBlock(newStartBlock);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, scaleFactor, totalBlocks, visibleStartIndex, visibleEndIndex, onScrollToBlock, blockToY]);

    return (
        <div
            className="disassembly-minimap"
            style={{
                position: 'absolute',
                right: 0,
                top: 0,
                width: `${width}px`,
                height: '100%',
                backgroundColor: '#ffffff',
                borderLeft: '2px solid #e0e0e0',
                zIndex: 10,
            }}
        >
            <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                style={{
                    cursor: 'pointer',
                    display: 'block',
                }}
            />
            {/* Viewport brush indicator */}
            <div
                ref={brushRef}
                className="disassembly-minimap-brush"
                onMouseDown={handleBrushMouseDown}
                style={{
                    position: 'absolute',
                    left: `${BLOCK_LINE_LEFT - 10}px`,
                    width: `${BLOCK_LINE_WIDTH + 20}px`,
                    backgroundColor: 'rgba(75, 137, 231, 0.2)',
                    border: '1px solid rgba(75, 137, 231, 0.5)',
                    borderRadius: `${BRUSH_BORDER_RADIUS}px`,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    transition: isDragging ? 'none' : 'top 0.1s, height 0.1s',
                    pointerEvents: 'auto',
                }}
            />
        </div>
    );
};

export default React.memo(DisassemblyMinimap);
