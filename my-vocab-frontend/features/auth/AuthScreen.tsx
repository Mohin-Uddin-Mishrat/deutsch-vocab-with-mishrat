"use client";

import { type FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
    <main className="min-h-screen grid place-items-center p-4 bg-gradient-to-br from-indigo-50 via-slate-50 to-indigo-100/60">
      <section className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xl shadow-indigo-900/5">
        <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">
          Deutsch Learning Helper
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Use your account to build and organize your German vocabulary.
        </p>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 mt-6 rounded-xl bg-slate-100 border border-slate-200/70" aria-label="Authentication mode">
          <button
            type="button"
            className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
              mode === "login" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
            onClick={() => setMode("login")}
          >
            Log in
          </button>
          <button
            type="button"
            className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
              mode === "register" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4 mt-6">
          {mode === "register" && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Name</label>
              <input
                required
                name="name"
                autoComplete="name"
                placeholder="Your full name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email</label>
            <input
              required
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Password</label>
            <input
              required
              name="password"
              type="password"
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-indigo-600/20 disabled:opacity-60"
          >
            {isSubmitting ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        {message && (
          <p className="mt-4 p-3 rounded-xl bg-slate-100 text-slate-700 text-xs text-center font-medium" role="status">
            {message}
          </p>
        )}
      </section>
    </main>
  );
}
