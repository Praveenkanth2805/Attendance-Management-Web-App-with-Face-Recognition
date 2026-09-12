"use client";
import { useCallback, useEffect, useState } from "react";
import Button from "@/components/Button";
import Spinner from "@/components/Spinner";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { IconPlus, IconTrash, IconEdit } from "@/components/icons";

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

  // Modal state — shared for add & edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClassRow | null>(null); // null → add mode
  const [name, setName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ClassRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
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

  function openAdd() {
    setEditing(null);
    setName("");
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(c: ClassRow) {
    setEditing(c);
    setName(c.name);
    setFormError(null);
    setModalOpen(true);
  }

  async function save() {
    if (saving) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError("Class name is required.");
      return;
    }
    if (trimmed.length > 40) {
      setFormError("Class name must be at most 40 characters.");
      return;
    }

    setSaving(true);
    setFormError(null);

    const isEdit = !!editing;
    const url = isEdit ? `/api/classes/${editing!.id}` : "/api/classes";
    const method = isEdit ? "PUT" : "POST";

    try {
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setFormError(data.error ?? `Unable to ${isEdit ? "update" : "add"} class.`);
        return;
      }

      if (isEdit) {
        setClasses((prev) =>
          prev
            .map((c) => (c.id === editing!.id ? { ...c, name: data.name } : c))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
        show("Class updated.", "success");
      } else {
        setClasses((prev) =>
          [...prev, { ...data, _count: { students: 0 } }].sort((a, b) =>
            a.name.localeCompare(b.name)
          )
        );
        show("Class added.", "success");
      }
      setModalOpen(false);
      setEditing(null);
      setName("");
    } catch {
      setFormError(`Unable to ${isEdit ? "update" : "add"} class. Try again.`);
    } finally {
      setSaving(false);
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

  const isEdit = !!editing;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Classes</h1>
          <p className="text-sm text-slate-500">
            Add, rename, or remove classes available in the student form.
          </p>
        </div>
        <Button onClick={openAdd}>
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
          <p className="text-sm text-slate-500 mt-1">Add your first class to get started.</p>
          <div className="mt-4">
            <Button onClick={openAdd}>
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
            const deleteDisabled = count > 0;
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
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(c)}
                    title="Edit class"
                    className="p-2 rounded-lg text-slate-400 hover:bg-brand-50 hover:text-brand-700 transition"
                    aria-label={`Edit ${c.name}`}
                  >
                    <IconEdit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(c)}
                    disabled={deleteDisabled}
                    title={deleteDisabled ? "Remove students from this class first" : "Delete class"}
                    className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    aria-label={`Delete ${c.name}`}
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={saving ? () => {} : () => setModalOpen(false)}
        title={isEdit ? "Edit Class" : "Add Class"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving} loadingText={isEdit ? "Saving..." : "Adding..."}>
              {isEdit ? "Save Changes" : "Add Class"}
            </Button>
          </>
        }
      >
        <label className="block text-sm font-medium text-slate-700 mb-1">Class Name</label>
        <input
          autoFocus
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 outline-none ${
            formError
              ? "border-red-400 focus:border-red-500 focus:ring-red-100"
              : "border-slate-300 focus:border-brand-500 focus:ring-brand-100"
          }`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. CSE-A"
          maxLength={40}
          disabled={saving}
          onKeyDown={(e) => e.key === "Enter" && save()}
        />
        {formError && <p className="mt-1 text-xs text-red-600">{formError}</p>}
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