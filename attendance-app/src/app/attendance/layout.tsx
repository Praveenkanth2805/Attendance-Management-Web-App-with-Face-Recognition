import PublicHeader from "@/components/PublicHeader";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicHeader />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </>
  );
}