import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

export interface BinaryFilePaths {
    paths: string[],
}

const initialState: BinaryFilePaths = {
    paths: [],
}

export const binaryFilePathSlice = createSlice({
    name: 'binaryfilepath',
    initialState,
    reducers: {
        addBinaryFilePath: (state: BinaryFilePaths, action: PayloadAction<string>) => {
            state.paths = [...state.paths, action.payload];
        },
        removeBinaryFilePath: (state: BinaryFilePaths, action: PayloadAction<number>) => {
            state.paths = state.paths.filter((path, index) => index !== action.payload);
        },
        replaceBinaryFilePath: (state: BinaryFilePaths, action: PayloadAction<{ index: number, binaryFilePath: string }>) => {
            state.paths = state.paths.map((path, index) => index === action.payload.index ? action.payload.binaryFilePath : path);
        },
    },
});

export const { addBinaryFilePath, removeBinaryFilePath, replaceBinaryFilePath } = binaryFilePathSlice.actions;
export const selectBinaryFilePaths = (state: RootState) => state.binaryFilePath.paths;

export default binaryFilePathSlice.reducer;
