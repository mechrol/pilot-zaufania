import { NextRequest, NextResponse } from "next/server";  
 
export async function POST(request: NextRequest) { 
  try { 
    const body = await request.json(); 
    const { email, password } = body; 
    if (!email || !password) { 
      return NextResponse.json({ error: "Email i haslo sa wymagane" }, { status: 400 }); 
    } 
    if (email === "demo@pilotzaufania.pl" && password === "demo123") { 
      return NextResponse.json({ success: true, user: { id: "demo-001", email, name: "Jan Kowalski", role: "driver" }, token: "demo-jwt" }); 
    } 
    return NextResponse.json({ error: "Nieprawidlowy email lub haslo" }, { status: 401 }); 
  } catch { 
    return NextResponse.json({ error: "Blad serwera" }, { status: 500 }); 
  } 
}
