import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { todayKey, nowTime } from "@/lib/date";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const registerNumber =
      typeof body?.registerNumber === "string" ? body.registerNumber.trim() : "";
    const status = body?.status;

    if (!registerNumber)
      return NextResponse.json(
        { error: "Register number is required." },
        { status: 400 }
      );

    if (status !== "present" && status !== "absent")
      return NextResponse.json(
        { error: "Status must be 'present' or 'absent'." },
        { status: 400 }
      );

    const student = await prisma.student.findUnique({
      where: { registerNumber },
    });
    if (!student)
      return NextResponse.json(
        { error: "Student not found." },
        { status: 404 }
      );

    const date = todayKey();

    if (status === "present") {
      const time = nowTime();
      const row = await prisma.attendance.upsert({
        where: { registerNumber_date: { registerNumber, date } },
        update: { checkInTime: time },
        create: { registerNumber, date, checkInTime: time },
      });
      return NextResponse.json({
        ok: true,
        present: true,
        checkInTime: row.checkInTime,
      });
    }

    // status === "absent"
    await prisma.attendance.deleteMany({
      where: { registerNumber, date },
    });
    return NextResponse.json({ ok: true, present: false, checkInTime: null });
  } catch {
    return NextResponse.json(
      { error: "Unable to update attendance." },
      { status: 500 }
    );
  }
}