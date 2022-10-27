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
    const scrollPercent = minimap.blockStartAddress.findIndex(address => address === visibleBlockWindow.start)/totalBlocks // s

    const canvasRef = React.useRef<HTMLCanvasElement>(null)

    const draw = (ctx: CanvasRenderingContext2D, frameCount: number) => {
        // Assuming each block has only 1 instruction, at most how many blocks we need to draw?
        const blocksToDraw = Math.ceil((ctx.canvas.height - BLOCKS_START_TOP)/(BLOCK_LINE_HEIGHT_FACTOR*1 + BLOCK_SEP)) // n

        let startBlockI:number, endBlockI:number
        if(blocksToDraw >= totalBlocks) {
            startBlockI = 0
            endBlockI = totalBlocks-1
        }
        else {
            startBlockI = Math.floor(totalBlocks * scrollPercent - blocksToDraw * (scrollPercent))
            endBlockI = startBlockI + blocksToDraw
        }

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        ctx.fillStyle = "#FFFFFF"

        let cumulativeHeight = 0;
        minimap.blockHeights.forEach((blockHeight, i) => {
            if(i < startBlockI || i > endBlockI) return
            const curBlock = i - startBlockI
            ctx.beginPath()
            ctx.moveTo(BLOCK_LINE_LEFT, BLOCKS_START_TOP + curBlock * BLOCK_SEP + cumulativeHeight + blockHeight / 2)

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
            ctx.lineTo(BLOCK_LINE_LEFT + BLOCK_LINE_WIDTH, BLOCKS_START_TOP + curBlock * BLOCK_SEP + cumulativeHeight + blockHeight / 2)
            ctx.stroke()

            cumulativeHeight += blockHeight

        })
        // Draw the brush
        const brushTop = scrollPercent * ctx.canvas.height + BRUSH_OFFSET
        const brushBottom = brushTop + minimap.blockHeights.slice(startBlockI,endBlockI+1).reduce((total, current) => total+current)
        const brushHeight = brushBottom - brushTop
        ctx.fillStyle = 'rgba(200,200,200,0.02)';

        console.log('startBlockI', startBlockI, 'endBlockI', endBlockI, 'scrollPercent', scrollPercent, 'brushTop', brushTop, 'brushBottom', brushBottom, 'brushHeight', brushHeight)
        ctx.fillRect(
            BLOCK_LINE_LEFT-BRUSH_OFFSET,
            brushTop,
            // 50,
            BLOCK_LINE_LEFT+BLOCK_LINE_WIDTH+BRUSH_OFFSET,
            brushBottom
            // 100
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