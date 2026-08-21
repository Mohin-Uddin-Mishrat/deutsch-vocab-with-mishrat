"use client";

import type { Category } from "@/redux/features/auth/types";

export default function VocabularyPdfPanel({ category }: { category: Category }) {
  return <section className="min-h-[70vh] rounded-sm border border-slate-300 bg-white p-6 sm:p-8 shadow-sm">
    <h2 className="mb-6 border-b border-slate-200 pb-3 text-xl font-bold text-slate-900">{category.name}</h2>
    {category.vocabularies.length ? <ol className="list-decimal space-y-1 pl-7 text-base font-semibold leading-6 text-red-600 marker:font-bold">
      {category.vocabularies.map((vocabulary, index) => <li key={`${vocabulary.bangla}-${index}`}><span>{vocabulary.bangla} = {vocabulary.german.join(" / ")}</span></li>)}
    </ol> : <p className="text-sm text-slate-500">No vocabulary items in this category.</p>}
  </section>;
}
