"use client";

import { type FormEvent, useState } from "react";
import {
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useDeleteUserMutation,
  useGetUsersQuery,
  useUploadCategoryVocabularyMutation,
} from "@/redux/services/authApi";
import type { Profile } from "@/redux/features/auth/types";

type AdminView = "overview" | "categories" | "users";
type Props = { profile: Profile; onSignOut: () => void };

const messageFromError = (error: unknown) =>
  typeof error === "object" && error && "data" in error
    ? ((error as { data?: { message?: string } }).data?.message ?? "Request failed")
    : "Request failed";

export default function AdminDashboard({ profile, onSignOut }: Props) {
  const [view, setView] = useState<AdminView>("overview");
  const [notice, setNotice] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [createCategory, createState] = useCreateCategoryMutation();
  const [uploadCategoryVocabulary, uploadState] = useUploadCategoryVocabularyMutation();
  const [deleteCategory, deleteCategoryState] = useDeleteCategoryMutation();
  const [deleteUser, deleteUserState] = useDeleteUserMutation();
  const { data: users = [], isFetching: usersLoading } = useGetUsersQuery(undefined, { skip: view !== "users" });

  const categories = profile.categories.all ?? [];

  async function createCategoryHandler(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await createCategory({ name: String(form.get("name") ?? "").trim() }).unwrap();
      event.currentTarget.reset();
      setNotice("Category created.");
    } catch (error) {
      setNotice(messageFromError(error));
    }
  }

  async function uploadVocabularyHandler(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const result = await uploadCategoryVocabulary({
        categoryId: String(form.get("categoryId")),
        input: String(form.get("input") ?? ""),
      }).unwrap();
      event.currentTarget.reset();
      setNotice(`${result.created} vocabulary item(s) added; ${result.updated} updated.`);
    } catch (error) {
      setNotice(messageFromError(error));
    }
  }

  async function removeCategory(categoryId: string) {
    try {
      await deleteCategory(categoryId).unwrap();
      setNotice("Category deleted.");
    } catch (error) {
      setNotice(messageFromError(error));
    }
  }

  async function removeUser(userId: string) {
    try {
      await deleteUser(userId).unwrap();
      setNotice("User deleted.");
    } catch (error) {
      setNotice(messageFromError(error));
    }
  }

  function handleNavigate(targetView: AdminView) {
    setView(targetView);
    setMobileMenuOpen(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 max-w-full overflow-x-hidden">
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-30 bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm text-white shadow-xs">
            DL
          </div>
          <div>
            <h1 className="font-bold text-sm leading-none">Deutsch</h1>
            <span className="text-[10px] text-indigo-300">Admin Console</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex flex-col bg-slate-900/95 backdrop-blur-md p-5 pt-16">
          <div className="flex-1 space-y-2">
            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Management</p>
            <button
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                view === "overview" ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"
              }`}
              onClick={() => handleNavigate("overview")}
            >
              Overview
            </button>
            <button
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                view === "categories" ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"
              }`}
              onClick={() => handleNavigate("categories")}
            >
              Categories
            </button>
            <button
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                view === "users" ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"
              }`}
              onClick={() => handleNavigate("users")}
            >
              Users
            </button>
          </div>

          <button
            className="w-full py-3 px-4 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-red-600/20 text-sm font-semibold"
            onClick={onSignOut}
          >
            Sign out
          </button>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-slate-900 text-slate-200 min-h-screen p-5 flex-col justify-between border-r border-slate-800 shadow-lg sticky top-0 h-screen">
        <div>
          <div className="flex items-center gap-3 pb-6 mb-6 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-extrabold text-white text-base shadow-md">
              DL
            </div>
            <div>
              <strong className="block text-slate-100 text-base leading-tight">Deutsch</strong>
              <small className="text-xs text-indigo-300">Admin Console</small>
            </div>
          </div>

          <nav aria-label="Admin dashboard navigation" className="space-y-6">
            <div>
              <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Management</p>
              <div className="space-y-1">
                <button
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    view === "overview" ? "bg-indigo-600 text-white font-semibold" : "text-slate-300 hover:bg-slate-800"
                  }`}
                  onClick={() => setView("overview")}
                >
                  Overview
                </button>
                <button
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    view === "categories"
                      ? "bg-indigo-600 text-white font-semibold"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                  onClick={() => setView("categories")}
                >
                  Categories
                </button>
                <button
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    view === "users" ? "bg-indigo-600 text-white font-semibold" : "text-slate-300 hover:bg-slate-800"
                  }`}
                  onClick={() => setView("users")}
                >
                  Users
                </button>
              </div>
            </div>
          </nav>
        </div>

        <button
          className="w-full py-2.5 px-4 rounded-xl border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-semibold transition-all flex items-center justify-center gap-2"
          onClick={onSignOut}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span>Sign out</span>
        </button>
      </aside>

      {/* Content Area */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full min-w-0">
        <header className="flex items-center justify-between gap-4 mb-6 md:mb-8 pb-4 border-b border-slate-200/80">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Administrator Dashboard</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              {view === "overview" ? "Overview" : view === "categories" ? "Category Management" : "User Management"}
            </h1>
          </div>

          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-indigo-600 text-white font-extrabold text-base sm:text-lg flex items-center justify-center shadow-md flex-shrink-0">
            {(profile?.account?.name || profile?.account?.email || "Admin").slice(0, 1).toUpperCase()}
          </div>
        </header>

        {notice && (
          <div
            className="mb-6 p-4 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-900 text-sm font-medium flex items-center justify-between"
            role="status"
          >
            <span>{notice}</span>
            <button
              type="button"
              className="text-cyan-700 hover:text-cyan-950 font-bold ml-4"
              onClick={() => setNotice(null)}
            >
              ✕
            </button>
          </div>
        )}

        {view === "overview" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col gap-1">
              <strong className="text-3xl font-extrabold text-indigo-600">{categories.length}</strong>
              <span className="text-sm text-slate-600 font-medium">All categories</span>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col gap-1">
              <strong className="text-3xl font-extrabold text-emerald-600">{(profile?.account?.learned ?? []).length}</strong>
              <span className="text-sm text-slate-600 font-medium">My learned words</span>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col gap-1">
              <strong className="text-3xl font-extrabold text-amber-600">{(profile?.account?.pending ?? []).length}</strong>
              <span className="text-sm text-slate-600 font-medium">My pending words</span>
            </div>
          </div>
        )}

        {view === "categories" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <article className="p-5 md:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Create a Category</h2>
              <form className="space-y-4" onSubmit={createCategoryHandler}>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Category Name
                  </label>
                  <input
                    name="name"
                    required
                    placeholder="e.g. A1 verbs"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <button
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-xs disabled:opacity-50"
                  disabled={createState.isLoading}
                >
                  {createState.isLoading ? "Creating..." : "Create category"}
                </button>
              </form>
            </article>

            <article className="p-5 md:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Upload Vocabulary</h2>
              <form className="space-y-4" onSubmit={uploadVocabularyHandler}>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    name="categoryId"
                    required
                    defaultValue=""
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                  >
                    <option value="" disabled>
                      Select a category
                    </option>
                    {categories.map((category) => (
                      <option value={category._id} key={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Vocabulary Input
                  </label>
                  <textarea
                    name="input"
                    required
                    placeholder="বাংলা = German1 + German2 <Example sentence> |"
                    rows={4}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <button
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-xs disabled:opacity-50"
                  disabled={uploadState.isLoading}
                >
                  {uploadState.isLoading ? "Uploading..." : "Upload vocabulary"}
                </button>
              </form>
            </article>

            <article className="lg:col-span-2 p-5 md:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">All Categories</h2>
              {categories.length ? (
                <div className="divide-y divide-slate-100">
                  {categories.map((category) => (
                    <div className="py-3 flex items-center justify-between gap-4" key={category._id}>
                      <div>
                        <strong className="block text-sm font-semibold text-slate-900">{category.name}</strong>
                        <small className="text-xs text-slate-500">{category.vocabularies.length} items</small>
                      </div>
                      <button
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
                        disabled={deleteCategoryState.isLoading}
                        onClick={() => removeCategory(category._id)}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-6">No categories created yet.</p>
              )}
            </article>
          </div>
        )}

        {view === "users" && (
          <section className="p-5 md:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">All Users</h2>
            {usersLoading ? (
              <p className="text-sm text-slate-500">Loading users…</p>
            ) : users.length ? (
              <div className="divide-y divide-slate-100">
                {users.map((user) => (
                  <div className="py-3 flex items-center justify-between gap-4" key={user._id}>
                    <div>
                      <strong className="block text-sm font-semibold text-slate-900">{user.name}</strong>
                      <small className="text-xs text-slate-500">
                        {user.email} · {user.accountStatus}
                      </small>
                    </div>
                    <button
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
                      disabled={deleteUserState.isLoading}
                      onClick={() => removeUser(user._id)}
                    >
                      Delete user
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-6">There are no active user accounts.</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
