import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recognizeFace } from "@/lib/faceService";
import { todayKey, nowTime } from "@/lib/date";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const image = body?.image;
    if (typeof image !== "string" || image.length < 32)
      return NextResponse.json({ error: "No image provided." }, { status: 400 });

    const students = await prisma.student.findMany({
      where: { faceEncoding: { not: null } },
      include: { class: true, year: true },
    });

    if (students.length === 0) {
      return NextResponse.json(
        { matched: false, reason: "No registered faces. Register a face first." },
        { status: 200 }
      );
    }

    const known = students
      .map((s) => {
        try {
          return { registerNumber: s.registerNumber, encoding: JSON.parse(s.faceEncoding ?? "[]") };
        } catch {
          return null;
        }
      })
      .filter(Boolean) as { registerNumber: string; encoding: number[] }[];

    let result;
    try {
      result = await recognizeFace(image, known);
    } catch (e: any) {
      return NextResponse.json({ error: e?.message ?? "Face recognition failed." }, { status: 502 });
    }

    if (!result.matched) {
      return NextResponse.json({ matched: false, reason: result.reason });
    }

    const student = students.find((s) => s.registerNumber === result.registerNumber);
    if (!student) return NextResponse.json({ matched: false, reason: "Face not recognized" });

    const date = todayKey();

    // Check duplicate — DB unique constraint is the source of truth
    const existing = await prisma.attendance.findUnique({
      where: { registerNumber_date: { registerNumber: student.registerNumber, date } },
    });

    if (existing) {
      return NextResponse.json({
        matched: true,
        duplicate: true,
        student: {
  registerNumber: student.registerNumber,
  name: student.name,
  gender: student.gender,
  className: student.class.name,
  yearName: student.year.name,
},
        checkInTime: existing.checkInTime,
        message: "Attendance already marked for today.",
      });
    }

    const time = nowTime();
    let created;
    try {
      created = await prisma.attendance.create({
        data: { registerNumber: student.registerNumber, date, checkInTime: time },
      });
    } catch (e: any) {
      if (e?.code === "P2002") {
        return NextResponse.json({
          matched: true,
          duplicate: true,
          student: {
  registerNumber: student.registerNumber,
  name: student.name,
  gender: student.gender,
  className: student.class.name,
  yearName: student.year.name,
},
          checkInTime: time,
          message: "Attendance already marked for today.",
        });
      }
      throw e;
    }

    return NextResponse.json({
      matched: true,
      duplicate: false,
      marked: true,
      student: {
  registerNumber: student.registerNumber,
  name: student.name,
  gender: student.gender,
  className: student.class.name,
  yearName: student.year.name,
},
      checkInTime: created.checkInTime,
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong while marking attendance." }, { status: 500 });
  }
}