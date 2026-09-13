import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encodeFace } from "@/lib/faceService";

// Same threshold as Python service
const FACE_MATCH_THRESHOLD = 0.55;

/** Euclidean distance between two 128-d vectors */
function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

export async function POST(
  req: Request,
  { params }: { params: { registerNumber: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const image = body?.image;
    if (typeof image !== "string" || image.length < 32)
      return NextResponse.json({ error: "No image provided." }, { status: 400 });

    const student = await prisma.student.findUnique({
      where: { registerNumber: params.registerNumber },
    });
    if (!student)
      return NextResponse.json({ error: "Student not found." }, { status: 404 });

    // 1) Extract encoding from image via Python service
    let encoding: number[];
    try {
      encoding = await encodeFace(image);
    } catch (e: any) {
      return NextResponse.json(
        { error: e?.message ?? "Unable to register face. Try again." },
        { status: 422 }
      );
    }

    // 2) Check against all other students' encodings
    const others = await prisma.student.findMany({
      where: {
        faceEncoding: { not: null },
        NOT: { registerNumber: params.registerNumber },
      },
      select: {
        registerNumber: true,
        name: true,
        faceEncoding: true,
      },
    });

    let closestMatch: { registerNumber: string; name: string; distance: number } | null = null;

    for (const other of others) {
      if (!other.faceEncoding) continue;
      let known: number[];
      try {
        known = JSON.parse(other.faceEncoding);
      } catch {
        continue;
      }
      if (!Array.isArray(known) || known.length !== encoding.length) continue;

      const dist = euclideanDistance(encoding, known);
      if (dist < FACE_MATCH_THRESHOLD) {
        if (!closestMatch || dist < closestMatch.distance) {
          closestMatch = {
            registerNumber: other.registerNumber,
            name: other.name,
            distance: dist,
          };
        }
      }
    }

    if (closestMatch) {
      return NextResponse.json(
        {
          error: `This face is already registered to ${closestMatch.name} (${closestMatch.registerNumber}). Each student must have a unique face.`,
          conflict: {
            registerNumber: closestMatch.registerNumber,
            name: closestMatch.name,
          },
        },
        { status: 409 }
      );
    }

    // 3) Save encoding
    await prisma.student.update({
      where: { registerNumber: params.registerNumber },
      data: { faceEncoding: JSON.stringify(encoding) },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to register face. Try again." },
      { status: 500 }
    );
  }
}