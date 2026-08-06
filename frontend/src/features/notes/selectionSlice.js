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
    clearSelection: (state) => {
      state.selectedIds = [];
    },
  },
});

export const { toggleSelect, clearSelection } = selectionSlice.actions;
export default selectionSlice.reducer;