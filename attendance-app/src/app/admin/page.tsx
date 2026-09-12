"use client";
import { useCallback, useEffect, useState } from "react";
import StatCard from "@/components/StatCard";
import Spinner from "@/components/Spinner";

type Record = {
  id: number;
  registerNumber: string;
  name: string;
  className: string;
  yearName: string;
  checkInTime: string;
};

type Data = {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  percentage: number;
  date: string;
  records: Record[];
};

export default function DashboardPage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/dashboard", { cache: "no-store" });
      if (!r.ok) throw new Error();
      setData(await r.json());
    } catch {
      setError("Unable to load dashboard. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">
            {data ? new Date(data.date + "T00:00:00").toDateString() : "\u00A0"}
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="text-sm text-slate-600 hover:text-brand-700 disabled:opacity-50">
          Refresh
        </button>
      </div>

      {loading && !data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-brand-100 bg-white p-5 animate-pulse">
              <div className="h-3 w-24 bg-slate-200 rounded" />
              <div className="h-8 w-16 bg-slate-200 rounded mt-3" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error} <button onClick={load} className="font-semibold underline ml-1">Retry</button>
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Students" value={data.totalStudents} />
            <StatCard label="Present Today" value={data.presentToday} tone="emerald" />
            <StatCard label="Absent Today" value={data.absentToday} tone="red" />
            <StatCard label="Attendance %" value={`${data.percentage}%`} tone="brand" />
          </div>

          <div className="rounded-2xl border border-brand-100 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-brand-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Today's Attendance</h2>
              <span className="text-xs text-slate-500">{data.records.length} marked</span>
            </div>
            {data.records.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">
                No attendance marked yet today.
              </div>
            ) : (
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
                    {data.records.map((r) => (
                      <tr key={r.id}>
                        <td className="px-5 py-3 font-mono text-slate-700">{r.registerNumber}</td>
                        <td className="px-5 py-3 text-slate-900">{r.name}</td>
                        <td className="px-5 py-3 text-slate-600">{r.className}</td>
                        <td className="px-5 py-3 text-slate-600">{r.yearName}</td>
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
        </>
      )}
    </div>
  );
}