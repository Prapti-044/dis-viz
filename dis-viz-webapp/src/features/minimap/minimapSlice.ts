import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../store/store';

export type MinimapType = {
    blockHeights: number[],
    builtInBlock: boolean[],
    blockStartAddress: number[],
    blockLoopIndents: number[],
    blockTypes: ("memory_read" | "memory_write" | "call" | "vectorized" | "normal" | "hoisted" | "inline")[]
}

export interface Minimap {
    minimaps: MinimapType[]
}

const initialState: Minimap = {
    minimaps: []
}

export const minimapSlice = createSlice({
    name: 'minimap',
    initialState,
    reducers: {
        addMinimap: (state: Minimap, action: PayloadAction<MinimapType>) => {
            state.minimaps = [...state.minimaps, action.payload];
        },
        removeMinimap: (state: Minimap, action: PayloadAction<number>) => {
            state.minimaps = state.minimaps.filter((minimap, index) => index !== action.payload);
        }
    },
});

export const {
    addMinimap, removeMinimap
} = minimapSlice.actions;
export const selectMinimap = (state: RootState) => state.minimap.minimaps;

export default minimapSlice.reducer;
