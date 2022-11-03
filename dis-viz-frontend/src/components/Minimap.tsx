import React from 'react';
import { useAppSelector } from '../app/hooks';
import { selectMinimap } from '../features/minimap/minimapSlice'
import { selectSelections, selectActiveDisassemblyView } from '../features/selections/selectionsSlice'
import { codeColors, hexToHSL } from '../utils'

const BLOCK_LINE_HEIGHT_FACTOR = 1.2
const BLOCK_LINE_WIDTH = 120
const BLOCK_SEP = 5
const BLOCK_LINE_LEFT = 20
const BLOCKS_START_TOP = 50
const BRUSH_OFFSET = 10

export default function Minimap({ visibleBlockWindow, width, ...props }: {
    width: number,
    visibleBlockWindow: {start: number, end: number}
}) {
    const minimap = useAppSelector(selectMinimap)
    const selections = useAppSelector(selectSelections)
    const totalBlocks = minimap.blockStartAddress.length // b
    const brushStartBlockI = minimap.blockStartAddress.findIndex(address => address === visibleBlockWindow.start)
    const brushEndBlockI = minimap.blockStartAddress.findIndex(address => address === visibleBlockWindow.end)

    console.log("Scroll Percent: ", brushStartBlockI/totalBlocks)

    const canvasRef = React.useRef<HTMLCanvasElement>(null)

    const draw = (ctx: CanvasRenderingContext2D, frameCount: number) => {
        let brushStartY: number|null = null, brushEndY: number|null = null
        let drawingStartBlockI:number = brushStartBlockI, drawingEndBlockI:number = brushStartBlockI+1
        
        {
            let topHeight: number = brushStartBlockI/totalBlocks * ctx.canvas.height - BLOCKS_START_TOP - BRUSH_OFFSET - BLOCK_SEP
            while(topHeight > 100) {
                drawingStartBlockI -= 1
                if(drawingStartBlockI < 0) {
                    drawingStartBlockI = 0
                    break
                }
                topHeight -= minimap.blockHeights[drawingStartBlockI]*BLOCK_LINE_HEIGHT_FACTOR + BLOCK_SEP
            }
            let bottomHeight: number = ctx.canvas.height - brushStartBlockI/totalBlocks * ctx.canvas.height
            while(bottomHeight > -100) {
                drawingEndBlockI += 1
                if(drawingEndBlockI >= totalBlocks) {
                    drawingEndBlockI = totalBlocks - 1
                    break
                }
                bottomHeight -= minimap.blockHeights[drawingEndBlockI]*BLOCK_LINE_HEIGHT_FACTOR + BLOCK_SEP
            }
        }

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        ctx.fillStyle = "#FFFFFF"

        let cumulativeHeight = 0;
        minimap.blockHeights.forEach((blockHeight, i) => {
            if(i < drawingStartBlockI || i > drawingEndBlockI) return


            const curBlock = i - drawingStartBlockI
            const x = BLOCK_LINE_LEFT
            const y = BLOCKS_START_TOP + curBlock * BLOCK_SEP + cumulativeHeight

            // Detect if the brush should start here
            if(i === brushStartBlockI) {
                brushStartY = y
            }
            if(i <= brushEndBlockI) {
                brushEndY = y
            }

            ctx.beginPath()
            ctx.moveTo(x, y)

            ctx.strokeStyle = minimap.builtInBlock[i] === true ? "lightgrey" : "grey"
            for(const disViewId in selections) {
                const addresses = selections[disViewId]?.addresses
                if(addresses === undefined || addresses.length === 0) continue
                for(const address of addresses) {
                    if(minimap.blockStartAddress[i] <= address && (i >= minimap.blockStartAddress.length || address <= minimap.blockStartAddress[i+1])) {
                        const {h, s, l} = hexToHSL(codeColors[disViewId])
                        if(minimap.builtInBlock[i])
                            ctx.strokeStyle = "hsl(" + Math.max(h-10, 0) + "," + s + "%," + l + "%)"
                        else
                            ctx.strokeStyle = "hsl(" + h + "," + s + "%," + l + "%)"
                        break
                    }
                }
            }


            ctx.lineWidth = blockHeight * BLOCK_LINE_HEIGHT_FACTOR
            ctx.lineTo(x + BLOCK_LINE_WIDTH, y)
            ctx.stroke()

            cumulativeHeight += blockHeight * BLOCK_LINE_HEIGHT_FACTOR
        })
        // Draw the brush
        ctx.fillStyle = 'rgba(0,0,0,0.4)';

        ctx.fillRect(
            BLOCK_LINE_LEFT-BRUSH_OFFSET,
            brushStartY!,
            BLOCK_LINE_LEFT+BLOCK_LINE_WIDTH+BRUSH_OFFSET,
            brushEndY! - brushStartY!
        );
    }

    React.useEffect(() => {
        const canvas = canvasRef.current
        if (canvas === null) return
        canvas.width = width
        canvas.style.height = "100%"
        // canvas.height = minimap.blockHeights.reduce((total, height) => total + height, BLOCKS_START_TOP) * BLOCK_LINE_HEIGHT_FACTOR + minimap.blockHeights.length * BLOCK_SEP
        canvas.height = canvas.offsetHeight
        const context = canvas.getContext('2d')!
        let frameCount = 0
        let animationFrameId: number

        //Our draw came here
        const render = () => {
            frameCount++
            draw(context, frameCount)
            animationFrameId = window.requestAnimationFrame(render)
        }
        render()

        return () => {
            window.cancelAnimationFrame(animationFrameId)
        }
    }, [draw])

    return <div style={{
        position: "absolute",
        top: "5px",
        right: "20px",
        width: width+"px",
        height: "100%",
        background: "#eeeded",
        border: "1px solid lightgrey",
        zIndex: "5"
    }}>
        <canvas ref={canvasRef} {...props} />
    </div>
}