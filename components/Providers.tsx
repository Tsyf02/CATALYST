"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import type { Lang } from "@/lib/i18n";

// ── Language context ──
interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
}
export const LangContext = createContext<LangContextValue>({ lang: "id", setLang: () => {} });
export function useLang() { return useContext(LangContext); }

function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("id");
  useEffect(() => {
    const saved = localStorage.getItem("agenda-lang") as Lang | null;
    if (saved === "en" || saved === "id") setLangState(saved);
  }, []);
  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("agenda-lang", l);
  }
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

// ── Root providers ──
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <SessionProvider>
        <LangProvider>{children}</LangProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
