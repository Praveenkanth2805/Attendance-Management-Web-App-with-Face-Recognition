"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconDashboard,
  IconUsers,
  IconBook,
  IconCalendar,
  IconClose,
} from "./icons";

type NavItem = {
  href: string;
  label: string;
  Icon: (p: { className?: string }) => JSX.Element;
};

const links: NavItem[] = [
  { href: "/admin", label: "Dashboard", Icon: IconDashboard },
  { href: "/admin/students", label: "Students", Icon: IconUsers },
  { href: "/admin/classes", label: "Classes", Icon: IconBook },
  { href: "/admin/years", label: "Years", Icon: IconCalendar },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-5">
      <p className="px-3 mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/50">
        Navigation
      </p>

      <div className="space-y-1.5">
        {links.map(({ href, label, Icon }) => {
          const active =
            href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-white text-brand-700 shadow-md shadow-black/10"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                  active
                    ? "bg-brand-50 text-brand-600"
                    : "text-white/70 group-hover:bg-white/10 group-hover:text-white"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
              </span>

              <span>{label}</span>

              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-600" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function AdminSidebar({
  mobileOpen,
  onMobileClose,
}: {
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-brand-600 shadow-xl md:flex">
        <div className="flex h-16 items-center border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
              <span className="text-lg font-bold text-white">A</span>
            </div>

            <div>
              <p className="text-sm font-bold text-white">
                Attendance
              </p>
              <p className="text-[11px] text-white/60">
                Management System
              </p>
            </div>
          </div>
        </div>

        <NavList />

        <div className="border-t border-white/10 p-4">
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-xs font-medium text-white/60">
              Admin Portal
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              Manage your institution
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={onMobileClose}
            aria-hidden="true"
          />

          <aside className="relative flex h-full w-72 max-w-[85%] flex-col bg-brand-600 shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                  <span className="font-bold text-white">A</span>
                </div>

                <div>
                  <p className="text-sm font-bold text-white">
                    Attendance
                  </p>
                  <p className="text-[11px] text-white/60">
                    Admin Panel
                  </p>
                </div>
              </div>

              <button
                onClick={onMobileClose}
                className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label="Close menu"
              >
                <IconClose className="h-5 w-5" />
              </button>
            </div>

            <NavList onNavigate={onMobileClose} />
          </aside>
        </div>
      )}
    </>
  );
}