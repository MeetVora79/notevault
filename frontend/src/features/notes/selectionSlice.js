import { createSlice } from "@reduxjs/toolkit";

const selectionSlice = createSlice({
  name: "selection",
  initialState: {
    selectedIds: [],
  },
  reducers: {
    toggleSelect: (state, action) => {
      const id = action.payload;
      if (state.selectedIds.includes(id)) {
        state.selectedIds = state.selectedIds.filter((i) => i !== id);
      } else {
        state.selectedIds.push(id);
      }
    },
    selectAll: (state, action) => {
      state.selectedIds = action.payload; // array of ids
    },
    clearSelection: (state) => {
      state.selectedIds = [];
    },
    enterSelectionMode: (state) => {
      state.isSelectionMode = true;
    },
    exitSelectionMode: (state) => {
      state.selectedIds = [];
      state.isSelectionMode = false;
    },
  },
});

export const {
  toggleSelect,
  selectAll,
  clearSelection,
  enterSelectionMode,
  exitSelectionMode,
} = selectionSlice.actions;
export default selectionSlice.reducer;
