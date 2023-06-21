import React from 'react';
import { useAppSelector } from '../app/hooks';
import { MinimapType, selectMinimap } from '../features/minimap/minimapSlice'
import { selectSelections, selectActiveDisassemblyView } from '../features/selections/selectionsSlice'
import { codeColors, hexToHSL } from '../utils'

const BLOCK_LINE_HEIGHT_FACTOR = 1.2
const BLOCK_LINE_WIDTH = 90
const BLOCK_SEP = 5
const BLOCK_LINE_LEFT = 20
const BLOCKS_START_TOP = 50
const BRUSH_OFFSET = 10
const HIDDEN_ARROW_GAP = 30
const HIDDEN_ARROW_LEN = 20
const LOOP_INDENT_SIZE = 6

function canvas_arrow(context: CanvasRenderingContext2D, fromx: number, fromy: number, tox: number, toy: number) {
  var headlen = 10; // length of head in pixels
  var dx = tox - fromx;
  var dy = toy - fromy;
  var angle = Math.atan2(dy, dx);
  context.moveTo(fromx, fromy);
  context.lineTo(tox, toy);
  context.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
  context.moveTo(tox, toy);
  context.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
}


export default function Minimap({ minimap, visibleBlockWindow, width, ...props }: {
    minimap: MinimapType,
    width: number,
    visibleBlockWindow: {startAddress: number, nBlocks: number}
}) {
    
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const selections = useAppSelector(selectSelections)

    const totalBlocks = minimap.blockStartAddress.length // b
    const brushStartBlockI = minimap.blockStartAddress.findIndex(address => address === visibleBlockWindow.startAddress)
    const brushEndBlockI = brushStartBlockI + visibleBlockWindow.nBlocks - 1

    let drawingStartBlockI:number = brushStartBlockI, drawingEndBlockI:number = brushStartBlockI+1
    
    const height = canvasRef.current?canvasRef.current.height:window.innerHeight

    {
        let topHeight: number = brushStartBlockI/totalBlocks * height - BLOCKS_START_TOP - BRUSH_OFFSET - BLOCK_SEP
        while(topHeight > 100) {
            drawingStartBlockI -= 1
            if(drawingStartBlockI < 0) {
                drawingStartBlockI = 0
                break
            }
            topHeight -= minimap.blockHeights[drawingStartBlockI]*BLOCK_LINE_HEIGHT_FACTOR + BLOCK_SEP
        }
        let bottomHeight: number = height - brushStartBlockI/totalBlocks * height
        while(bottomHeight > -100) {
            drawingEndBlockI += 1
            if(drawingEndBlockI >= totalBlocks) {
                drawingEndBlockI = totalBlocks - 1
                break
            }
            bottomHeight -= minimap.blockHeights[drawingEndBlockI]*BLOCK_LINE_HEIGHT_FACTOR + BLOCK_SEP
        }
    }

    const topHidden: number[] = [], bottomHidden: number[] = []
    for(const disViewId in selections) {
        const selection = selections[disViewId]
        if(selection) {
            if(selection.addresses.some(address => address < minimap.blockStartAddress[drawingStartBlockI])) {
                topHidden.push(parseInt(disViewId))
            }
            if(selection.addresses.some(address => address > minimap.blockStartAddress[drawingEndBlockI])) {
                bottomHidden.push(parseInt(disViewId))
            }
        }
    }



    const draw = (ctx: CanvasRenderingContext2D, frameCount: number) => {
        let brushStartY: number|null = null, brushEndY: number|null = null
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        ctx.fillStyle = "#FFFFFF"

        let cumulativeHeight = 0;
        minimap.blockHeights.forEach((blockHeight, i) => {
            if(i < drawingStartBlockI || i > drawingEndBlockI) return


            const curBlock = i - drawingStartBlockI
            const x = BLOCK_LINE_LEFT + minimap.blockLoopIndents[i] * LOOP_INDENT_SIZE
            const y = BLOCKS_START_TOP + curBlock * BLOCK_SEP + cumulativeHeight + blockHeight * BLOCK_LINE_HEIGHT_FACTOR / 2

            // Detect if the brush should start here
            if(i === brushStartBlockI) {
                brushStartY = y
            }
            if(i <= brushEndBlockI) {
                brushEndY = y
            }

            ctx.beginPath()
            if(blockHeight === 0) {
                ctx.setLineDash([5, 5])
            }
            else {
                ctx.setLineDash([])
            }
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
                            ctx.strokeStyle = "hsl(" + h + "," + s + "%," + Math.max(l-20, 0) + "%)"
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
        ctx.fillStyle = 'rgba(0,0,0,0.1)'; //'rgba(0,0,0,0.4)

        ctx.fillRect(
            BLOCK_LINE_LEFT-BRUSH_OFFSET,
            brushStartY!,
            BLOCK_LINE_LEFT+BLOCK_LINE_WIDTH+BRUSH_OFFSET,
            brushEndY! - brushStartY!
        );

        // ctx.font = '32px serif';
        // ctx.fillText(
        //     Math.ceil(brushStartBlockI/totalBlocks * 100).toString(),
        //     BLOCK_LINE_LEFT + BLOCK_LINE_WIDTH / 2,
        //     (brushStartY! + brushEndY!)/2
        // )

        // Draw the hidden marked blocks
        topHidden.forEach((disViewId, i) => {
            ctx.beginPath()
            ctx.strokeStyle = codeColors[disViewId]
            canvas_arrow(ctx,
                BLOCK_LINE_LEFT + BLOCK_LINE_WIDTH/20 + i*HIDDEN_ARROW_GAP,
                BLOCKS_START_TOP,
                BLOCK_LINE_LEFT + BLOCK_LINE_WIDTH/20 + i*HIDDEN_ARROW_GAP,
                BLOCKS_START_TOP - HIDDEN_ARROW_LEN)
            ctx.stroke()
        })
        bottomHidden.forEach((disViewId, i) => {
            ctx.beginPath()
            ctx.strokeStyle = codeColors[disViewId]
            canvas_arrow(ctx,
                BLOCK_LINE_LEFT + BLOCK_LINE_WIDTH/20 + i*HIDDEN_ARROW_GAP,
                ctx.canvas.height - HIDDEN_ARROW_LEN,
                BLOCK_LINE_LEFT + BLOCK_LINE_WIDTH/20 + i*HIDDEN_ARROW_GAP,
                ctx.canvas.height)
            ctx.stroke()
        })
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

    return <>
    <h5 style={{
        position: "absolute",
        fontSize: "17px",
        top: "5px", //5px
        right: "60px",
        color: "#4b89e7",
    }}>Overview</h5>
    <div style={{
        position: "absolute",
        top: "0px", //30
        right: "20px",
        width: width+"px",
        height: "100%",
        background: "#ffffff",
        border: "5px solid lightgrey",
        zIndex: "5"
    }}>
        <canvas ref={canvasRef} {...props} />
    </div>
    </>
    
}