import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

export interface BinaryFilePath {
    path: string
}

const initialState: BinaryFilePath = {
    path: ''
}

export const binaryFilePathSlice = createSlice({
    name: 'binaryfilepath',
    initialState,
    reducers: {
        setBinaryFilePath: (state, action: PayloadAction<string>) => {
            state.path = action.payload
        }
    },
});

export const { setBinaryFilePath } = binaryFilePathSlice.actions;
export const selectBinaryFilePath = (state: RootState) => state.binaryFilePath.path

export default binaryFilePathSlice.reducer;
