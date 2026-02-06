import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../store/store';

export type SourceSelection = {
    source_file: string,
    source_lines: number[]
}

export type BinarySelection = {
    binary_file: string,
    addresses: number[]
}

export type Selection = {
    source_selection: SourceSelection[],
    binary_selection: BinarySelection[],
    source_hover_highlight: SourceSelection[],
    binary_hover_highlight: BinarySelection[]
}

const initialState: Selection = {
    source_selection: [],
    binary_selection: [],
    source_hover_highlight: [],
    binary_hover_highlight: []
}

export const selectionsSlice = createSlice({
    name: 'selections',
    initialState,
    reducers: {
        setSelection: (state: Selection, action: PayloadAction<{ source_selection: Selection['source_selection'], binary_selection: Selection['binary_selection'] }>) => {
            state.source_selection = action.payload.source_selection
            state.binary_selection = action.payload.binary_selection
        },
        setHoverHighlight: (state: Selection, action: PayloadAction<{ source_hover_highlight: Selection['source_hover_highlight'], binary_hover_highlight: Selection['binary_hover_highlight'] }>) => {
            state.source_hover_highlight = action.payload.source_hover_highlight
            state.binary_hover_highlight = action.payload.binary_hover_highlight
        },
        clearHoverHighlight: (state: Selection) => {
            state.source_hover_highlight = []
            state.binary_hover_highlight = []
        },
        clearSelection: (state: Selection) => {
            state.source_selection = []
            state.binary_selection = []
        }
    },
});

export const {
    setSelection,
    setHoverHighlight,
    clearHoverHighlight,
    clearSelection,
} = selectionsSlice.actions;

export const selectSourceSelection = (state: RootState) => state.selections.source_selection;
export const selectBinarySelection = (state: RootState) => state.selections.binary_selection;

export const selectSourceHoverHighlight = (state: RootState) => state.selections.source_hover_highlight;
export const selectBinaryHoverHighlight = (state: RootState) => state.selections.binary_hover_highlight;

export default selectionsSlice.reducer;
