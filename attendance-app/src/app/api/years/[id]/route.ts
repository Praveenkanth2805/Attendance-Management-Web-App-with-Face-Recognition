import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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