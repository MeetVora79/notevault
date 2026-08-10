import { configureStore } from "@reduxjs/toolkit";
import { api } from "@/services/api";
import authReducer from "@/features/auth/authSlice";
import themeReducer from "@/features/theme/themeSlice";
import selectionReducer from "@/features/notes/selectionSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    selection: selectionReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});