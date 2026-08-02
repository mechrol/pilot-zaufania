"use client";

import { useState, FormEvent } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Nieprawidłowy email lub hasło.");
        setLoading(false);
        return;
      }

      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));

      window.location.href = "/dashboard";
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      if (err instanceof DOMException && err.name === "AbortError") {
        setError(
          "Przekroczono czas oczekiwania. Serwer nie odpowiada — spróbuj ponownie później."
        );
      } else if (err instanceof TypeError && err.message === "Failed to fetch") {
        setError(
          "Nie można połączyć się z serwerem. Sprawdź połączenie internetowe."
        );
      } else {
        setError(
          "Nieoczekiwany błąd połączenia. Sprawdź internet i spróbuj ponownie."
        );
      }
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 min-h-screen">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-zinc-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-amber-400/5 via-transparent to-transparent" />
        <div className="relative flex flex-col justify-between p-14 w-full">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-zinc-900 text-xl font-bold">
              P
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">
              Pilot Zaufania
            </span>
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white leading-tight">
              Bezpieczna podróż
              <br />
              zaczyna się od zaufania
            </h2>
            <p className="mt-4 max-w-md text-zinc-400 leading-relaxed">
              System weryfikacji kierowców i pasażerów. Budujemy
              przejrzystość na drodze — dla każdego kursu.
            </p>
          </div>
          <div className="flex gap-6 text-sm text-zinc-500">
            <span>🔒 Szyfrowane połączenie</span>
            <span>✅ Zweryfikowani użytkownicy</span>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="flex items-center gap-3 mb-12 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-zinc-900 text-xl font-bold">
              P
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Pilot Zaufania
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">
              Zaloguj się
            </h1>
            <p className="mt-2 text-zinc-400">
              Wprowadź swoje dane, aby kontynuować
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-300 mb-1.5"
              >
                Adres email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="np. jan@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-zinc-300"
                >
                  Hasło
                </label>
                <a
                  href="/reset-hasla"
                  className="text-xs text-amber-500 hover:text-amber-400 transition"
                >
                  Nie pamiętasz hasła?
                </a>
              </div>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
              />
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-border bg-surface accent-amber-500"
              />
              <label htmlFor="remember" className="text-sm text-zinc-400">
                Zapamiętaj mnie
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-amber-400 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Logowanie...
                </span>
              ) : (
                "Zaloguj się"
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="mt-8 text-center text-sm text-zinc-500">
            Nie masz jeszcze konta?{" "}
            <a
              href="/rejestracja"
              className="font-medium text-amber-500 hover:text-amber-400 transition"
            >
              Zarejestruj się
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
