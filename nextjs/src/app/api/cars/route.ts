import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { carSchema } from "@/lib/validations";

const prisma = new PrismaClient();

export async function GET() {
  const cars = await prisma.car.findMany({ include: { driver: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(cars);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = carSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 });
    const car = await prisma.car.create({ data: parsed.data });
    return NextResponse.json(car, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
