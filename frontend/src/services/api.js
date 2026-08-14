import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setCredentials, logoutLocal } from "@/features/auth/authSlice";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL,
  credentials: "include", // sends the httpOnly refresh cookie automatically
  prepareHeaders: (headers, { getState }) => {
    const accessToken = getState().auth.accessToken;
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
    return headers;
  },
});

// Wraps every request: on a 401, silently tries /auth/refresh, then retries the original request once.
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  // Determine the URL of the request that just failed
  const requestUrl = typeof args === "string" ? args : args.url;

  // Don't attempt recovery if the failing request IS the refresh call itself —
  // that would just retry refresh and fail again identically.
  const isRefreshCall = requestUrl?.includes("/auth/refresh");

  if (result.error && result.error.status === 401 && !isRefreshCall) {
    const refreshResult = await rawBaseQuery(
      { url: "/auth/refresh", method: "POST" },
      api,
      extraOptions,
    );

    if (refreshResult.data?.accessToken) {
      api.dispatch(
        setCredentials({
          accessToken: refreshResult.data.accessToken,
          user: api.getState().auth.user,
        }),
      );
      result = await rawBaseQuery(args, api, extraOptions); // retry original request
    } else {
      api.dispatch(logoutLocal());
    }
  }

  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Note", "User"],
  endpoints: () => ({}), // extended by authApi.js and noteApi.js
});
