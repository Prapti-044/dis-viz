import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';
import { SOURCE_TAGS, INSTRUCTION_TAGS } from '../../utils';

interface TagsState {
  enabledTags: { [key: string]: boolean };
}

const initialState: TagsState = {
  enabledTags: [...SOURCE_TAGS, ...INSTRUCTION_TAGS]
    .filter((tag, index, self) => 
      index === self.findIndex(t => t.id === tag.id)
    )
    .reduce((acc, tag) => ({
      ...acc,
      [tag.id]: true
    }), {})
};

export const tagsSlice = createSlice({
  name: 'tags',
  initialState,
  reducers: {
    toggleTag: (state, action: PayloadAction<string>) => {
      state.enabledTags[action.payload] = !state.enabledTags[action.payload];
    },
    setTagEnabled: (state, action: PayloadAction<{ tagName: string; enabled: boolean }>) => {
      state.enabledTags[action.payload.tagName] = action.payload.enabled;
    }
  }
});

export const { toggleTag, setTagEnabled } = tagsSlice.actions;

export const selectTagEnabled = (state: RootState, tagName: string) => state.tags.enabledTags[tagName];
export const selectAllTagStates = (state: RootState) => state.tags.enabledTags;

export default tagsSlice.reducer; 