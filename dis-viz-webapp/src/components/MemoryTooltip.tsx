import React, { useState } from 'react';
import { AppDispatch } from '../app/store';

interface MemoryInfo {
    isRead: boolean;
    isWrite: boolean;
}

interface MemoryTooltipProps {
    memoryInfos: { [binary: string]: MemoryInfo };
    dispatch: AppDispatch;
}

const getMemoryDisplayInfo = (memoryInfo: MemoryInfo) => {
    const { isRead, isWrite } = memoryInfo;
    
    let operationType = '';
    let backgroundColor = '';
    let borderColor = '';
    
    if (isRead && isWrite) {
        operationType = 'Read & Write';
        backgroundColor = '#fff3e0';
        borderColor = '#ff9800';
    } else if (isRead) {
        operationType = 'Read';
        backgroundColor = '#e3f2fd';
        borderColor = '#2196f3';
    } else if (isWrite) {
        operationType = 'Write';
        backgroundColor = '#ffebee';
        borderColor = '#f44336';
    }
    
    return { operationType, backgroundColor, borderColor, isRead, isWrite };
};

const MemoryTooltip: React.FC<MemoryTooltipProps> = ({
    memoryInfos,
    dispatch
}) => {
    const binaryPaths = Object.keys(memoryInfos);
    const [selectedBinary, setSelectedBinary] = useState<string>(binaryPaths[0] || '');
    
    if (binaryPaths.length === 0) {
        return (
            <div style={{
                backgroundColor: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                fontFamily: 'Consolas, monospace',
                fontSize: '12px',
            }}>
                No memory access information available
            </div>
        );
    }

    const showBinarySelector = binaryPaths.length > 1;
    const memoryInfo = memoryInfos[selectedBinary];
    const { operationType, backgroundColor, borderColor, isRead, isWrite } = getMemoryDisplayInfo(memoryInfo);

    return (
        <div
            style={{
                backgroundColor: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                maxWidth: '300px',
                fontFamily: 'Consolas, monospace',
                fontSize: '12px',
                zIndex: 1000
            }}
        >
            {/* Memory Operation Header */}
            <div style={{
                marginBottom: '8px',
                paddingBottom: '8px',
                borderBottom: '1px solid #eee',
                fontWeight: 'bold',
                fontSize: '14px'
            }}>
                Memory Access
            </div>

            {/* Binary selector tabs */}
            {showBinarySelector && (
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                    marginBottom: '12px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid #eee'
                }}>
                    {binaryPaths.map((binaryPath) => {
                        const binaryName = binaryPath.split('/').pop() || binaryPath;
                        const isSelected = binaryPath === selectedBinary;
                        const info = getMemoryDisplayInfo(memoryInfos[binaryPath]);
                        return (
                            <button
                                key={binaryPath}
                                onClick={() => setSelectedBinary(binaryPath)}
                                title={`${binaryPath} - ${info.operationType}`}
                                style={{
                                    padding: '4px 8px',
                                    fontSize: '11px',
                                    border: isSelected ? '2px solid #1976d2' : '1px solid #ccc',
                                    borderRadius: '4px',
                                    backgroundColor: isSelected ? '#e3f2fd' : '#f5f5f5',
                                    color: isSelected ? '#1976d2' : '#666',
                                    cursor: 'pointer',
                                    fontWeight: isSelected ? 'bold' : 'normal'
                                }}
                            >
                                {binaryName}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Operation Type */}
            <div
                style={{
                    padding: '8px 12px',
                    backgroundColor: backgroundColor,
                    borderLeft: `4px solid ${borderColor}`,
                    borderRadius: '2px',
                    marginBottom: '8px'
                }}
            >
                <div style={{ fontWeight: 'bold', marginBottom: '4px', color: borderColor }}>
                    Operation Type:
                </div>
                <div style={{ fontSize: '13px', color: '#333' }}>
                    {operationType}
                </div>
            </div>

            {/* Details */}
            <div style={{
                fontSize: '11px',
                color: '#666',
                paddingTop: '8px',
                borderTop: '1px solid #eee'
            }}>
                {isRead && isWrite ? (
                    <div>This line performs both memory read and write operations</div>
                ) : isRead ? (
                    <div>This line reads from memory</div>
                ) : isWrite ? (
                    <div>This line writes to memory</div>
                ) : null}
            </div>
        </div>
    );
};

export default MemoryTooltip;

