import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

export type Selection = {
    source_selection: {
        source_file: string,
        source_lines: number[]
    }[],
    binary_selection: {
        binary_file: string,
        addresses: number[]
    }[]
}

const initialState: Selection = {
    source_selection: [],
    binary_selection: []
}

export const selectionsSlice = createSlice({
    name: 'selections',
    initialState,
    reducers: {
        setSelection: (state: Selection, action: PayloadAction<Selection>) => {
            state.source_selection = action.payload.source_selection
            state.binary_selection = action.payload.binary_selection
        },
    },
});

export const {
    setSelection,
} = selectionsSlice.actions;

export const selectSelection = (state: RootState) => state.selections;


export default selectionsSlice.reducer;
