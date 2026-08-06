import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    accessToken: null,
    isAuthChecked: false,
  },
  reducers: {
    setAccessToken: (state, action) => {
      state.accessToken = action.payload; // does NOT touch isAuthChecked
    },
    setCredentials: (state, action) => {
      state.user = action.payload.user ?? state.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthChecked = true;
    },
    logoutLocal: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthChecked = true;
    },
  },
});

export const { setAccessToken, setCredentials, logoutLocal } = authSlice.actions;
export default authSlice.reducer;
