import React from 'react';
import { AppDispatch } from '../app/store';

interface MemoryInfo {
    isRead: boolean;
    isWrite: boolean;
}

interface MemoryTooltipProps {
    memoryInfo: MemoryInfo;
    dispatch: AppDispatch;
}

const MemoryTooltip: React.FC<MemoryTooltipProps> = ({
    memoryInfo,
    dispatch
}) => {
    const { isRead, isWrite } = memoryInfo;

    // Determine the memory operation type(s)
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

