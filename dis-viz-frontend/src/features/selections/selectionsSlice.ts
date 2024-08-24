import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

export type HoverHighlight = {
    addresses: {
        [binaryFilePath: string]: number[]
    },
    source_selection: {
        source_file: string,
        lines: number[]
    }[],
}

export type DisIdSelections = {
    binaryFilePath: string,
    addresses: number[]
    source_selection: {
        source_file: string,
        lines: number[]
    }[],
}

export interface Selections {
    value: {
        [disassemblyViewId: number]: DisIdSelections
    },
    activeDisassemblyView: number|null
    hoverHighlight: HoverHighlight
}

const initialState: Selections = {
    value: {},
    activeDisassemblyView: null,
    hoverHighlight: {
        addresses: {},
        source_selection: []
    }
}

export const selectionsSlice = createSlice({
    name: 'selections',
    initialState,
    reducers: {
        setActiveDisassemblyView: (state: Selections, action: PayloadAction<number|null>) => {
        state.activeDisassemblyView = action.payload;
        },
        // adds a new disassembly view. If the payload is null, then the new disassembly view will not have any selections
        // If payload is a DisIdSelections, then the new disassembly view will have the same selections as the payload
        // If payload is a string, then it must be the block ID of the block that the new disassembly view will be selecting
        addDisassemblyView: (state: Selections, action: PayloadAction<DisIdSelections>) => {
            const disIds = Object.keys(state.value).map(val => parseInt(val))
            let newDisId = 1
            for (const i of disIds) {
                if (i !== newDisId) break;
                newDisId++
            }
            state.value[newDisId] = action.payload
        },
        removeDisassemblyView: (state: Selections, action: PayloadAction<number>) => {
            delete state.value[action.payload]
        },
        setDisassemblyLineSelection: (state: Selections, action: PayloadAction<{ disassemblyViewId: number | null, disIdSelections: DisIdSelections }>) => {
            const disassemblyViewId = action.payload.disassemblyViewId || state.activeDisassemblyView
            if (disassemblyViewId === null) return;
            state.value[disassemblyViewId] = action.payload.disIdSelections
        },
        setSourceLineSelection: (state: Selections, action: PayloadAction<DisIdSelections>) => {
            if(state.activeDisassemblyView === null) return;
            state.value[state.activeDisassemblyView] = action.payload
        },
        setMouseHighlight: (state: Selections, action: PayloadAction<HoverHighlight>) => {
            state.hoverHighlight = action.payload
        }
    },
});

export const {
    setActiveDisassemblyView,
    addDisassemblyView,
    removeDisassemblyView,
    setSourceLineSelection,
    setDisassemblyLineSelection,
    setMouseHighlight,
} = selectionsSlice.actions;
export const selectSelections = (state: RootState) => state.selections.value;
export const selectActiveDisassemblyView = (state: RootState) => state.selections.activeDisassemblyView;
export const selectHoverHighlight = (state: RootState) => state.selections.hoverHighlight;

export default selectionsSlice.reducer;
