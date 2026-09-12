import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encodeFace } from "@/lib/faceService";

export async function POST(req: Request, { params }: { params: { registerNumber: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const image = body?.image;
    if (typeof image !== "string" || image.length < 32)
      return NextResponse.json({ error: "No image provided." }, { status: 400 });

    const student = await prisma.student.findUnique({ where: { registerNumber: params.registerNumber } });
    if (!student) return NextResponse.json({ error: "Student not found." }, { status: 404 });

    let encoding: number[];
    try {
      encoding = await encodeFace(image);
    } catch (e: any) {
      return NextResponse.json(
        { error: e?.message ?? "Unable to register face. Try again." },
        { status: 422 }
      );
    }

    await prisma.student.update({
      where: { registerNumber: params.registerNumber },
      data: { faceEncoding: JSON.stringify(encoding) },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to register face. Try again." }, { status: 500 });
  }
}