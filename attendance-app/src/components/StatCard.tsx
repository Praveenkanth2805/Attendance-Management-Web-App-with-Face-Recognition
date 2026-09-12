export default function StatCard({
  label,
  value,
  hint,
  tone = "brand",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "brand" | "emerald" | "red" | "indigo" | "slate";
}) {
  const tones: Record<string, string> = {
    brand:   "bg-brand-50 border-brand-200 text-brand-900",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-900",
    red:     "bg-red-50 border-red-200 text-red-900",
    indigo:  "bg-indigo-50 border-indigo-200 text-indigo-900",
    slate:   "bg-slate-50 border-slate-200 text-slate-900",
  };
  return (
    <div className={`rounded-2xl border p-5 ${tones[tone]}`}>
      <div className="text-xs uppercase tracking-wide font-semibold opacity-70">{label}</div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
      {hint && <div className="mt-1 text-xs opacity-70">{hint}</div>}
    </div>
  );
}