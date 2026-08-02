import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://oflomemrwwzukwwayfky.supabase.co";
const SUPABASE_ANON_KEY =
  "sb_publishable_7YH6QLhFpHXv4N1W3BVPmg_7QzVdyP8";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email i hasło są wymagane." },
        { status: 400 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      let message = error.message;

      if (
        error.message?.includes("Invalid login") ||
        error.message?.includes("invalid credentials") ||
        error.message?.includes("Invalid email")
      ) {
        message = "Nieprawidłowy email lub hasło. Spróbuj ponownie.";
      } else if (
        error.message?.includes("Email not confirmed") ||
        error.message?.includes("not confirmed")
      ) {
        message =
          "Email nie został jeszcze potwierdzony. Sprawdź skrzynkę pocztową.";
      } else if (
        error.message?.includes("rate") ||
        error.message?.includes("limit")
      ) {
        message = "Zbyt wiele prób logowania. Spróbuj ponownie za chwilę.";
      }

      return NextResponse.json({ error: message }, { status: 401 });
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        { error: "Nie udało się zalogować. Spróbuj ponownie." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.user_metadata?.full_name,
        role: data.user.user_metadata?.role,
      },
      token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    });
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
