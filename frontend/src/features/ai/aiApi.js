import { api } from "@/services/api";

export const aiApi = api.injectEndpoints({
  endpoints: (builder) => ({
    generateTitle: builder.mutation({
      query: (body) => ({
        url: "/ai/generate-title",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useGenerateTitleMutation } = aiApi;