import React, { useState } from 'react';
import { InlineEntry } from '../types';
import '../styles/inlineTreeTooltip.css';
import { setSelection } from '../features/selections/selectionsSlice';
import { AppDispatch } from '../app/store';

interface InlineTreeTooltipProps {
    inlineTrees: { [binary: string]: InlineEntry[] };
    dispatch: AppDispatch;
    validBinaryFilePaths: string[];
    correspondences: { [binaryFilePath: string]: number[][] };
}

interface InlineTreeNodeProps {
    entry: InlineEntry;
    depth: number;
    dispatch: AppDispatch;
    validBinaryFilePaths: string[];
    correspondences: { [binaryFilePath: string]: number[][] };
}

const InlineTreeNode: React.FC<InlineTreeNodeProps> = ({ entry, depth, dispatch, validBinaryFilePaths, correspondences }) => {
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

        // Dispatch selection to navigate to the callsite
        dispatch(setSelection({
            source_selection: [{
                source_file: entry.callsite_file,
                source_lines: [callsiteLine]
            }],
            binary_selection: binarySelections
        }));
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
                            dispatch={dispatch}
                            validBinaryFilePaths={validBinaryFilePaths}
                            correspondences={correspondences}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const InlineTreeTooltip: React.FC<InlineTreeTooltipProps> = ({ inlineTrees, dispatch, validBinaryFilePaths, correspondences }) => {
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
                        dispatch={dispatch}
                        validBinaryFilePaths={validBinaryFilePaths}
                        correspondences={correspondences}
                    />
                ))}
            </div>
        </div>
    );
};

export default InlineTreeTooltip; 