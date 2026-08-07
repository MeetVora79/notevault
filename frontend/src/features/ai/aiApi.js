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
    summarizeNote: builder.mutation({
      query: (body) => ({
        url: "/ai/summarize",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useGenerateTitleMutation, useSummarizeNoteMutation } = aiApi;
