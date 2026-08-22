"use client";

import { useState } from "react";
import type { Category } from "@/redux/features/auth/types";

const PAGE_SIZE = 100;

export default function VocabularyPdfPanel({ category }: { category: Category }) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = category.vocabularies.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pageItems = category.vocabularies.slice(startIndex, startIndex + PAGE_SIZE);

  function handlePrint() {
    window.print();
  }

  const paginationBar = totalPages > 1 && (
    <nav
      aria-label="Vocabulary pagination"
      className="vocab-no-print flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-medium"
    >
      <span className="text-slate-600">
        Showing <strong className="text-slate-900">{startIndex + 1}&#8211;{Math.min(startIndex + PAGE_SIZE, totalItems)}</strong> of{" "}
        <strong className="text-slate-900">{totalItems}</strong> items
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={safePage === 1}
          onClick={() => setCurrentPage(safePage - 1)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
        >
          Prev
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
          .map((p, idx, arr) => (
            <span key={p} className="flex items-center gap-1">
              {idx > 0 && arr[idx - 1] !== p - 1 && (
                <span className="px-1 text-slate-400">...</span>
              )}
              <button
                type="button"
                onClick={() => setCurrentPage(p)}
                className={`h-8 min-w-8 rounded-lg px-2 font-bold ${
                  p === safePage
                    ? "bg-red-600 text-white"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                {p}
              </button>
            </span>
          ))}
        <button
          type="button"
          disabled={safePage === totalPages}
          onClick={() => setCurrentPage(safePage + 1)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </nav>
  );

  return (
    <>
      <style>{`
        @media screen {
          #vocab-print-area {
            position: fixed;
            top: -9999px;
            left: -9999px;
            width: 794px;
            visibility: hidden;
          }
        }
        @media print {
          body * { visibility: hidden !important; }
          #vocab-print-area, #vocab-print-area * { visibility: visible !important; }
          #vocab-print-area {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            padding: 32px 48px !important;
            background: #fff !important;
            z-index: 9999 !important;
          }
          .vocab-no-print { display: none !important; }
        }
      `}</style>

      <div id="vocab-print-area">
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{category.name}</h2>
        <p style={{ fontSize: 11, color: "#64748b", marginBottom: 16 }}>{totalItems} vocabulary items</p>
        <hr style={{ borderColor: "#e2e8f0", marginBottom: 20 }} />
        <ol style={{ paddingLeft: 24, margin: 0 }}>
          {category.vocabularies.map((vocab, index) => (
            <li key={`print-${index}`} style={{ fontSize: 13, fontWeight: 600, lineHeight: "1.85", color: "#b91c1c", background: index % 2 === 0 ? "#fff5f5" : "transparent", padding: "1px 4px", borderRadius: 3 }}>
              {vocab.bangla} = {vocab.german.join(" / ")}
            </li>
          ))}
        </ol>
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{category.name}</h2>
            <p className="mt-0.5 text-xs text-slate-500">{totalItems} vocabulary items</p>
          </div>
          <button type="button" onClick={handlePrint} className="vocab-no-print inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a1 1 0 001-1v-4a1 1 0 00-1-1H9a1 1 0 00-1 1v4a1 1 0 001 1zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Download PDF
          </button>
        </div>
        {paginationBar}
        {totalItems ? (
          <ol className="vocab-no-print mt-4 list-decimal space-y-1 pl-7 text-base font-semibold leading-7 text-red-600 marker:font-bold" start={startIndex + 1}>
            {pageItems.map((vocabulary, index) => (
              <li key={`${vocabulary.bangla}-${startIndex + index}`}>
                <span>{vocabulary.bangla} = {vocabulary.german.join(" / ")}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-4 text-sm text-slate-500">No vocabulary items in this category.</p>
        )}
        {totalPages > 1 && <div className="mt-5">{paginationBar}</div>}
      </section>
    </>
  );
}
