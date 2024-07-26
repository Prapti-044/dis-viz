import React from 'react';
import { MinimapType, selectMinimap } from '../features/minimap/minimapSlice'
import { selectSelections, selectActiveDisassemblyView } from '../features/selections/selectionsSlice'
import { codeColors, hexToHSL } from '../utils'
import { setDisassemblyLineSelection } from '../features/selections/selectionsSlice'
import { useAppSelector, useAppDispatch } from '../app/hooks';
import * as api from '../api';
import { selectBinaryFilePath } from '../features/binary-data/binaryDataSlice';
import { BLOCK_ORDERS } from '../types';

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
    const headlen = 10; // length of head in pixels
    const dx = tox - fromx;
    const dy = toy - fromy;
    const angle = Math.atan2(dy, dx);
    context.moveTo(fromx, fromy);
    context.lineTo(tox, toy);
    context.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    context.moveTo(tox, toy);
    context.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
}


export default function Minimap({ minimap, visibleBlockWindow, width, order, ...props }: {
    minimap: MinimapType,
    width: number,
    order: BLOCK_ORDERS,
    visibleBlockWindow: { startAddress: number, nBlocks: number }
}) {
    const dispatch = useAppDispatch();
    const currentDisViewId = useAppSelector(selectActiveDisassemblyView)
    const binaryFilePath = useAppSelector(selectBinaryFilePath)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const selections = useAppSelector(selectSelections)

    const totalBlocks = minimap.blockStartAddress.length // b
    const brushStartBlockI = minimap.blockStartAddress.findIndex(address => address === visibleBlockWindow.startAddress)
    const brushEndBlockI = brushStartBlockI + visibleBlockWindow.nBlocks - 1

    const [highlightOption, setHighlightOption] = React.useState("none")

    const brushDiv = React.useRef<HTMLDivElement>(null)
    const [brushDragging, setBrushDragging] = React.useState(false)

    let drawingStartBlockI: number = brushStartBlockI, drawingEndBlockI: number = brushStartBlockI + 1

    const height = canvasRef.current ? canvasRef.current.height : window.innerHeight

    {
        let topHeight: number = brushStartBlockI / totalBlocks * height - BLOCKS_START_TOP - BRUSH_OFFSET - BLOCK_SEP
        while (topHeight > 100) {
            drawingStartBlockI -= 1
            if (drawingStartBlockI < 0) {
                drawingStartBlockI = 0
                break
            }
            topHeight -= minimap.blockHeights[drawingStartBlockI] * BLOCK_LINE_HEIGHT_FACTOR + BLOCK_SEP
        }
        let bottomHeight: number = height - brushStartBlockI / totalBlocks * height
        while (bottomHeight > -100) {
            drawingEndBlockI += 1
            if (drawingEndBlockI >= totalBlocks) {
                drawingEndBlockI = totalBlocks - 1
                break
            }
            bottomHeight -= minimap.blockHeights[drawingEndBlockI] * BLOCK_LINE_HEIGHT_FACTOR + BLOCK_SEP
        }
    }

    const topHidden: number[] = [], bottomHidden: number[] = []
    for (const disViewId in selections) {
        const selection = selections[disViewId]
        if (selection) {
            if (selection.addresses.some(address => address < minimap.blockStartAddress[drawingStartBlockI])) {
                topHidden.push(parseInt(disViewId))
            }
            if (selection.addresses.some(address => address > minimap.blockStartAddress[drawingEndBlockI])) {
                bottomHidden.push(parseInt(disViewId))
            }
        }
    }

    const draw = (ctx: CanvasRenderingContext2D, frameCount: number) => {
        let brushStartY: number | null = null
        let brushEndY: number | null = null
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        ctx.fillStyle = "#FFFFFF"

        let cumulativeHeight = 0;
        minimap.blockHeights.forEach((blockHeight, i) => {
            if (i < drawingStartBlockI || i > drawingEndBlockI) return


            const curBlock = i - drawingStartBlockI
            const x = BLOCK_LINE_LEFT + minimap.blockLoopIndents[i] * LOOP_INDENT_SIZE
            const y = BLOCKS_START_TOP + curBlock * BLOCK_SEP + cumulativeHeight + blockHeight * BLOCK_LINE_HEIGHT_FACTOR / 2

            // Detect if the brush should start here
            if (i === brushStartBlockI) {
                brushStartY = y
                // setBrushTop(y)
            }
            if (i <= brushEndBlockI) {
                brushEndY = y
                // setBrushHeight(y - brushTop)
            }

            ctx.beginPath()
            if (blockHeight === 0) {
                ctx.setLineDash([5, 5])
            }
            else {
                ctx.setLineDash([])
            }
            ctx.moveTo(x, y)

            ctx.strokeStyle = minimap.builtInBlock[i] === true ? "lightgrey" : "grey"
            for (const disViewId in selections) {
                const addresses = selections[disViewId]?.addresses
                if (addresses === undefined || addresses.length === 0) continue
                for (const address of addresses) {
                    if (minimap.blockStartAddress[i] <= address && (i >= minimap.blockStartAddress.length || address <= minimap.blockStartAddress[i + 1])) {
                        const { h, s, l } = hexToHSL(codeColors[disViewId])
                        if (minimap.builtInBlock[i])
                            ctx.strokeStyle = "hsl(" + Math.max(h - 10, 0) + "," + s + "%," + l + "%)"
                        else
                            ctx.strokeStyle = "hsl(" + h + "," + s + "%," + Math.max(l - 20, 0) + "%)"
                        break
                    }
                }
            }

            if (highlightOption === "VEC" && minimap.blockTypes[i].includes("vectorized"))
                ctx.strokeStyle = "cyan"
            else if (highlightOption === "Mem_Read" && minimap.blockTypes[i].includes("memory_read"))
                ctx.strokeStyle = "purple"
            else if (highlightOption === "Mem_Write" && minimap.blockTypes[i].includes("memory_write"))
                ctx.strokeStyle = "orange"
            else if (highlightOption === "Syscall" && minimap.blockTypes[i].includes("syscall"))
                ctx.strokeStyle = "red"

            ctx.lineWidth = (blockHeight === 0 ? 1 : blockHeight) * BLOCK_LINE_HEIGHT_FACTOR
            ctx.lineTo(x + BLOCK_LINE_WIDTH, y)
            ctx.stroke()

            cumulativeHeight += (blockHeight === 0 ? 1 : blockHeight) * BLOCK_LINE_HEIGHT_FACTOR
        })

        // move the brush div
        if (!brushDragging && brushStartY !== null && brushEndY !== null) {
            if (brushDiv.current) {
                brushDiv.current.style.top = brushStartY + "px"
                brushDiv.current.style.height = (brushEndY - brushStartY) + "px"
            }
        }

        // Draw arrows for hidden blocks at top and bottom
        topHidden.forEach((disViewId, i) => {
            ctx.beginPath()
            ctx.strokeStyle = codeColors[disViewId]
            canvas_arrow(ctx,
                BLOCK_LINE_LEFT + BLOCK_LINE_WIDTH / 20 + i * HIDDEN_ARROW_GAP,
                BLOCKS_START_TOP,
                BLOCK_LINE_LEFT + BLOCK_LINE_WIDTH / 20 + i * HIDDEN_ARROW_GAP,
                BLOCKS_START_TOP - HIDDEN_ARROW_LEN)
            ctx.stroke()
        })
        bottomHidden.forEach((disViewId, i) => {
            ctx.beginPath()
            ctx.strokeStyle = codeColors[disViewId]
            canvas_arrow(ctx,
                BLOCK_LINE_LEFT + BLOCK_LINE_WIDTH / 20 + i * HIDDEN_ARROW_GAP,
                ctx.canvas.height - HIDDEN_ARROW_LEN,
                BLOCK_LINE_LEFT + BLOCK_LINE_WIDTH / 20 + i * HIDDEN_ARROW_GAP,
                ctx.canvas.height)
            ctx.stroke()
        })
    }



    React.useEffect(() => {
        const canvas = canvasRef.current
        if (canvas === null) return
        canvas.width = width
        canvas.style.height = "100%"
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
    }, [draw, highlightOption])

    // Draw the brush: this is being converted to a div
    // ctx.fillStyle = 'rgba(0,0,0,0.1)'; //'rgba(0,0,0,0.4)

    // ctx.fillRect(
    //     BLOCK_LINE_LEFT-BRUSH_OFFSET,
    //     brushStartY!,
    //     BLOCK_LINE_LEFT+BLOCK_LINE_WIDTH+BRUSH_OFFSET,
    //     brushEndY! - brushStartY!
    // );
    
    function onCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
        const y = e.clientY - canvasRef.current!.getBoundingClientRect().top
        
        // The first block is from drawingStartBlockI. We start from drawingStartBlockI and add the block heights with the sep to the the clicked blockI
        let blockI = drawingStartBlockI
        let cumulativeHeight = 0
        while (blockI < drawingEndBlockI) {
            const blockHeight = minimap.blockHeights[blockI]
            if (y < BLOCKS_START_TOP + cumulativeHeight + blockHeight * BLOCK_LINE_HEIGHT_FACTOR / 2) {
                break
            }
            cumulativeHeight += blockHeight * BLOCK_LINE_HEIGHT_FACTOR + BLOCK_SEP
            blockI += 1
        }
        
        // get instruction addresses from blockI
        const addresses = [minimap.blockStartAddress[blockI]]
        api.getDisassemblyBlockByAddress(binaryFilePath, order, addresses[0])
            .then(block => {
                const sourceLines: { [source_file: string] : number[] } = {}
                for (let instr of block.instructions) {
                    for (let sourceFile in instr.correspondence) {
                        if (sourceLines[sourceFile] === undefined) {
                            sourceLines[sourceFile] = []
                        }
                        sourceLines[sourceFile].push(...instr.correspondence[sourceFile])
                    }
                }
                const sourceSelection = Object.entries(sourceLines).map(([source_file, lines]) => ({ source_file, lines }))

                dispatch(setDisassemblyLineSelection({
                    disassemblyViewId: currentDisViewId!,
                    disIdSelections: {
                        addresses: block.instructions.map(inst => inst.address),
                        source_selection: sourceSelection
                    }
                }))
            })
    }

    return <>
        <select style={{
            position: "absolute",
            fontSize: "17px",
            top: "5px", //5px
            right: "60px",
            color: "#4b89e7",
            zIndex: "5"
        }} value={highlightOption} onChange={e => setHighlightOption(e.target.value)}>
            <option value="none">Default</option>
            <option value="VEC">Vectorized</option>
            <option value="Mem_Read">Memory Read</option>
            <option value="Mem_Write">Memory Write</option>
            <option value="Syscall">System Call</option>
        </select>
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
            <div style={{
                position: "absolute",
                // top: brushTop,
                left: BLOCK_LINE_LEFT - BRUSH_OFFSET,
                width: BLOCK_LINE_LEFT + BLOCK_LINE_WIDTH + BRUSH_OFFSET,
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
            ></div>
        </div>
    </>

}