import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../store/store';
import { SOURCE_TAGS, INSTRUCTION_TAGS } from '../../utils';

interface TagsState {
  enabledTags: { [key: string]: boolean };
  showOnlyDifferingTags: boolean;
  dimSameTags: boolean;
}

const initialState: TagsState = {
  enabledTags: [...SOURCE_TAGS, ...INSTRUCTION_TAGS]
    .filter((tag, index, self) => 
      index === self.findIndex(t => t.id === tag.id)
    )
    .reduce((acc, tag) => ({
      ...acc,
      [tag.id]: tag.defaultEnabled
    }), {}),
  showOnlyDifferingTags: false,
  dimSameTags: false
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
    },
    toggleShowOnlyDifferingTags: (state) => {
      state.showOnlyDifferingTags = !state.showOnlyDifferingTags;
    },
    setShowOnlyDifferingTags: (state, action: PayloadAction<boolean>) => {
      state.showOnlyDifferingTags = action.payload;
    },
    toggleDimSameTags: (state) => {
      state.dimSameTags = !state.dimSameTags;
    },
    setDimSameTags: (state, action: PayloadAction<boolean>) => {
      state.dimSameTags = action.payload;
    }
  }
});

export const {
  toggleTag,
  setTagEnabled,
  toggleShowOnlyDifferingTags,
  setShowOnlyDifferingTags,
  toggleDimSameTags,
  setDimSameTags
} = tagsSlice.actions;

export const selectTagEnabled = (state: RootState, tagName: string) => state.tags.enabledTags[tagName];
export const selectAllTagStates = (state: RootState) => state.tags.enabledTags;
export const selectShowOnlyDifferingTags = (state: RootState) => state.tags.showOnlyDifferingTags;
export const selectDimSameTags = (state: RootState) => state.tags.dimSameTags;

export default tagsSlice.reducer; 