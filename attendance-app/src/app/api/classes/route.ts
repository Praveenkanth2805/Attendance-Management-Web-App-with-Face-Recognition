import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateLabel } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const classes = await prisma.class.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(classes);
  } catch {
    return NextResponse.json({ error: "Unable to load classes." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const err = validateLabel(body?.name, "Class");
    if (err) return NextResponse.json({ error: err, field: "name" }, { status: 400 });
    const name = (body.name as string).trim();

    const exists = await prisma.class.findUnique({ where: { name } });
    if (exists) return NextResponse.json({ error: "Class already exists.", field: "name" }, { status: 409 });

    const created = await prisma.class.create({ data: { name } });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002")
      return NextResponse.json({ error: "Class already exists.", field: "name" }, { status: 409 });
    return NextResponse.json({ error: "Unable to create class." }, { status: 500 });
  }
}