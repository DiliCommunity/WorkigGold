"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Briefcase,
  ListTodo,
  Calendar,
  GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Дашборд", icon: LayoutDashboard },
  { href: "/mini-app", label: "Mini App (Telegram)", icon: Briefcase },
  { href: "/orders", label: "Заказы", icon: Briefcase },
  { href: "/chat", label: "Чаты", icon: MessageSquare },
  { href: "/agents", label: "Агенты", icon: GitBranch },
  { href: "/stats", label: "Статистика", icon: BarChart3 },
  { href: "/tasks", label: "Задачи", icon: ListTodo },
  { href: "/calendar", label: "Календарь", icon: Calendar },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-card border-r border-white/5 flex flex-col">
      <div className="p-6 border-b border-white/5">
        <h1 className="text-xl font-bold text-primary">WorkingGold</h1>
        <p className="text-xs text-secondary mt-0.5">Админ панель</p>
      </div>
      <SidebarNav />
      <div className="p-4 border-t border-white/5 text-xs text-foreground/50">
        v0.1.0
      </div>
    </aside>
  );
}

export function SidebarNav({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  // Если открыт drawer — при смене маршрута закроем его (на случай навигации не по клику).
  useEffect(() => {
    onNavigate?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <nav className="flex-1 p-4 space-y-1">
      {nav.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={() => onNavigate?.()}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
            pathname === href ||
              (href === "/chat" && pathname.startsWith("/chat")) ||
              (href === "/calendar" && pathname.startsWith("/calendar")) ||
              (href === "/agents" && pathname.startsWith("/agents"))
              ? "bg-primary/20 text-primary border border-primary/30"
              : "text-foreground/70 hover:bg-card-hover hover:text-foreground"
          )}
        >
          <Icon className="w-5 h-5" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
