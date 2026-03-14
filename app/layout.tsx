import type { Metadata } from "next";
import "./globals.css";
import { LayoutShell } from "@/components/LayoutShell";

export const metadata: Metadata = {
  title: "WorkingGold — Админ Панель",
  description: "Фильтрация фриланс заказов и управление заказами",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
