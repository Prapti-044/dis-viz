import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

export type SourceSelection = {
    source_file: string,
    lines: number[]
}[]

export type HoverHighlight = {
    addresses: {
        [binaryFilePath: string]: number[]
    },
    source_selection: SourceSelection,
}

export type DisIdSelections = {
    binaryFilePath: string,
    addresses: number[]
    source_selection: SourceSelection,
}

export interface Selections {
    disIdSelections: {
        [disassemblyViewId: number]: {
            isActive: boolean,
            selections: DisIdSelections
        }
    },
    hoverHighlight: HoverHighlight
}

const initialState: Selections = {
    disIdSelections: {},
    hoverHighlight: {
        addresses: {},
        source_selection: []
    }
}

export const selectionsSlice = createSlice({
    name: 'selections',
    initialState,
    reducers: {
        setActiveDisassemblyView: (state: Selections, action: PayloadAction<number>) => {
            const disassemblyViewId = action.payload
            state.disIdSelections[disassemblyViewId].isActive = true
        },
        setInactiveDisassemblyView: (state: Selections, action: PayloadAction<number>) => {
            const disassemblyViewId = action.payload
            state.disIdSelections[disassemblyViewId].isActive = false
        },
        toggleActiveDisassemblyView: (state: Selections, action: PayloadAction<number>) => {
            const disassemblyViewId = action.payload
            state.disIdSelections[disassemblyViewId].isActive = !state.disIdSelections[disassemblyViewId].isActive
        },
        // adds a new disassembly view. If the payload is null, then the new disassembly view will not have any selections
        // If payload is a DisIdSelections, then the new disassembly view will have the same selections as the payload
        // If payload is a string, then it must be the block ID of the block that the new disassembly view will be selecting
        addDisassemblyView: (state: Selections, action: PayloadAction<DisIdSelections>) => {
            const binaryFilePath = action.payload.binaryFilePath
            const disIds = Object.keys(state.disIdSelections).map(val => parseInt(val))
            let newDisId = 1
            for (const i of disIds) {
                if (i !== newDisId) break;
                newDisId++
            }
            state.disIdSelections[newDisId] = {
                isActive: true,
                selections: action.payload
            }
        },
        removeDisassemblyView: (state: Selections, action: PayloadAction<number>) => {
            delete state.disIdSelections[action.payload]
        },
        setDisassemblyLineSelection: (state: Selections, action: PayloadAction<{ disassemblyViewId: number, disIdSelections: DisIdSelections }>) => {
            const disassemblyViewId = action.payload.disassemblyViewId
            state.disIdSelections[disassemblyViewId].selections = action.payload.disIdSelections
        },
        setSourceLineSelection: (state: Selections, action: PayloadAction<{ addresses: { [binaryFilePath: string]: number[] }, source_selection: SourceSelection }>) => {
            const activeDisassemblyViews = Object.keys(state.disIdSelections).filter(val => state.disIdSelections[parseInt(val)].isActive).map(val => parseInt(val))
            activeDisassemblyViews.forEach(disassemblyViewId => {
                const binaryFilePath = state.disIdSelections[disassemblyViewId].selections.binaryFilePath
                state.disIdSelections[disassemblyViewId].selections.source_selection = action.payload.source_selection
                state.disIdSelections[disassemblyViewId].selections.addresses = binaryFilePath in action.payload.addresses ? action.payload.addresses[binaryFilePath] : []
            })

        },
        setMouseHighlight: (state: Selections, action: PayloadAction<HoverHighlight>) => {
            state.hoverHighlight = action.payload
        }
    },
});

export const {
    setActiveDisassemblyView,
    setInactiveDisassemblyView,
    toggleActiveDisassemblyView,
    addDisassemblyView,
    removeDisassemblyView,
    setSourceLineSelection,
    setDisassemblyLineSelection,
    setMouseHighlight,
} = selectionsSlice.actions;
export const selectDisIdSelections = (state: RootState) => state.selections.disIdSelections;
export const selectDisIdSelection = (state: RootState, disassemblyViewId: number) => state.selections.disIdSelections[disassemblyViewId];
export const selectHoverHighlight = (state: RootState) => state.selections.hoverHighlight;

export default selectionsSlice.reducer;
