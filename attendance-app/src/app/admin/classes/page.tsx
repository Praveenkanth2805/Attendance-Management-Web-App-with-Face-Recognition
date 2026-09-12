"use client";
import { useCallback, useEffect, useState } from "react";
import Button from "@/components/Button";
import Spinner from "@/components/Spinner";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { IconPlus, IconTrash } from "@/components/icons";

type ClassRow = {
  id: number;
  name: string;
  _count?: { students: number };
};

export default function ClassesPage() {
  const { show } = useToast();

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ClassRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Uses /api/classes (already returns all classes)
      // Fetch students in parallel to compute per-class counts
      const [cRes, sRes] = await Promise.all([
        fetch("/api/classes", { cache: "no-store" }),
        fetch("/api/students", { cache: "no-store" }),
      ]);
      if (!cRes.ok || !sRes.ok) throw new Error();
      const classesData: { id: number; name: string }[] = await cRes.json();
      const studentsData: { classId: number }[] = await sRes.json();

      const counts = new Map<number, number>();
      for (const s of studentsData) {
        counts.set(s.classId, (counts.get(s.classId) ?? 0) + 1);
      }

      setClasses(
        classesData
          .map((c) => ({ ...c, _count: { students: counts.get(c.id) ?? 0 } }))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
    } catch {
      setError("Unable to load classes. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    const trimmed = newName.trim();
    if (!trimmed) {
      setAddError("Class name is required.");
      return;
    }
    if (trimmed.length > 40) {
      setAddError("Class name must be at most 40 characters.");
      return;
    }
    setAdding(true);
    setAddError(null);
    try {
      const r = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setAddError(data.error ?? "Unable to add class.");
        return;
      }
      setClasses((prev) =>
        [...prev, { ...data, _count: { students: 0 } }].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );
      setNewName("");
      setAddOpen(false);
      show("Class added.", "success");
    } catch {
      setAddError("Unable to add class. Try again.");
    } finally {
      setAdding(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const r = await fetch(`/api/classes/${deleteTarget.id}`, { method: "DELETE" });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        show(data.error ?? "Unable to delete class.", "error");
        return;
      }
      setClasses((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      show("Class deleted.", "success");
      setDeleteTarget(null);
    } catch {
      show("Unable to delete class. Try again.", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Classes</h1>
          <p className="text-sm text-slate-500">
            Add or remove classes available in the student form.
          </p>
        </div>
        <Button onClick={() => { setNewName(""); setAddError(null); setAddOpen(true); }}>
          <IconPlus className="h-4 w-4" />
          Add Class
        </Button>
      </div>

      {loading && classes.length === 0 && (
        <div className="rounded-2xl border border-brand-100 bg-white p-10 flex justify-center">
          <Spinner className="text-slate-400" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}{" "}
          <button onClick={load} className="font-semibold underline ml-1">Retry</button>
        </div>
      )}

      {!loading && !error && classes.length === 0 && (
        <div className="rounded-2xl border border-dashed border-brand-300 bg-white p-10 text-center">
          <p className="text-slate-700 font-medium">No classes yet</p>
          <p className="text-sm text-slate-500 mt-1">
            Add your first class to get started.
          </p>
          <div className="mt-4">
            <Button onClick={() => setAddOpen(true)}>
              <IconPlus className="h-4 w-4" />
              Add Class
            </Button>
          </div>
        </div>
      )}

      {classes.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c) => {
            const count = c._count?.students ?? 0;
            const disabled = count > 0;
            return (
              <div
                key={c.id}
                className="rounded-2xl border border-brand-100 bg-white p-5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{c.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {count} student{count === 1 ? "" : "s"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(c)}
                  disabled={disabled}
                  title={disabled ? "Remove students from this class first" : "Delete class"}
                  className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400"
                  aria-label={`Delete ${c.name}`}
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={addOpen}
        onClose={adding ? () => {} : () => setAddOpen(false)}
        title="Add Class"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)} disabled={adding}>
              Cancel
            </Button>
            <Button onClick={add} loading={adding} loadingText="Adding...">
              Add Class
            </Button>
          </>
        }
      >
        <label className="block text-sm font-medium text-slate-700 mb-1">Class Name</label>
        <input
          autoFocus
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 outline-none ${
            addError
              ? "border-red-400 focus:border-red-500 focus:ring-red-100"
              : "border-slate-300 focus:border-brand-500 focus:ring-brand-100"
          }`}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="e.g. CSE-A"
          maxLength={40}
          disabled={adding}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        {addError && <p className="mt-1 text-xs text-red-600">{addError}</p>}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Class"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmText="Delete"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}