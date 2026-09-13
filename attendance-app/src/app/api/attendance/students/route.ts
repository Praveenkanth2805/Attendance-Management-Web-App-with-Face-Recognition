import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { todayKey } from "@/lib/date";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") ?? todayKey();

    const [students, attendance] = await Promise.all([
      prisma.student.findMany({
        include: { class: true, year: true },
        orderBy: { registerNumber: "asc" },
      }),
      prisma.attendance.findMany({ where: { date } }),
    ]);

    const attendanceMap = new Map(
      attendance.map((a) => [a.registerNumber, a])
    );

    const rows = students.map((s) => {
      const att = attendanceMap.get(s.registerNumber);
      return {
        registerNumber: s.registerNumber,
        name: s.name,
        gender: s.gender,
        classId: s.classId,
        yearId: s.yearId,
        className: s.class.name,
        yearName: s.year.name,
        present: !!att,
        checkInTime: att?.checkInTime ?? null,
      };
    });

    return NextResponse.json({ date, rows });
  } catch {
    return NextResponse.json(
      { error: "Unable to load attendance." },
      { status: 500 }
    );
  }
}