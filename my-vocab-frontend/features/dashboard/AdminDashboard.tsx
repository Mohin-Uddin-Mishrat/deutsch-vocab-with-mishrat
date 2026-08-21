"use client";

import { type FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useDeleteUserMutation,
  useGetUsersQuery,
  useUploadCategoryVocabularyMutation,
} from "@/redux/services/authApi";
import type { Profile } from "@/redux/features/auth/types";
import AdminVocabularyPanel from "./AdminVocabularyPanel";
import AdminParagraphManager from "./AdminParagraphManager";

type AdminView = "overview" | "categories" | "paragraphs" | "users" | `category:${string}`;
type Props = { profile: Profile; onSignOut: () => void };

const messageFromError = (error: unknown) =>
  typeof error === "object" && error && "data" in error
    ? ((error as { data?: { message?: string } }).data?.message ?? "Request failed")
    : "Request failed";

const formatVocabularyActivity = (date?: string) =>
  date
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(date))
    : "No activity yet";

export default function AdminDashboard({ profile, onSignOut }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const view: AdminView = pathname === "/admin/users"
    ? "users"
    : pathname === "/admin/paragraphs"
      ? "paragraphs"
    : pathname === "/admin/categories"
      ? "categories"
      : pathname.startsWith("/admin/categories/")
        ? `category:${pathname.slice("/admin/categories/".length)}`
        : "overview";
  const [notice, setNotice] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");

  useEffect(() => {
    if (!successToast) return;
    const timeout = window.setTimeout(() => setSuccessToast(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [successToast]);

  const [createCategory, createState] = useCreateCategoryMutation();
  const [uploadCategoryVocabulary, uploadState] = useUploadCategoryVocabularyMutation();
  const [deleteCategory, deleteCategoryState] = useDeleteCategoryMutation();
  const [deleteUser, deleteUserState] = useDeleteUserMutation();
  const { data: users = [], isFetching: usersLoading } = useGetUsersQuery(undefined, { skip: view !== "users" });

  const categories = profile.categories.all ?? [];
  const selectedCategoryId = view.startsWith("category:") ? view.slice("category:".length) : null;
  const selectedCategory = categories.find((category) => category._id === selectedCategoryId);
  const filteredCategories = categories.filter((category) => category.name.toLowerCase().includes(categorySearchQuery.toLowerCase().trim()));

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
    const path = targetView === "overview"
      ? "/admin"
      : targetView === "categories"
        ? "/admin/categories"
        : targetView === "paragraphs"
          ? "/admin/paragraphs"
        : targetView === "users"
          ? "/admin/users"
          : `/admin/categories/${targetView.slice("category:".length)}`;
    router.push(path);
    setMobileMenuOpen(false);
  }

  const categoryLinks = (mobile = false) => (
    <div className={mobile ? "mt-6" : "mt-6"}>
      <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Vocabularies <span className="float-right rounded bg-slate-700 px-1.5">{categories.length}</span></p>
      <input value={categorySearchQuery} onChange={(event) => setCategorySearchQuery(event.target.value)} placeholder="Filter categories..." className="w-full mb-2 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 bg-slate-800 border border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500" />
      <div className="space-y-1 max-h-64 overflow-y-auto pr-1">{filteredCategories.map((category) => <button key={category._id} onClick={() => handleNavigate(`category:${category._id}`)} className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${selectedCategoryId === category._id ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"}`}><span className="truncate">{category.name}</span><span className="ml-2 rounded bg-slate-700/70 px-1.5 py-0.5 text-[10px]">{category.vocabularies.length}</span></button>)}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 max-w-full overflow-x-hidden">
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-30 bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <Image src="/asset/logo.jpg" alt="Deutsch logo" width={32} height={32} className="h-8 w-8 rounded-full object-cover shadow-xs" />
          <div>
            <h1 className="font-bold text-sm leading-none">Deutsch</h1>
            <span className="text-[10px] text-indigo-300">Learning With Mishrat</span>
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
            <button className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${view === "paragraphs" ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"}`} onClick={() => handleNavigate("paragraphs")}>Paragraphs</button>
            <button
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                view === "users" ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"
              }`}
              onClick={() => handleNavigate("users")}
            >
              Users
            </button>
            {categoryLinks(true)}
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
            <Image src="/asset/logo.jpg" alt="Deutsch logo" width={40} height={40} className="h-10 w-10 rounded-xl object-cover shadow-md" />
            <div>
              <strong className="block text-slate-100 text-base leading-tight">Deutsch</strong>
              <small className="text-xs text-indigo-300">Learning With Mishrat</small>
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
                  onClick={() => handleNavigate("overview")}
                >
                  Overview
                </button>
                <button
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    view === "categories"
                      ? "bg-indigo-600 text-white font-semibold"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                  onClick={() => handleNavigate("categories")}
                >
                  Categories
                </button>
                <button className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${view === "paragraphs" ? "bg-indigo-600 text-white font-semibold" : "text-slate-300 hover:bg-slate-800"}`} onClick={() => handleNavigate("paragraphs")}>Paragraphs</button>
                <button
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    view === "users" ? "bg-indigo-600 text-white font-semibold" : "text-slate-300 hover:bg-slate-800"
                  }`}
                  onClick={() => handleNavigate("users")}
                >
                  Users
                </button>
              </div>
              {categoryLinks()}
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
              {view === "overview" ? "Overview" : view === "categories" ? "Category Management" : view === "paragraphs" ? "Paragraph Management" : view === "users" ? "User Management" : selectedCategory?.name ?? "Vocabulary"}
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

        {view === "paragraphs" && <AdminParagraphManager onNotice={setNotice} onSuccess={setSuccessToast} />}

        {selectedCategory && <AdminVocabularyPanel key={selectedCategory._id} category={selectedCategory} onNotice={setNotice} />}

        {view === "users" && (
          <section className="p-5 md:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">All Users</h2>
            {usersLoading ? (
              <p className="text-sm text-slate-500">Loading users…</p>
            ) : users.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left">
                  <thead className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th scope="col" className="px-3 py-3">User</th>
                      <th scope="col" className="px-3 py-3">Status</th>
                      <th scope="col" className="px-3 py-3 text-center">Learned</th>
                      <th scope="col" className="px-3 py-3 text-center">Pending</th>
                      <th scope="col" className="px-3 py-3">Last activity</th>
                      <th scope="col" className="px-3 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((user) => (
                      <tr key={user._id} className="hover:bg-slate-50/70">
                        <td className="px-3 py-3">
                          <strong className="block text-sm font-semibold text-slate-900">{user.name}</strong>
                          <small className="text-xs text-slate-500">{user.email}</small>
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-600">{user.accountStatus}</td>
                        <td className="px-3 py-3 text-center">
                          <span className="inline-flex min-w-8 justify-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                            {user.learnedVocabularyCount}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="inline-flex min-w-8 justify-center rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
                            {user.pendingVocabularyCount}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="block text-sm text-slate-700">{formatVocabularyActivity(user.lastVocabularyActivityAt)}</span>
                          {user.lastVocabularyActivityType && (
                            <span className="text-xs text-slate-500">
                              Added to {user.lastVocabularyActivityType === "LEARNED" ? "learned" : "today's task"}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
                            disabled={deleteUserState.isLoading}
                            onClick={() => removeUser(user._id)}
                          >
                            Delete user
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-6">There are no active user accounts.</p>
            )}
          </section>
        )}
      </main>
      {successToast && <div role="status" className="fixed right-5 top-5 z-50 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 shadow-lg"><span>{successToast}</span><button type="button" onClick={() => setSuccessToast(null)} className="text-emerald-700 hover:text-emerald-950" aria-label="Dismiss success message">×</button></div>}
    </div>
  );
}
