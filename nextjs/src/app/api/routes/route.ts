import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { routeSchema } from "@/lib/validations";

const prisma = new PrismaClient();

export async function GET() {
  const routes = await prisma.route.findMany({
    include: { waypoints: { orderBy: { order: "asc" } }, passenger: true, driver: true, car: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(routes);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = routeSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 });
    const { waypoints, ...routeData } = parsed.data;
    const route = await prisma.route.create({
      data: { ...routeData, waypoints: { create: waypoints } },
      include: { waypoints: true },
    });
    return NextResponse.json(route, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
