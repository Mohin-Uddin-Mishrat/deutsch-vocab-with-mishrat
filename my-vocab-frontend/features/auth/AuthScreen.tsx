"use client";

import { type FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import { useGetMeQuery, useLoginMutation, useRegisterMutation } from "@/redux/services/authApi";
import { clearCredentials, setCredentials } from "@/redux/features/auth/authSlice";
import UserDashboard from "@/features/dashboard/UserDashboard";
import AdminDashboard from "@/features/dashboard/AdminDashboard";

const TOKEN_STORAGE_KEY = "deutsch-helper-access-token";

const getErrorMessage = (error: unknown) =>
  typeof error === "object" && error && "data" in error
    ? ((error as { data?: { message?: string } }).data?.message ?? "The request could not be completed.")
    : "The request could not be completed. Please try again.";

export default function AuthScreen() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { accessToken } = useSelector((state: RootState) => state.auth);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [message, setMessage] = useState<string | null>(null);
  const [sessionRestored, setSessionRestored] = useState(false);
  const [login, loginState] = useLoginMutation();
  const [register, registerState] = useRegisterMutation();
  const { data: profile, error: profileError, isFetching: profileFetching } = useGetMeQuery(undefined, { skip: !accessToken });

  useEffect(() => {
    const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token && !accessToken) dispatch(setCredentials({ accessToken: token }));
    setSessionRestored(true);
  }, [accessToken, dispatch]);

  useEffect(() => {
    if (profile?.account.role && accessToken) {
      dispatch(setCredentials({ accessToken, role: profile.account.role }));
      const dashboardPath = profile.account.role === "ADMIN" ? "/admin" : "/user";
      const isCorrectDashboard = pathname === dashboardPath || pathname.startsWith(`${dashboardPath}/`);
      if (!isCorrectDashboard) router.replace(dashboardPath);
    }
  }, [accessToken, dispatch, pathname, profile?.account.role, router]);

  useEffect(() => {
    if (profileError) {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      dispatch(clearCredentials());
    }
  }, [dispatch, profileError]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    try {
      const credentials =
        mode === "login"
          ? await login({ email, password }).unwrap()
          : await register({ name: String(form.get("name") ?? "").trim(), email, password }).unwrap();
      window.localStorage.setItem(TOKEN_STORAGE_KEY, credentials.accessToken);
      setMessage(mode === "login" ? "Welcome back." : "Account created. Welcome!");
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  function signOut() {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    dispatch(clearCredentials());
    router.replace("/");
    setMessage("You have been signed out.");
  }

  const isSubmitting = loginState.isLoading || registerState.isLoading;

  if (!sessionRestored || (accessToken && profileFetching && !profileError)) {
    return (
      <main className="min-h-screen grid place-items-center p-4 bg-gradient-to-br from-indigo-50 via-slate-50 to-indigo-100/60">
        <div className="flex flex-col items-center gap-3 text-slate-600" role="status">
          <span className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
          <span className="text-sm font-medium">Restoring your session…</span>
        </div>
      </main>
    );
  }

  if (accessToken && profile?.account.role === "USER") {
    return <UserDashboard profile={profile} onSignOut={signOut} />;
  }

  if (accessToken && profile?.account.role === "ADMIN") {
    return <AdminDashboard profile={profile} onSignOut={signOut} />;
  }

  return (
    <main className="min-h-screen bg-slate-950 p-3 sm:p-6 lg:p-8">
      <section className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-slate-950/40 lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative hidden overflow-hidden lg:block">
          <Image src="/asset/loginPic.jpg" alt="Learning German vocabulary" fill priority className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/80 via-indigo-900/35 to-slate-950/75" />
          <div className="absolute inset-x-0 bottom-0 p-10 text-white">
            <div className="mb-6 flex items-center gap-3"><Image src="/asset/logo.jpg" alt="Deutsch Learning With Mishrat" width={48} height={48} className="h-12 w-12 rounded-2xl object-cover ring-2 ring-white/70" /><span className="text-lg font-extrabold tracking-tight">Deutsch Learning With Mishrat</span></div>
            <p className="max-w-md text-3xl font-black leading-tight">Build a vocabulary habit that actually sticks.</p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-indigo-100">Organize your words, focus on today&apos;s task, and see your German grow every day.</p>
          </div>
        </div>
        <div className="flex items-center justify-center bg-gradient-to-b from-white to-indigo-50/60 p-6 sm:p-10">
          <section className="w-full max-w-md">
            <div className="relative mb-7 h-44 overflow-hidden rounded-2xl shadow-lg sm:h-56 lg:hidden">
              <Image src="/asset/loginPic.jpg" alt="Learning German vocabulary" fill priority className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/80 via-indigo-950/30 to-transparent" />
              <div className="absolute inset-x-4 bottom-4 flex items-center gap-3 text-white">
                <Image src="/asset/logo.jpg" alt="Deutsch Learning With Mishrat" width={44} height={44} className="h-11 w-11 rounded-xl object-cover ring-2 ring-white/70" />
                <span className="text-sm font-extrabold tracking-tight">Deutsch Learning With Mishrat</span>
              </div>
            </div>
            <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-indigo-600">Start learning today</span>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">{mode === "login" ? "Pick up right where you left off." : "Your personal German vocabulary space is one step away."}</p>
            <div className="mt-7 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1.5" aria-label="Authentication mode">
              <button type="button" className={`rounded-xl py-2.5 text-sm font-bold transition-all ${mode === "login" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-900"}`} onClick={() => setMode("login")}>Log in</button>
              <button type="button" className={`rounded-xl py-2.5 text-sm font-bold transition-all ${mode === "register" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-900"}`} onClick={() => setMode("register")}>Register</button>
            </div>
            <form onSubmit={onSubmit} className="mt-7 space-y-4">
              {mode === "register" && <div><label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">Name</label><input required name="name" autoComplete="name" placeholder="Your full name" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-hidden transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" /></div>}
              <div><label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">Email</label><input required name="email" type="email" autoComplete="email" placeholder="you@example.com" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-hidden transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" /></div>
              <div><label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">Password</label><input required name="password" type="password" minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="••••••••" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-hidden transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" /></div>
              <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-700 disabled:opacity-60">{isSubmitting ? "Please wait…" : mode === "login" ? "Log in to my account" : "Create my account"}</button>
            </form>
            {message && <p className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-center text-xs font-medium text-indigo-900" role="status">{message}</p>}
          </section>
        </div>
      </section>
    </main>
  );
}
