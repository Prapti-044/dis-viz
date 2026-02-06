import React from 'react';
import { MinimapType } from '../features/minimap/minimapSlice'
import { selectBinarySelection } from '../features/selections/selectionsSlice'
import { HIGHLIGHT_COLOR, hexToHSL, INSTRUCTION_TAGS } from '../utils'
import { useAppSelector } from '../store/hooks';
import { selectBinaryFilePaths } from '../features/binary-data/binaryDataSlice';
import * as disvizProcessor from '../disvizProcessor';
import { BLOCK_ORDERS } from '../types';
import useSelectionWithHistory from '../hooks/useSelectionWithHistory';

const BLOCK_LINE_HEIGHT_FACTOR = 1.2
const BLOCK_LINE_WIDTH = 90
const BLOCK_SEP = 5
const BLOCK_LINE_LEFT = 20
const BLOCKS_START_TOP = 50
const BRUSH_OFFSET = 10
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


export default function Minimap({ minimap, disViewId, binaryFilePath, visibleBlockWindow, width, order, ...props }: {
    minimap: MinimapType,
    disViewId: number,
    binaryFilePath: string,
    width: number,
    order: BLOCK_ORDERS,
    visibleBlockWindow: { startAddress: number, nBlocks: number }
}) {
    const { setSelectionWithHistory } = useSelectionWithHistory();
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const _selection = useAppSelector(selectBinarySelection).filter(selection => selection.binary_file === binaryFilePath)[0]
    const selection = _selection ? _selection.addresses : []
    
    const binaryFilePaths = useAppSelector(selectBinaryFilePaths)
    const validBinaryFilePaths = binaryFilePaths.filter(path => path !== "")

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

    let topHidden = false; let bottomHidden = false;
    if (selection.some(address => address < minimap.blockStartAddress[drawingStartBlockI])) {
        topHidden = true
    }
    if (selection.some(address => address > minimap.blockStartAddress[drawingEndBlockI])) {
        bottomHidden = true
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
            for (const address of selection) {
                if (minimap.blockStartAddress[i] <= address && (i >= minimap.blockStartAddress.length || address <= minimap.blockStartAddress[i + 1])) {
                    const { h, s, l } = hexToHSL(HIGHLIGHT_COLOR)
                    if (minimap.builtInBlock[i])
                        ctx.strokeStyle = "hsl(" + Math.max(h - 10, 0) + "," + s + "%," + l + "%)"
                    else
                        ctx.strokeStyle = "hsl(" + h + "," + s + "%," + Math.max(l - 20, 0) + "%)"
                    break
                }
            }

            if (highlightOption !== "none") {
                const tag = INSTRUCTION_TAGS.find(tag => tag.id === highlightOption);
                
                // Map tag identifiers to block types
                const tagToBlockType: Record<string, string[]> = {
                    'VECTORIZED': ['vectorized'],
                    'MEMORY': ['memory_read', 'memory_write'],
                    'SYSCALL': ['syscall'],
                    'CALL': ['call'],
                    'INLINE': ['inline'],
                    'FP': ['floating_point'],
                    'HOISTED': ['hoisted'],
                    'BRANCH': ['branch']
                };
                
                const blockTypes = tagToBlockType[highlightOption];
                if (tag && blockTypes && blockTypes.some(blockType => minimap.blockTypes[i].includes(blockType))) {
                    ctx.strokeStyle = tag.color;
                }
            }

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
        if (topHidden) {
            ctx.beginPath()
            ctx.strokeStyle = HIGHLIGHT_COLOR
            canvas_arrow(ctx,
                BLOCK_LINE_LEFT + BLOCK_LINE_WIDTH / 20,
                BLOCKS_START_TOP,
                BLOCK_LINE_LEFT + BLOCK_LINE_WIDTH / 20,
                BLOCKS_START_TOP - HIDDEN_ARROW_LEN)
            ctx.stroke()
        }
        if (bottomHidden) {
            ctx.beginPath()
            ctx.strokeStyle = HIGHLIGHT_COLOR
            canvas_arrow(ctx,
                BLOCK_LINE_LEFT + BLOCK_LINE_WIDTH / 20,
                ctx.canvas.height - HIDDEN_ARROW_LEN,
                BLOCK_LINE_LEFT + BLOCK_LINE_WIDTH / 20,
                ctx.canvas.height)
            ctx.stroke()
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draw, highlightOption])
    
    
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
        const block = disvizProcessor.getDisassemblyBlockByAddress(binaryFilePath, order, addresses[0])
        const sourceLines: { [source_file: string] : number[] } = {}
        for (let instr of block.instructions) {
            for (let sourceFile in instr.correspondence) {
                if (sourceLines[sourceFile] === undefined) {
                    sourceLines[sourceFile] = []
                }
                sourceLines[sourceFile].push(...instr.correspondence[sourceFile])
            }
        }
        
        const selections = disvizProcessor.getSelectionFromBinary_indirect(
            binaryFilePath,
            block.instructions.map(inst => inst.address),
            validBinaryFilePaths,
            order
        )
        setSelectionWithHistory({
            ...selections,
            origin: {
                type: 'disassembly',
                disassemblyId: disViewId,
                address: block.start_address,
            },
            details: {
                functionName: block.function_name,
                blockName: block.name,
            },
        })
    }

    return <>
        <select style={{
            position: "absolute",
            fontSize: "16px",
            top: "60px",
            right: "20px",
            zIndex: 3,
            width: "150px",
            padding: "4px 8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            backgroundColor: "#fff",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
        }} value={highlightOption} onChange={e => setHighlightOption(e.target.value)}>
            <option value="none" style={{padding: "4px 0"}}>Default</option>
            {INSTRUCTION_TAGS.map(tag => (
                <option 
                    key={tag.id} 
                    value={tag.id}
                    style={{
                        color: tag.color,
                        fontWeight: "500",
                        padding: "4px 0"
                    }}
                >
                    {tag.fullName}
                </option>
            ))}
        </select>
        <div style={{
            position: "absolute",
            bottom: "0px", //30
            right: "20px",
            width: width + "px",
            top: "90px",
            // height: "96%",
            background: "#ffffff",
            // border: "5px solid lightgrey",
            borderLeft: "2px solid lightgray",
            zIndex: 3
        }}>
            <canvas ref={canvasRef} {...props} onClick={onCanvasClick} />
            <div style={{
                position: "absolute",
                // top: brushTop,
                left: BLOCK_LINE_LEFT - BRUSH_OFFSET,
                width: BLOCK_LINE_LEFT + BLOCK_LINE_WIDTH + BRUSH_OFFSET,
                // height: brushHeight,
                // border: "2px solid #4b89e7",
                zIndex: 4,
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