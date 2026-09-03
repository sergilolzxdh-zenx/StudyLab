import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-16">
      <Link href="/" className="font-display text-2xl text-text">
        StudyLab
      </Link>
      {children}
    </main>
  );
}
