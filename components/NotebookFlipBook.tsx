"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { NotebookPage, NoteColor } from "@/lib/types";
import { useLang } from "./Providers";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────
type Tool = "text" | "pen" | "eraser";
type InkColor = "#1a1a1a" | "#c02626" | "#2e6966" | "#2b529a";
type FontStyle = "serif" | "sans";

const PAGE_COLORS: Record<NoteColor, { bg: string; line: string; accent: string }> = {
  default: { bg: "#faf8f2", line: "#e8e1d3", accent: "#2e6966" },
  yellow:  { bg: "#fffbe6", line: "#f0e5b0", accent: "#b8860b" },
  blue:    { bg: "#eef4ff", line: "#c8d8f4", accent: "#2b529a" },
  green:   { bg: "#f0faf0", line: "#b8e4c0", accent: "#2e7d4f" },
  pink:    { bg: "#fff0f3", line: "#f4c0cc", accent: "#b03060" },
};

const SECTION_LABELS = [
  "CATATAN BARU", "JOURNALING SESSION", "IDE & TARGET",
  "REFLEKSI HARIAN", "AGENDA MINGGUAN", "TO-DO LIST",
  "MOOD TRACKER", "MIMPI & TUJUAN",
];

// ─────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────
interface Props {
  pages: NotebookPage[];
  onClose: () => void;
  onSavePage: (id: string, title: string, body: string) => Promise<void>;
  onAddPage: () => Promise<NotebookPage | null>;
}

// ─────────────────────────────────────────────────────────────────
// Single Page Component
// ─────────────────────────────────────────────────────────────────
interface PageViewProps {
  page: NotebookPage;
  index: number;
  lang: string;
  fontStyle: FontStyle;
  tool: Tool;
  inkColor: InkColor;
  onSave: (id: string, title: string, body: string) => void;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
}

function PageView({ page, index, lang, fontStyle, tool, inkColor, onSave, canvasRef }: PageViewProps) {
  const col = PAGE_COLORS[page.color] ?? PAGE_COLORS.default;
  const sectionLabel = SECTION_LABELS[index % SECTION_LABELS.length];
  const pageNum = String(index + 1).padStart(2, "0");
  const pageLabel = lang === "en" ? `PAGE ${pageNum}` : `HALAMAN ${pageNum}`;
  const isSerif = fontStyle === "serif";
  const paperBg = "#fcfaf2";
  const paperLine = "#e8e1d3";

  const titleRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const localCanvasRef = useRef<HTMLCanvasElement>(null);
  const actualCanvasRef = (canvasRef ?? localCanvasRef) as React.RefObject<HTMLCanvasElement | null>;

  // Drawing state
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const toolRef = useRef(tool);
  const inkRef = useRef(inkColor);
  toolRef.current = tool;
  inkRef.current = inkColor;

  function getXY(e: React.MouseEvent | React.TouchEvent) {
    const canvas = actualCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const raw = "touches" in e ? e.touches[0] : e;
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    return {
      x: (raw.clientX - rect.left) * sx,
      y: (raw.clientY - rect.top)  * sy,
    };
  }

  function onPointerDown(e: React.MouseEvent | React.TouchEvent) {
    const t = toolRef.current;
    if (t === "text") return;
    e.preventDefault();
    isDrawing.current = true;
    const p = getXY(e);
    lastPos.current = p;
  }

  function onPointerMove(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing.current) return;
    const t = toolRef.current;
    if (t === "text") return;
    e.preventDefault();
    const canvas = actualCanvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const p = getXY(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(p.x, p.y);
    if (t === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 22;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = inkRef.current;
      ctx.lineWidth = 2;
    }
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
    lastPos.current = p;
  }

  function onPointerUp() {
    isDrawing.current = false;
  }

  function saveContent() {
    const title = titleRef.current?.innerText?.trim() ?? "";
    const body = bodyRef.current?.innerText?.trim() ?? "";
    onSave(page.id, title, body);
  }

  const penActive = tool === "pen" || tool === "eraser";

  // Sync canvas size to display size
  useEffect(() => {
    const canvas = actualCanvasRef.current;
    if (!canvas) return;
    const obs = new ResizeObserver(() => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (w && h && (canvas.width !== w || canvas.height !== h)) {
        // Preserve drawing
        const tmp = document.createElement("canvas");
        tmp.width = canvas.width; tmp.height = canvas.height;
        tmp.getContext("2d")?.drawImage(canvas, 0, 0);
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")?.drawImage(tmp, 0, 0, w, h);
      }
    });
    obs.observe(canvas);
    return () => obs.disconnect();
  }, [actualCanvasRef]);

  return (
    <div style={{
      width: "100%", height: "100%", position: "relative",
      backgroundColor: paperBg,
      backgroundImage: `repeating-linear-gradient(to bottom, ${paperBg} 0px, ${paperBg} 31px, ${paperLine} 31px, ${paperLine} 32px)`,
      backgroundSize: "100% 32px",
      backgroundPosition: "0 52px",
      overflow: "hidden",
      boxSizing: "border-box",
      boxShadow: "inset 0 0 0 1px rgba(120,103,82,0.08)",
    }}>
      {/* Drawing canvas — sits on top */}
      <canvas
        ref={actualCanvasRef as React.RefObject<HTMLCanvasElement>}
        style={{
          position: "absolute", top: 0, left: 0,
          width: "100%", height: "100%",
          zIndex: 5,
          pointerEvents: penActive ? "auto" : "none",
          cursor: tool === "pen" ? "crosshair" : tool === "eraser" ? "cell" : "default",
          touchAction: penActive ? "none" : "auto",
        }}
        onMouseDown={onPointerDown}
        onMouseMove={onPointerMove}
        onMouseUp={onPointerUp}
        onMouseLeave={onPointerUp}
        onTouchStart={onPointerDown}
        onTouchMove={onPointerMove}
        onTouchEnd={onPointerUp}
      />

      {/* Page content */}
      <div style={{ padding: "18px 20px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
        {/* Header row */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "baseline",
          fontSize: "0.6rem", letterSpacing: "0.08em", color: "#999",
          borderBottom: `1.5px solid ${col.accent}`,
          paddingBottom: 4, marginBottom: 12, fontWeight: 700,
          fontFamily: "'Segoe UI', sans-serif", flexShrink: 0,
        }}>
          <span>{sectionLabel}</span>
          <span>{pageLabel}</span>
        </div>

        {/* Editable title */}
        <div
          ref={titleRef}
          contentEditable={!penActive}
          suppressContentEditableWarning
          onBlur={saveContent}
          style={{
            fontFamily: isSerif ? "Georgia, serif" : "'Segoe UI', sans-serif",
            fontSize: "1.05rem", fontWeight: 700, color: "#1a1a1a",
            outline: "none", marginBottom: 6, flexShrink: 0,
            cursor: penActive ? "default" : "text",
            userSelect: penActive ? "none" : "text",
          }}
        >
          {page.title || (lang === "en" ? "Page Title" : "Judul Halaman")}
        </div>

        {/* Editable body */}
        <div
          ref={bodyRef}
          contentEditable={!penActive}
          suppressContentEditableWarning
          onBlur={saveContent}
          style={{
            fontFamily: isSerif ? "Georgia, serif" : "'Segoe UI', sans-serif",
            fontStyle: "italic",
            fontSize: "0.82rem", lineHeight: "32px", color: "#333",
            flex: 1, overflowY: "hidden", outline: "none",
            whiteSpace: "pre-wrap",
            cursor: penActive ? "default" : "text",
            userSelect: penActive ? "none" : "text",
          }}
        >
          {page.body || (lang === "en" ? "Write your notes here..." : "Tulis catatanmu di sini...")}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Cover Components
// ─────────────────────────────────────────────────────────────────
function FrontCover() {
  return (
    <div style={{
      width: "100%", height: "100%",
      background: "linear-gradient(135deg, #172120 100%, #172120 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxSizing: "border-box",
      boxShadow: "inset 0 0 20px rgba(0,0,0,0.75)",
    }}>
      <div style={{
        border: "2px solid rgba(226,201,141,0.8)",
        padding: "28px 22px", borderRadius: 10,
        width: "74%", textAlign: "center", boxSizing: "border-box",
        background: "rgba(20,25,24,0.16)",
      }}>
        <div style={{ fontSize: "2.1rem", marginBottom: 10 }}>📖</div>
        <center>
          <div style={{
            fontFamily: "Georgia, serif", fontSize: "1.45rem",
            letterSpacing: 4, fontWeight: 700, lineHeight: 1.2, color: "#e2c98d",
          }}>DIGITAL<br/>JOURNAL</div>
        </center>
        <div style={{ width: 38, height: 1, background: "#e2c98d", margin: "12px auto", opacity: 0.6 }} />
        <div style={{
          fontSize: "0.58rem", letterSpacing: 2, opacity: 0.75,
          fontFamily: "'Segoe UI', sans-serif", fontWeight: 700, color: "#e2c98d",
        }}>AGENDA NOTEBOOK</div>
      </div>
    </div>
  );
}

function BackCover() {
  return (
    <div style={{
      width: "100%", height: "100%",
      background: "linear-gradient(135deg, #172120 100%, #172120 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "inset 0 0 20px rgba(0,0,0,0.75)",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontFamily: "Georgia, serif", fontSize: "1.08rem",
          letterSpacing: 5, fontWeight: 700, color: "#e2c98d",
        }}>SELESAI</div>
        <div style={{
          fontSize: "0.62rem", marginTop: 10,
          fontFamily: "'Segoe UI', sans-serif", letterSpacing: 1.4,
          color: "rgba(226,201,141,0.6)",
        }}>AGENDA DIGITAL © 2026</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main FlipBook Component — realistic page-flip book with hardcover styling
// ─────────────────────────────────────────────────────────────────
export default function NotebookFlipBook({ pages, onClose, onSavePage, onAddPage }: Props) {
  const { lang } = useLang();
  const bookContainerRef = useRef<HTMLDivElement>(null);
  const flipbookRef = useRef<HTMLDivElement>(null);
  const bookTargetRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pageFlipInstance = useRef<any>(null);

  const [tool, setTool] = useState<Tool>("text");
  const [inkColor, setInkColor] = useState<InkColor>("#1a1a1a");
  const [fontStyle, setFontStyle] = useState<FontStyle>("serif");
  const [adding, setAdding] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isClosedFront, setIsClosedFront] = useState(false);

  const saveRef = useRef(onSavePage);
  saveRef.current = onSavePage;

  useEffect(() => {
    let isMounted = true;

    async function initFlipbook() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!flipbookRef.current || !(window as any).St?.PageFlip) return;

      if (pageFlipInstance.current) {
        try { pageFlipInstance.current.destroy(); } catch { /* ignore */ }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const flip = new (window as any).St.PageFlip(flipbookRef.current, {
        width: 420,
        height: 520,
        size: "stretch",
        minWidth: 300,
        maxWidth: 500,
        minHeight: 380,
        maxHeight: 600,
        maxShadowOpacity: 0.6,
        showCover: true,
        usePortrait: true,
        mobileScrollSupport: false,
      });

      flip.loadFromHTML(flipbookRef.current.querySelectorAll(".page-item"));
      pageFlipInstance.current = flip;

      const syncCoverState = () => {
        const currentIdx = flip.getCurrentPageIndex();
        const totalPages = flip.getPageCount();
        const closedFront = currentIdx === 0 || currentIdx >= totalPages - 1;
        setIsClosedFront(closedFront);
      };

      syncCoverState();
      flip.on("flip", syncCoverState);
      flip.on("init", syncCoverState);

      if (!isMounted) {
        try { flip.destroy(); } catch { /* ignore */ }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(window as any).St?.PageFlip) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/page-flip/dist/js/page-flip.browser.js";
      script.async = true;
      script.onload = () => { if (isMounted) initFlipbook(); };
      document.body.appendChild(script);
    } else {
      initFlipbook();
    }

    return () => {
      isMounted = false;
      if (pageFlipInstance.current) {
        try { pageFlipInstance.current.destroy(); } catch { /* ignore */ }
      }
    };
  }, [pages.length]);

  const goPrev = () => pageFlipInstance.current?.flipPrev();
  const goNext = () => pageFlipInstance.current?.flipNext();

  const handleAddPage = useCallback(async () => {
    if (adding) return;
    setAdding(true);
    await onAddPage();
    setAdding(false);
    setTimeout(() => {
      if (pageFlipInstance.current) {
        const total = pageFlipInstance.current.getPageCount();
        pageFlipInstance.current.flip(total - 2);
      }
    }, 200);
  }, [adding, onAddPage]);

  type H2C = (el: HTMLElement, opts: Record<string, unknown>) => Promise<HTMLCanvasElement>;
  async function loadH2C(): Promise<H2C> {
    const w = window as unknown as { html2canvas?: H2C };
    if (w.html2canvas) return w.html2canvas;
    await new Promise<void>((res) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      s.onload = () => res();
      document.head.appendChild(s);
    });
    return (window as unknown as { html2canvas: H2C }).html2canvas;
  }

  async function exportPng() {
    if (!bookTargetRef.current) return;
    setExporting(true);
    try {
      const h2c = await loadH2C();
      const canvas = await h2c(bookTargetRef.current, { scale: 2, useCORS: true, logging: false });
      const a = document.createElement("a");
      a.download = "digital-journal.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    } finally { setExporting(false); }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function loadJsPDF(): Promise<any> {
    const w = window as unknown as { jspdf?: unknown };
    if (w.jspdf) return w.jspdf;
    await new Promise<void>((res) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      s.onload = () => res();
      document.head.appendChild(s);
    });
    return (window as unknown as { jspdf: unknown }).jspdf;
  }

  async function exportPdf() {
    setExporting(true);
    try {
      const h2c = await loadH2C();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { jsPDF } = (await loadJsPDF()) as any;
      const pagesInBook = bookTargetRef.current?.querySelectorAll<HTMLElement>(".stf__page");
      if (!pagesInBook || !pagesInBook.length) { setExporting(false); return; }
      const pw = pagesInBook[0].offsetWidth || 380;
      const ph = pagesInBook[0].offsetHeight || 500;
      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [pw, ph] });
      for (let i = 0; i < pagesInBook.length; i++) {
        // eslint-disable-next-line no-await-in-loop
        const c = await h2c(pagesInBook[i], { scale: 2, useCORS: true, logging: false });
        if (i > 0) pdf.addPage([pw, ph], "portrait");
        pdf.addImage(c.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pw, ph);
      }
      pdf.save("digital-journal.pdf");
    } finally { setExporting(false); }
  }

  async function shareSosmed() {
    if (!bookTargetRef.current) return;
    setExporting(true);
    try {
      const h2c = await loadH2C();
      const canvas = await h2c(bookTargetRef.current, { scale: 2, useCORS: true, logging: false });
      canvas.toBlob(async (blob) => {
        if (!blob) { setExporting(false); return; }
        const file = new File([blob], "journal-story.png", { type: "image/png" });
        const nav = navigator as {
          canShare?: (d: { files: File[] }) => boolean;
          share?: (d: { title: string; text: string; files: File[] }) => Promise<void>;
        };
        if (nav.canShare?.({ files: [file] })) {
          try { await nav.share?.({ title: "Digital Journal Saya", text: "Lihat jurnal digital saya! ?", files: [file] }); }
          catch { /* cancelled */ }
        } else {
          const a = document.createElement("a"); a.download = "journal-story.png";
          a.href = canvas.toDataURL("image/png"); a.click();
          setTimeout(() => alert("Gambar terunduh! Upload ke Instagram/WA/TikTok ??"), 300);
        }
        setExporting(false);
      });
    } catch { setExporting(false); }
  }

  const TB: React.CSSProperties = {
    background: "#f4f2eb",
    color: "#444",
    border: "none",
    width: 36,
    height: 36,
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
  };

  const ExportBtnStyle: React.CSSProperties = {
    background: "#111",
    color: "#fff",
    border: "none",
    borderRadius: 20,
    padding: "6px 14px",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: 600,
  };

  const NavBtnStyle: React.CSSProperties = {
    background: "#fff",
    border: "none",
    color: "#333",
    padding: "8px 18px",
    borderRadius: 30,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.85rem",
    boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
  };

  const L = (id: string, en: string) => lang === "en" ? en : id;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(30, 25, 20, 0.75)",
      backdropFilter: "blur(8px)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: 10,
    }}>
      <button onClick={onClose} style={{
        position: "absolute",
        top: 20,
        right: 25,
        background: "#fff",
        border: "none",
        color: "#333",
        width: 42,
        height: 42,
        borderRadius: "50%",
        fontSize: "1.2rem",
        cursor: "pointer",
        boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
        zIndex: 1100,
      }}>?</button>

      <div style={{
        background: "#ffffff",
        borderRadius: 30,
        padding: "8px 20px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 15,
        boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
        flexWrap: "wrap",
        justifyContent: "center",
      }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setTool("text")} style={{ ...TB, background: tool === "text" ? "#2e6966" : "#f4f2eb", color: tool === "text" ? "#fff" : "#444", fontWeight: "bold" }}>A</button>
          <button onClick={() => setTool("pen")} style={{ ...TB, background: tool === "pen" ? "#2e6966" : "#f4f2eb", color: tool === "pen" ? "#fff" : "#444" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>
          <button onClick={() => setTool("eraser")} style={{ ...TB, background: tool === "eraser" ? "#2e6966" : "#f4f2eb", color: tool === "eraser" ? "#fff" : "#444" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 20H7L3 16l11-11 6 6-4 5" /><path d="M6 20l5-5" />
            </svg>
          </button>
          <button onClick={() => {
            const canvasList = bookTargetRef.current?.querySelectorAll<HTMLCanvasElement>("canvas");
            canvasList?.forEach((canvas) => {
              const ctx = canvas.getContext("2d");
              ctx?.clearRect(0, 0, canvas.width, canvas.height);
            });
          }} style={{ ...TB, background: "#f4f2eb" }}>??</button>
        </div>
        <div style={{ display: "flex", gap: 6, borderLeft: "1px solid #ddd", paddingLeft: 10 }}>
          {(["#1a1a1a", "#c02626", "#2e6966", "#2b529a"] as InkColor[]).map((c) => (
            <div key={c} onClick={() => { setInkColor(c); setTool("pen"); }} style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: c,
              cursor: "pointer",
              border: inkColor === c ? "2px solid #fff" : "2px solid transparent",
              boxShadow: "0 0 4px rgba(0,0,0,0.3)",
            }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, borderLeft: "1px solid #ddd", paddingLeft: 10 }}>
          <button onClick={exportPng} style={ExportBtnStyle}>?? PNG</button>
          <button onClick={exportPdf} style={ExportBtnStyle}>?? PDF</button>
          <button onClick={shareSosmed} style={ExportBtnStyle}>?? Share</button>
        </div>
      </div>

      <div
        ref={bookContainerRef}
        style={{
          position: "relative",
          padding: 14,
          borderRadius: 16,
          boxShadow: isClosedFront ? "0 20px 35px -16px rgba(0,0,0,.5)" : "0 25px 60px -12px rgba(0,0,0,0.5)",
          background: isClosedFront ? "transparent" : "#2b1d14",
          width: "min(94vw, 135vh, 920px)",
          aspectRatio: "840 / 520",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          transition: "transform 0.4s ease, background 0.4s ease, box-shadow 0.4s ease",
          transform: isClosedFront ? "translateX(-20px)" : "translateX(0)",
        }}
      >
        <div ref={bookTargetRef} style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div ref={flipbookRef} id="flipbook" style={{ width: "100%", height: "100%" }}>
            <div className="page-item page --cover" data-density="hard" style={{
              background: "linear-gradient(135deg, #2b3a39 0%, #172120 100%)",
              color: "#e2c98d",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              border: "2px solid #101716",
              boxShadow: "inset 0 0 20px rgba(0,0,0,0.7)",
              width: "100%",
              height: "100%",
              boxSizing: "border-box",
            }}>
              <div style={{
                border: "2px solid #e2c98d",
                padding: "35px 25px",
                borderRadius: 8,
                width: "78%",
                boxSizing: "border-box",
                background: "rgba(0, 0, 0, 0.15)",
              }}>
                <div style={{ fontSize: "2.5rem", marginBottom: 10 }}>??</div>
                <h2 style={{ fontFamily: "serif", fontSize: "1.8rem", letterSpacing: 3, margin: "10px 0" }}>DIGITAL JOURNAL</h2>
                <p style={{ fontSize: "0.8rem", letterSpacing: 1, margin: 0 }}>AGENDA NOTEBOOK</p>
              </div>
            </div>

            {pages.map((p, idx) => (
              <div key={p.id} className="page-item" style={{ width: "100%", height: "100%" }}>
                <PageView
                  page={p}
                  index={idx}
                  lang={lang}
                  fontStyle={fontStyle}
                  tool={tool}
                  inkColor={inkColor}
                  onSave={(id, title, body) => saveRef.current(id, title, body)}
                />
              </div>
            ))}

            <div className="page-item page --cover" data-density="hard" style={{
              background: "linear-gradient(135deg, #4a2e1b 0%, #2c180e 100%)",
              color: "#e2c98d",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              border: "2px solid #1a0f08",
              boxShadow: "inset 0 0 25px rgba(0,0,0,0.85)",
              width: "100%",
              height: "100%",
              boxSizing: "border-box",
            }}>
              <div style={{
                border: "2px solid #e2c98d",
                padding: "35px 25px",
                borderRadius: 8,
                width: "78%",
                boxSizing: "border-box",
                background: "rgba(0, 0, 0, 0.15)",
              }}>
                <h3 style={{ letterSpacing: 2, margin: "0 0 8px" }}>SELESAI</h3>
                <center><p style={{ fontSize: "0.8rem", margin: 0 }}>Agenda Digital ? 2026</p></center>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 15, display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={goPrev} style={NavBtnStyle}>⬅️ {L("Prev", "Prev")}</button>
        <button onClick={handleAddPage} disabled={adding} style={{ ...NavBtnStyle, background: "#2e6966", color: "#fff", opacity: adding ? 0.6 : 1 }}>
          {adding ? "..." : "+ " + L("Halaman", "Page")}
        </button>
        <button onClick={goNext} style={NavBtnStyle}>{L("Next", "Next")} ➡️</button>
      </div>

      {exporting && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", zIndex: 1200 }}>
          {L("Mengekspor Berkas...", "Exporting file...")}
        </div>
      )}
    </div>
  );
}


