import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

export interface BinaryFilePath {
    path: string,
    // order: BLOCK_ORDERS,
}

const initialState: BinaryFilePath = {
    path: '',
    // order: 'memory_order',
}

export const binaryFilePathSlice = createSlice({
    name: 'binaryfilepath',
    initialState,
    reducers: {
        setBinaryFilePath: (state: BinaryFilePath, action: PayloadAction<string>) => {
            state.path = action.payload
        },
        // changeOrder: (state: BinaryFilePath, action: PayloadAction<BLOCK_ORDERS>) => {
        //     state.order = action.payload
        // }
    },
});

export const { setBinaryFilePath, 
    // changeOrder
} = binaryFilePathSlice.actions;
export const selectBinaryFilePath = (state: RootState) => state.binaryFilePath.path
// export const selectOrder = (state: RootState) => state.binaryFilePath.order

export default binaryFilePathSlice.reducer;
