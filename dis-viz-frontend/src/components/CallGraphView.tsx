import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as disvizProcessor from '../disvizProcessor';
import { useAppSelector } from '../app/hooks';
import { selectBinaryFilePaths } from '../features/binary-data/binaryDataSlice';
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
    const [selectedBinary, setSelectedBinary] = useState<string>('');
    const [callGraph, setCallGraph] = useState<disvizProcessor.CallGraph | null>(null);
      const [stats, setStats] = useState<{
    totalNodes: number;
    totalEdges: number;
    maxDepth: number;
    averageCallsPerFunction: number;
  } | null>(null);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
    const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, k: 1 });
    const [hideBuiltInFunctions, setHideBuiltInFunctions] = useState<boolean>(false);

    const svgRef = useRef<SVGSVGElement>(null);
    const gRef = useRef<SVGGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const zoomBehaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);

    // Update selected binary when binary file paths change
    useEffect(() => {
        const validPaths = binaryFilePaths.filter(path => path !== '');
        if (validPaths.length > 0 && !validPaths.includes(selectedBinary)) {
            setSelectedBinary(validPaths[0]);
        }
    }, [binaryFilePaths, selectedBinary]);

    // Build call graph when selected binary changes
    useEffect(() => {
        if (selectedBinary) {
            try {
                const graph = disvizProcessor.buildCallGraph(selectedBinary);
                const graphStats = disvizProcessor.getCallGraphStats(selectedBinary);
                setCallGraph(graph);
                setStats(graphStats);

                // Reset transform
                setTransform({ x: 0, y: 0, k: 1 });
                
                // Reset D3 zoom transform
                if (svgRef.current && zoomBehaviorRef.current) {
                    select(svgRef.current).call(
                        zoomBehaviorRef.current.transform,
                        zoomIdentity
                    );
                }
            } catch (error) {
                console.error('Error building call graph:', error);
                setCallGraph(null);
                setStats(null);
            }
        }
    }, [selectedBinary]);

    // Filter call graph based on hideBuiltInFunctions toggle
    const filteredCallGraph = React.useMemo(() => {
        if (!callGraph) return null;
        
        if (!hideBuiltInFunctions) return callGraph;
        
        // Filter out built-in nodes
        const filteredNodes = callGraph.nodes.filter(node => !node.isBuiltIn);
        const filteredNodeIds = new Set(filteredNodes.map(node => node.id));
        
        // Filter out edges that connect to/from built-in functions
        const filteredEdges = callGraph.edges.filter(edge => 
            filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target)
        );
        
        return {
            ...callGraph,
            nodes: filteredNodes,
            edges: filteredEdges
        };
    }, [callGraph, hideBuiltInFunctions]);

    // Initialize D3 zoom behavior
    useEffect(() => {
        if (!svgRef.current || !filteredCallGraph) return;

        const svg = select(svgRef.current);
        
        // Create zoom behavior
        const zoomBehavior = zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 10])
            .on('zoom', (event) => {
                const { x, y, k } = event.transform;
                setTransform({ x, y, k });
            });

        // Apply zoom behavior to SVG
        svg.call(zoomBehavior);
        
        // Store reference for programmatic control
        zoomBehaviorRef.current = zoomBehavior;

        // Cleanup
        return () => {
            svg.on('.zoom', null);
        };
    }, [filteredCallGraph]);

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
        if (filteredCallGraph && svgRef.current && zoomBehaviorRef.current && containerRef.current) {
            const svg = svgRef.current;
            const containerRect = containerRef.current.getBoundingClientRect();

            // Calculate bounds of all nodes
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            filteredCallGraph.nodes.forEach(node => {
                minX = Math.min(minX, node.x);
                maxX = Math.max(maxX, node.x + node.width);
                minY = Math.min(minY, node.y);
                maxY = Math.max(maxY, node.y + node.height);
            });

            const graphWidth = maxX - minX;
            const graphHeight = maxY - minY;
            const padding = 50;

            // Calculate scale to fit content
            const scaleX = (containerRect.width - padding * 2) / graphWidth;
            const scaleY = (containerRect.height - padding * 2) / graphHeight;
            const scale = Math.min(scaleX, scaleY, 2); // Allow up to 2x zoom

            // Calculate translation to center the content
            const translateX = (containerRect.width - graphWidth * scale) / 2 - minX * scale;
            const translateY = (containerRect.height - graphHeight * scale) / 2 - minY * scale;

            // Apply the transform with smooth transition
            select(svg).transition().duration(750).call(
                zoomBehaviorRef.current.transform,
                zoomIdentity.translate(translateX, translateY).scale(scale)
            );
        }
    }, [filteredCallGraph]);

    if (!selectedBinary) {
        return (
            <div className="call-graph-view">
                <div className="call-graph-header">
                    <h3>Call Graph View</h3>
                    <button onClick={removeSelf} className="close-button">×</button>
                </div>
                <div className="call-graph-content">
                    <p>No binary file selected. Please load a .disviz file first.</p>
                </div>
            </div>
        );
    }

    if (!filteredCallGraph) {
        return (
            <div className="call-graph-view">
                <div className="call-graph-header">
                    <h3>Call Graph View</h3>
                    <button onClick={removeSelf} className="close-button">×</button>
                </div>
                <div className="call-graph-content">
                    <p>Loading call graph...</p>
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
                        <span className="toggle-text">Hide Built-in Functions</span>
                    </label>
                    <button onClick={resetView} className="control-button">Reset View</button>
                    <button onClick={fitToView} className="control-button">Fit to View</button>
                    <button onClick={removeSelf} className="close-button">×</button>
                </div>
            </div>

            <div className="call-graph-stats">
                {stats && (
                    <div className="stats-grid">
                        <div className="stat-item">
                            <span className="stat-label">Functions:</span>
                            <span className="stat-value">{stats.totalNodes}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Calls:</span>
                            <span className="stat-value">{stats.totalEdges}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Max Depth:</span>
                            <span className="stat-value">{stats.maxDepth}</span>
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
                    {filteredCallGraph.edges.map((edge: disvizProcessor.CallGraphEdge) => {
                        const sourceNode = filteredCallGraph.nodes.find((n: disvizProcessor.CallGraphNode) => n.id === edge.source);
                        const targetNode = filteredCallGraph.nodes.find((n: disvizProcessor.CallGraphNode) => n.id === edge.target);

                        if (!sourceNode || !targetNode) return null;

                        // Create curved path using dagre edge points or fallback to straight line
                        let pathData: string;
                        
                        if (edge.points && edge.points.length > 0) {
                            // Use dagre-provided control points for smooth curves
                            const lineGenerator = line<{ x: number; y: number }>()
                                .x(d => d.x)
                                .y(d => d.y)
                                .curve(curveBasis);
                            
                            pathData = lineGenerator(edge.points) || '';
                        } else {
                            // Fallback to curved path between node centers
                            const sourceX = sourceNode.x + sourceNode.width / 2;
                            const sourceY = sourceNode.y + sourceNode.height;
                            const targetX = targetNode.x + targetNode.width / 2;
                            const targetY = targetNode.y;
                            
                            // Create a smooth curve
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
                    {filteredCallGraph.nodes.map((node: disvizProcessor.CallGraphNode) => (
                        <g key={node.id}>
                            <rect
                                x={node.x}
                                y={node.y}
                                width={node.width}
                                height={node.height}
                                className={`call-graph-node ${node.isBuiltIn ? 'builtin' : ''} ${hoveredNode === node.id ? 'hovered' : ''}`}
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
                                {node.name.length > 15 ? node.name.substring(0, 15) + '...' : node.name}
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

                    {/* Arrow marker definition */}
                    <defs>
                        <marker
                            id="arrowhead"
                            markerWidth="12"
                            markerHeight="8"
                            refX="11"
                            refY="4"
                            orient="auto"
                            markerUnits="strokeWidth"
                        >
                            <polygon
                                points="0 0, 12 4, 0 8"
                                fill="#1976d2"
                                stroke="none"
                            />
                        </marker>
                        <marker
                            id="arrowhead-highlighted"
                            markerWidth="12"
                            markerHeight="8"
                            refX="11"
                            refY="4"
                            orient="auto"
                            markerUnits="strokeWidth"
                        >
                            <polygon
                                points="0 0, 12 4, 0 8"
                                fill="#4caf50"
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
                        const node = filteredCallGraph.nodes.find((n: disvizProcessor.CallGraphNode) => n.id === hoveredNode);
                        return node ? (
                            <>
                                <div className="tooltip-title">{node.name}</div>
                                <div className="tooltip-content">
                                    <div><strong>Entry Address:</strong> 0x{node.entry.toString(16)}</div>
                                    <div><strong>Call Count:</strong> {node.callCount}</div>
                                    <div><strong>Type:</strong> {node.isBuiltIn ? 'Built-in' : 'User-defined'}</div>
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
