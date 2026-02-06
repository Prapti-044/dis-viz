import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../store/store';
import { SourceSelection, BinarySelection } from '../selections/selectionsSlice';

const MAX_HISTORY_SIZE = 10;

export type SelectionOrigin = 
    | { type: 'source'; sourceFile: string; lineNumber: number }
    | { type: 'disassembly'; disassemblyId: number; address: number };

export type HistoryEntryDetails = {
    // Function name if available
    functionName?: string;
    // Block name if available
    blockName?: string;
    // All source files and lines involved
    sourceDetails: { file: string; lines: number[] }[];
    // All binary addresses involved
    binaryDetails: { file: string; addresses: number[] }[];
};

export type HistoryEntry = {
    id: string;
    timestamp: number;
    label: string;
    origin: SelectionOrigin;
    details: HistoryEntryDetails;
    source_selection: SourceSelection[];
    binary_selection: BinarySelection[];
};

export type HistoryState = {
    entries: HistoryEntry[];
    currentIndex: number | null; // Index of the currently active history entry, null if at latest state
};

const initialState: HistoryState = {
    entries: [],
    currentIndex: null,
};

export type AddHistoryEntryPayload = {
    source_selection: SourceSelection[];
    binary_selection: BinarySelection[];
    origin: SelectionOrigin;
    details?: Partial<HistoryEntryDetails>;
};

/**
 * Generate a human-readable label for a selection based on origin
 */
function generateLabel(origin: SelectionOrigin): string {
    if (origin.type === 'source') {
        const fileName = origin.sourceFile.split('/').pop() || origin.sourceFile;
        return `${fileName}:${origin.lineNumber}`;
    } else {
        return `Disassembly_${origin.disassemblyId}:0x${origin.address.toString(16).toUpperCase()}`;
    }
}

export const historySlice = createSlice({
    name: 'history',
    initialState,
    reducers: {
        addHistoryEntry: (
            state: HistoryState,
            action: PayloadAction<AddHistoryEntryPayload>
        ) => {
            const { source_selection, binary_selection, origin, details } = action.payload;

            // Don't add empty selections
            if (source_selection.length === 0 && binary_selection.length === 0) {
                return;
            }

            // Determine which entry to compare against for duplicate check
            // If we're at a history point, compare against that entry
            // Otherwise compare against the most recent entry
            const compareIndex = state.currentIndex !== null 
                ? state.currentIndex 
                : state.entries.length - 1;

            if (compareIndex >= 0 && compareIndex < state.entries.length) {
                const compareEntry = state.entries[compareIndex];
                const isSame =
                    JSON.stringify(compareEntry.source_selection) === JSON.stringify(source_selection) &&
                    JSON.stringify(compareEntry.binary_selection) === JSON.stringify(binary_selection);
                if (isSame) {
                    // If we're navigating in history and clicked the same thing,
                    // just reset to that point without adding duplicate
                    if (state.currentIndex !== null) {
                        // Trim history to current point
                        state.entries = state.entries.slice(0, state.currentIndex + 1);
                    }
                    state.currentIndex = null;
                    return;
                }
            }

            // Build details from selections
            const entryDetails: HistoryEntryDetails = {
                functionName: details?.functionName,
                blockName: details?.blockName,
                sourceDetails: source_selection.map(sel => ({
                    file: sel.source_file,
                    lines: sel.source_lines.map(l => l + 1) // Convert to 1-based
                })),
                binaryDetails: binary_selection.map(sel => ({
                    file: sel.binary_file,
                    addresses: sel.addresses
                })),
            };

            const newEntry: HistoryEntry = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: Date.now(),
                label: generateLabel(origin),
                origin,
                details: entryDetails,
                source_selection: source_selection,
                binary_selection: binary_selection,
            };

            // If we're at a previous history point and make a new selection,
            // we should branch from that point (remove entries after current)
            if (state.currentIndex !== null) {
                state.entries = state.entries.slice(0, state.currentIndex + 1);
            }

            state.entries.push(newEntry);

            // Keep only the last MAX_HISTORY_SIZE entries
            if (state.entries.length > MAX_HISTORY_SIZE) {
                state.entries = state.entries.slice(-MAX_HISTORY_SIZE);
            }

            // Reset to latest state
            state.currentIndex = null;
        },

        setCurrentHistoryIndex: (state: HistoryState, action: PayloadAction<number | null>) => {
            if (action.payload === null) {
                state.currentIndex = null;
            } else if (action.payload >= 0 && action.payload < state.entries.length) {
                state.currentIndex = action.payload;
            }
        },

        clearHistory: (state: HistoryState) => {
            state.entries = [];
            state.currentIndex = null;
        },
    },
});

export const { addHistoryEntry, setCurrentHistoryIndex, clearHistory } = historySlice.actions;

// Selectors
export const selectHistoryEntries = (state: RootState) => state.history.entries;
export const selectCurrentHistoryIndex = (state: RootState) => state.history.currentIndex;
export const selectCurrentHistoryEntry = (state: RootState) => {
    const { entries, currentIndex } = state.history;
    if (currentIndex !== null && currentIndex < entries.length) {
        return entries[currentIndex];
    }
    return null;
};

export default historySlice.reducer;
