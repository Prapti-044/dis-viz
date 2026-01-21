import React from 'react';
import { HIGHLIGHT_COLOR, hexToHSL } from '../utils';

interface SourceMinimapProps {
    totalLines: number;
    visibleStartLine: number;
    visibleEndLine: number;
    selectedLines: number[]; // 0-indexed
    hoveredLines: number[]; // 0-indexed
    correspondenceLines: Set<number>; // 0-indexed lines that have disassembly correspondence
    onLineClick: (lineIndex: number) => void;
    onScrollToLine: (lineIndex: number) => void;
    width?: number;
    containerHeight: number;
}

const MINIMAP_PADDING_TOP = 10;
const MINIMAP_PADDING_BOTTOM = 10;
const MIN_LINE_HEIGHT = 1;
const MAX_LINE_HEIGHT = 3;
const BRUSH_BORDER_RADIUS = 3;

const SourceMinimap: React.FC<SourceMinimapProps> = ({
    totalLines,
    visibleStartLine,
    visibleEndLine,
    selectedLines,
    hoveredLines,
    correspondenceLines,
    onLineClick,
    onScrollToLine,
    width = 120,
    containerHeight,
}) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const brushRef = React.useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const dragStartY = React.useRef(0);
    const dragStartScrollLine = React.useRef(0);

    // Calculate the available height for drawing
    const availableHeight = containerHeight - MINIMAP_PADDING_TOP - MINIMAP_PADDING_BOTTOM;

    // Calculate line height based on total lines
    const lineHeight = Math.max(
        MIN_LINE_HEIGHT,
        Math.min(MAX_LINE_HEIGHT, availableHeight / totalLines)
    );

    // Calculate total content height
    const contentHeight = totalLines * lineHeight;

    // Scale factor if content is taller than available space
    const scaleFactor = contentHeight > availableHeight ? availableHeight / contentHeight : 1;
    const scaledLineHeight = lineHeight * scaleFactor;

    // Convert line index to Y position (memoized)
    const lineToY = React.useCallback((lineIndex: number): number => {
        return MINIMAP_PADDING_TOP + lineIndex * scaledLineHeight;
    }, [scaledLineHeight]);

    // Convert Y position to line index (memoized)
    const yToLine = React.useCallback((y: number): number => {
        const lineIndex = Math.floor((y - MINIMAP_PADDING_TOP) / scaledLineHeight);
        return Math.max(0, Math.min(totalLines - 1, lineIndex));
    }, [scaledLineHeight, totalLines]);

    // Draw the minimap
    const draw = React.useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background
        ctx.fillStyle = '#fafafa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw all lines as thin rectangles
        const lineWidth = width - 30; // Leave some margin
        const lineStartX = 15;

        // Draw correspondence lines (lines with disassembly mapping) in a subtle color
        ctx.fillStyle = '#e8e8e8';
        correspondenceLines.forEach(lineIndex => {
            const y = lineToY(lineIndex);
            ctx.fillRect(lineStartX, y, lineWidth, Math.max(1, scaledLineHeight - 0.5));
        });

        // Draw hovered lines
        if (hoveredLines.length > 0) {
            ctx.fillStyle = '#dddddd';
            hoveredLines.forEach(lineIndex => {
                const y = lineToY(lineIndex);
                ctx.fillRect(lineStartX, y, lineWidth, Math.max(1, scaledLineHeight - 0.5));
            });
        }

        // Draw selected lines with highlight color
        if (selectedLines.length > 0) {
            const { h, s, l } = hexToHSL(HIGHLIGHT_COLOR);
            ctx.fillStyle = `hsl(${h}, ${s}%, ${Math.max(l - 10, 30)}%)`;
            selectedLines.forEach(lineIndex => {
                const y = lineToY(lineIndex);
                ctx.fillRect(lineStartX, y, lineWidth, Math.max(2, scaledLineHeight));
            });
        }

        // Draw arrows if selected lines are outside visible area
        const visibleStart = visibleStartLine;
        const visibleEnd = visibleEndLine;

        selectedLines.forEach(lineIndex => {
            if (lineIndex < visibleStart) {
                // Draw up arrow
                ctx.beginPath();
                ctx.strokeStyle = HIGHLIGHT_COLOR;
                ctx.lineWidth = 2;
                const arrowY = MINIMAP_PADDING_TOP;
                ctx.moveTo(lineStartX + lineWidth / 2, arrowY + 10);
                ctx.lineTo(lineStartX + lineWidth / 2, arrowY);
                ctx.lineTo(lineStartX + lineWidth / 2 - 5, arrowY + 5);
                ctx.moveTo(lineStartX + lineWidth / 2, arrowY);
                ctx.lineTo(lineStartX + lineWidth / 2 + 5, arrowY + 5);
                ctx.stroke();
            } else if (lineIndex > visibleEnd) {
                // Draw down arrow
                ctx.beginPath();
                ctx.strokeStyle = HIGHLIGHT_COLOR;
                ctx.lineWidth = 2;
                const arrowY = containerHeight - MINIMAP_PADDING_BOTTOM;
                ctx.moveTo(lineStartX + lineWidth / 2, arrowY - 10);
                ctx.lineTo(lineStartX + lineWidth / 2, arrowY);
                ctx.lineTo(lineStartX + lineWidth / 2 - 5, arrowY - 5);
                ctx.moveTo(lineStartX + lineWidth / 2, arrowY);
                ctx.lineTo(lineStartX + lineWidth / 2 + 5, arrowY - 5);
                ctx.stroke();
            }
        });
    }, [
        selectedLines,
        hoveredLines,
        correspondenceLines,
        visibleStartLine,
        visibleEndLine,
        width,
        containerHeight,
        scaledLineHeight,
        lineToY,
    ]);

    // Update brush position
    const updateBrush = React.useCallback(() => {
        if (!brushRef.current || isDragging) return;

        const brushTop = lineToY(visibleStartLine);
        const brushBottom = lineToY(visibleEndLine);
        const brushHeight = Math.max(20, brushBottom - brushTop);

        brushRef.current.style.top = `${brushTop}px`;
        brushRef.current.style.height = `${brushHeight}px`;
    }, [visibleStartLine, visibleEndLine, isDragging, lineToY]);

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
    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const y = e.clientY - rect.top;
        const lineIndex = yToLine(y);
        onLineClick(lineIndex);
    };

    // Handle brush drag
    const handleBrushMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        dragStartY.current = e.clientY;
        dragStartScrollLine.current = visibleStartLine;
    };

    React.useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaY = e.clientY - dragStartY.current;
            const deltaLines = Math.round(deltaY / scaledLineHeight);
            const visibleLineCount = visibleEndLine - visibleStartLine;
            const newStartLine = Math.max(
                0,
                Math.min(
                    totalLines - visibleLineCount,
                    dragStartScrollLine.current + deltaLines
                )
            );
            
            // Update brush position directly during drag for responsive feedback
            if (brushRef.current) {
                const brushTop = MINIMAP_PADDING_TOP + newStartLine * scaledLineHeight;
                const brushBottom = MINIMAP_PADDING_TOP + (newStartLine + visibleLineCount) * scaledLineHeight;
                const brushHeight = Math.max(20, brushBottom - brushTop);
                brushRef.current.style.top = `${brushTop}px`;
                brushRef.current.style.height = `${brushHeight}px`;
            }
            
            onScrollToLine(newStartLine);
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
    }, [isDragging, scaledLineHeight, totalLines, visibleStartLine, visibleEndLine, onScrollToLine]);

    return (
        <div
            className="source-minimap"
            style={{
                position: 'absolute',
                right: 0,
                top: 0,
                width: `${width}px`,
                height: '100%',
                backgroundColor: '#fafafa',
                borderLeft: '1px solid #e0e0e0',
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
                className="source-minimap-brush"
                onMouseDown={handleBrushMouseDown}
                style={{
                    position: 'absolute',
                    left: '5px',
                    right: '5px',
                    backgroundColor: 'rgba(75, 137, 231, 0.2)',
                    border: '1px solid rgba(75, 137, 231, 0.5)',
                    borderRadius: `${BRUSH_BORDER_RADIUS}px`,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    transition: isDragging ? 'none' : 'top 0.1s, height 0.1s',
                }}
            />
        </div>
    );
};

export default React.memo(SourceMinimap);
