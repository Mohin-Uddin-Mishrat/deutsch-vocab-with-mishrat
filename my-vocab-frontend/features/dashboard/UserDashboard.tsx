"use client";

import { useEffect, useState } from "react";
import { useDeletePersonalVocabularyMutation, useUploadPersonalVocabularyMutation } from "@/redux/services/authApi";
import type { Category, PersonalVocabulary, Profile } from "@/redux/features/auth/types";
import VocabularyGraph from "./VocabularyGraph";

type View = "profile" | "learned" | "pending" | `category:${string}`;
type Props = { profile: Profile; onSignOut: () => void };

const vocabularyKey = (categoryId: string, index: number) => `${categoryId}:${index}`;

function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl mt-4 text-xs md:text-sm font-medium">
      <div className="text-slate-600">
        Showing <span className="font-bold text-slate-900">{startItem}–{endItem}</span> of{" "}
        <span className="font-bold text-slate-900">{totalItems}</span> items (Page {currentPage} of {totalPages})
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 font-semibold transition-all shadow-2xs"
        >
          ← Prev
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
          .map((p, idx, arr) => {
            const prevPage = arr[idx - 1];
            const showEllipsis = prevPage && p - prevPage > 1;
            return (
              <span key={p} className="flex items-center gap-1">
                {showEllipsis && <span className="text-slate-400 font-bold px-1">...</span>}
                <button
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${
                    currentPage === p
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {p}
                </button>
              </span>
            );
          })}

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 font-semibold transition-all shadow-2xs"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

function PersonalVocabularyPanel({ items, listType }: { items: PersonalVocabulary[]; listType: "learned" | "pending" }) {
  const [deletePersonalVocabulary, deleteState] = useDeletePersonalVocabularyMutation();
  const [uploadPersonalVocabulary, uploadState] = useUploadPersonalVocabularyMutation();
  const [hideBangla, setHideBangla] = useState(false);
  const [hideGerman, setHideGerman] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [shownSentences, setShownSentences] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSentences, setSearchSentences] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 60;
  const displayListType = listType === "pending" ? "today task" : listType;
  const canDelete = listType === "learned";
  const canMove = listType === "pending";

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, listType]);

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const banglaMatch = item.bangla.toLowerCase().includes(q);
    const englishMatch = item.english.some((eng) => eng.toLowerCase().includes(q));
    const sentenceMatch = searchSentences && item.sentence ? item.sentence.toLowerCase().includes(q) : false;
    return banglaMatch || englishMatch || sentenceMatch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedItems = filteredItems.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const allSelected =
    filteredItems.length > 0 && filteredItems.every((_item, index) => selected.has(`item:${index}`));

  function toggleItem(index: number) {
    const key = `item:${index}`;
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleAll() {
    setSelected(() => (allSelected ? new Set() : new Set(filteredItems.map((_item, index) => `item:${index}`))));
  }

  async function moveToLearned() {
    const selectedItems = items.filter((_item, index) => selected.has(`item:${index}`));
    const input = selectedItems
      .map((item) => `${item.bangla} = ${item.english.join(" + ")}${item.sentence ? ` <${item.sentence}>` : ""}`)
      .join(" | \n");
    await uploadPersonalVocabulary({ listType: "learned", input }).unwrap();
    setSelected(new Set());
  }

  if (!items.length) {
    return (
      <section className="p-5 md:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        <h2 className="text-lg md:text-xl font-bold text-slate-800 capitalize">My {displayListType} vocabulary</h2>
        <p className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 text-sm text-center">
          There are no {displayListType} vocabulary items saved yet.
        </p>
      </section>
    );
  }

  return (
    <section className="p-4 sm:p-5 md:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-slate-800 capitalize">My {displayListType} vocabulary</h2>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            {searchQuery ? `${filteredItems.length} of ${items.length} vocabulary items` : `${items.length} saved vocabulary items`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {canMove && filteredItems.length > 0 && (
            <label className="inline-flex items-center gap-2 text-xs md:text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer select-none bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 accent-indigo-600"
              />
              <span>Select all</span>
            </label>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-medium rounded-lg border transition-all ${
                hideGerman
                  ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
              onClick={() => setHideGerman(!hideGerman)}
              title="Toggle German translations visibility"
            >
              <span>{hideGerman ? "🙈" : "👁️"}</span>
              <span>Deutsch</span>
            </button>

            <button
              type="button"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-medium rounded-lg border transition-all ${
                hideBangla
                  ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
              onClick={() => setHideBangla(!hideBangla)}
              title="Toggle Bangla translations visibility"
            >
              <span>{hideBangla ? "🙈" : "👁️"}</span>
              <span>বাংলা</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${displayListType} vocabulary (German or Bangla)...`}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer select-none bg-slate-50 hover:bg-slate-100 px-3 py-2.5 rounded-xl border border-slate-200 transition-colors flex-shrink-0">
          <input
            type="checkbox"
            checked={searchSentences}
            onChange={(e) => setSearchSentences(e.target.checked)}
            className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 accent-indigo-600"
          />
          <span>Include sentences</span>
        </label>
      </div>

      {/* Bulk action banner */}
      {selected.size > 0 && canMove && (
        <div className="mt-4 p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-950 flex items-center justify-between flex-wrap gap-3">
          <span className="text-xs md:text-sm font-semibold">{selected.size} item(s) selected</span>
          <button
            type="button"
            disabled={uploadState.isLoading}
            onClick={() => moveToLearned()}
            className="px-3.5 py-1.5 text-xs md:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors"
          >
            {uploadState.isLoading ? "Moving..." : "Move to learned"}
          </button>
        </div>
      )}

      {/* Pagination at the TOP of the page */}
      <PaginationControls
        currentPage={safePage}
        totalPages={totalPages}
        totalItems={filteredItems.length}
        pageSize={PAGE_SIZE}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {/* Empty Search Result */}
      {filteredItems.length === 0 ? (
        <div className="mt-4 p-6 rounded-xl bg-slate-50 border border-slate-100 text-center">
          <p className="text-slate-600 text-sm font-medium">
            No {displayListType} vocabulary items found matching &quot;<span className="font-semibold text-slate-900">{searchQuery}</span>&quot;.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        /* Responsive Grid list of items */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 mt-4">
          {paginatedItems.map((item, pageIdx) => {
            const realIndex = (safePage - 1) * PAGE_SIZE + pageIdx;
            const key = `item:${realIndex}`;
            const showSentence = shownSentences.has(key);

            return (
              <article
                key={`${item.bangla}-${realIndex}`}
                className="p-3.5 md:p-4 rounded-xl bg-white border border-slate-200/90 hover:border-indigo-200 hover:shadow-xs transition-all flex flex-col justify-between gap-2.5"
              >
                <div className="flex items-center justify-between gap-3 min-w-0">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 flex-wrap">
                    {canMove && (
                      <input
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer accent-indigo-600 flex-shrink-0"
                        type="checkbox"
                        checked={selected.has(key)}
                        onChange={() => toggleItem(realIndex)}
                        aria-label={`Select ${item.english.join(", ")}`}
                      />
                    )}

                    {!hideGerman && (
                      <strong className="font-semibold text-slate-900 text-sm md:text-base break-words">
                        {item.english.join(", ")}
                      </strong>
                    )}

                    {!hideBangla && (
                      <span className="text-xs md:text-sm text-slate-600 font-medium break-words bg-slate-100/90 px-2 py-0.5 rounded-md">
                        {item.bangla}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {canDelete && (
                      <button
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/90 active:bg-red-200 rounded-lg transition-all border border-red-200/80 shadow-2xs group flex-shrink-0"
                        type="button"
                        title="Delete vocabulary"
                        disabled={deleteState.isLoading}
                        onClick={() => deletePersonalVocabulary({ listType, bangla: item.bangla })}
                      >
                        <svg
                          className="w-3.5 h-3.5 transition-transform group-hover:scale-110"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        <span>Delete</span>
                      </button>
                    )}

                    <button
                      type="button"
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all border ${
                        showSentence
                          ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                          : "bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border-slate-200"
                      }`}
                      onClick={() =>
                        setShownSentences((current) => {
                          const next = new Set(current);
                          if (showSentence) next.delete(key);
                          else next.add(key);
                          return next;
                        })
                      }
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                        />
                      </svg>
                      <span>{showSentence ? "Hide sentence" : "Sentence"}</span>
                    </button>
                  </div>
                </div>

                {/* Show related German sentence (never fallback to Bangla) */}
                {showSentence && (
                  <div className="w-full mt-1 p-2.5 rounded-lg bg-indigo-50/80 border border-indigo-100 text-xs md:text-sm text-indigo-950 italic flex items-start gap-2">
                    <span className="font-semibold text-indigo-500 not-italic select-none">💬</span>
                    <span className="break-words flex-1">{item.sentence || item.english.join(", ")}</span>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function CategoryPanel({ category, learnedBangla }: { category: Category; learnedBangla: Set<string> }) {
  const availableWords = category.vocabularies.filter((item) => !learnedBangla.has(item.bangla));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [shownSentences, setShownSentences] = useState<Set<string>>(new Set());
  const [hideBangla, setHideBangla] = useState(false);
  const [hideGerman, setHideGerman] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSentences, setSearchSentences] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadPersonalVocabulary, uploadState] = useUploadPersonalVocabularyMutation();

  const PAGE_SIZE = 60;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, category._id]);

  const filteredWords = availableWords.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const banglaMatch = item.bangla.toLowerCase().includes(q);
    const germanMatch = item.german.some((g) => g.toLowerCase().includes(q));
    const sentenceMatch = searchSentences && item.sentence ? item.sentence.toLowerCase().includes(q) : false;
    return banglaMatch || germanMatch || sentenceMatch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredWords.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedWords = filteredWords.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const allSelected =
    filteredWords.length > 0 &&
    filteredWords.every((_item, index) => selected.has(vocabularyKey(category._id, index)));

  function toggleWord(index: number) {
    const key = vocabularyKey(category._id, index);
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleAll() {
    setSelected(() =>
      allSelected ? new Set() : new Set(filteredWords.map((_item, index) => vocabularyKey(category._id, index)))
    );
  }

  async function addToPersonalList(listType: "learned" | "pending") {
    const selectedWords = availableWords.filter((_item, index) => selected.has(vocabularyKey(category._id, index)));
    const input = selectedWords
      .map(
        (item) =>
          `${item.bangla} = ${item.german.join(" + ")}${item.sentence ? ` <${item.sentence}>` : ""}`
      )
      .join(" | \n");
    await uploadPersonalVocabulary({ listType, input }).unwrap();
    setSelected(new Set());
  }

  return (
    <section className="p-4 sm:p-5 md:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-slate-800">{category.name}</h2>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            {searchQuery
              ? `${filteredWords.length} of ${availableWords.length} available vocabulary items`
              : `${availableWords.length} available vocabulary items`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {filteredWords.length > 0 && (
            <label className="inline-flex items-center gap-2 text-xs md:text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer select-none bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 accent-indigo-600"
              />
              <span>Select all</span>
            </label>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-medium rounded-lg border transition-all ${
                hideGerman
                  ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
              onClick={() => setHideGerman(!hideGerman)}
              title="Toggle German translations visibility"
            >
              <span>{hideGerman ? "🙈" : "👁️"}</span>
              <span>Deutsch</span>
            </button>

            <button
              type="button"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-medium rounded-lg border transition-all ${
                hideBangla
                  ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
              onClick={() => setHideBangla(!hideBangla)}
              title="Toggle Bangla translations visibility"
            >
              <span>{hideBangla ? "🙈" : "👁️"}</span>
              <span>বাংলা</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search in ${category.name} (German or Bangla)...`}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer select-none bg-slate-50 hover:bg-slate-100 px-3 py-2.5 rounded-xl border border-slate-200 transition-colors flex-shrink-0">
          <input
            type="checkbox"
            checked={searchSentences}
            onChange={(e) => setSearchSentences(e.target.checked)}
            className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 accent-indigo-600"
          />
          <span>Include sentences</span>
        </label>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mt-4 p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-950 flex items-center justify-between flex-wrap gap-3">
          <span className="text-xs md:text-sm font-semibold">{selected.size} item(s) selected</span>
          <button
            type="button"
            disabled={uploadState.isLoading}
            onClick={() => addToPersonalList("pending")}
            className="px-3.5 py-1.5 text-xs md:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors"
          >
            {uploadState.isLoading ? "Adding..." : "Add to today task"}
          </button>
        </div>
      )}

      {/* Pagination Controls at the TOP */}
      <PaginationControls
        currentPage={safePage}
        totalPages={totalPages}
        totalItems={filteredWords.length}
        pageSize={PAGE_SIZE}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {availableWords.length === 0 ? (
        <p className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 text-sm text-center">
          All words in this category are already in your learned list.
        </p>
      ) : filteredWords.length === 0 ? (
        <div className="mt-4 p-6 rounded-xl bg-slate-50 border border-slate-100 text-center">
          <p className="text-slate-600 text-sm font-medium">
            No vocabulary items found in <span className="font-semibold">{category.name}</span> matching &quot;<span className="font-semibold text-slate-900">{searchQuery}</span>&quot;.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 mt-4">
          {paginatedWords.map((item, pageIdx) => {
            const realIndex = (safePage - 1) * PAGE_SIZE + pageIdx;
            const key = vocabularyKey(category._id, realIndex);
            const showSentence = shownSentences.has(key);

            return (
              <article
                key={key}
                className="p-3.5 md:p-4 rounded-xl bg-white border border-slate-200/90 hover:border-indigo-200 hover:shadow-xs transition-all flex flex-col justify-between gap-2.5"
              >
                <div className="flex items-center justify-between gap-3 min-w-0">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 flex-wrap">
                    <input
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer accent-indigo-600 flex-shrink-0"
                      type="checkbox"
                      checked={selected.has(key)}
                      onChange={() => toggleWord(realIndex)}
                      aria-label={`Select ${item.german.join(", ")}`}
                    />

                    {!hideGerman && (
                      <strong className="font-semibold text-slate-900 text-sm md:text-base break-words">
                        {item.german.join(", ")}
                      </strong>
                    )}

                    {!hideBangla && (
                      <span className="text-xs md:text-sm text-slate-600 font-medium break-words bg-slate-100/90 px-2 py-0.5 rounded-md">
                        {item.bangla}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all border flex-shrink-0 ${
                      showSentence
                        ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                        : "bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border-slate-200"
                    }`}
                    onClick={() =>
                      setShownSentences((current) => {
                        const next = new Set(current);
                        if (showSentence) next.delete(key);
                        else next.add(key);
                        return next;
                      })
                    }
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                      />
                    </svg>
                    <span>{showSentence ? "Hide sentence" : "Sentence"}</span>
                  </button>
                </div>

                {showSentence && (
                  <div className="w-full mt-1 p-2.5 rounded-lg bg-indigo-50/80 border border-indigo-100 text-xs md:text-sm text-indigo-950 italic flex items-start gap-2">
                    <span className="font-semibold text-indigo-500 not-italic select-none">💬</span>
                    <span className="break-words flex-1">{item.sentence || item.german.join(", ")}</span>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function UserDashboard({ profile, onSignOut }: Props) {
  const [activeView, setActiveView] = useState<View>("profile");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");

  const adminCategories = profile.categories.admin ?? [];
  const learnedBangla = new Set(profile.account.learned.map((item) => item.bangla));
  const selectedCategoryId = activeView.startsWith("category:") ? activeView.slice("category:".length) : null;
  const selectedCategory = adminCategories.find((category) => category._id === selectedCategoryId);

  const filteredCategories = adminCategories.filter((category) =>
    category.name.toLowerCase().includes(categorySearchQuery.toLowerCase().trim())
  );

  const title =
    activeView === "profile"
      ? "Profile"
      : activeView === "learned"
      ? "Learned"
      : activeView === "pending"
      ? "Today task"
      : selectedCategory?.name ?? "Vocabulary";

  function handleNavigate(view: View) {
    setActiveView(view);
    setMobileMenuOpen(false);
  }

  const renderNavLinks = () => (
    <div className="space-y-6">
      <div>
        <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Account</p>
        <button
          type="button"
          className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeView === "profile"
              ? "bg-indigo-600 text-white font-semibold shadow-xs"
              : "text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
          onClick={() => handleNavigate("profile")}
        >
          Profile
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between px-3 mb-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Vocabularies</p>
          {adminCategories.length > 0 && (
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md font-semibold">
              {adminCategories.length}
            </span>
          )}
        </div>

        {adminCategories.length > 3 && (
          <div className="px-1 mb-2">
            <input
              type="text"
              value={categorySearchQuery}
              onChange={(e) => setCategorySearchQuery(e.target.value)}
              placeholder="Filter categories..."
              className="w-full px-3 py-1.5 text-xs bg-slate-800 text-slate-200 border border-slate-700/80 rounded-lg placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        )}

        <div className="space-y-1">
          {filteredCategories.length ? (
            filteredCategories.map((category) => (
              <button
                type="button"
                className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-between gap-2 ${
                  selectedCategoryId === category._id
                    ? "bg-indigo-600 text-white font-semibold shadow-xs"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
                onClick={() => handleNavigate(`category:${category._id}`)}
                key={category._id}
              >
                <span className="truncate">{category.name}</span>
                <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  selectedCategoryId === category._id
                    ? "bg-indigo-500/60 text-indigo-100"
                    : "bg-slate-700 text-slate-400"
                }`}>
                  {category.vocabularies.filter(v => !learnedBangla.has(v.bangla)).length}
                </span>
              </button>
            ))
          ) : (
            <span className="block px-3 py-1 text-xs text-slate-500">
              {adminCategories.length ? "No matching categories" : "No shared categories"}
            </span>
          )}
        </div>
      </div>

      <div>
        <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">My condition</p>
        <div className="space-y-1">
          <button
            type="button"
            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between gap-2 ${
              activeView === "learned"
                ? "bg-indigo-600 text-white font-semibold shadow-xs"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
            onClick={() => handleNavigate("learned")}
          >
            <span>Learned</span>
            <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
              activeView === "learned"
                ? "bg-indigo-500/60 text-indigo-100"
                : "bg-slate-700 text-slate-400"
            }`}>
              {profile.account.learned.length}
            </span>
          </button>
          <button
            type="button"
            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between gap-2 ${
              activeView === "pending"
                ? "bg-indigo-600 text-white font-semibold shadow-xs"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
            onClick={() => handleNavigate("pending")}
          >
            <span>Today task</span>
            <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
              activeView === "pending"
                ? "bg-indigo-500/60 text-indigo-100"
                : profile.account.pending.length > 0
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-slate-700 text-slate-400"
            }`}>
              {profile.account.pending.length}
            </span>
          </button>
        </div>
      </div>
    </div>
  );

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
            <span className="text-[10px] text-indigo-300">Learning Helper</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-hidden"
          aria-label="Toggle navigation menu"
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

      {/* Mobile Menu Backdrop & Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex flex-col bg-slate-900/95 backdrop-blur-md p-5 pt-16 overflow-y-auto">
          <div className="flex-1">{renderNavLinks()}</div>
          <button
            type="button"
            onClick={onSignOut}
            className="mt-6 w-full py-2.5 px-4 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-red-600/20 hover:border-red-500/50 text-sm font-semibold transition-all"
          >
            Sign out
          </button>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-slate-900 text-slate-200 min-h-screen p-5 flex-col justify-between border-r border-slate-800 shadow-lg sticky top-0 h-screen">
        <div>
          {/* Brand logo */}
          <div className="flex items-center gap-3 pb-6 mb-6 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-extrabold text-white text-base shadow-md">
              DL
            </div>
            <div>
              <strong className="block text-slate-100 text-base leading-tight">Deutsch</strong>
              <small className="text-xs text-indigo-300">Learning Helper</small>
            </div>
          </div>

          {/* Nav links */}
          {renderNavLinks()}
        </div>

        {/* Sign out */}
        <button
          className="w-full py-2.5 px-4 rounded-xl border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-semibold transition-all flex items-center justify-center gap-2"
          type="button"
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

      {/* Main Content Body */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full min-w-0">
        {/* Main Header */}
        <header className="flex items-center justify-between gap-4 mb-6 md:mb-8 pb-4 border-b border-slate-200/80">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">User Dashboard</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">{title}</h1>
          </div>

          <div
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-indigo-600 text-white font-extrabold text-base sm:text-lg flex items-center justify-center shadow-md flex-shrink-0"
            aria-label={profile?.account?.name || profile?.account?.email || "User"}
          >
            {(profile?.account?.name || profile?.account?.email || "User").slice(0, 1).toUpperCase()}
          </div>
        </header>

        {/* Dynamic Views */}
        {activeView === "profile" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <article className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-center flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-indigo-600 text-white font-extrabold text-3xl flex items-center justify-center shadow-lg mb-4">
                {(profile?.account?.name || profile?.account?.email || "User").slice(0, 1).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold text-slate-900">{profile?.account?.name || profile?.account?.email || "User"}</h2>
              <p className="text-sm text-slate-500 mt-1">{profile?.account?.email}</p>
              <span className="mt-4 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                User account
              </span>
            </article>

            <article className="md:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Learning Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                  <strong className="text-2xl sm:text-3xl font-extrabold text-indigo-600">
                    {profile.account.learned.length}
                  </strong>
                  <span className="text-xs sm:text-sm text-slate-600 font-medium">Learned words</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                  <strong className="text-2xl sm:text-3xl font-extrabold text-amber-600">
                    {profile.account.pending.length}
                  </strong>
                  <span className="text-xs sm:text-sm text-slate-600 font-medium">Pending words</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                  <strong className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                    {adminCategories.length}
                  </strong>
                  <span className="text-xs sm:text-sm text-slate-600 font-medium">Shared categories</span>
                </div>
              </div>
            </article>

            {/* Vocabulary Progress Graph */}
            <div className="md:col-span-3">
              <VocabularyGraph />
            </div>
          </div>
        )}

        {activeView === "learned" && (
          <PersonalVocabularyPanel items={profile.account.learned} listType="learned" />
        )}

        {activeView === "pending" && (
          <PersonalVocabularyPanel items={profile.account.pending} listType="pending" />
        )}

        {selectedCategory && (
          <CategoryPanel
            key={selectedCategory._id}
            category={selectedCategory}
            learnedBangla={learnedBangla}
          />
        )}
      </main>
    </div>
  );
}
