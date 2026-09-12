const FACE_URL = process.env.FACE_SERVICE_URL ?? "http://127.0.0.1:8000";

export type KnownFace = { registerNumber: string; encoding: number[] };

export type RecognizeResult =
  | { matched: true; registerNumber: string; distance: number }
  | { matched: false; reason: string };

async function parseError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
    if (typeof data?.error === "string") return data.error;
  } catch {}
  return fallback;
}

export async function encodeFace(image: string): Promise<number[]> {
  let res: Response;
  try {
    res = await fetch(`${FACE_URL}/encode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image }),
      cache: "no-store",
    });
  } catch {
    throw new Error("Face service is unreachable. Make sure the Python service is running.");
  }
  if (!res.ok) throw new Error(await parseError(res, "Unable to extract face features."));
  const data = (await res.json()) as { encoding: number[] };
  if (!Array.isArray(data.encoding)) throw new Error("Invalid face encoding received.");
  return data.encoding;
}

export async function recognizeFace(image: string, known: KnownFace[]): Promise<RecognizeResult> {
  let res: Response;
  try {
    res = await fetch(`${FACE_URL}/recognize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, known }),
      cache: "no-store",
    });
  } catch {
    throw new Error("Face service is unreachable.");
  }
  if (!res.ok) throw new Error(await parseError(res, "Face recognition failed."));
  return (await res.json()) as RecognizeResult;
}