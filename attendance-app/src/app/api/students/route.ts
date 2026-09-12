import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateGender, validateName, validateRegisterNumber } from "@/lib/validation";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();

    const where = q
      ? {
          OR: [
            { name: { contains: q } },
            { registerNumber: { contains: q } },
            { class: { name: { contains: q } } },
            { year: { name: { contains: q } } },
          ],
        }
      : {};

    const students = await prisma.student.findMany({
      where,
      include: { class: true, year: true },
      orderBy: { registerNumber: "asc" },
    });
    return NextResponse.json(students);
  } catch {
    return NextResponse.json({ error: "Unable to load students." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const regErr = validateRegisterNumber(body?.registerNumber);
    if (regErr) return NextResponse.json({ error: regErr, field: "registerNumber" }, { status: 400 });
    const nameErr = validateName(body?.name);
    if (nameErr) return NextResponse.json({ error: nameErr, field: "name" }, { status: 400 });
    const genderErr = validateGender(body?.gender);
    if (genderErr) return NextResponse.json({ error: genderErr, field: "gender" }, { status: 400 });

    const registerNumber = (body.registerNumber as string).trim();
    const name = (body.name as string).trim();
    const gender = body.gender as "MALE" | "FEMALE" | "OTHER";
    const classId = Number(body.classId);
    const yearId = Number(body.yearId);

    if (!Number.isInteger(classId) || classId <= 0)
      return NextResponse.json({ error: "Please select a valid class.", field: "classId" }, { status: 400 });
    if (!Number.isInteger(yearId) || yearId <= 0)
      return NextResponse.json({ error: "Please select a valid year.", field: "yearId" }, { status: 400 });

    const [cls, yr, existing] = await Promise.all([
      prisma.class.findUnique({ where: { id: classId } }),
      prisma.year.findUnique({ where: { id: yearId } }),
      prisma.student.findUnique({ where: { registerNumber } }),
    ]);

    if (!cls) return NextResponse.json({ error: "Selected class does not exist.", field: "classId" }, { status: 400 });
    if (!yr) return NextResponse.json({ error: "Selected year does not exist.", field: "yearId" }, { status: 400 });
    if (existing)
      return NextResponse.json({ error: "Register number already exists.", field: "registerNumber" }, { status: 409 });

    const created = await prisma.student.create({
      data: { registerNumber, name, gender, classId, yearId },
      include: { class: true, year: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002")
      return NextResponse.json({ error: "Register number already exists.", field: "registerNumber" }, { status: 409 });
    return NextResponse.json({ error: "Unable to create student." }, { status: 500 });
  }
}