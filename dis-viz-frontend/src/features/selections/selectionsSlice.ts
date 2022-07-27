import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';
import * as api from '../../api'

export interface Selections {
    value: {
        [disassemblyViewId: number]: {
            addresses: number[]
            source_selection: {
                source_file: string,
                lines: number[]
            }[],
        }|null
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
        setActiveDisassemblyView: (state, action: PayloadAction<number|null>) => {
        state.activeDisassemblyView = action.payload;
        },
        addDisassemblyView: (state) => {
            const disIds = Object.keys(state.value).map(val => parseInt(val))
            let newDisId = 1
            for (const i of disIds) {
                if (i !== newDisId) break;
                newDisId++
            }
            state.value[newDisId] = null
        },
        removeDisassemblyView: (state, action: PayloadAction<number>) => {
            delete state.value[action.payload]
        },
        setSourceLineSelection: (state, action: PayloadAction<{
            addresses: number[],
            source_selection: {
                source_file: string,
                lines: number[],
            }[],
        }>) => {
            if(state.activeDisassemblyView === null) return;
            state.value[state.activeDisassemblyView] = action.payload
        },
        setDisassemblyLineSelection: (state, action: PayloadAction<{
            addresses: number[],
            source_selection: {
                source_file: string,
                lines: number[],
            }[],
            disassemblyViewId: number,
        }>) => {
            state.value[action.payload.disassemblyViewId] = {
                addresses: action.payload.addresses,
                source_selection: action.payload.source_selection
            }
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
