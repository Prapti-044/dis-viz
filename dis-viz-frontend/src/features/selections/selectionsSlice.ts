import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';
import * as api from '../../api'

export interface Selections {
    value: {
        [disassemblyViewId: number]: {
            start_address: number,
            end_address: number,
            source_selection: {
                source_file: string,
                start_line: number,
                end_line: number,
            }[],
        }|null
    },
    activeDisassemblyView: number|null
}

const initialState: Selections = {
    value: {},
    activeDisassemblyView: null,
}

export const selectionsSlice = createSlice({
    name: 'selections',
    initialState,
    reducers: {
        setActiveDisassemblyView: (state, action: PayloadAction<number|null>) => {
        state.activeDisassemblyView = action.payload;
        },
        addDisassemblyView: (state) => {
            const disIds = Object.keys(state.value).map(val => parseInt(val))
            let newDisId = 1
            for (const i of disIds) {
                if (i !== newDisId) break;
                newDisId++
            }
            state.value[newDisId] = null
        },
        removeDisassemblyView: (state, action: PayloadAction<number>) => {
            // TODO: Remove key action.payload from state
        },
        setSourceLineSelection: (state, action: PayloadAction<{
            binaryFilePath: string,
            file_name: string,
            start_line: number,
            end_line: number
        }>) => {
            api.getSourceCorresponding(action.payload.binaryFilePath, action.payload.file_name, action.payload.start_line, action.payload.end_line).then(newDisLine => {

                const activeDisassemblyView = state.activeDisassemblyView
                if (activeDisassemblyView === null) return;
                state.value[activeDisassemblyView] = {
                    start_address: newDisLine.start_address,
                    end_address: newDisLine.end_address,
                    source_selection: [{
                        source_file: action.payload.file_name,
                        start_line: action.payload.start_line,
                        end_line: action.payload.end_line
                    }]
                }
            })
        },
        setDisassemblyLineSelection: (state, action: PayloadAction<{
            binaryFilePath: string,
            start_address: number,
            end_address: number,
        }>) => {
            api.getDisassemblyCorresponding(action.payload.binaryFilePath, action.payload.start_address, action.payload.end_address).then(newSourceLine => {
                const activeDisassemblyView = state.activeDisassemblyView

                console.log("Disassembly Selection not yet implemented")
                console.log("    newSourceLine", newSourceLine)
                console.log("    activeDisView", activeDisassemblyView)
                // const disassemblyStateIndex = state.value[sourceStateIndex].highlights.findIndex(disState => disState.disassemblyId === activeDisassemblyView)
                // const newData = {
                //     start_line: newSourceLine
                //     end_line: action.payload.start_line,
                //     disassemblyId: activeDisassemblyView,
                //     start_address: newDisLine.start_address,
                //     end_address: newDisLine.end_address,
                // }
                // if (disassemblyStateIndex === -1) {
                //     state.value[sourceStateIndex].highlights.push(newData)
                // }
                // else {
                //     state.value[sourceStateIndex].highlights[disassemblyStateIndex] = newData
                // }
            })
        }
    },
});

export const {
    setActiveDisassemblyView,
    addDisassemblyView,
    removeDisassemblyView,
    setSourceLineSelection,
    setDisassemblyLineSelection
} = selectionsSlice.actions;
export const selectSelections = (state: RootState) => state.selections.value;
export const selectActiveDisassemblyView = (state: RootState) => state.selections.activeDisassemblyView;

export default selectionsSlice.reducer;
