import React  from 'react';

import { selectSelections, setActiveDisassemblyView, setDisassemblyLineSelection, selectActiveDisassemblyView } from '../features/selections/selectionsSlice'
import { selectBinaryFilePath } from '../features/binary-data/binaryDataSlice'
import { BlockPage, Instruction } from '../types'
import * as api from '../api'
import Minimap from './Minimap';

import DisassemblyBlock from './DisassemblyBlock';
import { useAppDispatch, useAppSelector } from '../app/hooks';


function useVisibleBlockWindow(ref: React.MutableRefObject<{
    [start_address: number]: HTMLDivElement
}>) {
    const [blockIsVisible, setBlockIsVisible] = React.useState<{blockAddress:number, inside:boolean}[]>([])

    const observer = new IntersectionObserver(entries => {
        const changedBlockAddresses = Object.keys(ref.current)
            .filter(key => entries.map(entry => entry.target).includes(ref.current[parseInt(key)]))

        const newBlockVisibility = structuredClone(blockIsVisible)
        newBlockVisibility.forEach(block => {
            block.inside = false
        })
        changedBlockAddresses.forEach((address, i) => {
            const foundBlock = newBlockVisibility.find(block => block.blockAddress === parseInt(address))
            if (!foundBlock) {
                newBlockVisibility.push({
                    blockAddress: parseInt(address),
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
    })

    React.useEffect(() => {
        for(const start_address in ref.current) {
            if(ref.current[start_address])
                observer.observe(ref.current[start_address])
        }

        return () => {
            observer.disconnect()
        };
    }, [ref.current[parseInt(Object.keys(ref.current)[0])], observer]);

    const visibleBlocks = blockIsVisible.filter(block => block.inside).map(block => block.blockAddress)
    return {
        start: Math.min(...visibleBlocks),
        end: Math.max(...visibleBlocks)
    }
}



function DisassemblyView({ id }:{
    id: number,
}) {

    const dispatch = useAppDispatch();
    const selections = useAppSelector(selectSelections)
    const binaryFilePath = useAppSelector(selectBinaryFilePath)!
    const activeDisassemblyView = useAppSelector(selectActiveDisassemblyView)
    const active = activeDisassemblyView === id

    const lineSelection = selections[id]
    const [pages, setPages] = React.useState<BlockPage[]>([]);
    const disassemblyBlockRefs = React.useRef<{[start_address: number]: HTMLDivElement}>({})
    const onScreenFirstBlockAddress = useVisibleBlockWindow(disassemblyBlockRefs)

    React.useEffect(() => {
        const setAfterFetch = ((page: BlockPage) => {
            setPages([page])
        })
        if(lineSelection && lineSelection.addresses.length > 0) {
            api.getDisassemblyPageByAddress(binaryFilePath, lineSelection.addresses[0]).then(setAfterFetch)
        }
        else {
            api.getDisassemblyPage(binaryFilePath, 1).then(setAfterFetch)
        }
    }, [lineSelection])

    const addNewPage = (newPageNo: number) => {
        api.getDisassemblyPage(binaryFilePath, newPageNo).then(page => {
            let pagesCopy = [...pages]
            pagesCopy.push(page)
            pagesCopy = pagesCopy.sort((page1, page2) => page1.page_no - page2.page_no)
            setPages(pagesCopy)
        })
    }

    React.useEffect(() => {
        if (!lineSelection || lineSelection.addresses.length == 0) return;
        const firstFocusLine = lineSelection.addresses[0]

        const blockAddresses = Object.keys(disassemblyBlockRefs.current).map(key => parseInt(key, 10))
        for(const i in blockAddresses) {
            const blockAddress = blockAddresses[i]
            if (parseInt(i) > 0 && blockAddresses[parseInt(i)-1] <= firstFocusLine && firstFocusLine <= blockAddress) {
                if (!disassemblyBlockRefs.current[blockAddresses[parseInt(i)-1]]) continue;
                const scrollRef = disassemblyBlockRefs.current[blockAddress];
                setTimeout(() => {
                    scrollRef.scrollIntoView({
                        behavior: 'smooth'
                    })
                }, 100);
                break
            }
        }
    }, [lineSelection])

    const borderStyle: {[style: string]: string} = {}
    if(active) {
        borderStyle.border = '1px solid red'
    }

    const activeRef = React.useRef<HTMLInputElement>(null);
    React.useEffect(() => {
        if(activeRef.current)
            activeRef.current.checked = active;
    }, [active])

    let currentHidableName = ""
    const currentHidableInstructions: Instruction[] = []
    let totalHidables = 0

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
        {pages ?  
        <div style={{
            ...borderStyle,
            overflow: 'scroll',
        }}
        >
            {pages.length > 0 && pages[0].page_no > 1?<button onClick={e => {addNewPage(pages[0].page_no-1)}}>
                Load more
            </button>:<></>}
            {pages.map(page => page.blocks).flat().map((block, i, allBlocks) => (
                <DisassemblyBlock block={block} i={i} allBlocks={allBlocks} id={id} pages={pages} disassemblyBlockRefs={disassemblyBlockRefs} lineSelection={lineSelection} block_type={block.block_type}/>
            ))}
            {pages.length > 0 && !pages[pages.length-1].is_last?<button onClick={e => {addNewPage(pages[pages.length-1].page_no+1)}}>
                Load more
            </button>:<></>}
            {(onScreenFirstBlockAddress.start && isFinite(onScreenFirstBlockAddress.start))?
            <Minimap
                width={150}
                visibleBlockWindow={onScreenFirstBlockAddress}
            ></Minimap>:<></>}
            </div> :
            <div>
                <h1>Please select a binary file to get disassembly code here.</h1>
            </div>}
    </>
}

export default DisassemblyView;

