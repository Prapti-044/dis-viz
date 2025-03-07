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
    }[],
    source_hover_highlight: {
        source_file: string,
        source_lines: number[]
    },
    binary_hover_highlight: {
        binary_file: string,
        addresses: number[]
    }[]
}

const initialState: Selection = {
    source_selection: [],
    binary_selection: [],
    source_hover_highlight: {
        source_file: "",
        source_lines: []
    },
    binary_hover_highlight: []
}

export const selectionsSlice = createSlice({
    name: 'selections',
    initialState,
    reducers: {
        setSelection: (state: Selection, action: PayloadAction<Selection>) => {
            state.source_selection = action.payload.source_selection
            state.binary_selection = action.payload.binary_selection
            state.source_hover_highlight = action.payload.source_hover_highlight
            state.binary_hover_highlight = action.payload.binary_hover_highlight
        },
        setSourceHoverHighlight: (state: Selection, action: PayloadAction<{
            source_file: string,
            source_lines: number[]
        }>) => {
            state.source_hover_highlight = action.payload
        },
        setBinaryHoverHighlight: (state: Selection, action: PayloadAction<{
            binary_file: string,
            addresses: number[]
        }[]>) => {
            state.binary_hover_highlight = action.payload
        },
        clearSourceHoverHighlight: (state: Selection) => {
            state.source_hover_highlight = {
                source_file: "",
                source_lines: []
            }
        },
        clearBinaryHoverHighlight: (state: Selection) => {
            state.binary_hover_highlight = []
        },
    },
});

export const {
    setSelection,
    setSourceHoverHighlight,
    setBinaryHoverHighlight,
    clearSourceHoverHighlight,
    clearBinaryHoverHighlight,
} = selectionsSlice.actions;

export const selectSourceSelection = (state: RootState) => state.selections.source_selection;
export const selectBinarySelection = (state: RootState) => state.selections.binary_selection;

export const selectSourceHoverHighlight = (state: RootState) => state.selections.source_hover_highlight;
export const selectBinaryHoverHighlight = (state: RootState) => state.selections.binary_hover_highlight;

export default selectionsSlice.reducer;
