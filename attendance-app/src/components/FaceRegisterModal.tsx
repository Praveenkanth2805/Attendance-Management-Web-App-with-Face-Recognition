"use client";
import { useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import { useToast } from "./Toast";

export default function FaceRegisterModal({
  open,
  registerNumber,
  studentName,
  onClose,
  onDone,
}: {
  open: boolean;
  registerNumber: string;
  studentName: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const { show } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<"idle" | "starting" | "active" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setState("idle");
    setErrorMsg(null);
    return () => stopStream();
  }, [open]);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function start() {
    setState("starting");
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState("active");
    } catch {
      setState("error");
      setErrorMsg("Unable to access camera. Please allow camera permissions.");
    }
  }

  function capture(): string | null {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.85);
  }

  async function register() {
    if (saving) return;
    const image = capture();
    if (!image) {
      setErrorMsg("Camera is not ready yet.");
      return;
    }
    setSaving(true);
    setErrorMsg(null);
    try {
      const r = await fetch(`/api/students/${encodeURIComponent(registerNumber)}/face`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErrorMsg(data.error ?? "Unable to register face. Try again.");
        show(data.error ?? "Unable to register face. Try again.", "error");
        return;
      }
      show("Face registered successfully.", "success");
      stopStream();
      onDone();
    } catch {
      setErrorMsg("Unable to register face. Try again.");
      show("Unable to register face. Try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function close() {
    stopStream();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : close}
      title={`Register Face — ${studentName}`}
      maxWidth="max-w-xl"
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={saving}>
            Close
          </Button>
          {state === "active" && (
            <Button onClick={register} loading={saving} loadingText="Registering...">
              Capture &amp; Register
            </Button>
          )}
          {state !== "active" && (
            <Button onClick={start} loading={state === "starting"} loadingText="Starting...">
              Start Camera
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-3">
        <div className="relative w-full aspect-video bg-slate-900 rounded-xl overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${state === "active" ? "" : "opacity-40"}`}
          />
          {state !== "active" && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
              {state === "starting" ? "Starting camera..." : state === "error" ? "Camera unavailable" : "Camera is off"}
            </div>
          )}
        </div>
        <p className="text-xs text-slate-500">
          Face the camera directly in a well-lit area. Only one person should be visible.
        </p>
        {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
      </div>
    </Modal>
  );
}