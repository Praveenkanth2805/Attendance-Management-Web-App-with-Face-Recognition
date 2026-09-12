"use client";
import { useCallback, useEffect, useState } from "react";
import Button from "@/components/Button";
import Spinner from "@/components/Spinner";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { IconPlus, IconTrash, IconEdit } from "@/components/icons";

type YearRow = {
  id: number;
  name: string;
  _count?: { students: number };
};

export default function YearsPage() {
  const { show } = useToast();

  const [years, setYears] = useState<YearRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<YearRow | null>(null);
  const [name, setName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<YearRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [yRes, sRes] = await Promise.all([
        fetch("/api/years", { cache: "no-store" }),
        fetch("/api/students", { cache: "no-store" }),
      ]);
      if (!yRes.ok || !sRes.ok) throw new Error();
      const yearsData: { id: number; name: string }[] = await yRes.json();
      const studentsData: { yearId: number }[] = await sRes.json();

      const counts = new Map<number, number>();
      for (const s of studentsData) {
        counts.set(s.yearId, (counts.get(s.yearId) ?? 0) + 1);
      }

      setYears(
        yearsData
          .map((y) => ({ ...y, _count: { students: counts.get(y.id) ?? 0 } }))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
    } catch {
      setError("Unable to load years. Try again.");
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

  function openEdit(y: YearRow) {
    setEditing(y);
    setName(y.name);
    setFormError(null);
    setModalOpen(true);
  }

  async function save() {
    if (saving) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError("Year name is required.");
      return;
    }
    if (trimmed.length > 40) {
      setFormError("Year name must be at most 40 characters.");
      return;
    }

    setSaving(true);
    setFormError(null);

    const isEdit = !!editing;
    const url = isEdit ? `/api/years/${editing!.id}` : "/api/years";
    const method = isEdit ? "PUT" : "POST";

    try {
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setFormError(data.error ?? `Unable to ${isEdit ? "update" : "add"} year.`);
        return;
      }

      if (isEdit) {
        setYears((prev) =>
          prev
            .map((y) => (y.id === editing!.id ? { ...y, name: data.name } : y))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
        show("Year updated.", "success");
      } else {
        setYears((prev) =>
          [...prev, { ...data, _count: { students: 0 } }].sort((a, b) =>
            a.name.localeCompare(b.name)
          )
        );
        show("Year added.", "success");
      }
      setModalOpen(false);
      setEditing(null);
      setName("");
    } catch {
      setFormError(`Unable to ${isEdit ? "update" : "add"} year. Try again.`);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const r = await fetch(`/api/years/${deleteTarget.id}`, { method: "DELETE" });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        show(data.error ?? "Unable to delete year.", "error");
        return;
      }
      setYears((prev) => prev.filter((y) => y.id !== deleteTarget.id));
      show("Year deleted.", "success");
      setDeleteTarget(null);
    } catch {
      show("Unable to delete year. Try again.", "error");
    } finally {
      setDeleting(false);
    }
  }

  const isEdit = !!editing;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Years</h1>
          <p className="text-sm text-slate-500">
            Add, rename, or remove years available in the student form.
          </p>
        </div>
        <Button onClick={openAdd}>
          <IconPlus className="h-4 w-4" />
          Add Year
        </Button>
      </div>

      {loading && years.length === 0 && (
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

      {!loading && !error && years.length === 0 && (
        <div className="rounded-2xl border border-dashed border-brand-300 bg-white p-10 text-center">
          <p className="text-slate-700 font-medium">No years yet</p>
          <p className="text-sm text-slate-500 mt-1">Add your first year to get started.</p>
          <div className="mt-4">
            <Button onClick={openAdd}>
              <IconPlus className="h-4 w-4" />
              Add Year
            </Button>
          </div>
        </div>
      )}

      {years.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {years.map((y) => {
            const count = y._count?.students ?? 0;
            const deleteDisabled = count > 0;
            return (
              <div
                key={y.id}
                className="rounded-2xl border border-brand-100 bg-white p-5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{y.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {count} student{count === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(y)}
                    title="Edit year"
                    className="p-2 rounded-lg text-slate-400 hover:bg-brand-50 hover:text-brand-700 transition"
                    aria-label={`Edit ${y.name}`}
                  >
                    <IconEdit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(y)}
                    disabled={deleteDisabled}
                    title={deleteDisabled ? "Remove students from this year first" : "Delete year"}
                    className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    aria-label={`Delete ${y.name}`}
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
        title={isEdit ? "Edit Year" : "Add Year"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving} loadingText={isEdit ? "Saving..." : "Adding..."}>
              {isEdit ? "Save Changes" : "Add Year"}
            </Button>
          </>
        }
      >
        <label className="block text-sm font-medium text-slate-700 mb-1">Year Name</label>
        <input
          autoFocus
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 outline-none ${
            formError
              ? "border-red-400 focus:border-red-500 focus:ring-red-100"
              : "border-slate-300 focus:border-brand-500 focus:ring-brand-100"
          }`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. 2024"
          maxLength={40}
          disabled={saving}
          onKeyDown={(e) => e.key === "Enter" && save()}
        />
        {formError && <p className="mt-1 text-xs text-red-600">{formError}</p>}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Year"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmText="Delete"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}