import React from 'react';
import { InlineEntry } from '../types';
import '../styles/inlineTreeTooltip.css';

interface InlineTreeTooltipProps {
    inlineTree: InlineEntry[];
}

interface InlineTreeNodeProps {
    entry: InlineEntry;
    depth: number;
}

const InlineTreeNode: React.FC<InlineTreeNodeProps> = ({ entry, depth }) => {
    const indentStyle = {
        paddingLeft: `${depth * 16}px`
    };

    // Extract just the function name from the full signature
    const getFunctionName = (fullName: string): string => {
        // Handle C++ mangled names and common patterns
        const match = fullName.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
        if (match) {
            return match[1];
        }
        
        // If no parentheses found, try to get the last part after ::
        const parts = fullName.split('::');
        const lastPart = parts[parts.length - 1];
        
        // Remove template parameters if any
        const templateMatch = lastPart.match(/([a-zA-Z_][a-zA-Z0-9_]*)/);
        return templateMatch ? templateMatch[1] : lastPart;
    };

    const functionName = getFunctionName(entry.name);
    const fileName = entry.callsite_file.split('/').pop() || entry.callsite_file;

    return (
        <div className="inline-tree-node">
            <div className="inline-tree-entry" style={indentStyle}>
                <span className="inline-tree-icon">
                    ƒ
                </span>
                <span className="inline-tree-function-name" title={entry.name}>
                    {functionName}
                </span>
                <span className="inline-tree-location">
                    <span className="inline-tree-file">{fileName}</span>
                    <span className="inline-tree-line">:{entry.callsite_line}</span>
                </span>
                {entry.ranges.length > 0 && (
                    <span className="inline-tree-ranges">
                        [{entry.ranges.length} range{entry.ranges.length > 1 ? 's' : ''}]
                    </span>
                )}
            </div>
            {entry.children.length > 0 && (
                <div className="inline-tree-children">
                    {entry.children.map((child, index) => (
                        <InlineTreeNode 
                            key={`${child.name}-${child.callsite_line}-${index}`} 
                            entry={child} 
                            depth={depth + 1} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const InlineTreeTooltip: React.FC<InlineTreeTooltipProps> = ({ inlineTree }) => {
    if (inlineTree.length === 0) {
        return (
            <div className="inline-tree-tooltip">
                <div className="inline-tree-header">Inline Functions</div>
                <div className="inline-tree-empty">No inline functions found</div>
            </div>
        );
    }

    return (
        <div className="inline-tree-tooltip">
            <div className="inline-tree-header">
                <span className="inline-tree-title">Inline Functions</span>
                <span className="inline-tree-count">({inlineTree.length})</span>
            </div>
            <div className="inline-tree-content">
                {inlineTree.map((entry, index) => (
                    <InlineTreeNode 
                        key={`${entry.name}-${entry.callsite_line}-${index}`} 
                        entry={entry} 
                        depth={0} 
                    />
                ))}
            </div>
        </div>
    );
};

export default InlineTreeTooltip; 