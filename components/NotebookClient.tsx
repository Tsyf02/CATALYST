"use client";

import { useEffect, useState, useCallback } from "react";
import type { NotebookPage, NoteColor } from "@/lib/types";
import { useLang } from "./Providers";
import { t } from "@/lib/i18n";
import dynamic from "next/dynamic";

// Lazy-load flip book
const NotebookFlipBook = dynamic(() => import("./NotebookFlipBook"), { ssr: false });

// ── Color palettes ────────────────────────────────────────────────
// Always light/cream — notebook kertas harus selalu terang agar mudah dibaca
const PAGE_BG: Record<NoteColor, string> = {
  default: "bg-[#FFFDF8]",
  yellow:  "bg-[#FFFBE6]",
  blue:    "bg-[#EEF4FF]",
  green:   "bg-[#F0FAF0]",
  pink:    "bg-[#FFF0F3]",
};
// Text color always dark (for readability on light bg)
const PAGE_TEXT = "text-[#23262b]";
const PAGE_TEXT_SOFT = "text-[#63687a]";
const PAGE_BORDER = "border-[#e4dfd0]";
const PAGE_LINES: Record<NoteColor, string> = {
  default: "#e8e2d4",
  yellow:  "#f0e5b0",
  blue:    "#c8d8f4",
  green:   "#b8e4c0",
  pink:    "#f4c0cc",
};
const COLOR_DOT: Record<NoteColor, string> = {
  default: "bg-[#d4cfc4]",
  yellow:  "bg-[#F5C518]",
  blue:    "bg-[#6699DD]",
  green:   "bg-[#55AA77]",
  pink:    "bg-[#EE7799]",
};
const COLOR_ACCENT: Record<NoteColor, string> = {
  default: "border-l-[#b0a898]",
  yellow:  "border-l-[#F5C518]",
  blue:    "border-l-[#6699DD]",
  green:   "border-l-[#55AA77]",
  pink:    "border-l-[#EE7799]",
};
const COLORS: NoteColor[] = ["default", "yellow", "blue", "green", "pink"];

function linedBg(lineColor: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="28">
    <line x1="0" y1="27" x2="100" y2="27" stroke="${lineColor}" stroke-width="1"/>
  </svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function formatDate(iso: string, lang: string) {
  return new Date(iso).toLocaleDateString(lang === "en" ? "en-US" : "id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ─────────────────────────────────────────────────────────────────
export default function NotebookClient() {
  const { lang } = useLang();
  const [pages, setPages] = useState<NotebookPage[]>([]);
  const [loading, setLoading] = useState(true);

  // "view" = note grid, "read" = reading a note, "edit" = editing a note
  const [view, setView] = useState<"grid" | "read" | "edit">("grid");
  const [activeId, setActiveId] = useState<string | null>(null);

  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody]   = useState("");
  const [editColor, setEditColor] = useState<NoteColor>("default");
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState("");
  const [flipBookOpen, setFlipBookOpen] = useState(false);

  // ── Load ──
  useEffect(() => {
    fetch("/api/notebook")
      .then((r) => r.json())
      .then((d) => {
        const sorted = (d.pages ?? []).sort(
          (a: NotebookPage, b: NotebookPage) => a.pageNumber - b.pageNumber,
        );
        setPages(sorted);
      })
      .finally(() => setLoading(false));
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  }

  const activePage = pages.find((p) => p.id === activeId) ?? null;

  // ── Open a note to read ──
  function openRead(id: string) {
    setActiveId(id);
    setView("read");
  }

  // ── Open editor (new or existing) ──
  function openEdit(page?: NotebookPage) {
    if (page) {
      setActiveId(page.id);
      setEditTitle(page.title);
      setEditBody(page.body);
      setEditColor(page.color);
    } else {
      setActiveId(null);
      setEditTitle("");
      setEditBody("");
      setEditColor("default");
    }
    setView("edit");
  }

  // ── Save (create or update) ──
  const saveNote = useCallback(async () => {
    setSaving(true);
    try {
      if (activeId) {
        // Update existing
        const r = await fetch(`/api/notebook/${activeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: editTitle.trim(), body: editBody, color: editColor }),
        });
        const d = await r.json();
        if (d.page) {
          setPages((prev) => prev.map((p) => (p.id === activeId ? d.page : p)));
          setActiveId(d.page.id);
        }
      } else {
        // Create new
        const r = await fetch("/api/notebook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: editTitle.trim(), body: editBody, color: editColor }),
        });
        const d = await r.json();
        if (d.page) {
          setPages((prev) => [...prev, d.page].sort((a, b) => a.pageNumber - b.pageNumber));
          setActiveId(d.page.id);
        }
      }
      setView("read");
      showToast(t("nbSaved", lang));
    } finally {
      setSaving(false);
    }
  }, [activeId, editTitle, editBody, editColor, lang]);

  // ── Delete ──
  async function deleteNote(id: string) {
    if (!confirm(t("nbConfirmDelete", lang))) return;
    await fetch(`/api/notebook/${id}`, { method: "DELETE" });
    setPages((prev) => prev.filter((p) => p.id !== id).map((p, i) => ({ ...p, pageNumber: i + 1 })));
    setView("grid");
    setActiveId(null);
    showToast(t("nbDeleted", lang));
  }

  // ── Save page content (used by FlipBook) ──
  async function savePageContent(id: string, title: string, body: string) {
    const r = await fetch(`/api/notebook/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body }),
    });
    const d = await r.json();
    if (d.page) setPages((prev) => prev.map((p) => (p.id === id ? d.page : p)));
  }

  // ── Add page (used by FlipBook) ──
  async function addPageForFlip(): Promise<NotebookPage | null> {
    const r = await fetch("/api/notebook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "", body: "", color: "default" }),
    });
    const d = await r.json();
    if (d.page) {
      const sorted = [...pages, d.page].sort((a, b) => a.pageNumber - b.pageNumber);
      setPages(sorted);
      return d.page;
    }
    return null;
  }

  // ─────────────────────────────────────────────────────────────────
  // Loading
  // ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-16 text-inksoft text-sm text-center">
        {t("nbLoading", lang)}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // EDIT VIEW
  // ─────────────────────────────────────────────────────────────────
  if (view === "edit") {
    return (
      <div className={`min-h-screen pb-24 ${PAGE_BG[editColor]}`}>
        {/* Header — always light bg */}
        <div
          className="sticky top-12 z-20 flex items-center justify-between px-4 py-3"
          style={{ borderBottom: `1px solid ${PAGE_LINES[editColor]}`, background: "inherit" }}
        >
          <button
            onClick={() => setView(activeId ? "read" : "grid")}
            className={`text-sm font-semibold px-3 py-1.5 rounded-lg border ${PAGE_TEXT} ${PAGE_BORDER}`}
          >
            ← {lang === "en" ? "Back" : "Kembali"}
          </button>
          <div className="flex gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setEditColor(c)}
                className={`w-6 h-6 rounded-full ${COLOR_DOT[c]} border-2 transition-transform ${
                  editColor === c ? "border-[#23262b] scale-125" : "border-transparent"
                }`}
              />
            ))}
          </div>
          <button
            onClick={saveNote}
            disabled={saving}
            className="text-sm font-bold px-4 py-1.5 rounded-lg disabled:opacity-50"
            style={{ background: "#23262b", color: "#fffdf8" }}
          >
            {saving ? "..." : t("nbSave", lang)}
          </button>
        </div>

        {/* Edit area */}
        <div className="max-w-2xl mx-auto px-5 pt-5">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder={t("nbTitlePlaceholder", lang)}
            className={`w-full bg-transparent border-none outline-none text-[22px] font-display italic font-bold mb-4 ${PAGE_TEXT}`}
            style={{ caretColor: "#23262b" }}
          />
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            placeholder={t("nbBodyPlaceholder", lang)}
            autoFocus
            className={`w-full bg-transparent border-none outline-none text-[15px] leading-[28px] resize-none min-h-[calc(100vh-220px)] ${PAGE_TEXT}`}
            style={{
              backgroundImage: linedBg(PAGE_LINES[editColor]),
              backgroundSize: "100% 28px",
              backgroundPositionY: "4px",
              caretColor: "#23262b",
            }}
          />
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // READ VIEW (single note)
  // ─────────────────────────────────────────────────────────────────
  if (view === "read" && activePage) {
    return (
      <div className={`min-h-screen pb-24 ${PAGE_BG[activePage.color]}`}>
        {/* Header — always light */}
        <div
          className="sticky top-12 z-20 flex items-center justify-between px-4 py-3"
          style={{ borderBottom: `1px solid ${PAGE_LINES[activePage.color]}`, background: "inherit" }}
        >
          <button
            onClick={() => setView("grid")}
            className={`text-sm font-semibold px-3 py-1.5 rounded-lg border ${PAGE_TEXT_SOFT} ${PAGE_BORDER}`}
          >
            ← {lang === "en" ? "All Notes" : "Semua Catatan"}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => deleteNote(activePage.id)}
              className="text-[12px] text-red-500 underline"
            >
              {t("nbDelete", lang)}
            </button>
            <button
              onClick={() => openEdit(activePage)}
              className={`text-sm font-bold px-4 py-1.5 rounded-lg border ${PAGE_TEXT} ${PAGE_BORDER}`}
            >
              ✏️ Edit
            </button>
          </div>
        </div>

        {/* Content — always light cream */}
        <div
          className="max-w-2xl mx-auto px-6 pt-6"
          style={{
            backgroundImage: linedBg(PAGE_LINES[activePage.color]),
            backgroundSize: "100% 28px",
            backgroundPositionY: "84px",
          }}
        >
          {activePage.title && (
            <h2 className={`font-display italic font-bold text-[24px] mb-4 leading-snug ${PAGE_TEXT}`}>
              {activePage.title}
            </h2>
          )}
          {activePage.body ? (
            <p className={`text-[15px] leading-[28px] whitespace-pre-wrap ${PAGE_TEXT}`}>
              {activePage.body}
            </p>
          ) : (
            <p className="italic text-sm mt-8" style={{ color: "#a09890" }}>
              — {lang === "id" ? "catatan kosong" : "empty note"} —
            </p>
          )}
          <div className="mt-8 text-[11px] font-mono" style={{ color: "#a09890" }}>
            {formatDate(activePage.updatedAt, lang)}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // GRID VIEW (all notes)
  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-28">

      {/* FlipBook modal */}
      {flipBookOpen && (
        <NotebookFlipBook
          pages={pages}
          onClose={() => setFlipBookOpen(false)}
          onSavePage={savePageContent}
          onAddPage={addPageForFlip}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display italic font-semibold text-2xl text-ink">
          📒 {t("tabNotebook", lang)}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFlipBookOpen(true)}
            disabled={pages.length === 0}
            className="flex items-center gap-1.5 text-[12px] font-bold border border-[#2e6966] rounded-lg px-3 py-1.5 text-[#2e6966] bg-cardbg disabled:opacity-40"
            title={lang === "en" ? "Open Flip Book" : "Buka Jurnal Bolak-Balik"}
          >
            📖 {lang === "en" ? "Flip Book" : "Mode Buku"}
          </button>
          <button
            onClick={() => openEdit()}
            className="flex items-center gap-1.5 text-[12px] font-bold border border-ink rounded-lg px-3 py-1.5 text-ink bg-cardbg"
          >
            + {lang === "en" ? "New Note" : "Catatan Baru"}
          </button>
        </div>
      </div>

      {/* Empty state */}
      {pages.length === 0 ? (
        <div className="text-center py-20 text-inksoft italic text-sm">
          <div className="text-4xl mb-4">📝</div>
          <p>{t("nbEmpty", lang)}</p>
          <button
            onClick={() => openEdit()}
            className="mt-6 px-5 py-2.5 rounded-xl bg-ink text-paper text-sm font-bold"
          >
            + {lang === "en" ? "Write your first note" : "Tulis catatan pertamamu"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
          {pages.map((page) => (
            <button
              key={page.id}
              onClick={() => openRead(page.id)}
              className={`text-left rounded-2xl border-l-4 p-4 shadow-sm hover:shadow-md transition-shadow ${PAGE_BG[page.color]} ${COLOR_ACCENT[page.color]}`}
              style={{ minHeight: 130, border: `1px solid ${PAGE_LINES[page.color]}`, borderLeftWidth: 4 }}
            >
              {/* Title — always dark text */}
              <div className="font-display italic font-bold text-[15px] leading-snug mb-1.5 line-clamp-2" style={{ color: "#23262b" }}>
                {page.title || (
                  <span className="font-normal not-italic text-[13px]" style={{ color: "#a09890" }}>
                    {lang === "id" ? "Tanpa judul" : "Untitled"}
                  </span>
                )}
              </div>
              {/* Body preview */}
              <div className="text-[12.5px] leading-snug line-clamp-3 mb-3" style={{ color: "#63687a" }}>
                {page.body || (
                  <span className="italic" style={{ color: "#b0aa9f" }}>
                    {lang === "id" ? "catatan kosong" : "empty note"}
                  </span>
                )}
              </div>
              {/* Footer */}
              <div className="text-[10.5px] font-mono" style={{ color: "#a09890" }}>
                {formatDate(page.updatedAt, lang)}
              </div>
            </button>
          ))}

          {/* New note card */}
          <button
            onClick={() => openEdit()}
            className="text-left rounded-2xl border border-dashed border-paperline p-4 flex flex-col items-center justify-center text-inksoft/50 hover:border-inksoft/50 hover:text-inksoft transition-colors"
            style={{ minHeight: 130 }}
          >
            <span className="text-3xl mb-1">+</span>
            <span className="text-[12px] font-semibold">
              {lang === "en" ? "New note" : "Catatan baru"}
            </span>
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-ink text-paper px-4 py-2 rounded-full text-[13px] z-[200] whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  );
}
