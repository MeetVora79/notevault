import { api } from "@/services/api";

export const noteApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getNotes: builder.query({
      query: (params = {}) => ({ url: "/notes", params }),
      providesTags: (result) =>
        result?.notes
          ? [
              ...result.notes.map(({ _id }) => ({ type: "Note", id: _id })),
              { type: "Note", id: "LIST" },
            ]
          : [{ type: "Note", id: "LIST" }],
    }),
    createNote: builder.mutation({
      query: (body) => ({ url: "/notes", method: "POST", body }),
      invalidatesTags: [{ type: "Note", id: "LIST" }],
    }),
    updateNote: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/notes/${id}`, method: "PUT", body }),
      invalidatesTags: (result, error, { id }) => [{ type: "Note", id }],
    }),
    togglePin: builder.mutation({
      query: (id) => ({ url: `/notes/${id}/pin`, method: "PATCH" }),
      invalidatesTags: (result, error, id) => [{ type: "Note", id }],
    }),
    toggleArchive: builder.mutation({
      query: (id) => ({ url: `/notes/${id}/archive`, method: "PATCH" }),
      invalidatesTags: [{ type: "Note", id: "LIST" }],
    }),
    trashNote: builder.mutation({
      query: (id) => ({ url: `/notes/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Note", id: "LIST" }],
    }),
    restoreNote: builder.mutation({
      query: (id) => ({ url: `/notes/${id}/restore`, method: "PATCH" }),
      invalidatesTags: [{ type: "Note", id: "LIST" }],
    }),
    deleteNotePermanently: builder.mutation({
      query: (id) => ({ url: `/notes/${id}/permanent`, method: "DELETE" }),
      invalidatesTags: [{ type: "Note", id: "LIST" }],
    }),
  }),
});

export const {
  useGetNotesQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useTogglePinMutation,
  useToggleArchiveMutation,
  useTrashNoteMutation,
  useRestoreNoteMutation,
  useDeleteNotePermanentlyMutation,
} = noteApi;