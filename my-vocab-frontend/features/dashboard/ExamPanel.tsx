"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGetExamHistoryQuery, useGetExamQuery, useSubmitExamMutation } from "@/redux/services/authApi";
import type { Exam } from "@/redux/features/auth/types";

export function ExamHistoryPanel() {
  const { data: exams = [], isLoading } = useGetExamHistoryQuery();
  const router = useRouter();
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
    <h2 className="text-lg font-bold text-slate-900">Exam history</h2>
    <p className="mt-1 text-sm text-slate-500">Your submitted vocabulary exam results.</p>
    {isLoading ? <p className="mt-5 text-sm text-slate-500">Loading exam history…</p> : exams.length ? <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[440px] text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-3 py-3">Date</th><th className="px-3 py-3 text-center">Score</th><th className="px-3 py-3 text-right">Review</th></tr></thead><tbody className="divide-y divide-slate-100">{exams.map(exam => <tr key={exam._id}><td className="px-3 py-3 text-slate-700">{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(exam.submittedAt))}</td><td className="px-3 py-3 text-center font-bold text-indigo-700">{exam.score}/{exam.total}</td><td className="px-3 py-3 text-right"><button type="button" onClick={() => router.push(`/user/exam/${exam._id}/result`)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">View result</button></td></tr>)}</tbody></table></div> : <p className="mt-5 rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">No exams submitted yet.</p>}
  </section>;
}

export function ExamPanel({ examId, resultOnly = false }: { examId: string; resultOnly?: boolean }) {
  const router = useRouter();
  const { data: exam, isLoading, isError } = useGetExamQuery(examId);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitExam, submitState] = useSubmitExamMutation();
  if (isLoading) return <p className="text-sm text-slate-500">Loading exam…</p>;
  if (isError || !exam) return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">This exam could not be found.</p>;
  if (resultOnly || exam.answers) return <ExamResult exam={exam} onBack={() => router.push("/user/exams")} />;
  const questions = exam.questions ?? [];
  async function submit() {
    try {
      await submitExam({ examId, answers: questions.map(question => ({ bangla: question.bangla, answer: answers[question.bangla] ?? "" })) }).unwrap();
      router.replace(`/user/exam/${examId}/result`);
    } catch { /* Request state shows an inline error. */ }
  }
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 pb-4"><div><h2 className="text-xl font-bold text-slate-900">Today&apos;s vocabulary exam</h2><p className="mt-1 text-sm text-slate-500">Write the German meaning for every Bangla word.</p></div><span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-bold text-indigo-700">{questions.length} questions</span></div>
    <div className="mt-5 space-y-4">{questions.map((question, index) => <label key={question.bangla} className="block rounded-xl border border-slate-200 p-4"><span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Question {index + 1}</span><strong className="mt-1 block text-lg text-slate-900">{question.bangla}</strong><input value={answers[question.bangla] ?? ""} onChange={event => setAnswers(current => ({ ...current, [question.bangla]: event.target.value }))} placeholder="Write the German meaning" className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></label>)}</div>
    {submitState.isError && <p className="mt-4 text-sm text-red-600">Could not submit the exam. Please try again.</p>}
    <button type="button" disabled={submitState.isLoading} onClick={submit} className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">{submitState.isLoading ? "Submitting…" : "Submit exam"}</button>
  </section>;
}

function ExamResult({ exam, onBack }: { exam: Exam; onBack: () => void }) {
  const answers = exam.answers ?? [];
  const score = exam.score ?? 0;
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"><div className="rounded-2xl bg-indigo-600 p-6 text-white"><p className="text-sm font-semibold text-indigo-100">Exam result</p><h2 className="mt-1 text-3xl font-black">{score}/{exam.total}</h2><p className="mt-2 text-sm text-indigo-100">Correct words were moved to your Learned list. Incorrect words remain in Today&apos;s task.</p></div><div className="mt-6 space-y-3">{answers.map((item, index) => <article key={item.bangla} className={`rounded-xl border p-4 ${item.correct ? "border-emerald-200 bg-emerald-50/60" : "border-red-200 bg-red-50/60"}`}><div className="flex items-start justify-between gap-3"><div><span className="text-xs font-bold uppercase tracking-wider text-slate-500">{index + 1}. {item.bangla}</span><p className="mt-1 text-sm text-slate-700">Your answer: <strong>{item.answer || "No answer"}</strong></p><p className="mt-1 text-sm text-slate-700">Correct answer: <strong>{item.expected.join(", ")}</strong></p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.correct ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{item.correct ? "Correct" : "Incorrect"}</span></div></article>)}</div><button type="button" onClick={onBack} className="mt-6 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">View exam history</button></section>;
}
