import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { todayKey } from "@/lib/date";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") ?? todayKey();

    const records = await prisma.attendance.findMany({
      where: { date },
      include: { student: { include: { class: true, year: true } } },
      orderBy: { checkInTime: "desc" },
    });
    return NextResponse.json(records);
  } catch {
    return NextResponse.json({ error: "Unable to load attendance." }, { status: 500 });
  }
}