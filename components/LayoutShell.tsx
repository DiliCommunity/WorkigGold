"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { SidebarNav } from "./Sidebar";
import Link from "next/link";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMiniApp = pathname?.startsWith("/mini-app");
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isMiniApp) {
    return <>{children}</>;
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Mobile topbar */}
      <header className="md:hidden sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-white/5">
        <div className="h-14 px-4 flex items-center justify-between">
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-card-hover text-foreground/80"
            onClick={() => setMobileOpen(true)}
            aria-label="Открыть меню"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Link href="/" className="font-semibold text-foreground">
            WorkingGold
          </Link>
          <div className="w-10" />
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={[
          "md:hidden fixed inset-0 z-50",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
        aria-hidden={!mobileOpen}
      >
        <div
          className={[
            "absolute inset-0 bg-black/60 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={[
            "absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-card border-r border-white/5",
            "transition-transform duration-200 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <div className="h-14 px-4 border-b border-white/5 flex items-center justify-between">
            <div className="min-w-0">
              <div className="font-semibold text-primary truncate">WorkingGold</div>
              <div className="text-xs text-secondary/80">Админ панель</div>
            </div>
            <button
              type="button"
              className="p-2 rounded-lg hover:bg-card-hover text-foreground/80"
              onClick={() => setMobileOpen(false)}
              aria-label="Закрыть меню"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
          <div className="p-4 border-t border-white/5 text-xs text-foreground/50">
            v0.1.0
          </div>
        </aside>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:flex min-h-screen">
        <div className="w-64 bg-card border-r border-white/5 flex flex-col">
          <div className="p-6 border-b border-white/5">
            <h1 className="text-xl font-bold text-primary">WorkingGold</h1>
            <p className="text-xs text-secondary mt-0.5">Админ панель</p>
          </div>
          <SidebarNav />
          <div className="p-4 border-t border-white/5 text-xs text-foreground/50">
            v0.1.0
          </div>
        </div>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {/* Mobile content */}
      <main className="md:hidden">{children}</main>
    </div>
  );
}
