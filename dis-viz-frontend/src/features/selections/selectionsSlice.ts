import { applyMiddleware, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';
import * as api from '../../api'
import { useAppSelector } from '../../app/hooks';
import { selectActiveDisassemblyView } from '../active-disassembly-view/activeDisassemblyViewSlice'

export interface Selections {
    value: {
        file_name: string,
        highlights: {
            start_line: number,
            end_line: number,
            disassemblyId: number|null,
            start_address: number,
            end_address: number
        }[]
    }[]
}

const initialState: Selections = {
    value: []
}

export const selectionsSlice = createSlice({
    name: 'selections',
    initialState,
    reducers: {
        initializeSourceFiles: (state, action: PayloadAction<string[]>) => {
            state.value = action.payload.map(file_name => ({
                file_name,
                highlights: []
            }))
        },
        setSourceLineSelection: (state, action: PayloadAction<{
            binaryFilePath: string,
            file_name: string,
            start_line: number,
            end_line: number
        }>) => {
            api.getSourceCorresponding(action.payload.binaryFilePath, action.payload.file_name, action.payload.start_line, action.payload.end_line).then(newDisLine => {
                const activeDisassemblyView = useAppSelector(selectActiveDisassemblyView)
                const sourceStateIndex = state.value.findIndex(sourceState => sourceState.file_name === action.payload.file_name)

                if(sourceStateIndex === -1) return;
                const disassemblyStateIndex = state.value[sourceStateIndex].highlights.findIndex(disState => disState.disassemblyId === activeDisassemblyView)
                const newData = {
                    start_line: action.payload.start_line,
                    end_line: action.payload.start_line,
                    disassemblyId: activeDisassemblyView,
                    start_address: newDisLine.start_address,
                    end_address: newDisLine.end_address,
                }
                if (disassemblyStateIndex === -1) {
                    state.value[sourceStateIndex].highlights.push(newData)
                }
                else {
                    state.value[sourceStateIndex].highlights[disassemblyStateIndex] = newData
                }
            })
        }
    },
});

export const { initializeSourceFiles, setSourceLineSelection } = selectionsSlice.actions;
export const selectSelections = (state: RootState) => state.selections.value;

export default selectionsSlice.reducer;
