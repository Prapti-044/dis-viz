import React from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/themes/prism.css';
import { useFloating, autoUpdate, offset, flip, shift, useHover, useDismiss, useRole, useInteractions, FloatingPortal } from '@floating-ui/react';
import InlineTreeTooltip from './InlineTreeTooltip';
import CallGraphTooltip from './CallGraphTooltip';
import MemoryTooltip from './MemoryTooltip';
import { InlineEntry, CallGraphInfo, MemoryInfo } from '../types';
import { AppDispatch } from '../app/store';
import { SOURCE_TAGS } from '../utils';

// Component to wrap tags with tooltip functionality
const TooltipWrapper: React.FC<{
    children: React.ReactNode;
    inlineTree?: InlineEntry[];
    callGraphInfo?: CallGraphInfo;
    memoryInfo?: MemoryInfo;
    tagId: string;
    dispatch: AppDispatch;
    validBinaryFilePaths: string[];
    correspondences: { [binaryFilePath: string]: number[][] };
}> = ({ children, inlineTree, callGraphInfo, memoryInfo, tagId, dispatch, validBinaryFilePaths, correspondences }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    const { refs, floatingStyles, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        middleware: [
            offset(8),
            flip(),
            shift()
        ],
        whileElementsMounted: autoUpdate,
    });

    const hover = useHover(context, {
        delay: { open: 300, close: 150 }
    });
    const dismiss = useDismiss(context);
    const role = useRole(context, { role: 'tooltip' });

    const { getReferenceProps, getFloatingProps } = useInteractions([
        hover,
        dismiss,
        role,
    ]);

    // Check if we should show tooltip
    const shouldShowInlineTooltip = tagId === 'INLINE' && inlineTree && inlineTree.length > 0;
    const shouldShowCallGraphTooltip = tagId === 'CALL_GRAPH' && callGraphInfo;
    const shouldShowMemoryTooltip = tagId === 'MEMORY' && memoryInfo;
    const shouldShowTooltip = shouldShowInlineTooltip || shouldShowCallGraphTooltip || shouldShowMemoryTooltip;

    if (!shouldShowTooltip) {
        return <>{children}</>;
    }

    return (
        <>
            <div ref={refs.setReference} {...getReferenceProps()}>
                {children}
            </div>
            {isOpen && (
                <FloatingPortal root={document.body}>
                    <div
                        ref={refs.setFloating}
                        style={{
                            ...floatingStyles,
                            zIndex: 100,
                            position: 'fixed'
                        }}
                        {...getFloatingProps()}
                    >
                        {shouldShowInlineTooltip && inlineTree && (
                            <InlineTreeTooltip
                                inlineTree={inlineTree}
                                dispatch={dispatch}
                                validBinaryFilePaths={validBinaryFilePaths}
                                correspondences={correspondences}
                            />
                        )}
                        {shouldShowCallGraphTooltip && callGraphInfo && (
                            <CallGraphTooltip
                                callGraphInfo={callGraphInfo}
                                dispatch={dispatch}
                                validBinaryFilePaths={validBinaryFilePaths}
                            />
                        )}
                        {shouldShowMemoryTooltip && memoryInfo && (
                            <MemoryTooltip
                                memoryInfo={memoryInfo}
                                dispatch={dispatch}
                            />
                        )}
                    </div>
                </FloatingPortal>
            )}
        </>
    );
};

export interface SourceLineProps {
    lineIndex: number; // 0-based index
    lineContent: string;
    highlightedHtml: string;
    hasCorrespondence: boolean;
    isSelected: boolean;
    isHovered: boolean;
    tags: number[][]; // [tag][binary] - which binaries have this tag
    inlineTree?: { [binary: string]: InlineEntry[] };
    callGraphInfo?: { [binary: string]: CallGraphInfo };
    memoryInfo?: { [binary: string]: MemoryInfo };
    enabledTags: { [key: string]: boolean };
    validBinaryFilePaths: string[];
    correspondences: { [binaryFilePath: string]: number[][] };
    dispatch: AppDispatch;
    onClick: (lineIndex: number) => void;
    onMouseEnter: (lineIndex: number) => void;
    onMouseLeave: () => void;
    style?: React.CSSProperties;
}

const SourceLine: React.FC<SourceLineProps> = React.memo(({
    lineIndex,
    lineContent,
    highlightedHtml,
    hasCorrespondence,
    isSelected,
    isHovered,
    tags,
    inlineTree,
    callGraphInfo,
    memoryInfo,
    enabledTags,
    validBinaryFilePaths,
    correspondences,
    dispatch,
    onClick,
    onMouseEnter,
    onMouseLeave,
    style,
}) => {
    const lineNumber = lineIndex + 1; // 1-based for display

    // Build class names for line container
    const lineClasses = ['source-line'];
    if (isSelected) lineClasses.push('selected-line');
    if (isHovered) lineClasses.push('mouseHoverHighlight');

    // Build class names for line number
    const lineNumberClasses = ['source-line-number'];
    if (hasCorrespondence) lineNumberClasses.push('hasCorrespondence');

    // Get tag data for tooltips
    const getTagData = (tagId: string) => {
        let inlineTreeData: InlineEntry[] = [];
        let callGraphData: CallGraphInfo | undefined = undefined;
        let memoryData: MemoryInfo | undefined = undefined;

        if (tagId === 'INLINE' && inlineTree) {
            for (const binaryPath of validBinaryFilePaths) {
                if (inlineTree[binaryPath]) {
                    inlineTreeData = inlineTree[binaryPath];
                    break;
                }
            }
        }

        if (tagId === 'CALL_GRAPH' && callGraphInfo) {
            for (const binaryPath of validBinaryFilePaths) {
                if (callGraphInfo[binaryPath]) {
                    callGraphData = callGraphInfo[binaryPath];
                    break;
                }
            }
        }

        if (tagId === 'MEMORY' && memoryInfo) {
            for (const binaryPath of validBinaryFilePaths) {
                if (memoryInfo[binaryPath]) {
                    memoryData = memoryInfo[binaryPath];
                    break;
                }
            }
        }

        return { inlineTreeData, callGraphData, memoryData };
    };

    // Check if there are any enabled tags for this line
    const hasEnabledTags = tags.some((binaries, tagIndex) => 
        binaries.length > 0 && enabledTags[SOURCE_TAGS[tagIndex]?.id]
    );

    return (
        <div
            className={lineClasses.join(' ')}
            style={style}
            onClick={() => onClick(lineIndex)}
            onMouseEnter={() => onMouseEnter(lineIndex)}
            onMouseLeave={onMouseLeave}
        >
            {/* Line number gutter */}
            <div className={lineNumberClasses.join(' ')}>
                {lineNumber}
            </div>

            {/* Code content with syntax highlighting */}
            <div className="source-line-content">
                <pre className="source-code-pre">
                    <code
                        className="language-cpp"
                        dangerouslySetInnerHTML={{ __html: highlightedHtml || escapeHtml(lineContent) }}
                    />
                </pre>
            </div>

            {/* Tags container */}
            {hasEnabledTags && (
                <div className="source-line-tags">
                    <div className="right-tags">
                        {tags.map((binaries, tagIndex) => {
                            if (binaries.length === 0 || !enabledTags[SOURCE_TAGS[tagIndex]?.id]) {
                                return null;
                            }

                            const tagId = SOURCE_TAGS[tagIndex].id;
                            const { inlineTreeData, callGraphData, memoryData } = getTagData(tagId);

                            return (
                                <TooltipWrapper
                                    key={`${tagIndex}-${lineIndex}`}
                                    tagId={tagId}
                                    inlineTree={inlineTreeData}
                                    callGraphInfo={callGraphData}
                                    memoryInfo={memoryData}
                                    dispatch={dispatch}
                                    validBinaryFilePaths={validBinaryFilePaths}
                                    correspondences={correspondences}
                                >
                                    <div
                                        className="right-tags-container"
                                        style={{
                                            border: `2px solid ${SOURCE_TAGS[tagIndex].borderColor}`,
                                            color: SOURCE_TAGS[tagIndex].textColor,
                                            backgroundColor: SOURCE_TAGS[tagIndex].color,
                                        }}
                                    >
                                        <div className="right-tag">
                                            <span className="right-tag-name">{SOURCE_TAGS[tagIndex].shortName}</span>
                                            {validBinaryFilePaths.length > 1 && (
                                                <div className="right-tag-binaries">
                                                    {validBinaryFilePaths.map((binaryPath, binaryIndex) => (
                                                        <div
                                                            className={`right-tag-binary ${binaries.includes(binaryIndex) ? 'active' : 'inactive'}`}
                                                            key={`${lineIndex}-${tagIndex}-${binaryIndex}`}
                                                            title={binaryPath.split('/').pop()}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </TooltipWrapper>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison for memoization
    return (
        prevProps.lineIndex === nextProps.lineIndex &&
        prevProps.lineContent === nextProps.lineContent &&
        prevProps.highlightedHtml === nextProps.highlightedHtml &&
        prevProps.hasCorrespondence === nextProps.hasCorrespondence &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.isHovered === nextProps.isHovered &&
        prevProps.tags === nextProps.tags &&
        prevProps.enabledTags === nextProps.enabledTags &&
        prevProps.style?.top === nextProps.style?.top
    );
});

// Helper function to escape HTML
function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Utility function to highlight code with Prism.js
export function highlightCode(code: string, language: string = 'cpp'): string {
    try {
        const grammar = Prism.languages[language] || Prism.languages.cpp;
        return Prism.highlight(code, grammar, language);
    } catch (e) {
        console.error('Prism highlighting error:', e);
        return escapeHtml(code);
    }
}

// Pre-highlight all lines at once for better performance
export function highlightAllLines(lines: string[]): string[] {
    return lines.map(line => highlightCode(line, 'cpp'));
}

export default SourceLine;
