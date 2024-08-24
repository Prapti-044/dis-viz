import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

export type MinimapType = {
    blockHeights: number[],
    builtInBlock: boolean[],
    blockStartAddress: number[],
    blockLoopIndents: number[],
    blockTypes: string[][]
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
        blockTypes: []
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
