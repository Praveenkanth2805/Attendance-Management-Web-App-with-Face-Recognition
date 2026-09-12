"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "./ConfirmDialog";
import { useToast } from "./Toast";
import { IconLogout } from "./icons";

export default function SignOutButton() {
  const router = useRouter();
  const { show } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      show("Signed out.", "success");
      router.push("/login");
      router.refresh();
    } catch {
      show("Unable to sign out. Try again.", "error");
      setSigningOut(false);
    }
  }

  return (
    <>
      <button
  type="button"
  onClick={() => setConfirmOpen(true)}
  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
>
  <IconLogout className="h-4 w-4" />
  <span className="hidden sm:inline">Sign out</span>
</button>

      <ConfirmDialog
        open={confirmOpen}
        title="Sign out?"
        message="You will be returned to the login page and need to sign in again to access the admin panel."
        confirmText="Sign out"
        confirmVariant="primary"
        loading={signingOut}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={signOut}
      />
    </>
  );
}