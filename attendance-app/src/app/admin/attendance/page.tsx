"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "@/components/Button";
import Spinner from "@/components/Spinner";
import StatCard from "@/components/StatCard";
import { useToast } from "@/components/Toast";
import { IconCheck, IconClose } from "@/components/icons";

type Row = {
  registerNumber: string;
  name: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  classId: number;
  yearId: number;
  className: string;
  yearName: string;
  present: boolean;
  checkInTime: string | null;
};

type Option = { id: number; name: string };

export default function AdminAttendancePage() {
  const { show } = useToast();

  const [rows, setRows] = useState<Row[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
  const [years, setYears] = useState<Option[]>([]);
  const [date, setDate] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState<number | "">("");
  const [yearFilter, setYearFilter] = useState<number | "">("");
  const [statusFilter, setStatusFilter] = useState<"all" | "present" | "absent">("all");

  const [marking, setMarking] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [aRes, cRes, yRes] = await Promise.all([
        fetch("/api/attendance/students", { cache: "no-store" }),
        fetch("/api/classes", { cache: "no-store" }),
        fetch("/api/years", { cache: "no-store" }),
      ]);
      if (!aRes.ok || !cRes.ok || !yRes.ok) throw new Error();
      const aData = await aRes.json();
      setRows(aData.rows);
      setDate(aData.date);
      setClasses(await cRes.json());
      setYears(await yRes.json());
    } catch {
      setError("Unable to load attendance. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (
        q &&
        !r.name.toLowerCase().includes(q) &&
        !r.registerNumber.toLowerCase().includes(q)
      )
        return false;
      if (classFilter !== "" && r.classId !== classFilter) return false;
      if (yearFilter !== "" && r.yearId !== yearFilter) return false;
      if (statusFilter === "present" && !r.present) return false;
      if (statusFilter === "absent" && r.present) return false;
      return true;
    });
  }, [rows, query, classFilter, yearFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = rows.length;
    const present = rows.filter((r) => r.present).length;
    const absent = total - present;
    const percentage =
      total === 0 ? 0 : Math.round((present / total) * 1000) / 10;
    return { total, present, absent, percentage };
  }, [rows]);

  async function mark(registerNumber: string, status: "present" | "absent") {
    if (marking.has(registerNumber)) return;

    const current = rows.find((r) => r.registerNumber === registerNumber);
    if (!current) return;

    // no-op if already at target state
    if (
      (status === "present" && current.present) ||
      (status === "absent" && !current.present)
    )
      return;

    setMarking((prev) => new Set(prev).add(registerNumber));

    // Optimistic update
    const prevRows = rows;
    setRows((prev) =>
      prev.map((r) =>
        r.registerNumber === registerNumber
          ? {
              ...r,
              present: status === "present",
              checkInTime:
                status === "present"
                  ? r.checkInTime ?? new Date().toTimeString().slice(0, 8)
                  : null,
            }
          : r
      )
    );

    try {
      const res = await fetch("/api/attendance/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registerNumber, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRows(prevRows);
        show(data.error ?? "Unable to update attendance.", "error");
        return;
      }
      setRows((prev) =>
        prev.map((r) =>
          r.registerNumber === registerNumber
            ? { ...r, present: data.present, checkInTime: data.checkInTime }
            : r
        )
      );
      show(
        status === "present" ? "Marked present." : "Marked absent.",
        "success"
      );
    } catch {
      setRows(prevRows);
      show("Unable to update attendance. Try again.", "error");
    } finally {
      setMarking((prev) => {
        const next = new Set(prev);
        next.delete(registerNumber);
        return next;
      });
    }
  }

  const activeFilterCount =
    (classFilter !== "" ? 1 : 0) +
    (yearFilter !== "" ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (query.trim() ? 1 : 0);

  function clearFilters() {
    setQuery("");
    setClassFilter("");
    setYearFilter("");
    setStatusFilter("all");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
          <p className="text-sm text-slate-500">
            Manually mark attendance
            {date ? ` · ${new Date(date + "T00:00:00").toDateString()}` : ""}
          </p>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={stats.total} />
        <StatCard label="Present" value={stats.present} tone="emerald" />
        <StatCard label="Absent" value={stats.absent} tone="red" />
        <StatCard
          label="Attendance %"
          value={`${stats.percentage}%`}
          tone="brand"
        />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-brand-100 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Search
            </label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
              placeholder="Name or register number..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Class
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
              value={classFilter}
              onChange={(e) =>
                setClassFilter(e.target.value === "" ? "" : Number(e.target.value))
              }
            >
              <option value="">All classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Year
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
              value={yearFilter}
              onChange={(e) =>
                setYearFilter(e.target.value === "" ? "" : Number(e.target.value))
              }
            >
              <option value="">All years</option>
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-600">Status:</span>
          {(["all", "present", "absent"] as const).map((s) => {
            const active = statusFilter === s;
            const label =
              s === "all" ? "All" : s === "present" ? "Present" : "Absent";
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition border ${
                  active
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-white text-slate-600 border-slate-300 hover:border-brand-300 hover:text-brand-700"
                }`}
              >
                {label}
              </button>
            );
          })}

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto text-xs font-medium text-brand-700 hover:underline"
            >
              Clear all filters ({activeFilterCount})
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading && rows.length === 0 && (
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

      {!loading && !error && rows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-brand-300 bg-white p-10 text-center text-sm text-slate-500">
          No students yet. Add students first from the Students page.
        </div>
      )}

      {!loading && rows.length > 0 && filtered.length === 0 && (
        <div className="rounded-2xl border border-brand-100 bg-white p-8 text-center text-sm text-slate-500">
          No students match your filters.
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
                  <th className="text-left px-5 py-3 font-medium">Class</th>
                  <th className="text-left px-5 py-3 font-medium">Year</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium">Check-in</th>
                  <th className="text-right px-5 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => {
                  const busy = marking.has(r.registerNumber);
                  return (
                    <tr key={r.registerNumber} className={busy ? "opacity-60" : ""}>
                      <td className="px-5 py-3 font-mono text-slate-700">
                        {r.registerNumber}
                      </td>
                      <td className="px-5 py-3 text-slate-900">{r.name}</td>
                      <td className="px-5 py-3 text-slate-600">{r.className}</td>
                      <td className="px-5 py-3 text-slate-600">{r.yearName}</td>
                      <td className="px-5 py-3">
                        {r.present ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-700">
                            <IconCheck className="h-3 w-3" />
                            Present
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <IconClose className="h-3 w-3" />
                            Absent
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {r.checkInTime ?? "—"}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => mark(r.registerNumber, "present")}
                            className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                              r.present
                                ? "bg-brand-600 text-white"
                                : "border border-slate-300 text-slate-700 hover:border-brand-400 hover:text-brand-700 hover:bg-brand-50"
                            } ${busy ? "cursor-wait" : ""}`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => mark(r.registerNumber, "absent")}
                            className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                              !r.present
                                ? "bg-red-600 text-white"
                                : "border border-slate-300 text-slate-700 hover:border-red-400 hover:text-red-700 hover:bg-red-50"
                            } ${busy ? "cursor-wait" : ""}`}
                          >
                            Absent
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}