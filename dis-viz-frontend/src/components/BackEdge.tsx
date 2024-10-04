import React from 'react'

const BACKEDGE_MIDDLE_OFFSET = 40
const ARROW_SIZE = 20
const BLOCK_ARROW_GAP = 4
const BLOCK_TOP_OFFSET = 10
const MAX_SUPPORTED_INDENT = 6 //7

const BackEdge = ({ source, target, level, zIndex, borderColor, borderStyle, borderWidth, className }: {
    source: HTMLDivElement|undefined,
    target: HTMLDivElement,
    level: number,
    zIndex?: number,
    borderColor?: string,
    borderStyle?: string,
    borderWidth?: string,
    className?: string,
}) => {
    const lineStyle = {
        stroke: '#D3D3D3',
        strokeWidth: '2px',
    }
    
    if(source === undefined) return null

    const box0 = source.getBoundingClientRect()
    const box1 = target.getBoundingClientRect()

    const offsetX = window.scrollX
    const offsetY = window.scrollY

    const x0 = box0.left + box0.width + offsetX
    const x1 = box1.left + box1.width + offsetX
    const y0 = box0.top + offsetY
    const y1 = box1.top + offsetY
    
    const up = (source === target)?true:(y0 > y1)
    
    const blockWidth = box0.width
    const width = Math.abs(x1 - x0)
    const height = Math.abs(y1 - y0)
    const svgPad = 10
    const levelIndent = MAX_SUPPORTED_INDENT - level

    return (
        <svg style={{
            zIndex: 2,
            position: 'absolute',
            top: BLOCK_TOP_OFFSET-svgPad - (up?height:0) + (up?0:box0.height-25),
            left: blockWidth + BLOCK_ARROW_GAP - svgPad,
            width: width + BACKEDGE_MIDDLE_OFFSET * levelIndent + svgPad*2,
            height: height + 10 + svgPad*2 + (up?box0.height:0),
            pointerEvents: 'none',
        }}
        >
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7"
                    refX="0" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill='grey' />
                </marker>
            </defs>
            <g>
                <line
                    x1={svgPad + BACKEDGE_MIDDLE_OFFSET * levelIndent}
                    x2={svgPad + (up?ARROW_SIZE:0)}
                    y1={svgPad}
                    y2={svgPad}
                    style={lineStyle}
                    markerEnd={up ? "url(#arrowhead)" : ""}
                />
                <line
                    x1={svgPad + BACKEDGE_MIDDLE_OFFSET * levelIndent}
                    x2={svgPad + BACKEDGE_MIDDLE_OFFSET * levelIndent}
                    y1={svgPad}
                    y2={svgPad + height + (up?box0.height-25:-box0.height+25)}
                    style={lineStyle} />
                <line
                    x1={svgPad + BACKEDGE_MIDDLE_OFFSET * levelIndent}
                    x2={svgPad + (!up?ARROW_SIZE:0)}
                    y1={svgPad + height + (up?box0.height-25:-box0.height+25)}
                    y2={svgPad + height + (up?box0.height-25:-box0.height+25)}
                    style={lineStyle}
                    markerEnd={!up?"url(#arrowhead)":""} />
            </g>
        </svg>
    );
}
// , (prevProps, nextProps) => {
//     return prevProps.source === nextProps.source && prevProps.target === nextProps.target
// }

export default BackEdge