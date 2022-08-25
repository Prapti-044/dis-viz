import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';
import * as api from '../../api'

type DisIdSelections = {
    addresses: number[]
    source_selection: {
        source_file: string,
        lines: number[]
    }[],
}

export interface Selections {
    value: {
        [disassemblyViewId: number]: DisIdSelections|null
    },
    activeDisassemblyView: number|null
}

const initialState: Selections = {
    value: {},
    activeDisassemblyView: null,
}

export const selectionsSlice = createSlice({
    name: 'selections',
    initialState,
    reducers: {
        setActiveDisassemblyView: (state: Selections, action: PayloadAction<number|null>) => {
        state.activeDisassemblyView = action.payload;
        },
        addDisassemblyView: (state: Selections) => {
            const disIds = Object.keys(state.value).map(val => parseInt(val))
            let newDisId = 1
            for (const i of disIds) {
                if (i !== newDisId) break;
                newDisId++
            }
            state.value[newDisId] = null
        },
        removeDisassemblyView: (state: Selections, action: PayloadAction<number>) => {
            delete state.value[action.payload]
        },
        setSourceLineSelection: (state: Selections, action: PayloadAction<DisIdSelections>) => {
            if(state.activeDisassemblyView === null) return;
            state.value[state.activeDisassemblyView] = action.payload
        },
        setDisassemblyLineSelection: (state: Selections, action: PayloadAction<{
            disIdSelections: DisIdSelections,
            disassemblyViewId: number,
        }>) => {
            state.value[action.payload.disassemblyViewId] = action.payload.disIdSelections
        }
    },
});

export const {
    setActiveDisassemblyView,
    addDisassemblyView,
    removeDisassemblyView,
    setSourceLineSelection,
    setDisassemblyLineSelection
} = selectionsSlice.actions;
export const selectSelections = (state: RootState) => state.selections.value;
export const selectActiveDisassemblyView = (state: RootState) => state.selections.activeDisassemblyView;

export default selectionsSlice.reducer;
