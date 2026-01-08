import React from 'react';
import { AppDispatch } from '../app/store';
import { setSelection } from '../features/selections/selectionsSlice';
import * as disvizProcessor from '../disvizProcessor';

interface CallGraphInfo {
    functionName: string;
    calledFunctions: string[];  // Functions this function calls (out-degree)
    calledFunctionsBuiltIn?: { [funcName: string]: boolean };  // Whether each called function is built-in
    callingFunctions: string[]; // Functions that call this function (in-degree)
    callingFunctionsBuiltIn?: { [funcName: string]: boolean };  // Whether each calling function is built-in
    returnType: string;
    parameters: { type: string; name: string }[];
    inDegree: number;
    outDegree: number;
    inlines: { name: string; simplified_name: string }[];
}

interface CallGraphTooltipProps {
    callGraphInfo: CallGraphInfo;
    dispatch: AppDispatch;
    validBinaryFilePaths: string[];
}

const CallGraphTooltip: React.FC<CallGraphTooltipProps> = ({
    callGraphInfo,
    dispatch,
    validBinaryFilePaths
}) => {
    const { 
        functionName, 
        calledFunctions, 
        calledFunctionsBuiltIn = {}, 
        callingFunctions, 
        callingFunctionsBuiltIn = {}, 
        returnType, 
        parameters, 
        inDegree, 
        outDegree, 
        inlines 
    } = callGraphInfo;

    // Handler for clicking on a function name to navigate to its definition
    const handleFunctionClick = (funcName: string) => {
        // Try to find the function info from any of the loaded binaries
        for (const binaryPath of validBinaryFilePaths) {
            try {
                const funcInfo = disvizProcessor.getFunctionInfo(binaryPath, funcName);
                if (funcInfo && funcInfo.source_info && funcInfo.source_info.file && funcInfo.source_info.line > 0) {
                    const sourceFile = funcInfo.source_info.file;
                    const startLine = funcInfo.source_info.line; // 1-based line number
                    
                    // Get source lines to find the first line with assembly correspondence
                    const sourceData = disvizProcessor.getSourceLines(validBinaryFilePaths, sourceFile);
                    
                    // Find the first line starting from the function definition that has correspondence
                    let targetLine = -1;
                    let binarySelections: { binary_file: string; addresses: number[] }[] = [];
                    
                    // Search from the function definition line onwards
                    for (let lineIdx = startLine - 1; lineIdx < sourceData.lines.length; lineIdx++) {
                        const line = sourceData.lines[lineIdx];
                        const hasCorrespondence = validBinaryFilePaths.some(bp => {
                            const addresses = line.addresses[bp];
                            return addresses && addresses.length > 0;
                        });
                        
                        if (hasCorrespondence) {
                            targetLine = lineIdx; // 0-based index for selection
                            // Collect binary selections
                            binarySelections = validBinaryFilePaths
                                .map(bp => {
                                    const addresses = line.addresses[bp];
                                    if (addresses && addresses.length > 0) {
                                        return { binary_file: bp, addresses };
                                    }
                                    return null;
                                })
                                .filter((sel): sel is { binary_file: string; addresses: number[] } => sel !== null);
                            break;
                        }
                    }
                    
                    if (targetLine >= 0) {
                        dispatch(setSelection({
                            source_selection: [{
                                source_file: sourceFile,
                                source_lines: [targetLine]
                            }],
                            binary_selection: binarySelections
                        }));
                        return;
                    }
                }
            } catch (e) {
                // Function not found in this binary, try the next one
                continue;
            }
        }
    };

    return (
        <div
            style={{
                backgroundColor: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                maxWidth: '500px',
                fontFamily: 'Consolas, monospace',
                fontSize: '12px',
                zIndex: 1000
            }}
        >
            {/* Function Signature */}
            <div style={{
                marginBottom: '12px',
                paddingBottom: '8px',
                borderBottom: '1px solid #eee',
                fontWeight: 'bold'
            }}>
                <div style={{ color: '#0066cc', marginBottom: '4px' }}>
                    {returnType} <span style={{ color: '#000' }}>{functionName}</span>(
                </div>
                <div style={{ paddingLeft: '16px' }}>
                    {parameters.length === 0 ? (
                        <span style={{ color: '#666' }}>void</span>
                    ) : (
                        parameters.map((param, index) => (
                            <div key={index} style={{ color: '#666' }}>
                                <span style={{ color: '#0066cc' }}>{param.type}</span> {param.name}
                                {index < parameters.length - 1 ? ',' : ''}
                            </div>
                        ))
                    )}
                </div>
                <div>)</div>
            </div>

            {/* Call Graph Information - Called By Section */}
            <div style={{ marginBottom: '12px' }}>
                <div style={{
                    fontWeight: 'bold',
                    marginBottom: '6px',
                    color: '#1565c0'
                }}>
                    Called by {inDegree} function{inDegree !== 1 ? 's' : ''}:
                </div>
                {callingFunctions.length === 0 ? (
                    <div style={{ color: '#666', fontStyle: 'italic', paddingLeft: '8px' }}>
                        No callers found
                    </div>
                ) : (
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                        {callingFunctions.map((funcName, index) => {
                            const isBuiltIn = callingFunctionsBuiltIn[funcName] ?? false;
                            const bgColor = isBuiltIn ? '#f5f5f5' : '#f0f7ff';
                            const bgColorHover = isBuiltIn ? '#eeeeee' : '#e3f2fd';
                            const borderColor = isBuiltIn ? '#9e9e9e' : '#2196f3';
                            const textColor = isBuiltIn ? '#666' : '#000';
                            
                            return (
                                <div
                                    key={index}
                                    style={{
                                        padding: '4px 8px',
                                        marginBottom: '2px',
                                        backgroundColor: bgColor,
                                        borderLeft: `3px solid ${borderColor}`,
                                        borderRadius: '2px',
                                        cursor: 'pointer',
                                        color: textColor
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = bgColorHover;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = bgColor;
                                    }}
                                    onClick={() => handleFunctionClick(funcName)}
                                    title={isBuiltIn ? 'Built-in function - Click to navigate' : 'User-defined function - Click to navigate'}
                                >
                                    ← {funcName}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Call Graph Information - Calls Section */}
            <div>
                <div style={{
                    fontWeight: 'bold',
                    marginBottom: '6px',
                    color: '#2e7d32'
                }}>
                    Calls {outDegree} function{outDegree !== 1 ? 's' : ''}:
                </div>
                {calledFunctions.length === 0 ? (
                    <div style={{ color: '#666', fontStyle: 'italic', paddingLeft: '8px' }}>
                        No functions called
                    </div>
                ) : (
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                        {calledFunctions.map((funcName, index) => {
                            const isBuiltIn = calledFunctionsBuiltIn[funcName] ?? false;
                            const bgColor = isBuiltIn ? '#f5f5f5' : '#f0f9f0';
                            const bgColorHover = isBuiltIn ? '#eeeeee' : '#e1f5e1';
                            const borderColor = isBuiltIn ? '#9e9e9e' : '#4caf50';
                            const textColor = isBuiltIn ? '#666' : '#000';
                            
                            return (
                                <div
                                    key={index}
                                    style={{
                                        padding: '4px 8px',
                                        marginBottom: '2px',
                                        backgroundColor: bgColor,
                                        borderLeft: `3px solid ${borderColor}`,
                                        borderRadius: '2px',
                                        cursor: 'pointer',
                                        color: textColor
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = bgColorHover;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = bgColor;
                                    }}
                                    onClick={() => handleFunctionClick(funcName)}
                                    title={isBuiltIn ? 'Built-in function - Click to navigate' : 'User-defined function - Click to navigate'}
                                >
                                    → {funcName}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Inline Functions Section */}
            {inlines && inlines.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                    <div style={{
                        fontWeight: 'bold',
                        marginBottom: '6px',
                        color: '#7b1fa2'
                    }}>
                        {inlines.length} Inline{inlines.length !== 1 ? 's' : ''}:
                    </div>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                        {inlines.map((inline, index) => (
                            <div
                                key={index}
                                style={{
                                    padding: '4px 8px',
                                    marginBottom: '2px',
                                    backgroundColor: '#f3e5f5',
                                    borderLeft: '3px solid #9c27b0',
                                    borderRadius: '2px',
                                    cursor: 'default'
                                }}
                                title={inline.name}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#e1bee7';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f3e5f5';
                                }}
                            >
                                ⊕ {inline.simplified_name || inline.name}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={{
                marginTop: '8px',
                paddingTop: '8px',
                borderTop: '1px solid #eee',
                fontSize: '10px',
                color: '#666'
            }}>
                <div style={{ marginBottom: '4px' }}>In-degree: {inDegree} | Out-degree: {outDegree}</div>
                <div style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    fontSize: '9px',
                    marginTop: '4px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ 
                            display: 'inline-block', 
                            width: '12px', 
                            height: '12px', 
                            backgroundColor: '#f0f7ff',
                            border: '1px solid #2196f3',
                            borderRadius: '2px'
                        }} />
                        <span>User-defined</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ 
                            display: 'inline-block', 
                            width: '12px', 
                            height: '12px', 
                            backgroundColor: '#f5f5f5',
                            border: '1px solid #9e9e9e',
                            borderRadius: '2px'
                        }} />
                        <span>System/Built-in</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CallGraphTooltip;

