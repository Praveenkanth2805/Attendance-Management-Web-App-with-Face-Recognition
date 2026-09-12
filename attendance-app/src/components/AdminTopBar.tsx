"use client";

import SignOutButton from "./SignOutButton";
import { IconGraduation, IconMenu } from "./icons";

export default function AdminTopBar({
  onMenuClick,
}: {
  onMenuClick: () => void;
}) {
  const schoolName =
    process.env.NEXT_PUBLIC_SCHOOL_NAME || "Attendance System";

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onMenuClick}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 md:hidden"
            aria-label="Open menu"
          >
            <IconMenu className="h-5 w-5" />
          </button>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <IconGraduation className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold text-slate-900 sm:text-base">
              {schoolName}
            </h1>

            <p className="text-[11px] font-medium text-slate-500 sm:text-xs">
              Admin Panel
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden h-8 w-px bg-slate-200 sm:block" />

          <SignOutButton />
        </div>
      </div>
    </header>
  );
}