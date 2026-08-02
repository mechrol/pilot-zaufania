"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const userStr = localStorage.getItem("auth_user");

    if (!token || !userStr) {
      window.location.href = "/";
      return;
    }

    try {
      setUser(JSON.parse(userStr));
    } catch {
      window.location.href = "/";
      return;
    }

    setLoading(false);
  }, []);

  function handleLogout() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    window.location.href = "/";
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-border bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-zinc-900 text-xl font-bold">
              P
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Pilot Zaufania
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <span className="text-sm text-zinc-400">
              {user.fullName || user.email}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-zinc-400 hover:text-amber-400 transition px-4 py-2 rounded-lg border border-border hover:border-amber-500/30"
            >
              Wyloguj sie
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">
            Witaj, {user.fullName || "Uzytkowniku"}!
          </h1>
          <p className="mt-2 text-zinc-400">
            Twoja rola:{" "}
            <span className="text-amber-400 font-medium">
              {user.role === "driver" ? "Kierowca" : "Pasazer"}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/dashboard/przejazdy"
            className="block rounded-2xl border border-border bg-zinc-900/50 p-8 hover:border-amber-500/30 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            <div className="text-3xl mb-4">🚗</div>
            <h3 className="text-lg font-semibold mb-2">Moje przejazdy</h3>
            <p className="text-sm text-zinc-400">
              Przegladaj historie swoich przejazdow i nadchodzace kursy.
            </p>
          </Link>

          <Link
            href="/dashboard/zaufanie"
            className="block rounded-2xl border border-border bg-zinc-900/50 p-8 hover:border-amber-500/30 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            <div className="text-3xl mb-4">⭐</div>
            <h3 className="text-lg font-semibold mb-2">Oceny i zaufanie</h3>
            <p className="text-sm text-zinc-400">
              Twoj wskaznik zaufania i opinie od innych uzytkownikow.
            </p>
          </Link>

          <Link
            href="/dashboard/ustawienia"
            className="block rounded-2xl border border-border bg-zinc-900/50 p-8 hover:border-amber-500/30 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            <div className="text-3xl mb-4">⚙️</div>
            <h3 className="text-lg font-semibold mb-2">Ustawienia profilu</h3>
            <p className="text-sm text-zinc-400">
              Zarzadzaj swoim kontem, danymi i preferencjami.
            </p>
          </Link>
        </div>

        <div className="mt-10 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-medium text-emerald-400">
              Konto zweryfikowane
            </span>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Twoje konto jest w pelni aktywne. Aby zwiekszyc poziom zaufania,
            dokoncz weryfikacje tozsamosci i dodaj zdjecie profilowe.
          </p>
        </div>
      </main>
    </div>
  );
}
