import { useCallback } from 'react';
import { useAppDispatch } from '../store/hooks';
import { setSelection, SourceSelection, BinarySelection } from '../features/selections/selectionsSlice';
import { addHistoryEntry, SelectionOrigin, HistoryEntryDetails } from '../features/history/historySlice';

export type SetSelectionWithHistoryPayload = {
    source_selection: SourceSelection[];
    binary_selection: BinarySelection[];
    origin: SelectionOrigin;
    details?: Partial<HistoryEntryDetails>;
};

/**
 * Custom hook that provides a function to set selection with automatic history tracking.
 * Use this instead of directly dispatching setSelection when you want the selection
 * to be recorded in history.
 */
export function useSelectionWithHistory() {
    const dispatch = useAppDispatch();

    const setSelectionWithHistory = useCallback(
        (payload: SetSelectionWithHistoryPayload) => {
            // First, add to history
            dispatch(addHistoryEntry({
                source_selection: payload.source_selection,
                binary_selection: payload.binary_selection,
                origin: payload.origin,
                details: payload.details,
            }));

            // Then, set the selection
            dispatch(setSelection({
                source_selection: payload.source_selection,
                binary_selection: payload.binary_selection,
            }));
        },
        [dispatch]
    );

    return { setSelectionWithHistory };
}

export default useSelectionWithHistory;
