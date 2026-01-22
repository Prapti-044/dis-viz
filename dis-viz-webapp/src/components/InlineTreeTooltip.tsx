import React, { useState } from 'react';
import { InlineEntry } from '../types';
import '../styles/inlineTreeTooltip.css';
import useSelectionWithHistory from '../hooks/useSelectionWithHistory';
import * as disvizProcessor from '../disvizProcessor';

interface InlineTreeTooltipProps {
    inlineTrees: { [binary: string]: InlineEntry[] };
    validBinaryFilePaths: string[];
    correspondences: { [binaryFilePath: string]: number[][] };
}

interface InlineTreeNodeProps {
    entry: InlineEntry;
    depth: number;
    validBinaryFilePaths: string[];
    correspondences: { [binaryFilePath: string]: number[][] };
}

const InlineTreeNode: React.FC<InlineTreeNodeProps> = ({ entry, depth, validBinaryFilePaths, correspondences }) => {
    const { setSelectionWithHistory } = useSelectionWithHistory();
    const indentStyle = {
        paddingLeft: `${depth * 16}px`
    };

    const functionName = entry.simplified_name;
    const fileName = entry.callsite_file.split('/').pop() || entry.callsite_file;

    const handleFunctionClick = () => {
        // Navigate to the callsite line (convert to 0-based indexing)
        const callsiteLine = entry.callsite_line - 1;
        
        // Get addresses for this line from all binaries if available
        const binarySelections = validBinaryFilePaths
            .map(binaryPath => {
                const lineCorrespondences = correspondences[binaryPath];
                if (lineCorrespondences && lineCorrespondences[callsiteLine] && lineCorrespondences[callsiteLine].length > 0) {
                    return {
                        binary_file: binaryPath,
                        addresses: lineCorrespondences[callsiteLine]
                    };
                }
                return null;
            })
            .filter(selection => selection !== null);

        // Get block info for details
        let blockName: string | undefined;
        if (binarySelections.length > 0 && binarySelections[0].addresses.length > 0) {
            try {
                const block = disvizProcessor.getDisassemblyBlockByAddress(
                    binarySelections[0].binary_file,
                    'memory_order',
                    binarySelections[0].addresses[0]
                );
                blockName = block.name;
            } catch (err) {
                // Block info not available
            }
        }

        // Dispatch selection to navigate to the callsite
        setSelectionWithHistory({
            source_selection: [{
                source_file: entry.callsite_file,
                source_lines: [callsiteLine]
            }],
            binary_selection: binarySelections,
            origin: {
                type: 'source',
                sourceFile: entry.callsite_file,
                lineNumber: entry.callsite_line, // Already 1-based
            },
            details: {
                functionName: entry.simplified_name || entry.name,
                blockName,
            },
        });
    };

    return (
        <div className="inline-tree-node">
            <div className="inline-tree-entry" style={indentStyle}>
                <span className="inline-tree-icon">
                    ƒ
                </span>
                <span 
                    className="inline-tree-function-name clickable-function" 
                    title={`${entry.name} - Click to go to ${fileName}:${entry.callsite_line}`}
                    onClick={handleFunctionClick}
                >
                    {functionName}
                </span>
                <span className="inline-tree-location">
                    <span className="inline-tree-file">{fileName}</span>
                    <span className="inline-tree-line">:{entry.callsite_line}</span>
                </span>
                {/* {entry.ranges.length > 0 && (
                    <span className="inline-tree-ranges">
                        [{entry.ranges.length} range{entry.ranges.length > 1 ? 's' : ''}]
                    </span>
                )} */}
            </div>
            {entry.children.length > 0 && (
                <div className="inline-tree-children">
                    {entry.children.map((child, index) => (
                        <InlineTreeNode 
                            key={`${child.name}-${child.callsite_line}-${index}`} 
                            entry={child} 
                            depth={depth + 1}
                            validBinaryFilePaths={validBinaryFilePaths}
                            correspondences={correspondences}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const InlineTreeTooltip: React.FC<InlineTreeTooltipProps> = ({ inlineTrees, validBinaryFilePaths, correspondences }) => {
    const binaryPaths = Object.keys(inlineTrees);
    const [selectedBinary, setSelectedBinary] = useState<string>(binaryPaths[0] || '');
    
    if (binaryPaths.length === 0) {
        return (
            <div className="inline-tree-tooltip">
                <div className="inline-tree-header">Inline Functions</div>
                <div className="inline-tree-empty">No inline functions found</div>
            </div>
        );
    }

    const currentInlineTree = inlineTrees[selectedBinary] || [];
    const showBinarySelector = binaryPaths.length > 1;

    return (
        <div className="inline-tree-tooltip">
            <div className="inline-tree-header">
                <span className="inline-tree-title">Inline Functions</span>
                <span className="inline-tree-count">({currentInlineTree.length})</span>
            </div>
            
            {/* Binary selector tabs */}
            {showBinarySelector && (
                <div className="binary-selector">
                    {binaryPaths.map((binaryPath, index) => {
                        const binaryName = binaryPath.split('/').pop() || binaryPath;
                        const isSelected = binaryPath === selectedBinary;
                        return (
                            <button
                                key={binaryPath}
                                className={`binary-tab ${isSelected ? 'active' : ''}`}
                                onClick={() => setSelectedBinary(binaryPath)}
                                title={binaryPath}
                            >
                                {binaryName}
                                <span className="binary-count">({inlineTrees[binaryPath]?.length || 0})</span>
                            </button>
                        );
                    })}
                </div>
            )}
            
            <div className="inline-tree-content">
                {currentInlineTree.map((entry, index) => (
                    <InlineTreeNode 
                        key={`${entry.name}-${entry.callsite_line}-${index}`} 
                        entry={entry} 
                        depth={0}
                        validBinaryFilePaths={validBinaryFilePaths}
                        correspondences={correspondences}
                    />
                ))}
            </div>
        </div>
    );
};

export default InlineTreeTooltip; 