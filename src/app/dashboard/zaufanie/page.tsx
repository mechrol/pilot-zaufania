"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
}

// ---------- mock data ----------
interface TrustFactor {
  label: string;
  score: number; // 0-100
  description: string;
}

interface RatingEntry {
  id: string;
  fromName: string;
  rideId: string;
  route: string;
  rating: number; // 1.00-5.00
  comment: string;
  date: string;
}

const MOCK_TRUST_SCORE = 78;
const MOCK_RATING = 4.6;
const MOCK_TOTAL_RATINGS = 12;

const MOCK_FACTORS: TrustFactor[] = [
  { label: "Punktualność", score: 92, description: "Regularnie punktualny na odbiór pasażerów" },
  { label: "Bezpieczeństwo", score: 85, description: "Płynna jazda, przestrzeganie przepisów" },
  { label: "Komunikacja", score: 70, description: "Dobra, choć czasem opóźnione odpowiedzi" },
  { label: "Czystość pojazdu", score: 88, description: "Pojazd regularnie czyszczony i zadbany" },
  { label: "Zgodność z trasą", score: 80, description: "Trzyma się wyznaczonej trasy z GPS" },
];

const MOCK_RATINGS: RatingEntry[] = [
  {
    id: "rev1",
    fromName: "Anna K.",
    rideId: "r1",
    route: "Warszawa → Kraków",
    rating: 4.8,
    comment: "Świetny przejazd! Kierowca bardzo kulturalny i punktualny. Polecam!",
    date: "2026-07-28T14:00:00Z",
  },
  {
    id: "rev2",
    fromName: "Marek W.",
    rideId: "r5",
    route: "Katowice → Kraków",
    rating: 4.5,
    comment: "Komfortowa podróż, czysty samochód. Drobne opóźnienie na starcie.",
    date: "2026-06-15T12:30:00Z",
  },
  {
    id: "rev3",
    fromName: "Kasia N.",
    rideId: "rX",
    route: "Gdańsk → Gdynia",
    rating: 5.0,
    comment: "Perfekcyjnie! Najlepszy kierowca z jakim jechałam.",
    date: "2026-05-20T18:15:00Z",
  },
  {
    id: "rev4",
    fromName: "Tomasz R.",
    rideId: "rY",
    route: "Poznań → Łódź",
    rating: 4.0,
    comment: "OK, ale klimatyzacja mogłaby działać lepiej. Poza tym bez zarzutu.",
    date: "2026-05-10T10:00:00Z",
  },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const stars = [];
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.25 && rating - full < 0.75;
  const fullAdjusted = rating - full >= 0.75 ? full + 1 : full;

  for (let i = 1; i <= 5; i++) {
    if (i <= fullAdjusted) {
      stars.push(
        <span key={i} className={size === "lg" ? "text-2xl" : "text-sm"}>
          ★
        </span>
      );
    } else if (hasHalf && i === fullAdjusted + 1) {
      stars.push(
        <span key={i} className={`${size === "lg" ? "text-2xl" : "text-sm"} opacity-50`}>
          ★
        </span>
      );
    } else {
      stars.push(
        <span key={i} className={`${size === "lg" ? "text-2xl" : "text-sm"} text-zinc-700`}>
          ★
        </span>
      );
    }
  }

  return <span className="text-amber-400">{stars}</span>;
}

export default function ZaufaniePage() {
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  const trustColor =
    MOCK_TRUST_SCORE >= 80
      ? "text-emerald-400"
      : MOCK_TRUST_SCORE >= 60
        ? "text-amber-400"
        : "text-red-400";

  const trustBg =
    MOCK_TRUST_SCORE >= 80
      ? "border-emerald-500/30"
      : MOCK_TRUST_SCORE >= 60
        ? "border-amber-500/30"
        : "border-red-500/30";

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
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Oceny i zaufanie</h1>
          <p className="mt-2 text-zinc-400">
            Twój wskaźnik zaufania i opinie od innych użytkowników.
          </p>
        </div>

        {/* ---------- trust overview cards ---------- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Trust Score */}
          <div
            className={`rounded-2xl border ${trustBg} bg-zinc-900/50 p-8 text-center`}
          >
            <div className="text-xs uppercase tracking-widest text-zinc-500 mb-3">
              Wskaźnik zaufania
            </div>
            <div className={`text-6xl font-bold ${trustColor} mb-2`}>
              {MOCK_TRUST_SCORE}
            </div>
            <div className="text-sm text-zinc-500">na 100 punktów</div>
            {/* progress bar */}
            <div className="mt-4 h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all"
                style={{ width: `${MOCK_TRUST_SCORE}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-zinc-600 mt-1.5">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>

          {/* Rating */}
          <div className="rounded-2xl border border-border bg-zinc-900/50 p-8 text-center">
            <div className="text-xs uppercase tracking-widest text-zinc-500 mb-3">
              Średnia ocena
            </div>
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-6xl font-bold text-amber-400">{MOCK_RATING}</span>
              <span className="text-lg text-zinc-500">/5</span>
            </div>
            <StarRating rating={MOCK_RATING} size="lg" />
            <div className="text-sm text-zinc-500 mt-2">
              na podstawie {MOCK_TOTAL_RATINGS} ocen
            </div>
          </div>

          {/* Tier / Level */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 text-center">
            <div className="text-xs uppercase tracking-widest text-zinc-500 mb-3">
              Poziom zaufania
            </div>
            <div className="text-4xl mb-2">🥈</div>
            <div className="text-xl font-semibold text-amber-400">Zaufany</div>
            <div className="text-sm text-zinc-400 mt-1">
              {MOCK_TRUST_SCORE >= 90
                ? "Jesteś na najwyższym poziomie!"
                : `Awansuj do "Wysoko zaufany" — potrzebujesz ${100 - MOCK_TRUST_SCORE} pkt`}
            </div>
          </div>
        </div>

        {/* ---------- trust factors breakdown ---------- */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Składowe zaufania</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_FACTORS.map((factor) => (
              <div
                key={factor.label}
                className="rounded-2xl border border-border bg-zinc-900/50 p-5"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{factor.label}</span>
                  <span
                    className={`text-sm font-semibold ${
                      factor.score >= 80
                        ? "text-emerald-400"
                        : factor.score >= 60
                          ? "text-amber-400"
                          : "text-red-400"
                    }`}
                  >
                    {factor.score}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all ${
                      factor.score >= 80
                        ? "bg-emerald-500"
                        : factor.score >= 60
                          ? "bg-amber-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${factor.score}%` }}
                  />
                </div>
                <p className="text-xs text-zinc-500">{factor.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ---------- recent ratings ---------- */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Ostatnie opinie</h2>
          <div className="grid gap-4">
            {MOCK_RATINGS.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-border bg-zinc-900/50 p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{entry.fromName}</span>
                      <span className="text-zinc-600 text-xs">•</span>
                      <span className="text-xs text-zinc-500">{entry.route}</span>
                    </div>
                    <StarRating rating={entry.rating} />
                    <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
                      {entry.comment}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-500 shrink-0">
                    {formatDate(entry.date)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ---------- tips ---------- */}
        <div className="mt-10 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">💡</span>
            <h3 className="text-lg font-semibold">Jak poprawić swój wynik?</h3>
          </div>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li className="flex gap-2">
              <span className="text-emerald-400 shrink-0">•</span>
              <span>Bądź punktualny — każdy punktualny przejazd podnosi wskaźnik punktualności.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-400 shrink-0">•</span>
              <span>Utrzymuj czystość pojazdu — pasażerowie wysoko oceniają zadbane wnętrze.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-400 shrink-0">•</span>
              <span>Odpowiadaj szybko na wiadomości — komunikacja w ciągu 10 min poprawia wynik.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-400 shrink-0">•</span>
              <span>Trzymaj się trasy GPS — każde odstępstwo jest rejestrowane w raporcie.</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
