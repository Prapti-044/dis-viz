import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
    selectHistoryEntries,
    selectCurrentHistoryIndex,
    setCurrentHistoryIndex,
    clearHistory,
    HistoryEntry,
} from '../features/history/historySlice';
import { setSelection } from '../features/selections/selectionsSlice';

import '../styles/historyBar.css';

interface TooltipProps {
    entry: HistoryEntry;
    anchorRect: DOMRect | null;
}

const HistoryTooltip: React.FC<TooltipProps> = ({ entry, anchorRect }) => {
    if (!anchorRect) return null;

    const { details, origin } = entry;
    const time = new Date(entry.timestamp).toLocaleTimeString();

    // Calculate position
    const style: React.CSSProperties = {
        position: 'fixed',
        top: anchorRect.bottom + 8,
        left: anchorRect.left + anchorRect.width / 2,
        transform: 'translateX(-50%)',
    };

    return createPortal(
        <div className="history-tooltip" style={style}>
            <div className="tooltip-header">
                <span className="tooltip-origin">
                    {origin.type === 'source' ? 'Source Selection' : 'Disassembly Selection'}
                </span>
                <span className="tooltip-time">{time}</span>
            </div>

            {details.functionName && (
                <div className="tooltip-row">
                    <span className="tooltip-label">Function:</span>
                    <span className="tooltip-value">{details.functionName}</span>
                </div>
            )}

            {details.blockName && (
                <div className="tooltip-row">
                    <span className="tooltip-label">Block:</span>
                    <span className="tooltip-value tooltip-block">{details.blockName}</span>
                </div>
            )}

            {details.sourceDetails.length > 0 && (
                <div className="tooltip-section">
                    <span className="tooltip-section-title">Source Lines:</span>
                    {details.sourceDetails.map((src, idx) => (
                        <div key={idx} className="tooltip-source-item">
                            <span className="tooltip-file">{src.file.split('/').pop()}</span>
                            <span className="tooltip-lines">
                                : {src.lines.length <= 3 
                                    ? src.lines.join(', ') 
                                    : `${src.lines.slice(0, 3).join(', ')}... (+${src.lines.length - 3})`}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {details.binaryDetails.length > 0 && (
                <div className="tooltip-section">
                    <span className="tooltip-section-title">Binary Addresses:</span>
                    {details.binaryDetails.map((bin, idx) => (
                        <div key={idx} className="tooltip-binary-item">
                            <span className="tooltip-file">{bin.file.split('/').pop()}</span>
                            <span className="tooltip-addresses">
                                : {bin.addresses.length <= 2
                                    ? bin.addresses.map(a => `0x${a.toString(16).toUpperCase()}`).join(', ')
                                    : `0x${bin.addresses[0].toString(16).toUpperCase()}... (+${bin.addresses.length - 1})`}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>,
        document.body
    );
};

interface BreadcrumbItemProps {
    entry: HistoryEntry;
    index: number;
    activeIndex: number;
    onClick: () => void;
}

const BreadcrumbItem: React.FC<BreadcrumbItemProps> = ({ entry, index, activeIndex, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isHovered && buttonRef.current) {
            setAnchorRect(buttonRef.current.getBoundingClientRect());
        } else {
            setAnchorRect(null);
        }
    }, [isHovered]);

    return (
        <div 
            className="breadcrumb-item-wrapper"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <button
                ref={buttonRef}
                className={`breadcrumb-item ${index === activeIndex ? 'active' : ''} ${index < activeIndex ? 'past' : ''}`}
                onClick={onClick}
            >
                {entry.label}
            </button>
            {isHovered && <HistoryTooltip entry={entry} anchorRect={anchorRect} />}
        </div>
    );
};

const HistoryBar: React.FC = () => {
    const dispatch = useAppDispatch();
    const entries = useAppSelector(selectHistoryEntries);
    const currentIndex = useAppSelector(selectCurrentHistoryIndex);

    // Get the effective current position in history
    const getActiveIndex = (): number => {
        if (currentIndex !== null) {
            return currentIndex;
        }
        // If currentIndex is null, we're at the latest state (last entry)
        return entries.length - 1;
    };

    const activeIndex = getActiveIndex();

    const navigateToEntry = (entry: HistoryEntry, index: number) => {
        dispatch(setCurrentHistoryIndex(index));
        dispatch(
            setSelection({
                source_selection: entry.source_selection,
                binary_selection: entry.binary_selection,
            })
        );
    };

    const handlePrevious = () => {
        if (activeIndex > 0) {
            const prevIndex = activeIndex - 1;
            const entry = entries[prevIndex];
            navigateToEntry(entry, prevIndex);
        }
    };

    const handleNext = () => {
        if (activeIndex < entries.length - 1) {
            const nextIndex = activeIndex + 1;
            const entry = entries[nextIndex];
            navigateToEntry(entry, nextIndex);
        }
    };

    const handleClearHistory = () => {
        dispatch(clearHistory());
    };

    const canGoBack = activeIndex > 0;
    const canGoForward = activeIndex < entries.length - 1;

    if (entries.length === 0) {
        return null; // Don't render if no history
    }

    return (
        <div className="history-bar">
            {/* Navigation buttons */}
            <div className="history-nav-buttons">
                <button
                    className={`history-nav-btn ${!canGoBack ? 'disabled' : ''}`}
                    onClick={handlePrevious}
                    disabled={!canGoBack}
                    title="Go back (Previous selection)"
                >
                    <span className="nav-arrow">&#8592;</span>
                </button>
                <button
                    className={`history-nav-btn ${!canGoForward ? 'disabled' : ''}`}
                    onClick={handleNext}
                    disabled={!canGoForward}
                    title="Go forward (Next selection)"
                >
                    <span className="nav-arrow">&#8594;</span>
                </button>
            </div>

            {/* Breadcrumb trail */}
            <div className="history-breadcrumb">
                {entries.map((entry, index) => (
                    <React.Fragment key={entry.id}>
                        {index > 0 && <span className="breadcrumb-separator">›</span>}
                        <BreadcrumbItem
                            entry={entry}
                            index={index}
                            activeIndex={activeIndex}
                            onClick={() => navigateToEntry(entry, index)}
                        />
                    </React.Fragment>
                ))}
            </div>

            {/* Clear button */}
            <button
                className="history-clear-btn"
                onClick={handleClearHistory}
                title="Clear history"
            >
                &#10005;
            </button>
        </div>
    );
};

export default HistoryBar;
