import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

export interface ActiveDisassemblyView {
  value: number|null;
}

const initialState: ActiveDisassemblyView = {
    value: null,
}

export const activeDisassemblyViewSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    setActiveDisassemblyView: (state, action: PayloadAction<number|null>) => {
      state.value = action.payload;
    },
  },
});

export const { setActiveDisassemblyView } = activeDisassemblyViewSlice.actions;
export const selectActiveDisassemblyView = (state: RootState) => state.activeDisassemblyView.value;

export default activeDisassemblyViewSlice.reducer;
