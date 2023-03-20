import React from 'react'

const BACKEDGE_MIDDLE_OFFSET = 40
const ARROW_SIZE = 5
const BLOCK_TOP_OFFSET = 0

function BackEdge({ backedges, zIndex, borderColor, borderStyle, borderWidth, className, disassemblyViewId }: {
    backedges: {
        source: HTMLDivElement,
        target: HTMLDivElement
    }[],
    zIndex?: number,
    borderColor?: string,
    borderStyle?: string,
    borderWidth?: string,
    className?: string,
    disassemblyViewId: number,
}) {
    const [scrollPosition, setScrollPosition] = React.useState(0);

    React.useEffect(() => {
        if(backedges.length === 0) return;

        const updateScrollPosition = () => {
            console.log("Scrolling")
            setScrollPosition(window.pageYOffset);
        }
        const div = backedges[0].source.parentElement as HTMLDivElement
        div.addEventListener("scroll", updateScrollPosition);
        return () => window.removeEventListener("scroll", updateScrollPosition)
    })

    if (backedges.length === 0) return <></>

    const linePoints = backedges.map(backedge => {
        const box0 = backedge.source.getBoundingClientRect()
        const box1 = backedge.target.getBoundingClientRect()

        const offsetX = window.scrollX
        const offsetY = window.scrollY

        const x0 = box0.left + box0.width + offsetX
        const x1 = box1.left + box1.width + offsetX
        const y0 = box0.top + offsetY
        const y1 = box1.top + offsetY

        return {
            x0: Math.max(x0, x1),
            x1: Math.max(x0, x1),
            y0: y0 + BLOCK_TOP_OFFSET,
            y1: y1 + BLOCK_TOP_OFFSET,
        }
    })

    const lineStyle = {
        stroke: 'red',
        strokeWidth: '2px',
    }
    return (
        <svg style={{
            zIndex: 10,
            position: 'fixed',
            top: '0px',
            left: '0px',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
        }}
        >
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7"
                    refX="0" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" />
                </marker>
            </defs>
            {linePoints.map(({ x0, x1, y0, y1 }, i) => (
                <g>
                    <line key={disassemblyViewId + ":" + i + 'start'}
                        x1={x0 - ARROW_SIZE}
                        x2={x0 + BACKEDGE_MIDDLE_OFFSET}
                        y1={y0}
                        y2={y0}
                        style={lineStyle} />
                    <line key={disassemblyViewId + ":" + i + 'middle'}
                        x1={x0 + BACKEDGE_MIDDLE_OFFSET}
                        x2={x1 + BACKEDGE_MIDDLE_OFFSET}
                        y1={y0}
                        y2={y1}
                        style={lineStyle} />
                    <line key={disassemblyViewId + ":" + i + 'end'}
                        x1={x1 + BACKEDGE_MIDDLE_OFFSET}
                        x2={x1 - ARROW_SIZE}
                        y1={y1}
                        y2={y1}
                        style={lineStyle} markerEnd="url(#arrowhead)" />
                </g>
            ))}
        </svg>
    );
}

export default BackEdge