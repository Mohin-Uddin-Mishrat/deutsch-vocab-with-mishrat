"use client";

import { type FormEvent, useState } from "react";
import { useCreateParagraphCategoryMutation, useGetParagraphCategoriesQuery, useUploadCategoryParagraphMutation } from "@/redux/services/authApi";
import ParagraphPanel from "./ParagraphPanel";

const errorMessage = (error: unknown) => typeof error === "object" && error && "data" in error ? ((error as { data?: { message?: string } }).data?.message ?? "Request failed") : "Request failed";

export default function AdminParagraphManager({ onNotice, onSuccess }: { onNotice: (message: string) => void; onSuccess: (message: string) => void }) {
  const { data: categories = [] } = useGetParagraphCategoriesQuery();
  const [createCategory, createState] = useCreateParagraphCategoryMutation();
  const [uploadParagraph, uploadState] = useUploadCategoryParagraphMutation();
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  async function createCategoryHandler(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try { await createCategory({ name: String(form.get("name") ?? "").trim() }).unwrap(); event.currentTarget.reset(); onSuccess("Paragraph category created successfully."); }
    catch (error) { onNotice(errorMessage(error)); }
  }

  async function uploadHandler(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try { await uploadParagraph({ categoryId: String(form.get("categoryId")), input: String(form.get("input") ?? "") }).unwrap(); event.currentTarget.reset(); onSuccess("Paragraph uploaded successfully."); }
    catch (error) { onNotice(errorMessage(error)); }
  }

  return <div className="space-y-6"><div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-bold">Create Paragraph Category</h2><form className="space-y-4" onSubmit={createCategoryHandler}><input name="name" required placeholder="e.g. A1 reading" className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500" /><button disabled={createState.isLoading} className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{createState.isLoading ? "Creating..." : "Create category"}</button></form></article>
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-bold">Upload Paragraph</h2><form className="space-y-4" onSubmit={uploadHandler}><select name="categoryId" required value={selectedCategoryId} onChange={(event) => setSelectedCategoryId(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm"><option value="" disabled>Select a category</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select><textarea name="input" required rows={8} placeholder={"German paragraph\n<>\nBangla paragraph\n<>\nGerman = Bangla,"} className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500" /><button disabled={uploadState.isLoading || !categories.length} className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{uploadState.isLoading ? "Uploading..." : "Upload paragraph"}</button></form></article>
  </div><section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><h2 className="mb-3 text-lg font-bold">View Paragraph Categories</h2><div className="flex flex-wrap gap-2">{categories.map((category) => <button type="button" key={category._id} onClick={() => setSelectedCategoryId(category._id)} className={`rounded-lg px-3 py-2 text-sm font-semibold ${selectedCategoryId === category._id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>{category.name}</button>)}</div></section>{selectedCategoryId && <ParagraphPanel categoryId={selectedCategoryId} canDelete onNotice={onSuccess} />}</div>;
}
