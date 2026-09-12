import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateLabel } from "@/lib/validation";

export async function GET() {
  try {
    const years = await prisma.year.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(years);
  } catch {
    return NextResponse.json({ error: "Unable to load years." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const err = validateLabel(body?.name, "Year");
    if (err) return NextResponse.json({ error: err, field: "name" }, { status: 400 });
    const name = (body.name as string).trim();

    const exists = await prisma.year.findUnique({ where: { name } });
    if (exists) return NextResponse.json({ error: "Year already exists.", field: "name" }, { status: 409 });

    const created = await prisma.year.create({ data: { name } });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002")
      return NextResponse.json({ error: "Year already exists.", field: "name" }, { status: 409 });
    return NextResponse.json({ error: "Unable to create year." }, { status: 500 });
  }
}