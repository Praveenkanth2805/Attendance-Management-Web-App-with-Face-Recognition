"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "@/components/Button";
import Spinner from "@/components/Spinner";
import ConfirmDialog from "@/components/ConfirmDialog";
import StudentFormModal from "@/components/StudentFormModal";
import FaceRegisterModal from "@/components/FaceRegisterModal";
import { useToast } from "@/components/Toast";
import type { Gender } from "@/lib/validation";

type Student = {
  registerNumber: string;
  name: string;
  gender: Gender;
  classId: number;
  yearId: number;
  faceEncoding: string | null;
  class: { id: number; name: string };
  year: { id: number; name: string };
};

export default function StudentsPage() {
  const { show } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [faceTarget, setFaceTarget] = useState<Student | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/students", { cache: "no-store" });
      if (!r.ok) throw new Error();
      setStudents(await r.json());
    } catch {
      setError("Unable to load students. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.registerNumber.toLowerCase().includes(q) ||
        s.class.name.toLowerCase().includes(q) ||
        s.year.name.toLowerCase().includes(q)
    );
  }, [students, query]);

  function onSaved(saved: Student) {
    setStudents((prev) => {
      const idx = prev.findIndex((s) => s.registerNumber === saved.registerNumber);
      if (idx === -1)
        return [...prev, saved].sort((a, b) =>
          a.registerNumber.localeCompare(b.registerNumber)
        );
      const copy = [...prev];
      copy[idx] = saved;
      return copy;
    });
    setFormOpen(false);
    setEditing(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const r = await fetch(
        `/api/students/${encodeURIComponent(deleteTarget.registerNumber)}`,
        { method: "DELETE" }
      );
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        show(data.error ?? "Unable to delete student.", "error");
        return;
      }
      setStudents((prev) =>
        prev.filter((s) => s.registerNumber !== deleteTarget.registerNumber)
      );
      show("Student deleted.", "success");
      setDeleteTarget(null);
    } catch {
      show("Unable to delete student. Try again.", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <p className="text-sm text-slate-500">Manage students and register faces.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          + Add Student
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <input
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
          placeholder="Search by name, register number, class or year..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button variant="secondary" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      {loading && students.length === 0 && (
        <div className="rounded-2xl border border-brand-100 bg-white p-10 flex justify-center">
          <Spinner className="text-slate-400" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}{" "}
          <button onClick={load} className="font-semibold underline ml-1">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && students.length === 0 && (
        <div className="rounded-2xl border border-dashed border-brand-300 bg-white p-10 text-center">
          <p className="text-slate-700 font-medium">No students yet</p>
          <p className="text-sm text-slate-500 mt-1">
            Add your first student to get started.
          </p>
          <div className="mt-4">
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              + Add Student
            </Button>
          </div>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="rounded-2xl border border-brand-100 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-brand-50 text-brand-900">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Register No.</th>
                  <th className="text-left px-5 py-3 font-medium">Name</th>
                  <th className="text-left px-5 py-3 font-medium">Gender</th>
                  <th className="text-left px-5 py-3 font-medium">Class</th>
                  <th className="text-left px-5 py-3 font-medium">Year</th>
                  <th className="text-left px-5 py-3 font-medium">Face</th>
                  <th className="text-right px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.registerNumber}>
                    <td className="px-5 py-3 font-mono text-slate-700">
                      {s.registerNumber}
                    </td>
                    <td className="px-5 py-3 text-slate-900">{s.name}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          s.gender === "MALE"
                            ? "bg-sky-100 text-sky-700"
                            : s.gender === "FEMALE"
                            ? "bg-pink-100 text-pink-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {s.gender === "MALE"
                          ? "Male"
                          : s.gender === "FEMALE"
                          ? "Female"
                          : "Other"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{s.class.name}</td>
                    <td className="px-5 py-3 text-slate-600">{s.year.name}</td>
                    <td className="px-5 py-3">
                      {s.faceEncoding ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-700">
                          Registered
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          Not registered
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditing(s);
                            setFormOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setFaceTarget(s)}
                        >
                          {s.faceEncoding ? "Re-register face" : "Register face"}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setDeleteTarget(s)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && students.length > 0 && filtered.length === 0 && (
        <div className="rounded-2xl border border-brand-100 bg-white p-8 text-center text-sm text-slate-500">
          No students match &ldquo;{query}&rdquo;.
        </div>
      )}

      <StudentFormModal
        open={formOpen}
        initial={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSaved={onSaved}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Student"
        message={`Are you sure you want to delete "${deleteTarget?.name}" (${deleteTarget?.registerNumber})? This will also remove their attendance history.`}
        confirmText="Delete"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      {faceTarget && (
        <FaceRegisterModal
          open={!!faceTarget}
          registerNumber={faceTarget.registerNumber}
          studentName={faceTarget.name}
          onClose={() => setFaceTarget(null)}
          onDone={() => {
            setStudents((prev) =>
              prev.map((s) =>
                s.registerNumber === faceTarget.registerNumber
                  ? { ...s, faceEncoding: "registered" }
                  : s
              )
            );
            setFaceTarget(null);
          }}
        />
      )}
    </div>
  );
}