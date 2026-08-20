import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/redux/store";
import { setCredentials } from "@/redux/features/auth/authSlice";
import type { AdminUser, ApiResponse, AuthCredentials, Category, Exam, ExamHistory, LoginPayload, Profile, RegisterPayload } from "@/redux/features/auth/types";

const baseQuery = fetchBaseQuery({ baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api", prepareHeaders: (headers, { getState }) => { const token = (getState() as RootState).auth.accessToken; if (token) headers.set("authorization", `Bearer ${token}`); return headers; } });
export const authApi = createApi({
  reducerPath: "authApi", baseQuery, tagTypes: ["Profile", "Users", "Progress"], endpoints: (builder) => ({
    register: builder.mutation<AuthCredentials, RegisterPayload>({ query: (body) => ({ url: "/auth/register", method: "POST", body }), transformResponse: (response: ApiResponse<AuthCredentials>) => response.data, async onQueryStarted(_payload, { dispatch, queryFulfilled }) { const { data } = await queryFulfilled; dispatch(setCredentials(data)); } }),
    login: builder.mutation<AuthCredentials, LoginPayload>({ query: (body) => ({ url: "/auth/login", method: "POST", body }), transformResponse: (response: ApiResponse<AuthCredentials>) => response.data, async onQueryStarted(_payload, { dispatch, queryFulfilled }) { const { data } = await queryFulfilled; dispatch(setCredentials(data)); } }),
    getMe: builder.query<Profile, void>({ query: () => "/auth/me", transformResponse: (response: ApiResponse<Profile>) => response.data, providesTags: ["Profile"] }),
    getProgress: builder.query<{ date: string; count: number }[], { range: "week" | "month" | "3month" | "6month" }>({
      query: ({ range }) => `/progress?range=${range}`,
      transformResponse: (response: ApiResponse<{ date: string; count: number }[]>) => response.data,
      providesTags: ["Progress"],
    }),
    uploadPersonalVocabulary: builder.mutation<{ processed: number; created: number; updated: number }, { listType: "learned" | "pending"; input: string }>({
      query: ({ listType, input }) => ({ url: `/auth/vocabularies/${listType}`, method: "POST", body: { input } }),
      transformResponse: (response: ApiResponse<{ processed: number; created: number; updated: number }>) => response.data,
      invalidatesTags: ["Profile", "Progress"],
    }),
    deletePersonalVocabulary: builder.mutation<{ deleted: string; listType: "learned" | "pending" }, { listType: "learned" | "pending"; bangla: string }>({
      query: ({ listType, bangla }) => ({ url: `/auth/vocabularies/${listType}`, method: "DELETE", body: { bangla } }),
      transformResponse: (response: ApiResponse<{ deleted: string; listType: "learned" | "pending" }>) => response.data,
      invalidatesTags: ["Profile"],
    }),
    deletePersonalVocabularies: builder.mutation<{ deleted: number; listType: "learned" | "pending" }, { listType: "learned" | "pending"; bangla: string[] }>({
      query: ({ listType, bangla }) => ({ url: `/auth/vocabularies/${listType}/bulk`, method: "DELETE", body: { bangla } }),
      transformResponse: (response: ApiResponse<{ deleted: number; listType: "learned" | "pending" }>) => response.data,
      invalidatesTags: ["Profile"],
    }),
    startExam: builder.mutation<{ examId: string; questions: { bangla: string }[]; total: number }, void>({
      query: () => ({ url: "/auth/exams", method: "POST" }),
      transformResponse: (response: ApiResponse<{ examId: string; questions: { bangla: string }[]; total: number }>) => response.data,
    }),
    getExam: builder.query<Exam, string>({
      query: (examId) => `/auth/exams/${examId}`,
      transformResponse: (response: ApiResponse<Exam>) => response.data,
      providesTags: ["Profile"],
    }),
    submitExam: builder.mutation<Exam, { examId: string; answers: { bangla: string; answer: string }[] }>({
      query: ({ examId, answers }) => ({ url: `/auth/exams/${examId}/submit`, method: "POST", body: { answers } }),
      transformResponse: (response: ApiResponse<Exam>) => response.data,
      invalidatesTags: ["Profile", "Progress"],
    }),
    getExamHistory: builder.query<ExamHistory[], void>({
      query: () => "/auth/exams",
      transformResponse: (response: ApiResponse<ExamHistory[]>) => response.data,
      providesTags: ["Profile"],
    }),
    createCategory: builder.mutation<Category, { name: string }>({
      query: (body) => ({ url: "/vocabulary/categories", method: "POST", body }),
      transformResponse: (response: ApiResponse<Category>) => response.data,
      invalidatesTags: ["Profile"],
    }),
    uploadCategoryVocabulary: builder.mutation<{ processed: number; created: number; updated: number }, { categoryId: string; input: string }>({
      query: ({ categoryId, input }) => ({ url: `/vocabulary/categories/${categoryId}/vocabularies`, method: "POST", body: { input } }),
      transformResponse: (response: ApiResponse<{ processed: number; created: number; updated: number }>) => response.data,
      invalidatesTags: ["Profile"],
    }),
    updateCategoryVocabularyBangla: builder.mutation<Category, { categoryId: string; vocabularyIndex: number; bangla: string }>({
      query: ({ categoryId, vocabularyIndex, bangla }) => ({
        url: `/vocabulary/categories/${categoryId}/vocabularies/${vocabularyIndex}`,
        method: "PATCH",
        body: { bangla },
      }),
      transformResponse: (response: ApiResponse<Category>) => response.data,
      invalidatesTags: ["Profile"],
    }),
    updateCategoryVocabularyBanglaBulk: builder.mutation<Category, { categoryId: string; updates: { vocabularyIndex: number; bangla: string }[] }>({
      query: ({ categoryId, updates }) => ({
        url: `/vocabulary/categories/${categoryId}/vocabularies/bulk`,
        method: "PATCH",
        body: { updates },
      }),
      transformResponse: (response: ApiResponse<Category>) => response.data,
      invalidatesTags: ["Profile"],
    }),
    deleteCategory: builder.mutation<null, string>({
      query: (categoryId) => ({ url: `/vocabulary/categories/${categoryId}`, method: "DELETE" }),
      transformResponse: (response: ApiResponse<null>) => response.data,
      invalidatesTags: ["Profile"],
    }),
    getUsers: builder.query<AdminUser[], void>({
      query: () => "/auth/users",
      transformResponse: (response: ApiResponse<AdminUser[]>) => response.data,
      providesTags: ["Users"],
    }),
    deleteUser: builder.mutation<{ deletedUserId: string }, string>({
      query: (userId) => ({ url: `/auth/users/${userId}`, method: "DELETE" }),
      transformResponse: (response: ApiResponse<{ deletedUserId: string }>) => response.data,
      invalidatesTags: ["Users"],
    }),
  })
});
export const { useGetMeQuery, useLoginMutation, useRegisterMutation, useUploadPersonalVocabularyMutation, useDeletePersonalVocabularyMutation, useDeletePersonalVocabulariesMutation, useStartExamMutation, useGetExamQuery, useSubmitExamMutation, useGetExamHistoryQuery, useCreateCategoryMutation, useUploadCategoryVocabularyMutation, useUpdateCategoryVocabularyBanglaMutation, useUpdateCategoryVocabularyBanglaBulkMutation, useDeleteCategoryMutation, useGetUsersQuery, useDeleteUserMutation, useGetProgressQuery } = authApi;
