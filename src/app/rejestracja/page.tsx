"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";

export default function RejestracjaPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"driver" | "passenger">("passenger");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      errors.fullName = "Podaj imię i nazwisko (min. 2 znaki).";
    }
    if (!email.includes("@") || email.length < 5) {
      errors.email = "Podaj prawidłowy adres email.";
    }
    if (password.length < 8) {
      errors.password = "Hasło musi mieć co najmniej 8 znaków.";
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = "Hasła nie są identyczne.";
    }
    if (!consent) {
      errors.consent = "Wymagana jest zgoda na przetwarzanie danych.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validate()) return;

    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          role,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Wystąpił błąd podczas rejestracji.");
        setLoading(false);
        return;
      }

      setSuccess(
        data.message ||
          "Konto utworzone! Sprawdź email, aby potwierdzić rejestrację."
      );

      if (data.session) {
        localStorage.setItem("auth_token", data.session.access_token);
        localStorage.setItem("auth_user", JSON.stringify(data.user));

        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      }
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
              Dołącz do społeczności
              <br />
              zaufanych kierowców i pasażerów
            </h2>
            <p className="mt-4 max-w-md text-zinc-400 leading-relaxed">
              Załóż konto, aby rezerwować przejazdy lub oferować kursy.
              Weryfikacja w 3 krokach — bezpieczeństwo ponad wszystko.
            </p>
          </div>
          <div className="flex gap-6 text-sm text-zinc-500">
            <span>🔒 Szyfrowane połączenie</span>
            <span>✅ Zweryfikowani użytkownicy</span>
            <span>🛡️ Ochrona danych</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">
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
              Zarejestruj się
            </h1>
            <p className="mt-2 text-zinc-400">
              Wypełnij formularz, aby utworzyć konto
            </p>
          </div>

          {success && (
            <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-400">
              <p className="font-medium">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-zinc-300 mb-1.5"
              >
                Imię i nazwisko
              </label>
              <input
                id="fullName"
                type="text"
                required
                autoComplete="name"
                placeholder="np. Jan Kowalski"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.fullName;
                    return next;
                  });
                }}
                className={`w-full rounded-xl border px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition ${
                  fieldErrors.fullName
                    ? "border-red-500/50 bg-red-500/5"
                    : "border-border bg-surface"
                }`}
              />
              {fieldErrors.fullName && (
                <p className="mt-1 text-xs text-red-400">
                  {fieldErrors.fullName}
                </p>
              )}
            </div>

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
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.email;
                    return next;
                  });
                }}
                className={`w-full rounded-xl border px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition ${
                  fieldErrors.email
                    ? "border-red-500/50 bg-red-500/5"
                    : "border-border bg-surface"
                }`}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-400">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-300 mb-1.5"
              >
                Hasło
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Min. 8 znaków"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.password;
                    return next;
                  });
                }}
                className={`w-full rounded-xl border px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition ${
                  fieldErrors.password
                    ? "border-red-500/50 bg-red-500/5"
                    : "border-border bg-surface"
                }`}
              />
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-400">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-zinc-300 mb-1.5"
              >
                Powtórz hasło
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.confirmPassword;
                    return next;
                  });
                }}
                className={`w-full rounded-xl border px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition ${
                  fieldErrors.confirmPassword
                    ? "border-red-500/50 bg-red-500/5"
                    : "border-border bg-surface"
                }`}
              />
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-400">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Rejestruję się jako
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("passenger")}
                  className={`flex flex-col items-center gap-2 rounded-xl border px-4 py-3 transition-all ${
                    role === "passenger"
                      ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                      : "border-border bg-surface text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  <span className="text-2xl">🧑</span>
                  <span className="text-sm font-medium">Pasażer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("driver")}
                  className={`flex flex-col items-center gap-2 rounded-xl border px-4 py-3 transition-all ${
                    role === "driver"
                      ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                      : "border-border bg-surface text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  <span className="text-2xl">🚗</span>
                  <span className="text-sm font-medium">Kierowca</span>
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                id="consent"
                type="checkbox"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.consent;
                    return next;
                  });
                }}
                className="mt-0.5 h-4 w-4 rounded border-border bg-surface accent-amber-500"
              />
              <label
                htmlFor="consent"
                className="text-sm text-zinc-400 leading-relaxed"
              >
                Akceptuję{" "}
                <Link
                  href="/regulamin"
                  className="text-amber-500 hover:text-amber-400 underline"
                >
                  Regulamin
                </Link>{" "}
                i{" "}
                <Link
                  href="/polityka-prywatnosci"
                  className="text-amber-500 hover:text-amber-400 underline"
                >
                  Politykę prywatności
                </Link>
                . Wyrażam zgodę na przetwarzanie moich danych osobowych.
              </label>
            </div>
            {fieldErrors.consent && (
              <p className="text-xs text-red-400 -mt-3">
                {fieldErrors.consent}
              </p>
            )}

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

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
                  Tworzenie konta...
                </span>
              ) : (
                "Utwórz konto"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-zinc-500">
            Masz już konto?{" "}
            <Link
              href="/"
              className="font-medium text-amber-500 hover:text-amber-400 transition"
            >
              Zaloguj się
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
