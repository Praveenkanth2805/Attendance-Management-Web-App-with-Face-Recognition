import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateLabel } from "@/lib/validation";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0)
      return NextResponse.json({ error: "Invalid year id." }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const err = validateLabel(body?.name, "Year");
    if (err) return NextResponse.json({ error: err, field: "name" }, { status: 400 });
    const name = (body.name as string).trim();

    const existing = await prisma.year.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Year not found." }, { status: 404 });

    // Duplicate check excluding self
    const clash = await prisma.year.findFirst({
      where: { name, NOT: { id } },
    });
    if (clash)
      return NextResponse.json({ error: "Year already exists.", field: "name" }, { status: 409 });

    const updated = await prisma.year.update({
      where: { id },
      data: { name },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.code === "P2002")
      return NextResponse.json({ error: "Year already exists.", field: "name" }, { status: 409 });
    return NextResponse.json({ error: "Unable to update year." }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0)
      return NextResponse.json({ error: "Invalid year id." }, { status: 400 });

    const year = await prisma.year.findUnique({
      where: { id },
      include: { _count: { select: { students: true } } },
    });
    if (!year) return NextResponse.json({ error: "Year not found." }, { status: 404 });

    if (year._count.students > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete — ${year._count.students} student${
            year._count.students === 1 ? "" : "s"
          } are still assigned to this year.`,
        },
        { status: 409 }
      );
    }

    await prisma.year.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete year." }, { status: 500 });
  }
}