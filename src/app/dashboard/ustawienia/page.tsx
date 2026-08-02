"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
}

export default function UstawieniaPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [language, setLanguage] = useState("pl");
  const [notifications, setNotifications] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // password state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const userStr = localStorage.getItem("auth_user");

    if (!token || !userStr) {
      window.location.href = "/";
      return;
    }

    try {
      const parsed = JSON.parse(userStr) as User;
      setUser(parsed);
      setFullName(parsed.fullName || "");
      setEmail(parsed.email || "");
      setPhone("");
    } catch {
      window.location.href = "/";
      return;
    }

    setLoading(false);
  }, []);

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);

    try {
      // TODO: replace with actual API call
      await new Promise((r) => setTimeout(r, 800));

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Nie udało się zapisać zmian. Spróbuj ponownie.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordChanged(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("Nowe hasła nie są zgodne.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Hasło musi mieć co najmniej 8 znaków.");
      return;
    }

    setChangingPassword(true);

    try {
      // TODO: replace with actual API call
      await new Promise((r) => setTimeout(r, 1000));

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
      setPasswordChanged(true);
      setTimeout(() => setPasswordChanged(false), 3000);
    } catch {
      setPasswordError("Nie udało się zmienić hasła. Sprawdź obecne hasło.");
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* ---------- header ---------- */}
      <header className="border-b border-border bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-zinc-400 hover:text-amber-400 transition mr-2">
              ← Powrót
            </Link>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-zinc-900 text-xl font-bold">
              P
            </div>
            <span className="text-lg font-semibold tracking-tight">Pilot Zaufania</span>
          </div>
          <nav className="flex items-center gap-6">
            <span className="text-sm text-zinc-400">{user.fullName || user.email}</span>
          </nav>
        </div>
      </header>

      {/* ---------- content ---------- */}
      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Ustawienia profilu</h1>
          <p className="mt-2 text-zinc-400">
            Zarządzaj swoim kontem, danymi i preferencjami.
          </p>
        </div>

        {/* ---------- profile form ---------- */}
        <section className="rounded-2xl border border-border bg-zinc-900/50 p-8 mb-6">
          <h2 className="text-lg font-semibold mb-6">Dane osobowe</h2>

          <form onSubmit={handleProfileSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

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
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="np. Jan Kowalski"
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
              />
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-zinc-300 mb-1.5"
              >
                Numer telefonu
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="np. +48 500 600 700"
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label
                htmlFor="language"
                className="block text-sm font-medium text-zinc-300 mb-1.5"
              >
                Język
              </label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
              >
                <option value="pl">Polski</option>
                <option value="en">English</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                id="notifications"
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="h-4 w-4 rounded border-border bg-surface accent-amber-500"
              />
              <label htmlFor="notifications" className="text-sm text-zinc-300">
                Otrzymuj powiadomienia o przejazdach i ocenach
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-zinc-900 hover:bg-amber-400 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Zapisywanie...
                  </span>
                ) : (
                  "Zapisz zmiany"
                )}
              </button>
              {saved && (
                <span className="text-sm text-emerald-400">✓ Zmiany zapisane</span>
              )}
            </div>
          </form>
        </section>

        {/* ---------- password section ---------- */}
        <section className="rounded-2xl border border-border bg-zinc-900/50 p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Hasło</h2>
            {!showPasswordForm && (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="text-sm text-amber-400 hover:text-amber-300 transition"
              >
                Zmień hasło
              </button>
            )}
          </div>

          {passwordChanged && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400 mb-4">
              Hasło zostało zmienione pomyślnie.
            </div>
          )}

          {showPasswordForm && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              {passwordError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {passwordError}
                </div>
              )}

              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium text-zinc-300 mb-1.5"
                >
                  Obecne hasło
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-zinc-300 mb-1.5"
                >
                  Nowe hasło
                </label>
                <input
                  id="newPassword"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 znaków"
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-zinc-300 mb-1.5"
                >
                  Potwierdź nowe hasło
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-zinc-900 hover:bg-amber-400 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {changingPassword ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Zmienianie...
                    </span>
                  ) : (
                    "Zmień hasło"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setPasswordError("");
                  }}
                  className="text-sm text-zinc-400 hover:text-zinc-200 transition px-4 py-3"
                >
                  Anuluj
                </button>
              </div>
            </form>
          )}
        </section>

        {/* ---------- privacy ---------- */}
        <section className="rounded-2xl border border-border bg-zinc-900/50 p-8 mb-6">
          <h2 className="text-lg font-semibold mb-4">Prywatność i dane</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="text-sm font-medium">Widoczność profilu</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Twój profil jest widoczny tylko dla zweryfikowanych użytkowników.
                </p>
              </div>
              <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                Ograniczona
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="text-sm font-medium">Zgoda na nagrywanie</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Dane z kamery i czujników są używane tylko do oceny bezpieczeństwa.
                </p>
              </div>
              <span className="text-xs font-medium text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
                Aktywna
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">Eksport danych</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Pobierz kopię wszystkich swoich danych w formacie JSON.
                </p>
              </div>
              <button className="text-sm text-zinc-400 hover:text-amber-400 transition px-3 py-1.5 rounded-lg border border-border hover:border-amber-500/30">
                Eksportuj
              </button>
            </div>
          </div>
        </section>

        {/* ---------- danger zone ---------- */}
        <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8">
          <h2 className="text-lg font-semibold text-red-400 mb-4">Niebezpieczna strefa</h2>
          <p className="text-sm text-zinc-400 mb-4">
            Te operacje są nieodwracalne. Upewnij się, że tego chcesz.
          </p>
          <button className="rounded-xl border border-red-500/30 px-5 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition">
            Usuń konto
          </button>
        </section>
      </main>
    </div>
  );
}
