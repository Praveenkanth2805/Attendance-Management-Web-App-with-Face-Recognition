"use client";
import { useEffect, useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import { useToast } from "./Toast";

type Item = { id: number; name: string };

export default function YearSelect({
  value,
  onChange,
  error,
}: {
  value: number | "";
  onChange: (v: number) => void;
  error?: string;
}) {
  const { show } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/years", { cache: "no-store" });
      if (!r.ok) throw new Error();
      setItems(await r.json());
    } catch {
      show("Unable to load years.", "error");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function create() {
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError("Year name is required.");
      return;
    }
    setCreating(true);
    setFormError(null);
    try {
      const r = await fetch("/api/years", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await r.json();
      if (!r.ok) {
        setFormError(data.error ?? "Unable to create year.");
        return;
      }
      setItems((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      onChange(data.id);
      setModalOpen(false);
      setName("");
      show("Year added.", "success");
    } catch {
      setFormError("Unable to create year. Try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <select
          className={`w-full rounded-lg border px-3 py-2 text-sm bg-white ${
            error ? "border-red-400" : "border-slate-300"
          }`}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={loading}
        >
          <option value="">{loading ? "Loading years..." : "Select a year"}</option>
          {items.map((it) => (
            <option key={it.id} value={it.id}>
              {it.name}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setFormError(null);
            setName("");
            setModalOpen(true);
          }}
          aria-label="Add year"
        >
          +
        </Button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      <Modal
        open={modalOpen}
        onClose={creating ? () => {} : () => setModalOpen(false)}
        title="Add Year"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={create} loading={creating} loadingText="Adding...">
              Add Year
            </Button>
          </>
        }
      >
        <label className="block text-sm font-medium text-slate-700 mb-1">Year Name</label>
        <input
          autoFocus
          className={`w-full rounded-lg border px-3 py-2 text-sm ${
            formError ? "border-red-400" : "border-slate-300"
          }`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. 2024"
          onKeyDown={(e) => e.key === "Enter" && create()}
        />
        {formError && <p className="mt-1 text-xs text-red-600">{formError}</p>}
      </Modal>
    </>
  );
}