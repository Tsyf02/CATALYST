"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import DashboardClient from "./DashboardClient";
import AgendaClient from "./AgendaClient";
import NotebookClient from "./NotebookClient";
import ChatBot from "./ChatBot";
import { useLang } from "./Providers";
import { t } from "@/lib/i18n";

type Tab = "home" | "agenda" | "notebook";

export default function AppShell() {
  const [tab, setTab] = useState<Tab>("home");
  const { resolvedTheme, setTheme } = useTheme();
  const { lang, setLang } = useLang();

  const isDark = resolvedTheme === "dark";

  const tabTitle: Record<Tab, string> = {
    home: t("tabHome", lang),
    agenda: t("tabAgenda", lang),
    notebook: t("tabNotebook", lang),
  };

  return (
    <div className="min-h-screen">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-50 bg-paper/90 backdrop-blur border-b border-paperline">
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between gap-2">
          <h1 className="font-display italic font-semibold text-xl text-ink">
            {tabTitle[tab]}
          </h1>

          <div className="flex items-center gap-1.5 ml-auto">
            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === "id" ? "en" : "id")}
              className="text-xs font-bold text-inksoft border border-paperline rounded-md px-2 py-1.5 min-w-[32px] bg-paper"
              title={lang === "id" ? "Switch to English" : "Ganti ke Indonesia"}
            >
              {lang === "id" ? "EN" : "ID"}
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="text-xs text-inksoft border border-paperline rounded-md px-2 py-1.5"
              title={isDark ? t("lightMode", lang) : t("darkMode", lang)}
            >
              {isDark ? "☀️" : "🌙"}
            </button>

            {/* Logout */}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-xs text-inksoft border border-paperline rounded-md px-2.5 py-1.5"
            >
              {t("logout", lang)}
            </button>
          </div>
        </div>
      </header>

      {/* ── Content — render all, hide inactive to preserve state ── */}
      <div className={tab === "home" ? "block" : "hidden"}>
        <DashboardClient />
      </div>
      <div className={tab === "agenda" ? "block" : "hidden"}>
        <AgendaClient hideHeader />
      </div>
      <div className={tab === "notebook" ? "block" : "hidden"}>
        <NotebookClient />
      </div>

      {/* ── Bottom nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-paper/95 backdrop-blur border-t border-paperline">
        <div className="max-w-2xl mx-auto flex">
          {/* Home */}
          <NavItem
            active={tab === "home"}
            onClick={() => setTab("home")}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
                <path d="M9 21V12h6v9" />
              </svg>
            }
            label={t("tabHome", lang)}
          />
          {/* Agenda */}
          <NavItem
            active={tab === "agenda"}
            onClick={() => setTab("agenda")}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            }
            label={t("tabAgenda", lang)}
          />
          {/* Notebook */}
          <NavItem
            active={tab === "notebook"}
            onClick={() => setTab("notebook")}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                <path d="M8 7h8M8 11h8M8 15h5" />
              </svg>
            }
            label={t("tabNotebook", lang)}
          />
        </div>
      </nav>

      {/* ── AI Chatbot ── */}
      <ChatBot />
    </div>
  );
}

function NavItem({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors ${
        active ? "text-ink" : "text-inksoft/50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
