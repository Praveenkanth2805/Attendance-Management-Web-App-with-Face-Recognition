"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/components/Button";
import Spinner from "@/components/Spinner";
import { useToast } from "@/components/Toast";

type AttendanceRow = {
  id: number;
  registerNumber: string;
  checkInTime: string;
  student: {
    name: string;
    class: { name: string };
    year: { name: string };
  };
};

type RecognitionState =
  | { kind: "idle" }
  | { kind: "processing" }
  | { kind: "unknown"; reason: string }
  | {
      kind: "matched";
      student: { registerNumber: string; name: string; gender: string; className: string; yearName: string };
      checkInTime: string;
      duplicate: boolean;
    }
  | { kind: "error"; message: string };

export default function AttendancePage() {
  const { show } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlightRef = useRef(false);
  const lastNotifiedRef = useRef<string | null>(null);

  const [cameraState, setCameraState] = useState<"idle" | "starting" | "active" | "error">("idle");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<RecognitionState>({ kind: "idle" });

  const [today, setToday] = useState<AttendanceRow[]>([]);
  const [loadingToday, setLoadingToday] = useState(true);
  const [todayError, setTodayError] = useState<string | null>(null);

  const loadToday = useCallback(async () => {
    setLoadingToday(true);
    setTodayError(null);
    try {
      const r = await fetch("/api/attendance", { cache: "no-store" });
      if (!r.ok) throw new Error();
      setToday(await r.json());
    } catch {
      setTodayError("Unable to load today's attendance. Try again.");
    } finally {
      setLoadingToday(false);
    }
  }, []);

  useEffect(() => { loadToday(); }, [loadToday]);
  useEffect(() => { return () => stopCamera(); }, []);

  function stopCamera() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraState("idle");
    setRecognition({ kind: "idle" });
  }

  async function startCamera() {
    if (cameraState === "starting" || cameraState === "active") return;
    setCameraState("starting");
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState("active");
      intervalRef.current = setInterval(captureAndRecognize, 2500);
    } catch {
      setCameraState("error");
      setCameraError("Unable to access camera. Please allow camera permissions and try again.");
    }
  }

  async function captureAndRecognize() {
    if (inFlightRef.current) return;
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    inFlightRef.current = true;
    setRecognition((prev) => (prev.kind === "processing" ? prev : { kind: "processing" }));

    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

      const r = await fetch("/api/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await r.json().catch(() => ({}));

      if (!r.ok) { setRecognition({ kind: "error", message: data.error ?? "Recognition failed." }); return; }
      if (!data.matched) { setRecognition({ kind: "unknown", reason: data.reason ?? "Face not recognized" }); return; }

      setRecognition({
        kind: "matched",
        student: data.student,
        checkInTime: data.checkInTime,
        duplicate: !!data.duplicate,
      });

      const key = `${data.student.registerNumber}:${data.duplicate ? "dup" : "new"}`;
      if (lastNotifiedRef.current !== key) {
        lastNotifiedRef.current = key;
        if (data.duplicate) show(`Attendance already marked for ${data.student.name}.`, "info");
        else { show(`Attendance marked for ${data.student.name}.`, "success"); loadToday(); }
      }
    } catch {
      setRecognition({ kind: "error", message: "Network error. Retrying..." });
    } finally {
      inFlightRef.current = false;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mark Attendance</h1>
        <p className="text-sm text-slate-500">
          Start the camera. Attendance is marked automatically when a registered face is detected.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-brand-100 bg-white overflow-hidden">
          <div className="relative aspect-video bg-slate-900">
            <video ref={videoRef} autoPlay playsInline muted
              className={`w-full h-full object-cover ${cameraState === "active" ? "" : "opacity-40"}`} />
            {cameraState !== "active" && (
              <div className="absolute inset-0 flex items-center justify-center text-white text-sm text-center px-6">
                {cameraState === "starting" ? "Starting camera..." : cameraState === "error" ? cameraError : "Camera is off"}
              </div>
            )}
            {cameraState === "active" && recognition.kind === "processing" && (
              <div className="absolute top-3 right-3 inline-flex items-center gap-2 rounded-full bg-black/60 text-white text-xs px-3 py-1.5">
                <Spinner /> Scanning...
              </div>
            )}
          </div>
          <div className="p-4 flex items-center justify-between gap-3">
            {cameraState === "active" ? (
              <Button variant="danger" onClick={stopCamera}>Stop Camera</Button>
            ) : (
              <Button onClick={startCamera} loading={cameraState === "starting"} loadingText="Starting...">
                Start Camera
              </Button>
            )}
            <span className="text-xs text-slate-500">
              {cameraState === "active" ? "Auto-scanning every 2.5s" : "Idle"}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-white p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Recognition Status</h2>

          {recognition.kind === "idle" && (
            <p className="text-sm text-slate-500">Start the camera to begin recognition.</p>
          )}
          {recognition.kind === "processing" && (
            <p className="text-sm text-slate-500 inline-flex items-center gap-2">
              <Spinner className="text-slate-400" /> Processing frame...
            </p>
          )}
          {recognition.kind === "unknown" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold">Face not recognized</p>
              <p className="mt-0.5">{recognition.reason}. Make sure the student's face is registered.</p>
            </div>
          )}
          {recognition.kind === "error" && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {recognition.message}
            </div>
          )}
          {recognition.kind === "matched" && (
            <div className={`rounded-xl border p-4 ${
              recognition.duplicate ? "border-slate-200 bg-slate-50" : "border-brand-200 bg-brand-50"
            }`}>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-900">{recognition.student.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  recognition.duplicate ? "bg-slate-200 text-slate-700" : "bg-brand-600 text-white"
                }`}>
                  {recognition.duplicate ? "Already marked" : "Present"}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div><dt className="text-slate-500 text-xs">Register No.</dt>
                  <dd className="font-mono text-slate-800">{recognition.student.registerNumber}</dd></div>
                <div><dt className="text-slate-500 text-xs">Class</dt>
                  <dd className="text-slate-800">{recognition.student.className}</dd></div>
                <div><dt className="text-slate-500 text-xs">Year</dt>
                  <dd className="text-slate-800">{recognition.student.yearName}</dd></div>
                <div><dt className="text-slate-500 text-xs">Check-in</dt>
                  <dd className="text-slate-800">{recognition.checkInTime}</dd></div>
              </dl>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-brand-100 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-brand-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Today's Attendance</h2>
          <button onClick={loadToday} disabled={loadingToday}
            className="text-xs text-slate-500 hover:text-brand-700 disabled:opacity-50">Refresh</button>
        </div>
        {loadingToday && today.length === 0 && (
          <div className="p-8 flex justify-center"><Spinner className="text-slate-400" /></div>
        )}
        {todayError && <div className="p-4 text-sm text-red-700 bg-red-50">{todayError}</div>}
        {!loadingToday && !todayError && today.length === 0 && (
          <div className="p-10 text-center text-sm text-slate-500">No attendance marked yet today.</div>
        )}
        {today.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-brand-50 text-brand-900">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Register No.</th>
                  <th className="text-left px-5 py-3 font-medium">Name</th>
                  <th className="text-left px-5 py-3 font-medium">Class</th>
                  <th className="text-left px-5 py-3 font-medium">Year</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium">Check-in</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {today.map((r) => (
                  <tr key={r.id}>
                    <td className="px-5 py-3 font-mono text-slate-700">{r.registerNumber}</td>
                    <td className="px-5 py-3 text-slate-900">{r.student.name}</td>
                    <td className="px-5 py-3 text-slate-600">{r.student.class.name}</td>
                    <td className="px-5 py-3 text-slate-600">{r.student.year.name}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-700">
                        Present
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{r.checkInTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}