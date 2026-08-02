import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { passengerSchema } from "@/lib/validations";

const prisma = new PrismaClient();

export async function GET() {
  const passengers = await prisma.passenger.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(passengers);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = passengerSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 });
    const passenger = await prisma.passenger.create({ data: parsed.data });
    return NextResponse.json(passenger, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
