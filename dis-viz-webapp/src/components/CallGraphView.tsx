import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as disvizProcessor from '../disvizProcessor';
import { useAppSelector } from '../store/hooks';
import { selectBinaryFilePaths } from '../features/binary-data/binaryDataSlice';
import { selectSourceSelection } from '../features/selections/selectionsSlice';
import { line, curveBasis } from 'd3-shape';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, ZoomBehavior } from 'd3-zoom';
import 'd3-transition'; // Adds transition methods to d3-selection
import '../styles/CallGraphView.css';

interface CallGraphViewProps {
    id: number;
    removeSelf: () => void;
}

interface Transform {
    x: number;
    y: number;
    k: number; // scale factor
}

const CallGraphView: React.FC<CallGraphViewProps> = ({ id, removeSelf }) => {
    const binaryFilePaths = useAppSelector(selectBinaryFilePaths);
    const sourceSelection = useAppSelector(selectSourceSelection);
    
    const [selectedBinary, setSelectedBinary] = useState<string>('');
    const [graphIndex, setGraphIndex] = useState<disvizProcessor.CallGraphIndex | null>(null);
    const [currentSubgraph, setCurrentSubgraph] = useState<disvizProcessor.CallGraph | null>(null);
    const [visibleNodeIds, setVisibleNodeIds] = useState<Set<string>>(new Set());
    const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
    const [stats, setStats] = useState<{
        totalNodes: number;
        totalEdges: number;
        averageCallsPerFunction: number;
    } | null>(null);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
    const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, k: 1 });
    const [hideBuiltInFunctions, setHideBuiltInFunctions] = useState<boolean>(false);
    const [hideInlineFunctions, setHideInlineFunctions] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const svgRef = useRef<SVGSVGElement>(null);
    const gRef = useRef<SVGGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const zoomBehaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);

    // Determine whether there is an active source selection
    const hasSourceSelection = useMemo(() => {
        return sourceSelection.length > 0 && sourceSelection.some(sel => sel.source_lines.length > 0);
    }, [sourceSelection]);

    // Update selected binary when binary file paths change
    useEffect(() => {
        const validPaths = binaryFilePaths.filter(path => path !== '');
        if (validPaths.length > 0 && !validPaths.includes(selectedBinary)) {
            setSelectedBinary(validPaths[0]);
        }
    }, [binaryFilePaths, selectedBinary]);

    // Build lightweight index when selected binary changes (deferred to not block UI)
    useEffect(() => {
        if (!selectedBinary) return;
        setIsLoading(true);
        setGraphIndex(null);
        setCurrentSubgraph(null);

        const timeoutId = setTimeout(() => {
            try {
                const index = disvizProcessor.buildCallGraphIndex(selectedBinary);
                setGraphIndex(index);
                setStats(disvizProcessor.getCallGraphStatsFromIndex(index));
            } catch (error) {
                console.error('Error building call graph index:', error);
                setGraphIndex(null);
                setStats(null);
            }
            setIsLoading(false);
        }, 0);

        return () => clearTimeout(timeoutId);
    }, [selectedBinary]);

    // Core logic: derive visible nodes from source selection
    // When source lines are selected, find the containing function(s) and show them
    // with their callers and callees.  When nothing is selected, show nothing.
    useEffect(() => {
        if (!graphIndex || !selectedBinary) {
            setVisibleNodeIds(new Set());
            setSelectedNodeIds(new Set());
            return;
        }

        if (!hasSourceSelection) {
            // No source selection → empty call graph
            setVisibleNodeIds(new Set());
            setSelectedNodeIds(new Set());
            return;
        }

        const newVisible = new Set<string>();
        const newSelected = new Set<string>();

        for (const sel of sourceSelection) {
            if (sel.source_lines.length === 0) continue;

            // Find function(s) that contain the selected lines in this source file
            const funcs = disvizProcessor.getFunctionsForSourceLines(
                selectedBinary,
                sel.source_file,
                sel.source_lines
            );

            for (const func of funcs) {
                const nodeId = graphIndex.nameToId.get(func.name);
                if (!nodeId) continue;

                // The selected function itself is always shown
                newVisible.add(nodeId);
                newSelected.add(nodeId);

                // Add callers (incoming edges)
                const incoming = graphIndex.incoming.get(nodeId);
                if (incoming) {
                    for (const callerId of incoming) {
                        const node = graphIndex.nodes.get(callerId);
                        if (node &&
                            (!hideBuiltInFunctions || !node.isBuiltIn) &&
                            (!hideInlineFunctions || !node.isInline)) {
                            newVisible.add(callerId);
                        }
                    }
                }

                // Add callees (outgoing edges)
                const outgoing = graphIndex.outgoing.get(nodeId);
                if (outgoing) {
                    for (const calleeId of outgoing) {
                        const node = graphIndex.nodes.get(calleeId);
                        if (node &&
                            (!hideBuiltInFunctions || !node.isBuiltIn) &&
                            (!hideInlineFunctions || !node.isInline)) {
                            newVisible.add(calleeId);
                        }
                    }
                }
            }
        }

        setVisibleNodeIds(newVisible);
        setSelectedNodeIds(newSelected);

        // Reset zoom when selection changes
        setTransform({ x: 0, y: 0, k: 1 });
        if (svgRef.current && zoomBehaviorRef.current) {
            select(svgRef.current).call(zoomBehaviorRef.current.transform, zoomIdentity);
        }
    }, [sourceSelection, hasSourceSelection, selectedBinary, graphIndex, hideBuiltInFunctions, hideInlineFunctions]);

    // Layout visible subgraph whenever visibleNodeIds changes
    useEffect(() => {
        if (!graphIndex || visibleNodeIds.size === 0) {
            setCurrentSubgraph(null);
            return;
        }

        const subgraph = disvizProcessor.layoutVisibleSubgraph(graphIndex, visibleNodeIds);
        setCurrentSubgraph(subgraph);
    }, [graphIndex, visibleNodeIds]);

    // Initialize D3 zoom behavior
    useEffect(() => {
        if (!svgRef.current || !currentSubgraph) return;

        const svg = select(svgRef.current);
        
        const zoomBehavior = zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 10])
            .on('zoom', (event) => {
                const { x, y, k } = event.transform;
                setTransform({ x, y, k });
            });

        svg.call(zoomBehavior);
        zoomBehaviorRef.current = zoomBehavior;

        return () => {
            svg.on('.zoom', null);
        };
    }, [currentSubgraph]);

    // Handle node hover
    const handleNodeHover = useCallback((nodeId: string | null, event?: React.MouseEvent) => {
        setHoveredNode(nodeId);
        if (nodeId && event && containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            setTooltipPosition({
                x: event.clientX - containerRect.left + 15,
                y: event.clientY - containerRect.top - 10
            });
        } else {
            setTooltipPosition(null);
        }
    }, []);

    // Reset view
    const resetView = useCallback(() => {
        if (svgRef.current && zoomBehaviorRef.current) {
            select(svgRef.current).transition().duration(750).call(
                zoomBehaviorRef.current.transform,
                zoomIdentity
            );
        }
    }, []);

    // Fit to view
    const fitToView = useCallback(() => {
        if (currentSubgraph && svgRef.current && zoomBehaviorRef.current && containerRef.current) {
            const svg = svgRef.current;
            const containerRect = containerRef.current.getBoundingClientRect();

            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            currentSubgraph.nodes.forEach(node => {
                minX = Math.min(minX, node.x);
                maxX = Math.max(maxX, node.x + node.width);
                minY = Math.min(minY, node.y);
                maxY = Math.max(maxY, node.y + node.height);
            });

            const graphWidth = maxX - minX;
            const graphHeight = maxY - minY;
            const padding = 50;

            const scaleX = (containerRect.width - padding * 2) / graphWidth;
            const scaleY = (containerRect.height - padding * 2) / graphHeight;
            const scale = Math.min(scaleX, scaleY, 2);

            const translateX = (containerRect.width - graphWidth * scale) / 2 - minX * scale;
            const translateY = (containerRect.height - graphHeight * scale) / 2 - minY * scale;

            select(svg).transition().duration(750).call(
                zoomBehaviorRef.current.transform,
                zoomIdentity.translate(translateX, translateY).scale(scale)
            );
        }
    }, [currentSubgraph]);

    // Derive a friendly label for the selected function(s) shown in the header
    const selectionLabel = useMemo(() => {
        if (!currentSubgraph || selectedNodeIds.size === 0) return null;
        const names = currentSubgraph.nodes
            .filter(n => selectedNodeIds.has(n.id))
            .map(n => n.name);
        if (names.length === 0) return null;
        if (names.length === 1) return names[0];
        return `${names.length} functions`;
    }, [currentSubgraph, selectedNodeIds]);

    if (!selectedBinary) {
        return (
            <div className="call-graph-view">
                <div className="call-graph-header">
                    <h3>Call Graph View</h3>
                    <button onClick={removeSelf} className="close-button">&times;</button>
                </div>
                <div className="call-graph-content">
                    <p style={{ padding: '20px', color: '#888' }}>No binary file selected. Please load a .disviz file first.</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="call-graph-view">
                <div className="call-graph-header">
                    <h3>Call Graph View</h3>
                    <button onClick={removeSelf} className="close-button">&times;</button>
                </div>
                <div className="call-graph-loading">
                    <div className="loading-spinner" />
                    <p>Building call graph index...</p>
                </div>
            </div>
        );
    }

    // No source selection → show empty state
    if (!hasSourceSelection) {
        return (
            <div className="call-graph-view">
                <div className="call-graph-header">
                    <h3>Call Graph View</h3>
                    <div className="call-graph-controls">
                        <select
                            value={selectedBinary}
                            onChange={(e) => setSelectedBinary(e.target.value)}
                            className="binary-selector"
                        >
                            {binaryFilePaths.filter(path => path !== '').map(path => (
                                <option key={path} value={path}>{path}</option>
                            ))}
                        </select>
                        <button onClick={removeSelf} className="close-button">&times;</button>
                    </div>
                </div>
                <div className="call-graph-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ color: '#888', textAlign: 'center' }}>
                        Select lines in a source code view to see the call graph for the containing function.
                    </p>
                </div>
            </div>
        );
    }

    if (!currentSubgraph) {
        return (
            <div className="call-graph-view">
                <div className="call-graph-header">
                    <h3>Call Graph View</h3>
                    <button onClick={removeSelf} className="close-button">&times;</button>
                </div>
                <div className="call-graph-content">
                    <p style={{ padding: '20px', color: '#888' }}>No function found for the selected source lines.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="call-graph-view">
            <div className="call-graph-header">
                <h3>Call Graph View</h3>
                <div className="call-graph-controls">
                    <select
                        value={selectedBinary}
                        onChange={(e) => setSelectedBinary(e.target.value)}
                        className="binary-selector"
                    >
                        {binaryFilePaths.filter(path => path !== '').map(path => (
                            <option key={path} value={path}>{path}</option>
                        ))}
                    </select>
                    <label className="toggle-label">
                        <input
                            type="checkbox"
                            checked={hideBuiltInFunctions}
                            onChange={(e) => setHideBuiltInFunctions(e.target.checked)}
                            className="toggle-checkbox"
                        />
                        <span className="toggle-text">Hide Built-in</span>
                    </label>
                    <label className="toggle-label">
                        <input
                            type="checkbox"
                            checked={hideInlineFunctions}
                            onChange={(e) => setHideInlineFunctions(e.target.checked)}
                            className="toggle-checkbox"
                        />
                        <span className="toggle-text">Hide Inline</span>
                    </label>
                    <button onClick={resetView} className="control-button">Reset View</button>
                    <button onClick={fitToView} className="control-button">Fit to View</button>
                    <button onClick={removeSelf} className="close-button">&times;</button>
                </div>
            </div>

            <div className="call-graph-stats">
                {stats && currentSubgraph && (
                    <div className="stats-grid">
                        {selectionLabel && (
                            <div className="stat-item">
                                <span className="stat-label">Function:</span>
                                <span className="stat-value" title={selectionLabel}>
                                    {selectionLabel.length > 20 ? selectionLabel.substring(0, 20) + '...' : selectionLabel}
                                </span>
                            </div>
                        )}
                        <div className="stat-item">
                            <span className="stat-label">Visible:</span>
                            <span className="stat-value">{currentSubgraph.nodes.length}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Edges:</span>
                            <span className="stat-value">{currentSubgraph.edges.length}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Callers:</span>
                            <span className="stat-value">
                                {currentSubgraph.nodes.filter(n => !selectedNodeIds.has(n.id) &&
                                    currentSubgraph.edges.some(e => e.source === n.id && selectedNodeIds.has(e.target))
                                ).length}
                            </span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Callees:</span>
                            <span className="stat-value">
                                {currentSubgraph.nodes.filter(n => !selectedNodeIds.has(n.id) &&
                                    currentSubgraph.edges.some(e => e.target === n.id && selectedNodeIds.has(e.source))
                                ).length}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <div
                className="call-graph-content"
                ref={containerRef}
            >
                <svg
                    ref={svgRef}
                    className="call-graph-svg"
                    width="100%"
                    height="100%"
                    style={{ touchAction: 'none' }}
                >
                    {/* Background rect for zoom/pan events */}
                    <rect
                        width="100%"
                        height="100%"
                        fill="transparent"
                        style={{ pointerEvents: 'all' }}
                    />
                    
                    <g
                        ref={gRef}
                        transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}
                    >
                    {/* Render edges */}
                    {currentSubgraph.edges.map((edge: disvizProcessor.CallGraphEdge) => {
                        const sourceNode = currentSubgraph.nodes.find((n: disvizProcessor.CallGraphNode) => n.id === edge.source);
                        const targetNode = currentSubgraph.nodes.find((n: disvizProcessor.CallGraphNode) => n.id === edge.target);

                        if (!sourceNode || !targetNode) return null;

                        let pathData: string;
                        
                        if (edge.points && edge.points.length > 0) {
                            const lineGenerator = line<{ x: number; y: number }>()
                                .x(d => d.x)
                                .y(d => d.y)
                                .curve(curveBasis);
                            
                            pathData = lineGenerator(edge.points) || '';
                        } else {
                            const sourceX = sourceNode.x + sourceNode.width / 2;
                            const sourceY = sourceNode.y + sourceNode.height;
                            const targetX = targetNode.x + targetNode.width / 2;
                            const targetY = targetNode.y;
                            
                            const midY = sourceY + (targetY - sourceY) * 0.5;
                            pathData = `M ${sourceX} ${sourceY} Q ${sourceX} ${midY} ${(sourceX + targetX) / 2} ${midY} Q ${targetX} ${midY} ${targetX} ${targetY}`;
                        }

                        const isHighlighted = hoveredNode === edge.source || hoveredNode === edge.target;
                        
                        return (
                            <path
                                key={edge.id}
                                d={pathData}
                                className={`call-graph-edge ${isHighlighted ? 'highlighted' : ''}`}
                                strokeWidth={isHighlighted ? 3 : 2}
                                fill="none"
                                markerEnd={`url(#${isHighlighted ? 'arrowhead-highlighted' : 'arrowhead'})`}
                            />
                        );
                    })}

                    {/* Render nodes */}
                    {currentSubgraph.nodes.map((node: disvizProcessor.CallGraphNode) => (
                        <g key={node.id}>
                            <rect
                                x={node.x}
                                y={node.y}
                                width={node.width}
                                height={node.height}
                                className={`call-graph-node ${node.isBuiltIn ? 'builtin' : ''} ${node.isInline ? 'inline' : ''} ${hoveredNode === node.id ? 'hovered' : ''} ${selectedNodeIds.has(node.id) ? 'selected' : ''}`}
                                onMouseEnter={(e) => handleNodeHover(node.id, e)}
                                onMouseLeave={() => handleNodeHover(null)}
                                rx={8}
                                ry={8}
                            />
                            <text
                                x={node.x + node.width / 2}
                                y={node.y + node.height / 2}
                                className="call-graph-node-text"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                onMouseEnter={(e) => handleNodeHover(node.id, e)}
                                onMouseLeave={() => handleNodeHover(null)}
                            >
                                {(() => {
                                    if (node.isInline) {
                                        const displayName = node.simplifiedName || node.name.split('::').pop() || node.name;
                                        return displayName.length > 12 ? displayName.substring(0, 12) + '...' : displayName;
                                    } else {
                                        return node.name.length > 15 ? node.name.substring(0, 15) + '...' : node.name;
                                    }
                                })()}
                            </text>
                            {node.callCount > 0 && (
                                <text
                                    x={node.x + node.width - 5}
                                    y={node.y + 15}
                                    className="call-graph-node-count"
                                    textAnchor="end"
                                >
                                    {node.callCount}
                                </text>
                            )}
                        </g>
                    ))}

                    {/* Arrow marker definitions */}
                    <defs>
                        <marker
                            id="arrowhead"
                            markerWidth="10"
                            markerHeight="7"
                            refX="9"
                            refY="3.5"
                            orient="auto"
                            markerUnits="strokeWidth"
                        >
                            <polygon
                                points="0 0, 10 3.5, 0 7"
                                fill="#90a4ae"
                                stroke="none"
                            />
                        </marker>
                        <marker
                            id="arrowhead-highlighted"
                            markerWidth="10"
                            markerHeight="7"
                            refX="9"
                            refY="3.5"
                            orient="auto"
                            markerUnits="strokeWidth"
                        >
                            <polygon
                                points="0 0, 10 3.5, 0 7"
                                fill="#43a047"
                                stroke="none"
                            />
                        </marker>
                    </defs>
                    </g>
                </svg>
            </div>

            {/* Tooltip */}
            {hoveredNode && tooltipPosition && (
                <div 
                    className="call-graph-tooltip"
                    style={{
                        left: tooltipPosition.x,
                        top: tooltipPosition.y
                    }}
                >
                    {(() => {
                        const node = currentSubgraph.nodes.find((n: disvizProcessor.CallGraphNode) => n.id === hoveredNode);
                        return node ? (
                            <>
                                <div className="tooltip-title">{node.name}</div>
                                <div className="tooltip-content">
                                    <div><strong>Entry Address:</strong> 0x{node.entry.toString(16)}</div>
                                    <div><strong>Call Count:</strong> {node.callCount}</div>
                                    <div><strong>Type:</strong> {
                                        node.isInline ? 'Inline Function' : 
                                        node.isBuiltIn ? 'Built-in' : 'User-defined'
                                    }</div>
                                    {node.isInline && node.parentFunction && (
                                        <>
                                            <div><strong>Parent Function:</strong> {node.parentFunction}</div>
                                            {node.callsiteFile && (
                                                <div><strong>Callsite:</strong> {node.callsiteFile.split('/').pop()}:{node.callsiteLine}</div>
                                            )}
                                        </>
                                    )}
                                    <div><strong>Role:</strong> {
                                        selectedNodeIds.has(node.id) ? 'Selected function' :
                                        currentSubgraph.edges.some(e => e.target === node.id && selectedNodeIds.has(e.source)) ? 'Callee' :
                                        currentSubgraph.edges.some(e => e.source === node.id && selectedNodeIds.has(e.target)) ? 'Caller' :
                                        'Related'
                                    }</div>
                                </div>
                            </>
                        ) : null;
                    })()}
                </div>
            )}
        </div>
    );
};

export default CallGraphView;
