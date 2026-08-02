import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { driverSchema } from "@/lib/validations";

const prisma = new PrismaClient();

export async function GET() {
  const drivers = await prisma.driver.findMany({ include: { cars: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(drivers);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = driverSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 });
    const driver = await prisma.driver.create({ data: parsed.data });
    return NextResponse.json(driver, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
