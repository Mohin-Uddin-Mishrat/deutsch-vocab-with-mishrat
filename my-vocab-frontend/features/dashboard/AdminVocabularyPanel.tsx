"use client";

import { useEffect, useMemo, useState } from "react";
import { useUpdateCategoryVocabularyBanglaMutation, useUploadPersonalVocabularyMutation } from "@/redux/services/authApi";
import type { Category } from "@/redux/features/auth/types";

type Props = { category: Category; onNotice: (message: string) => void };

const errorMessage = (error: unknown) =>
  typeof error === "object" && error && "data" in error
    ? ((error as { data?: { message?: string } }).data?.message ?? "Request failed")
    : "Request failed";

export default function AdminVocabularyPanel({ category, onNotice }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [shownSentences, setShownSentences] = useState<Set<number>>(new Set());
  const [hideBangla, setHideBangla] = useState(false);
  const [hideGerman, setHideGerman] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSentences, setSearchSentences] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [banglaDraft, setBanglaDraft] = useState("");
  const [uploadPersonalVocabulary, uploadState] = useUploadPersonalVocabularyMutation();
  const [updateBangla, updateState] = useUpdateCategoryVocabularyBanglaMutation();
  const pageSize = 60;

  useEffect(() => {
    setCurrentPage(1);
    setSelected(new Set());
    setEditingIndex(null);
  }, [category._id, searchQuery]);

  const filteredWords = useMemo(
    () => category.vocabularies
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        const query = searchQuery.toLowerCase().trim();
        return !query || item.bangla.toLowerCase().includes(query) || item.german.some((word) => word.toLowerCase().includes(query)) ||
          (searchSentences && Boolean(item.sentence?.toLowerCase().includes(query)));
      }),
    [category.vocabularies, searchQuery, searchSentences]
  );
  const totalPages = Math.max(1, Math.ceil(filteredWords.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageWords = filteredWords.slice((safePage - 1) * pageSize, safePage * pageSize);
  const allSelected = filteredWords.length > 0 && filteredWords.every(({ index }) => selected.has(index));

  function toggleSelection(index: number) {
    setSelected((current) => {
      const next = new Set(current);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }

  async function addToTodayTask() {
    const input = category.vocabularies
      .filter((_item, index) => selected.has(index))
      .map((item) => `${item.bangla} = ${item.german.join(" + ")}${item.sentence ? ` <${item.sentence}>` : ""}`)
      .join(" |\n");
    try {
      const result = await uploadPersonalVocabulary({ listType: "pending", input }).unwrap();
      setSelected(new Set());
      onNotice(`${result.created} vocabulary item(s) added to today's task.`);
    } catch (error) {
      onNotice(errorMessage(error));
    }
  }

  async function saveBangla(index: number) {
    const bangla = banglaDraft.trim();
    if (!bangla) return onNotice("Bangla meaning is required.");
    try {
      await updateBangla({ categoryId: category._id, vocabularyIndex: index, bangla }).unwrap();
      setEditingIndex(null);
      onNotice("Bangla meaning updated.");
    } catch (error) {
      onNotice(errorMessage(error));
    }
  }

  return (
    <section className="p-4 sm:p-5 md:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-slate-800">{category.name}</h2>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">{searchQuery ? `${filteredWords.length} of ${category.vocabularies.length}` : category.vocabularies.length} vocabulary items</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 px-3 py-1.5 text-xs md:text-sm font-medium rounded-lg border bg-slate-50 text-slate-700 border-slate-200 cursor-pointer">
            <input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(filteredWords.map(({ index }) => index)))} className="w-4 h-4 accent-indigo-600" /> Select all
          </label>
          <button type="button" onClick={() => setHideGerman(!hideGerman)} className="px-3 py-1.5 text-xs md:text-sm rounded-lg border bg-slate-50 border-slate-200">{hideGerman ? "Show" : "Hide"} Deutsch</button>
          <button type="button" onClick={() => setHideBangla(!hideBangla)} className="px-3 py-1.5 text-xs md:text-sm rounded-lg border bg-slate-50 border-slate-200">{hideBangla ? "Show" : "Hide"} বাংলা</button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={`Search in ${category.name} (German or Bangla)...`} className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500" />
        <label className="inline-flex items-center gap-2 px-3 py-2.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"><input type="checkbox" checked={searchSentences} onChange={(event) => setSearchSentences(event.target.checked)} className="accent-indigo-600" /> Include sentences</label>
      </div>

      {selected.size > 0 && <div className="mt-4 p-3 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-between gap-3"><span className="text-xs md:text-sm font-semibold">{selected.size} item(s) selected</span><button type="button" disabled={uploadState.isLoading} onClick={addToTodayTask} className="px-3.5 py-1.5 text-xs md:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg">{uploadState.isLoading ? "Adding..." : "Add to today task"}</button></div>}

      <div className="mt-4 flex items-center justify-between gap-3 p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs md:text-sm"><span>Showing <strong>{filteredWords.length ? (safePage - 1) * pageSize + 1 : 0}–{Math.min(safePage * pageSize, filteredWords.length)}</strong> of <strong>{filteredWords.length}</strong> items</span><div className="flex gap-2"><button type="button" disabled={safePage === 1} onClick={() => setCurrentPage(safePage - 1)} className="px-3 py-1.5 bg-white border rounded-lg disabled:opacity-40">← Prev</button><span className="px-2 py-1.5">{safePage} / {totalPages}</span><button type="button" disabled={safePage === totalPages} onClick={() => setCurrentPage(safePage + 1)} className="px-3 py-1.5 bg-white border rounded-lg disabled:opacity-40">Next →</button></div></div>

      {filteredWords.length === 0 ? <p className="mt-4 p-6 text-center text-sm text-slate-500 bg-slate-50 rounded-xl">No vocabulary items match your search.</p> : <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 mt-4">{pageWords.map(({ item, index }) => {
        const showSentence = shownSentences.has(index);
        const isEditing = editingIndex === index;
        return <article key={index} className="p-3.5 md:p-4 rounded-xl bg-white border border-slate-200/90 hover:border-indigo-200 transition-all">
          <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2.5 min-w-0 flex-1 flex-wrap"><input type="checkbox" checked={selected.has(index)} onChange={() => toggleSelection(index)} className="w-4 h-4 accent-indigo-600" /> {!hideGerman && <strong className="text-sm md:text-base break-words">{item.german.join(", ")}</strong>} {!hideBangla && !isEditing && <span className="text-xs md:text-sm text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md break-words">{item.bangla}</span>}</div><div className="flex gap-1.5 flex-shrink-0"><button type="button" onClick={() => { setEditingIndex(isEditing ? null : index); setBanglaDraft(item.bangla); }} className="px-2.5 py-1 text-xs font-semibold rounded-lg border bg-slate-100 hover:bg-indigo-50">{isEditing ? "Cancel" : "Edit বাংলা"}</button><button type="button" onClick={() => setShownSentences((current) => { const next = new Set(current); showSentence ? next.delete(index) : next.add(index); return next; })} className="px-2.5 py-1 text-xs font-semibold rounded-lg border bg-slate-100 hover:bg-indigo-50">{showSentence ? "Hide" : "Sentence"}</button></div></div>
          {isEditing && <form className="mt-3 flex gap-2" onSubmit={(event) => { event.preventDefault(); saveBangla(index); }}><input autoFocus value={banglaDraft} onChange={(event) => setBanglaDraft(event.target.value)} aria-label="Bangla meaning" className="min-w-0 flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500" /><button type="submit" disabled={updateState.isLoading} className="px-3 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg disabled:opacity-50">{updateState.isLoading ? "Saving..." : "Save"}</button></form>}
          {showSentence && <div className="mt-3 p-2.5 rounded-lg bg-indigo-50 border border-indigo-100 text-xs md:text-sm text-indigo-950 italic">{item.sentence || item.german.join(", ")}</div>}
        </article>;
      })}</div>}
    </section>
  );
}
