import React from 'react'
import { InstructionBlock } from '../types'
import { disLineToId } from '../utils'

function toggleHideElement(isHidden: boolean, el: HTMLElement) {
    if (isHidden) {
        el.style.maxHeight = el.scrollHeight + "px";
    } else {
        el.style.maxHeight = "0px";
    } 
}

function HidableDisassembly({ name, block, disId }: {
    name: string,
    block: InstructionBlock,
    disId: number
}) {

    const [isHidden, setIsHidden] = React.useState(false)

    React.useEffect(() => {
        if(isHidden) return
        block.hidables
            // Get all instructions that are in hidables
            .map(hidable => block.instructions.filter(ins => ins.address >= hidable.start_address && ins.address <= hidable.end_address)).flat()
            // Remove duplicates
            .filter((elem, index, self) => index === self.indexOf(elem))
            // Get the ids of those instructions
            .map(className => disLineToId(disId, className.address))
            // Remove hide elements from html by id
            .forEach(elId => {
                const el = document.getElementById(elId)
                if(el) toggleHideElement(isHidden, el)
            })
        setIsHidden(true)
    }, [])

    return <button
            className={"hidablebtn " + (isHidden?"open":"closed")}
            key={block.name}
            onClick={() => {
                block.hidables
                    // Get all instructions that are in hidables
                    .map(hidable => block.instructions.filter(ins => ins.address >= hidable.start_address && ins.address <= hidable.end_address)).flat()
                    // Remove duplicates
                    .filter((elem, index, self) => index === self.indexOf(elem))
                    // Get the ids of those instructions
                    .map(className => disLineToId(disId, className.address))
                    // Remove hide elements from html by id
                    .forEach(elId => {
                        const el = document.getElementById(elId)
                        if(el) toggleHideElement(isHidden, el)
                    })
                setIsHidden(!isHidden)
            }}
        >{name}</button>
}

export default HidableDisassembly