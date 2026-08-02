import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://oflomemrwwzukwwayfky.supabase.co";
const SUPABASE_ANON_KEY =
  "sb_publishable_7YH6QLhFpHXv4N1W3BVPmg_7QzVdyP8";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, role } = body;

    if (!email || !password || !fullName || !role) {
      return NextResponse.json(
        { error: "Wszystkie pola są wymagane (email, hasło, imię i nazwisko, rola)." },
        { status: 400 }
      );
    }

    if (!email.includes("@") || email.length < 5) {
      return NextResponse.json(
        { error: "Podaj prawidłowy adres email." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Hasło musi mieć co najmniej 8 znaków." },
        { status: 400 }
      );
    }

    if (!["driver", "passenger"].includes(role)) {
      return NextResponse.json(
        { error: "Rola musi być 'driver' lub 'passenger'." },
        { status: 400 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    if (error) {
      let message = error.message;
      if (
        error.message?.includes("already registered") ||
        error.message?.includes("already exists")
      ) {
        message =
          "Konto z tym adresem email już istnieje. Zaloguj się lub użyj innego adresu.";
      } else if (
        error.message?.includes("password") ||
        error.message?.includes("weak")
      ) {
        message = "Hasło jest zbyt słabe. Użyj co najmniej 8 znaków.";
      } else if (
        error.message?.includes("rate") ||
        error.message?.includes("limit")
      ) {
        message = "Zbyt wiele prób. Spróbuj ponownie za chwilę.";
      }

      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "Nie udało się utworzyć konta. Spróbuj ponownie." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.user_metadata?.full_name,
          role: data.user.user_metadata?.role,
        },
        message: data.session
          ? "Konto utworzone pomyślnie! Zalogowano automatycznie."
          : "Konto utworzone! Sprawdź email, aby potwierdzić rejestrację.",
        session: data.session
          ? {
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              expires_at: data.session.expires_at,
            }
          : null,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Nieoczekiwany błąd serwera.";

    if (
      message.includes("fetch") ||
      message.includes("network") ||
      message.includes("ECONNREFUSED") ||
      message.includes("ETIMEDOUT") ||
      message.includes("ENOTFOUND") ||
      message.includes("timeout") ||
      message.includes("abort")
    ) {
      return NextResponse.json(
        {
          error:
            "Nie można połączyć się z serwerem. Sprawdź połączenie internetowe i spróbuj ponownie.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Wystąpił błąd serwera. Spróbuj ponownie później." },
      { status: 500 }
    );
  }
}
