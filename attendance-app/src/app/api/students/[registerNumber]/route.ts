import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateGender, validateName } from "@/lib/validation";

export async function GET(_: Request, { params }: { params: { registerNumber: string } }) {
  const student = await prisma.student.findUnique({
    where: { registerNumber: params.registerNumber },
    include: { class: true, year: true },
  });
  if (!student) return NextResponse.json({ error: "Student not found." }, { status: 404 });
  return NextResponse.json(student);
}

export async function PUT(req: Request, { params }: { params: { registerNumber: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const nameErr = validateName(body?.name);
    if (nameErr) return NextResponse.json({ error: nameErr, field: "name" }, { status: 400 });
    const genderErr = validateGender(body?.gender);
    if (genderErr) return NextResponse.json({ error: genderErr, field: "gender" }, { status: 400 });

    const name = (body.name as string).trim();
    const gender = body.gender as "MALE" | "FEMALE" | "OTHER";
    const classId = Number(body.classId);
    const yearId = Number(body.yearId);

    if (!Number.isInteger(classId) || classId <= 0)
      return NextResponse.json({ error: "Please select a valid class.", field: "classId" }, { status: 400 });
    if (!Number.isInteger(yearId) || yearId <= 0)
      return NextResponse.json({ error: "Please select a valid year.", field: "yearId" }, { status: 400 });

    const [existing, cls, yr] = await Promise.all([
      prisma.student.findUnique({ where: { registerNumber: params.registerNumber } }),
      prisma.class.findUnique({ where: { id: classId } }),
      prisma.year.findUnique({ where: { id: yearId } }),
    ]);

    if (!existing) return NextResponse.json({ error: "Student not found." }, { status: 404 });
    if (!cls) return NextResponse.json({ error: "Selected class does not exist.", field: "classId" }, { status: 400 });
    if (!yr) return NextResponse.json({ error: "Selected year does not exist.", field: "yearId" }, { status: 400 });

    const updated = await prisma.student.update({
      where: { registerNumber: params.registerNumber },
      data: { name, gender, classId, yearId },
      include: { class: true, year: true },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Unable to update student." }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { registerNumber: string } }) {
  try {
    const existing = await prisma.student.findUnique({ where: { registerNumber: params.registerNumber } });
    if (!existing) return NextResponse.json({ error: "Student not found." }, { status: 404 });
    await prisma.student.delete({ where: { registerNumber: params.registerNumber } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete student." }, { status: 500 });
  }
}