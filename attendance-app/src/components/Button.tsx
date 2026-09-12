"use client";
import { ButtonHTMLAttributes, ReactNode } from "react";
import Spinner from "./Spinner";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  loading?: boolean;
  loadingText?: string;
  children: ReactNode;
};

const styles: Record<string, string> = {
  primary:   "bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-300",
  secondary: "bg-white text-brand-700 border border-brand-300 hover:bg-brand-50 disabled:opacity-60",
  danger:    "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
  ghost:     "bg-transparent text-slate-700 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-60",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  loadingText,
  disabled,
  children,
  className = "",
  ...rest
}: Props) {
  const sizeCls = size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-sm";
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:cursor-not-allowed ${styles[variant]} ${sizeCls} ${className}`}
    >
      {loading && <Spinner />}
      <span>{loading && loadingText ? loadingText : children}</span>
    </button>
  );
}