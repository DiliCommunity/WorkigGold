"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMiniApp = pathname?.startsWith("/mini-app");

  if (isMiniApp) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
