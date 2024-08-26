import React  from 'react';

import { selectSelections, setActiveDisassemblyView, setDisassemblyLineSelection, selectActiveDisassemblyView } from '../features/selections/selectionsSlice'
import { selectBinaryFilePaths } from '../features/binary-data/binaryDataSlice'
import { BLOCK_ORDERS, BlockPage } from '../types'
import * as api from '../api'
import Minimap from './Minimap';

import DisassemblyBlock from './DisassemblyBlock';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { MinimapType } from '../features/minimap/minimapSlice';
import { isHex, toHex } from '../utils';
import { marginHorizontal, LOOP_INDENT_SIZE, BLOCK_MAX_WIDTH } from '../config';



function useVisibleBlockWindow(ref: React.MutableRefObject<{
    [start_address: number]: { div: HTMLDivElement, idx: number }
}>) {
    const [blockIsVisible, setBlockIsVisible] = React.useState<{blockIdx:number, blockAddress: number, inside:boolean}[]>([])

    const observer = React.useMemo(() => new IntersectionObserver(entries => {
        const changedBlockAddresses = Object.keys(ref.current)
            .filter(key => entries.map(entry => entry.target).includes(ref.current[parseInt(key)].div))

        const newBlockVisibility = structuredClone(blockIsVisible)
        newBlockVisibility.forEach(block => { block.inside = false })
        changedBlockAddresses.forEach((address, i) => {
            const foundBlock = newBlockVisibility.find(block => block.blockAddress === parseInt(address))
            if (!foundBlock) {
                newBlockVisibility.push({
                    blockAddress: parseInt(address),
                    blockIdx: ref.current[parseInt(address)].idx,
                    inside: entries[i].isIntersecting
                })
            }
            else {
                foundBlock.inside = entries[i].isIntersecting
            }
        });

        newBlockVisibility.sort((a, b) => a.blockAddress - b.blockAddress)

        const allKeys = Array.from(new Set([...newBlockVisibility.map(block => block.blockAddress), ...blockIsVisible.map(block => block.blockAddress)]))
        for (const key of allKeys) {
            const newBlock = newBlockVisibility.find(block => block.blockAddress === key)
            const block = blockIsVisible.find(block => block.blockAddress === key)

            if (!block || !newBlock || block.inside !== newBlock.inside) {
                setBlockIsVisible(newBlockVisibility)
                break
            }
        }
    }), [blockIsVisible, ref])
    
    const currentRef = ref.current[parseInt(Object.keys(ref.current)[0])]

    React.useEffect(() => {
        for(const start_address in ref.current) {
            if(ref.current[start_address].div)
                observer.observe(ref.current[start_address].div)
        }

        return () => {
            observer.disconnect()
        };
    }, [currentRef, observer, ref]);

    const visibleBlocks = blockIsVisible.filter(block => block.inside).sort((a, b) => a.blockIdx - b.blockIdx)
    return {
        startAddress: visibleBlocks.length > 0 ? visibleBlocks[0].blockAddress : 0,
        nBlocks: visibleBlocks.length,
    }
}

function DisassemblyView({ id, defaultBinaryFilePath, removeSelf }:{
    id: number,
    defaultBinaryFilePath: string | null,
    removeSelf: () => void
}) {
    const dispatch = useAppDispatch();

    const selections = useAppSelector(selectSelections)
    const lineSelection = selections[id]

    const binaryFilePaths = useAppSelector(selectBinaryFilePaths)
    const validBinaryFilePaths = binaryFilePaths.filter((binaryFilePath) => binaryFilePath !== "")
    const [binaryFilePath, setBinaryFilePath] = React.useState(defaultBinaryFilePath ? defaultBinaryFilePath : binaryFilePaths[0])
    if (!validBinaryFilePaths.includes(binaryFilePath)) removeSelf()
    const activeDisassemblyView = useAppSelector(selectActiveDisassemblyView)
    const isCurDisassemblyViewActive = activeDisassemblyView === id

    const [blockOrder, setBlockOrder] = React.useState<BLOCK_ORDERS>('memory_order')
    const [shouldScroll, setShouldScroll] = React.useState({
        value: true
    })

    const disassemblyBlockRefs = React.useRef<{[start_address: number]: { div: HTMLDivElement, idx: number }}>({})
    
    const [pages, setPages] = React.useState<BlockPage[]>([]);
    const onScreenFirstBlockAddress = useVisibleBlockWindow(disassemblyBlockRefs)
    const [backedges, setBackedges] = React.useState<{[pageBlockIdx: string]: HTMLDivElement[]}>({})
    const [minimap, setMinimap] = React.useState<MinimapType>()

    const [jumpAddress, setJumpAddress] = React.useState<string>('0x0')
    const [jumpValidationError, setJumpValidationError] = React.useState('')

    const [binaryJumpAddressRange, setBinaryJumpAddressRange] = React.useState({ start: 0, end: 0 })
    
    // Fetch and get the pages
    React.useEffect(() => {
        const setAfterFetch = ((page: BlockPage) => { setPages([page]) })
        if(lineSelection && lineSelection.addresses.length > 0)
            api.getDisassemblyPageByAddress(binaryFilePath, lineSelection.addresses[0], blockOrder).then(setAfterFetch)
        else
            api.getDisassemblyPage(binaryFilePath, 0, blockOrder).then(setAfterFetch)
        setTimeout(() => {
            setShouldScroll({value: true})
        }, 500);
    }, [lineSelection, blockOrder, binaryFilePath])

    // Get total address range for jumping to address
    React.useEffect(() => {
        api.getAddressRange(binaryFilePath).then(setBinaryJumpAddressRange)
    }, [binaryFilePath])

    const addNewPage = (newPageNo: number) => {
        api.getDisassemblyPage(binaryFilePath, newPageNo, blockOrder).then(page => {
            let pagesCopy = [...pages]
            pagesCopy.push(page)
            pagesCopy = pagesCopy.sort((page1, page2) => page1.page_no - page2.page_no)
            setPages(pagesCopy)
        })
    }
    
    // get minimap data
    React.useEffect(() => {
        api.getMinimapData(binaryFilePath, blockOrder).then(setMinimap)
    }, [binaryFilePath, blockOrder])

    const activeRef = React.useRef<HTMLInputElement>(null);
    React.useEffect(() => {
        if(activeRef.current)
            activeRef.current.checked = isCurDisassemblyViewActive;
    }, [isCurDisassemblyViewActive])

    // Setup backedges
    React.useEffect(() => {
        // Check if disassemblyBlockRefs is initialized
        if(Object.keys(disassemblyBlockRefs.current).length === 0) return;
        const currBackedges: typeof backedges = {}
        const doneBlocks: string[] = []
        pages.forEach((page,i) => {
            page.blocks.forEach((block,j) => {
                if(doneBlocks.includes(block.name)) {
                    currBackedges[i+':'+j] = []
                    return
                }
                doneBlocks.push(block.name)
                currBackedges[i+':'+j] = pages.map(page => page.blocks)
                    .flat()
                    .filter(b => block.backedges.includes(b.name) && b.start_address in disassemblyBlockRefs.current)
                    .map(b => disassemblyBlockRefs.current[b.start_address].div)
                    .filter(elem => elem !== undefined)
            })
        })
        setBackedges(currBackedges)
    }, [pages])
    
    // Scroll to the first focus line of selection
    React.useEffect(() => {
        if(shouldScroll.value) {
            if(!disassemblyBlockRefs.current) return;
            if(!lineSelection || lineSelection.addresses.length === 0) return;
            const firstFocusLine = lineSelection.addresses[0]

            const blockAddresses = Object.keys(disassemblyBlockRefs.current).map(key => parseInt(key, 10))
            for(const i in blockAddresses) {
                const blockAddress = blockAddresses[i]
                if (parseInt(i) > 0 && blockAddresses[parseInt(i)-1] <= firstFocusLine && firstFocusLine <= blockAddress) {
                    if (!disassemblyBlockRefs.current[blockAddresses[parseInt(i)-1]]) continue;
                    const scrollRef = disassemblyBlockRefs.current[blockAddress].div;
                    setTimeout(() => {
                        scrollRef.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center',
                        })
                    }, 100);
                    break
                }
            }
            setShouldScroll({value: false})
        }
    }, [lineSelection, shouldScroll])

    return <>
        <label className="toggle" style={{
            position: 'absolute',
            top: '10px',
            right: '200px',
            height: '40px',
            zIndex: 10,
        }}>
            <input type="checkbox" ref={activeRef} onChange={(event) => {
                if(event.target.checked)
                    dispatch(setActiveDisassemblyView(id))
                else
                    dispatch(setActiveDisassemblyView(null))
            }}/>
            <span className="labels" data-on="Active" data-off="Inactive"></span>
        </label>
        {pages.length > 0 ?  
        <div style={{
            border: isCurDisassemblyViewActive ? '1px solid black' : 'none',
            overflow: 'scroll',
        }}
        >
            <div style={{
                position: 'absolute',
                top: '0',
                width: '100%',
                backgroundColor: '#f1f1f1',
                padding: '10px',
                fontWeight: 'bold',
                zIndex: 1,
                display: 'flex',
                flexDirection: 'row',
            }}>
                <Form.Group style={{}} className='form-inline'>
                    <Form.Label style={{whiteSpace: 'nowrap', marginRight: "10px"}}>
                        Binary File:
                        <Form.Select aria-label="Binary File" style={{ width: '200px', }} value={binaryFilePath} onChange={(e) => {
                            setBinaryFilePath(e.currentTarget.value)
                        }}>
                            {validBinaryFilePaths.map((binaryFilePath) => <option key={binaryFilePath} value={binaryFilePath}>{binaryFilePath.split('/').pop()}</option>)}
                        </Form.Select>
                    </Form.Label>

                    <Form.Label style={{whiteSpace: 'nowrap', marginRight: "10px" }}>
                        Order By: 
                        <Form.Select aria-label="Block Order" style={{ width: '200px', }} value={blockOrder} onChange={(e) => {
                            // dispatch(changeOrder(e.currentTarget.value as BLOCK_ORDERS))
                            setBlockOrder(e.currentTarget.value as BLOCK_ORDERS)
                        }}>
                            <option value="memory_order">Memory Address</option>
                            <option value="loop_order">Loop Structure</option>
                        </Form.Select>
                    </Form.Label>

                    <Form.Label style={{whiteSpace: 'nowrap', marginRight: "10px" }}>
                        Jump to: 
                        <Form.Control type='text' value={jumpAddress} placeholder='0x10E59' aria-label="Address" style={{ width: '120px', }} onChange={(e) => {
                            setJumpAddress(e.target.value)
                            if(isHex(e.target.value) && toHex(e.target.value) <= binaryJumpAddressRange.end && toHex(e.target.value) >= binaryJumpAddressRange.start)
                                setJumpValidationError('')
                            else
                                setJumpValidationError('Input must be of format Hexa decimal and withing range');
                        }} isInvalid={!!jumpValidationError}>
                        </Form.Control>
                        <Form.Control.Feedback type="invalid">
                            {jumpValidationError}
                        </Form.Control.Feedback>
                    </Form.Label>
                    <Button onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
                        if(jumpValidationError !== '') return
                        // using api, get the sourceLines
                        dispatch(setDisassemblyLineSelection({
                            disIdSelections: {
                                binaryFilePath,
                                addresses: [toHex(jumpAddress)],
                                source_selection: []
                            },
                            disassemblyViewId: id,
                        }))
                        setShouldScroll({value: true})
                    }}>
                        Jump
                    </Button>
                </Form.Group>


                
            </div>
            {pages.length > 0 && pages[0].page_no > 1?<button style={{ marginTop: 120 }} onClick={e => {addNewPage(pages[0].page_no-1)}}>
                Load more
            </button>:<></>}
            {pages.map((page,i) => page.blocks.map((block, j, allBlocks) =>
                <div key={pages.slice(0, i).reduce((total,p) => total + p.blocks.length, 0) +j}>
                    <DisassemblyBlock
                        binaryFilePath={binaryFilePath}
                        block={block}
                        i={j}
                        key={pages.slice(0, i).reduce((total,p) => total + p.blocks.length, 0) +j}
                        allBlocks={allBlocks}
                        id={id}
                        pages={pages}
                        disassemblyBlockRefs={disassemblyBlockRefs}
                        lineSelection={lineSelection}
                        drawPseudo={blockOrder === 'memory_order'?'short':'full'}
                        blockOrder={blockOrder}
                        backedgeTargets={(i+':'+j) in backedges?backedges[i+':'+j]:[]}/>
                    
                    {blockOrder === 'loop_order' && j < allBlocks.length-1 && block.block_type !=='pseudoloop' && block.next_block_numbers.filter(nextBName => nextBName === allBlocks[j+1].name && allBlocks[j+1].block_type !== 'pseudoloop').length > 0 && <div style={{
                        position: 'relative',
                        height: '0',
                        top: '-5px',
                        width: '0',
                    }}>
                        <i className='continuity-arrow' style={{
                            marginLeft: marginHorizontal + block.loops.length * LOOP_INDENT_SIZE + BLOCK_MAX_WIDTH/2-16 + 'px',
                        }}></i>
                    </div>}
                </div>
            )).flat()}
            {pages.length > 0 && !pages[pages.length-1].is_last?<button onClick={e => {addNewPage(pages[pages.length-1].page_no+1)}}>
                Load more
            </button>:<></>}
            {minimap && onScreenFirstBlockAddress.nBlocks > 0 && <Minimap
                binaryFilePath={binaryFilePath}
                width={150}
                visibleBlockWindow={onScreenFirstBlockAddress}
                minimap={minimap}
                order={blockOrder}
            ></Minimap>}
            </div> :
            <div>
                <h1>Please select a binary file to get disassembly code here.</h1>
            </div>}
    </>
}

export default DisassemblyView;

