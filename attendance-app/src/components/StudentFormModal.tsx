"use client";
import { useEffect, useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import ClassSelect from "./ClassSelect";
import YearSelect from "./YearSelect";
import { useToast } from "./Toast";
import { GENDERS, GENDER_LABELS, validateGender, validateName, validateRegisterNumber, type Gender } from "@/lib/validation";

type Student = {
  registerNumber: string;
  name: string;
  gender: Gender;
  classId: number;
  yearId: number;
};

export default function StudentFormModal({
  open,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean;
  initial?: Student | null;
  onClose: () => void;
  onSaved: (student: any) => void;
}) {
  const { show } = useToast();
  const isEdit = !!initial;

  const [registerNumber, setRegisterNumber] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [classId, setClassId] = useState<number | "">("");
  const [yearId, setYearId] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setRegisterNumber(initial.registerNumber);
      setName(initial.name);
      setGender(initial.gender);
      setClassId(initial.classId);
      setYearId(initial.yearId);
    } else {
      setRegisterNumber("");
      setName("");
      setGender("");
      setClassId("");
      setYearId("");
    }
    setErrors({});
  }, [open, initial]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!isEdit) {
      const r = validateRegisterNumber(registerNumber);
      if (r) e.registerNumber = r;
    }
    const n = validateName(name);
    if (n) e.name = n;
    const g = validateGender(gender);
    if (g) e.gender = g;
    if (classId === "" || Number(classId) <= 0) e.classId = "Please select a class.";
    if (yearId === "" || Number(yearId) <= 0) e.yearId = "Please select a year.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (saving) return;
    if (!validate()) return;
    setSaving(true);
    try {
      const url = isEdit ? `/api/students/${encodeURIComponent(initial!.registerNumber)}` : "/api/students";
      const method = isEdit ? "PUT" : "POST";
      const body = isEdit
        ? { name: name.trim(), gender, classId, yearId }
        : { registerNumber: registerNumber.trim(), name: name.trim(), gender, classId, yearId };

      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (data.field) setErrors((prev) => ({ ...prev, [data.field]: data.error }));
        else setErrors((prev) => ({ ...prev, form: data.error ?? "Unable to save student." }));
        show(data.error ?? "Unable to save student.", "error");
        return;
      }
      onSaved(data);
      show(isEdit ? "Student updated." : "Student added.", "success");
    } catch {
      setErrors((prev) => ({ ...prev, form: "Network error. Try again." }));
      show("Unable to save student. Try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : onClose}
      title={isEdit ? "Edit Student" : "Add Student"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving} loadingText="Saving...">
            {isEdit ? "Save Changes" : "Add Student"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Register Number</label>
          <input
            className={`w-full rounded-lg border px-3 py-2 text-sm ${
              errors.registerNumber ? "border-red-400" : "border-slate-300"
            } ${isEdit ? "bg-slate-100 text-slate-500" : ""}`}
            value={registerNumber}
            disabled={isEdit || saving}
            onChange={(e) => setRegisterNumber(e.target.value)}
            placeholder="e.g. CS2021001"
            maxLength={20}
          />
          {errors.registerNumber && <p className="mt-1 text-xs text-red-600">{errors.registerNumber}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
          <input
            className={`w-full rounded-lg border px-3 py-2 text-sm ${
              errors.name ? "border-red-400" : "border-slate-300"
            }`}
            value={name}
            disabled={saving}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            maxLength={80}
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
          <div className="grid grid-cols-3 gap-2">
            {GENDERS.map((g) => {
              const selected = gender === g;
              return (
                <button
                  key={g}
                  type="button"
                  disabled={saving}
                  onClick={() => setGender(g)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    selected
                      ? "border-slate-900 bg-slate-900 text-white"
                      : errors.gender
                      ? "border-red-400 bg-white text-slate-700 hover:bg-slate-50"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  } disabled:opacity-60`}
                >
                  {GENDER_LABELS[g]}
                </button>
              );
            })}
          </div>
          {errors.gender && <p className="mt-1 text-xs text-red-600">{errors.gender}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Class</label>
          <ClassSelect value={classId} onChange={setClassId} error={errors.classId} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
          <YearSelect value={yearId} onChange={setYearId} error={errors.yearId} />
        </div>

        {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}
      </div>
    </Modal>
  );
}