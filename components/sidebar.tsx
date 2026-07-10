"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  Settings,
  CalendarClock,
  MessagesSquare,
  MessageCircle,
  LogOut,
  Moon,
  Sun,
  Newspaper,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/news", label: "Notícias", icon: Newspaper },
  { href: "/admin/conversations", label: "Conversas", icon: MessagesSquare },
  { href: "/admin/documents", label: "Documentos", icon: FileText },
  { href: "/admin/availability", label: "Horários", icon: CalendarClock },
  { href: "/admin/settings", label: "Configurações", icon: Settings },
];

export function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r bg-[var(--card)] px-4 py-6 [border-color:var(--border)]">
      <div className="mb-8 flex items-center gap-2 px-2 text-lg font-bold">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
          <MessageCircle size={19} />
        </span>
        ZapVenda
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {nav.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-brand-600 text-white shadow-sm"
                  : "hover:bg-black/5 dark:hover:bg-white/5"
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 space-y-2 border-t pt-4 [border-color:var(--border)]">
        <ThemeToggle />
        <div className="flex items-center justify-between gap-2 px-2">
          <span className="truncate text-sm muted" title={userName}>
            {userName}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="btn-ghost px-2 py-1.5 text-red-500"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.theme = next ? "dark" : "light";
  }

  return (
    <button onClick={toggle} className="btn-ghost w-full justify-start px-3">
      {dark ? <Sun size={18} /> : <Moon size={18} />}
      {dark ? "Modo claro" : "Modo escuro"}
    </button>
  );
}
