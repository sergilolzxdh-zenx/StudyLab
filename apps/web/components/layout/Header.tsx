"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import type { User } from "firebase/auth";
import { TOOL_NAV_ITEMS } from "@/lib/navigation";
import { signOut } from "@/lib/firebase/auth";
import { cn } from "@/lib/utils/cn";

export function Header({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    toast.success("Sesión cerrada.");
    router.push("/");
  }

  const name = user.displayName || user.email || "";
  const initial = name.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="font-display text-lg text-text">
            StudyLab
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            <NavLink href="/dashboard" active={pathname === "/dashboard"}>
              Inicio
            </NavLink>
            {TOOL_NAV_ITEMS.map((item) => (
              <NavLink key={item.href} href={item.href} active={pathname === item.href}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 lg:flex">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-surface-2 font-sans text-sm text-text">
              {initial}
            </span>
            <span className="max-w-[10rem] truncate font-sans text-sm text-text-dim">{name}</span>
            <Link
              href="/plan"
              className="font-sans text-sm text-text-dim transition-colors hover:text-text"
            >
              Plan
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="font-sans text-sm text-text-dim transition-colors hover:text-text"
            >
              Cerrar sesión
            </button>
          </div>
          <button
            type="button"
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] border border-border text-text lg:hidden"
          >
            <span aria-hidden="true">{mobileOpen ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="flex flex-col gap-1 border-t border-border px-6 py-3 lg:hidden">
          <NavLink href="/dashboard" active={pathname === "/dashboard"} onClick={() => setMobileOpen(false)}>
            Inicio
          </NavLink>
          {TOOL_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              active={pathname === item.href}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
          <div className="my-2 border-t border-border" />
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-surface-2 font-sans text-sm text-text">
              {initial}
            </span>
            <span className="truncate font-sans text-sm text-text-dim">{name}</span>
          </div>
          <NavLink href="/plan" active={pathname === "/plan"} onClick={() => setMobileOpen(false)}>
            Plan
          </NavLink>
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              handleSignOut();
            }}
            className="rounded-[var(--radius-sm)] px-3 py-2 text-left font-sans text-sm text-text-dim transition-colors hover:bg-surface-2 hover:text-text"
          >
            Cerrar sesión
          </button>
        </nav>
      )}
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
  onClick,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-[var(--radius-sm)] px-3 py-2 font-sans text-sm transition-colors",
        active ? "bg-surface-2 text-text" : "text-text-dim hover:bg-surface-2 hover:text-text"
      )}
    >
      {children}
    </Link>
  );
}
