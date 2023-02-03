import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';
import * as api from '../../api'

export type MinimapType = {
    blockHeights: number[],
    builtInBlock: boolean[],
    blockStartAddress: number[],
    blockLoopIndents: number[],
}

export interface Minimap {
    value: MinimapType
}

const initialState: Minimap = {
    value: {
        blockHeights: [],
        builtInBlock: [],
        blockStartAddress: [],
        blockLoopIndents: [],
    }
}

export const minimapSlice = createSlice({
    name: 'minimap',
    initialState,
    reducers: {
        initBlocks: (state: Minimap, action: PayloadAction<MinimapType>) => {
            state.value = action.payload;
        },
    },
});

export const {
    initBlocks
} = minimapSlice.actions;
export const selectMinimap = (state: RootState) => state.minimap.value;

export default minimapSlice.reducer;
