import React from 'react';

const LINE_HEIGHT = 1

export default function SourceMinimap({ width, startLine, ...props }:{
    width: number,
    startLine: number,
}) {
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const brushDiv = React.useRef<HTMLDivElement>(null)
    
    let brushTop = 0
    
    function onCanvasClick(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
        console.log("canvas click")
    }
    
    return <>
        <div style={{
            position: "absolute",
            bottom: "0px", //30
            right: "20px",
            width: width + "px",
            height: "96%",
            background: "#ffffff",
            border: "5px solid lightgrey",
            zIndex: "5"
        }}>
            <canvas ref={canvasRef} {...props} onClick={onCanvasClick} />
            {/* <div style={{
                position: "absolute",
                // top: brushTop,
                // left: BLOCK_LINE_LEFT - BRUSH_OFFSET,
                // width: BLOCK_LINE_LEFT + BLOCK_LINE_WIDTH + BRUSH_OFFSET,
                // height: brushHeight,
                // border: "2px solid #4b89e7",
                zIndex: "10",
                opacity: "0.3",
                backgroundColor: "#4b89e7",
                borderRadius: "2px",
                // boxShadow: "0px 0px 10px 5px rgba(75,137,231)",
                transition: "top 0.1s, height 0.1s",
            }}
                ref={brushDiv}
                onMouseDown={(e) => {
                    if (brushDiv.current === null) return
                    const startY = e.clientY
                    const startTop = brushDiv.current.offsetTop
                    const startHeight = brushDiv.current.offsetHeight
                    const mouseMoveHandler = (e: MouseEvent) => {
                        setBrushDragging(true)
                        console.log("mouse move")
                        if (brushDiv.current === null) return
                        let top = startTop + e.clientY - startY
                        brushDiv.current.style.top = Math.max(BLOCKS_START_TOP, Math.min(height - startHeight, top)) + "px"
                        // brushDiv.style.height = startHeight + "px"
                    }
                    const mouseUpHandler = () => {
                        window.removeEventListener('mousemove', mouseMoveHandler)
                        window.removeEventListener('mouseup', mouseUpHandler)
                        setBrushDragging(false)
                    }
                    window.addEventListener('mousemove', mouseMoveHandler)
                    window.addEventListener('mouseup', mouseUpHandler)
                }}
            ></div> */}
        </div>
    </>

}