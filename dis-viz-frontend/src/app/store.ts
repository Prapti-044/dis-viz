import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import activeDisassemblyViewReducer from '../features/active-disassembly-view/activeDisassemblyViewSlice';
import selectionsReducer from '../features/selections/selectionsSlice';

export const store = configureStore({
  reducer: {
    activeDisassemblyView: activeDisassemblyViewReducer,
    selections: selectionsReducer,
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
