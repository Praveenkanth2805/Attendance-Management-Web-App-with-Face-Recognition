import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0)
      return NextResponse.json({ error: "Invalid class id." }, { status: 400 });

    const cls = await prisma.class.findUnique({
      where: { id },
      include: { _count: { select: { students: true } } },
    });
    if (!cls) return NextResponse.json({ error: "Class not found." }, { status: 404 });

    if (cls._count.students > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete — ${cls._count.students} student${
            cls._count.students === 1 ? "" : "s"
          } are still assigned to this class.`,
        },
        { status: 409 }
      );
    }

    await prisma.class.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete class." }, { status: 500 });
  }
}