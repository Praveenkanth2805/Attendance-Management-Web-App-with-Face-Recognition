import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { todayKey } from "@/lib/date";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const date = todayKey();
    const [totalStudents, presentToday, attendance] = await Promise.all([
      prisma.student.count(),
      prisma.attendance.count({ where: { date } }),
      prisma.attendance.findMany({
        where: { date },
        include: { student: { include: { class: true, year: true } } },
        orderBy: { checkInTime: "desc" },
      }),
    ]);

    const absentToday = Math.max(totalStudents - presentToday, 0);
    const percentage = totalStudents === 0 ? 0 : Math.round((presentToday / totalStudents) * 1000) / 10;

    return NextResponse.json({
      totalStudents,
      presentToday,
      absentToday,
      percentage,
      date,
      records: attendance.map((a) => ({
        id: a.id,
        registerNumber: a.registerNumber,
        name: a.student.name,
        className: a.student.class.name,
        yearName: a.student.year.name,
        checkInTime: a.checkInTime,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Unable to load dashboard." }, { status: 500 });
  }
}