import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../store/store';
import * as disvizProcessor from '../../disvizProcessor';

export interface BinaryFilePaths {
    paths: string[];
    /** Baseline binary for semantic diff (must differ from semanticCompareRight when both set). */
    semanticCompareLeft: string;
    /** Target binary for semantic diff. */
    semanticCompareRight: string;
}

const initialState: BinaryFilePaths = {
    paths: [],
    semanticCompareLeft: '',
    semanticCompareRight: '',
};

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
        clearBinaryFilePaths: (state: BinaryFilePaths) => {
            state.paths = [];
            state.semanticCompareLeft = '';
            state.semanticCompareRight = '';
        },
        reorderBinaryFilePaths: (state: BinaryFilePaths, action: PayloadAction<string[]>) => {
            state.paths = action.payload;
        },
        removeLoadedFile: (state: BinaryFilePaths, action: PayloadAction<string>) => {
            try {
                const removed = action.payload;
                disvizProcessor.clearLoadedFile(removed);
                state.paths = state.paths.filter(path => path !== removed);
                if (state.semanticCompareLeft === removed) state.semanticCompareLeft = '';
                if (state.semanticCompareRight === removed) state.semanticCompareRight = '';
            } catch (error) {
                console.error('Error removing file:', error);
            }
        },
        syncWithLoadedFiles: (state: BinaryFilePaths) => {
            const loadedFiles = disvizProcessor.getLoadedFileNames();
            state.paths = loadedFiles;
            const set = new Set(loadedFiles);
            if (state.semanticCompareLeft && !set.has(state.semanticCompareLeft)) {
                state.semanticCompareLeft = '';
            }
            if (state.semanticCompareRight && !set.has(state.semanticCompareRight)) {
                state.semanticCompareRight = '';
            }
        },
        setSemanticComparePair: (state: BinaryFilePaths, action: PayloadAction<{ left: string; right: string }>) => {
            let { left, right } = action.payload;
            if (left && right && left === right) {
                right = '';
            }
            state.semanticCompareLeft = left;
            state.semanticCompareRight = right;
        },
    },
});

export const { 
    addBinaryFilePath, 
    removeBinaryFilePath, 
    replaceBinaryFilePath, 
    clearBinaryFilePaths,
    reorderBinaryFilePaths,
    removeLoadedFile,
    syncWithLoadedFiles,
    setSemanticComparePair,
} = binaryFilePathSlice.actions;

export const selectBinaryFilePaths = (state: RootState) => state.binaryFilePath.paths;
export const selectSemanticCompareLeft = (state: RootState) => state.binaryFilePath.semanticCompareLeft;
export const selectSemanticCompareRight = (state: RootState) => state.binaryFilePath.semanticCompareRight;

export default binaryFilePathSlice.reducer;
