import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import selectionsReducer from '../features/selections/selectionsSlice';
import minimapReducer from '../features/minimap/minimapSlice';
import binaryFilePathReducer from '../features/binary-data/binaryDataSlice';
import tagsReducer from '../features/tags/tagsSlice';
import historyReducer from '../features/history/historySlice';

export const store = configureStore({
  reducer: {
    selections: selectionsReducer,
    binaryFilePath: binaryFilePathReducer,
    minimap: minimapReducer,
    tags: tagsReducer,
    history: historyReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
