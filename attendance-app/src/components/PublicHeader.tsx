"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function PublicHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/attendance"
          className="group flex items-center gap-3"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
            A
          </span>

          <div className="leading-tight">
            <p className="text-base font-bold tracking-tight text-slate-900">
              Attendance
            </p>
            <p className="hidden text-[10px] font-medium uppercase tracking-wider text-slate-400 sm:block">
              Management System
            </p>
          </div>
        </Link>

        <nav className="flex items-center">
          <Link
            href="/attendance"
            className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200 sm:px-4 ${
              pathname === "/attendance"
                ? "bg-brand-50 text-brand-700 shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-brand-700"
            }`}
          >
            Mark Attendance
          </Link>
        </nav>
      </div>
    </header>
  );
}