"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Ride, RideStatus } from "@/types/ride";

interface User {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
}

const STATUS_LABELS: Record<RideStatus, string> = {
  booked: "Zarezerwowany",
  in_progress: "W trakcie",
  completed: "Zakończony",
  pending_approval: "Oczekuje na akceptację",
  approved: "Zatwierdzony",
  disputed: "Sporny",
};

const STATUS_COLORS: Record<RideStatus, string> = {
  booked: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  in_progress: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  completed: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  pending_approval: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  approved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  disputed: "bg-red-500/20 text-red-400 border-red-500/30",
};

const TIER_LABELS: Record<string, string> = {
  T1: "Podstawowy",
  T2: "Rozszerzony",
  T3: "Premium",
};

type Tab = "upcoming" | "history";

// ---------- mock data (zastąp API call) ----------
const MOCK_RIDES: Ride[] = [
  {
    rideId: "r1",
    passengerId: "p1",
    driverId: "d1",
    categoryKey: "standard",
    pickup: "Warszawa, Dworzec Centralny",
    dropoff: "Kraków, Rynek Główny",
    status: "completed",
    tier: "T2",
    createdAt: "2026-07-28T08:00:00Z",
    startedAt: "2026-07-28T08:05:00Z",
    completedAt: "2026-07-28T12:30:00Z",
    fareTotal: 189.99,
  },
  {
    rideId: "r2",
    passengerId: "p1",
    categoryKey: "standard",
    pickup: "Gdańsk, Lotnisko",
    dropoff: "Sopot, Molo",
    status: "approved",
    tier: "T1",
    createdAt: "2026-08-01T14:00:00Z",
    fareTotal: 49.99,
  },
  {
    rideId: "r3",
    passengerId: "p1",
    driverId: "d2",
    categoryKey: "premium",
    pickup: "Poznań, Stary Rynek",
    dropoff: "Wrocław, Dworzec Główny",
    status: "in_progress",
    tier: "T3",
    createdAt: "2026-08-01T10:00:00Z",
    startedAt: "2026-08-01T10:15:00Z",
    fareTotal: 249.99,
  },
  {
    rideId: "r4",
    passengerId: "p1",
    categoryKey: "standard",
    pickup: "Łódź, Manufaktura",
    dropoff: "Warszawa, Lotnisko Chopina",
    status: "booked",
    tier: "T1",
    createdAt: "2026-08-02T06:30:00Z",
    fareTotal: 139.99,
  },
  {
    rideId: "r5",
    passengerId: "p1",
    driverId: "d3",
    categoryKey: "standard",
    pickup: "Katowice, Spodek",
    dropoff: "Kraków, Dworzec Główny",
    status: "completed",
    tier: "T2",
    createdAt: "2026-06-15T09:00:00Z",
    startedAt: "2026-06-15T09:10:00Z",
    completedAt: "2026-06-15T11:45:00Z",
    fareTotal: 119.99,
  },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFare(fare?: number): string {
  return fare != null ? `${fare.toFixed(2)} zł` : "—";
}

export default function PrzejazdyPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("upcoming");

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

  const upcomingStatuses: RideStatus[] = ["booked", "pending_approval", "approved", "in_progress"];

  const upcoming = MOCK_RIDES.filter((r) => upcomingStatuses.includes(r.status));
  const history = MOCK_RIDES.filter((r) => !upcomingStatuses.includes(r.status));

  const rides = tab === "upcoming" ? upcoming : history;

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
          <h1 className="text-3xl font-bold tracking-tight">Moje przejazdy</h1>
          <p className="mt-2 text-zinc-400">
            Przeglądaj historię swoich przejazdów i nadchodzące kursy.
          </p>
        </div>

        {/* tabs */}
        <div className="flex gap-1 mb-8 border-b border-border">
          {(["upcoming", "history"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-2.5 text-sm font-medium transition border-b-2 -mb-[1px] ${
                tab === t
                  ? "border-amber-500 text-amber-400"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {t === "upcoming" ? "Nadchodzące" : "Historia"}
            </button>
          ))}
        </div>

        {/* ride cards */}
        {rides.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <div className="text-5xl mb-4">
              {tab === "upcoming" ? "📭" : "📂"}
            </div>
            <p className="text-lg font-medium">
              {tab === "upcoming"
                ? "Brak nadchodzących przejazdów"
                : "Brak przejazdów w historii"}
            </p>
            <p className="mt-1 text-sm text-zinc-600">
              {tab === "upcoming"
                ? "Nowe kursy pojawią się tutaj po rezerwacji."
                : "Twoje ukończone przejazdy będą widoczne tutaj."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {rides.map((ride) => (
              <div
                key={ride.rideId}
                className="rounded-2xl border border-border bg-zinc-900/50 p-6 hover:border-amber-500/20 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* route */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[ride.status]}`}
                      >
                        {STATUS_LABELS[ride.status]}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-border">
                        {TIER_LABELS[ride.tier] || ride.tier}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="truncate font-medium">{ride.pickup}</span>
                      <span className="text-zinc-600 shrink-0">→</span>
                      <span className="truncate font-medium">{ride.dropoff}</span>
                    </div>
                    <div className="mt-2 text-xs text-zinc-500">
                      {formatDate(ride.startedAt || ride.createdAt)}
                      {ride.completedAt && ` — ${formatDate(ride.completedAt)}`}
                    </div>
                  </div>

                  {/* fare */}
                  <div className="text-right shrink-0">
                    <div className="text-lg font-semibold text-amber-400">
                      {formatFare(ride.fareTotal)}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">ID: {ride.rideId}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
