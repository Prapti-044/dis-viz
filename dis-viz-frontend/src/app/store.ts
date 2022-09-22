import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import selectionsReducer from '../features/selections/selectionsSlice';
import minimapReducer from '../features/minimap/minimapSlice';
import binaryFilePathReducer from '../features/binary-data/binaryDataSlice';

export const store = configureStore({
  reducer: {
    selections: selectionsReducer,
    binaryFilePath: binaryFilePathReducer,
    minimap: minimapReducer,
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
