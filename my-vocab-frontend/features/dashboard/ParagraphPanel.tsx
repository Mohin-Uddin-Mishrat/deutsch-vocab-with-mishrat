"use client";

import { useState } from "react";
import { useDeleteCategoryParagraphMutation, useGetParagraphCategoryQuery } from "@/redux/services/authApi";

const PAGE_SIZE = 5;

export default function ParagraphPanel({ categoryId, canDelete = false, onNotice }: { categoryId: string; canDelete?: boolean; onNotice?: (message: string) => void }) {
  const { data: category, isLoading, isError } = useGetParagraphCategoryQuery(categoryId);
  const [language, setLanguage] = useState<"german" | "bangla">("german");
  const [shownTranslations, setShownTranslations] = useState<Set<string>>(new Set());
  const [wordsDialogIndex, setWordsDialogIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteParagraph, deleteState] = useDeleteCategoryParagraphMutation();

  if (isLoading) return <p className="text-sm text-slate-500">Loading paragraphs...</p>;
  if (isError || !category) return <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Could not load this paragraph category.</p>;
  if (!category.paragraphs.length) return <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">No paragraphs have been added to this category yet.</p>;

  const totalPages = Math.ceil(category.paragraphs.length / PAGE_SIZE);
  const safePage = Math.min(currentPage, totalPages);
  const pageParagraphs = category.paragraphs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const wordsParagraph = wordsDialogIndex === null ? null : category.paragraphs[wordsDialogIndex];
  function toggleTranslation(key: string) {
    setShownTranslations((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  const pagination = totalPages > 1 && <nav aria-label="Paragraph pagination" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-xs font-medium sm:text-sm"><span className="text-slate-600">Showing <strong className="text-slate-900">{(safePage - 1) * PAGE_SIZE + 1}-{Math.min(safePage * PAGE_SIZE, category.paragraphs.length)}</strong> of <strong className="text-slate-900">{category.paragraphs.length}</strong> paragraphs</span><div className="flex items-center gap-1.5"><button type="button" disabled={safePage === 1} onClick={() => setCurrentPage(safePage - 1)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 disabled:opacity-40">Prev</button>{Array.from({ length: totalPages }, (_, index) => index + 1).filter((page) => page === 1 || page === totalPages || Math.abs(page - safePage) <= 1).map((page, index, pages) => <span key={page} className="flex items-center gap-1.5">{index > 0 && page - pages[index - 1] > 1 && <span className="text-slate-400">…</span>}<button type="button" onClick={() => setCurrentPage(page)} className={`h-8 min-w-8 rounded-lg px-2 font-bold ${page === safePage ? "bg-indigo-600 text-white" : "border border-slate-300 bg-white text-slate-700"}`}>{page}</button></span>)}<button type="button" disabled={safePage === totalPages} onClick={() => setCurrentPage(safePage + 1)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 disabled:opacity-40">Next</button></div></nav>;

  async function removeParagraph(paragraphIndex: number) {
    if (!window.confirm("Delete this paragraph permanently?")) return;
    try {
      await deleteParagraph({ categoryId, paragraphIndex }).unwrap();
      setWordsDialogIndex(null);
      onNotice?.("Paragraph deleted successfully.");
    } catch {
      onNotice?.("Could not delete the paragraph.");
    }
  }

  return <section className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div><h2 className="font-bold text-slate-900">{category.name}</h2><p className="text-xs text-slate-500">{category.paragraphs.length} paragraphs</p></div>
      <button type="button" onClick={() => setLanguage((current) => current === "german" ? "bangla" : "german")} className="rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-sm font-semibold text-indigo-800 hover:bg-indigo-100">Show {language === "german" ? "Bangla" : "German"}</button>
    </div>

    {pagination}

    {pageParagraphs.map((paragraph, pageIndex) => {
      const paragraphIndex = (safePage - 1) * PAGE_SIZE + pageIndex;
      const showUsedWords = wordsDialogIndex === paragraphIndex;
      return <article key={paragraphIndex} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3"><h3 className="font-bold text-slate-900">Paragraph {paragraphIndex + 1}</h3><div className="flex gap-2"><button type="button" onClick={() => setWordsDialogIndex(showUsedWords ? null : paragraphIndex)} className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">{showUsedWords ? "Hide used words" : "See used words"}</button>{canDelete && <button type="button" disabled={deleteState.isLoading} onClick={() => removeParagraph(paragraphIndex)} className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50">Delete</button>}</div></div>
        <div className={showUsedWords ? "relative grid gap-5 lg:grid-cols-[minmax(0,2fr)_18rem]" : undefined}>
          <div className="leading-8 text-slate-900">
            {paragraph.german.map((german, sentenceIndex) => {
              const translationKey = `${paragraphIndex}:${sentenceIndex}`;
              const primaryText = language === "german" ? german : paragraph.bangla[sentenceIndex];
              const translation = language === "german" ? paragraph.bangla[sentenceIndex] : german;
              return <span key={translationKey} className="mr-1.5">{primaryText} <button type="button" onClick={() => toggleTranslation(translationKey)} className="mx-1 inline-flex rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 align-middle text-[11px] font-semibold leading-5 text-indigo-700 hover:bg-indigo-100">{shownTranslations.has(translationKey) ? "Hide trans" : "Trans"}</button>{shownTranslations.has(translationKey) && <span className="mx-1 rounded-md bg-indigo-50 px-2 py-1 text-sm leading-6 text-indigo-950">{translation}</span>}</span>;
            })}
          </div>
          {showUsedWords && <aside className="hidden border-t border-slate-200 pt-4 lg:block lg:absolute lg:top-0 lg:bottom-0 lg:right-0 lg:w-[18rem] lg:overflow-y-auto lg:border-t-0 lg:border-l lg:pl-5 lg:pt-0"><h4 className="sticky top-0 bg-white pb-3 font-semibold text-slate-900">Used words</h4><div className="flex flex-wrap gap-x-1 gap-y-2 text-sm leading-6 text-indigo-950">{paragraph.usedWords.map((word, index) => <span key={index} className="whitespace-nowrap"><strong>{word.german}</strong><span>=</span>{word.bangla}{index < paragraph.usedWords.length - 1 && <span>, </span>}</span>)}</div></aside>}
        </div>
      </article>;
    })}

    {pagination}

    {wordsParagraph && (
      <div className="fixed inset-0 z-50 bg-slate-950/50 lg:hidden" role="dialog" aria-modal="true" aria-label="Used words" onClick={() => setWordsDialogIndex(null)}>
        <div className="fixed top-0 left-0 right-0 h-[50vh] flex flex-col bg-white p-5 shadow-xl rounded-b-2xl" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <h3 className="text-lg font-bold text-slate-900">Used words</h3>
            <button type="button" onClick={() => setWordsDialogIndex(null)} className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100">Close</button>
          </div>
          <div className="mt-4 flex-1 overflow-y-auto flex flex-wrap content-start gap-x-1.5 gap-y-2.5 text-sm leading-6 text-indigo-950">
            {wordsParagraph.usedWords.map((word, index) => (
              <span key={index} className="whitespace-nowrap">
                <strong>{word.german}</strong>
                <span>=</span>
                {word.bangla}
                {index < wordsParagraph.usedWords.length - 1 && <span>, </span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    )}

  </section>;
}
