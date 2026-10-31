"use client";

import { useState, useRef, useEffect } from "react";
import { useLang } from "./Providers";
import { t } from "@/lib/i18n";

type ChatMode = "ask" | "parse";

type Message = {
  role: "user" | "assistant";
  content: string;
  /** If the message came from parse mode and contains a JSON block */
  parsedJson?: ParsedEntry | null;
};

type ParsedEntry = {
  title: string;
  cat: "acara" | "kerja" | "lomba" | "lainnya";
  deadline: string;
  remind: number;
  desc: string;
};

/** Extract first JSON block from assistant parse reply */
function extractJson(text: string): ParsedEntry | null {
  const match = text.match(/```json\s*([\s\S]*?)```/i) ?? text.match(/(\{[\s\S]*?\})/);
  if (!match) return null;
  try {
    const raw = JSON.parse(match[1]);
    if (!raw.title || !raw.cat || !raw.deadline) return null;
    const cats = ["acara", "kerja", "lomba", "lainnya"];
    return {
      title: String(raw.title),
      cat: cats.includes(raw.cat) ? raw.cat : "lainnya",
      deadline: String(raw.deadline),
      remind: typeof raw.remind === "number" ? raw.remind : 1440,
      desc: String(raw.desc ?? ""),
    };
  } catch {
    return null;
  }
}

export default function ChatBot() {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>("ask");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: t("chatWelcome", lang) },
  ]);
  const [input, setInput] = useState("");
  const [parseInput, setParseInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [addStatus, setAddStatus] = useState<Record<number, "added" | "error" | "loading">>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  // Update welcome message when language changes (only if conversation hasn't started)
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === "assistant") {
        return [{ role: "assistant", content: t("chatWelcome", lang) }];
      }
      return prev;
    });
  }, [lang]);

  useEffect(() => {
    if (open) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [messages, open]);

  async function sendChat() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, lang, mode: "chat" }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply ?? t("chatError", lang) },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: t("chatError", lang) }]);
    } finally {
      setLoading(false);
    }
  }

  async function sendParse() {
    const text = parseInput.trim();
    if (!text || loading) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", content: `📋 ${lang === "en" ? "Announcement:" : "Pengumuman:"}\n${text}` },
    ]);
    setParseInput("");
    setLoading(true);
    // Switch to ask tab so user can see the result
    setMode("ask");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, lang, mode: "parse" }),
      });
      const data = await res.json();
      const reply = data.reply ?? t("chatError", lang);
      const parsedJson = extractJson(reply);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply, parsedJson },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: t("chatError", lang) }]);
    } finally {
      setLoading(false);
    }
  }

  async function addToAgenda(msgIdx: number, entry: ParsedEntry) {
    setAddStatus((s) => ({ ...s, [msgIdx]: "loading" }));
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...entry, photo: null, audio: null }),
      });
      if (!res.ok) throw new Error();
      setAddStatus((s) => ({ ...s, [msgIdx]: "added" }));
    } catch {
      setAddStatus((s) => ({ ...s, [msgIdx]: "error" }));
    }
  }

  return (
    <>
      {/* ── Floating button ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-20 left-4 z-50 w-12 h-12 rounded-full bg-acara text-white shadow-lg flex items-center justify-center text-xl"
        aria-label={t("chatTitle", lang)}
      >
        {open ? "✕" : "🤖"}
      </button>

      {/* ── Chat panel ── */}
      {open && (
        <div
          className="fixed bottom-36 left-4 z-50 w-[calc(100vw-2rem)] max-w-sm bg-paper border border-paperline rounded-2xl shadow-xl flex flex-col overflow-hidden"
          style={{ height: "460px" }}
        >
          {/* ── Header ── */}
          <div className="px-3.5 pt-2.5 pb-0 border-b border-paperline bg-cardbg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-ink">🤖 {t("chatTitle", lang)}</span>
              <button onClick={() => setOpen(false)} className="text-inksoft text-lg leading-none">✕</button>
            </div>
            {/* Mode tabs */}
            <div className="flex gap-1 pb-0">
              <button
                onClick={() => setMode("ask")}
                className={`flex-1 text-[12px] font-semibold py-1.5 rounded-t-lg border-b-2 transition-colors ${
                  mode === "ask" ? "border-acara text-acara bg-paper" : "border-transparent text-inksoft"
                }`}
              >
                {t("chatModeAsk", lang)}
              </button>
              <button
                onClick={() => setMode("parse")}
                className={`flex-1 text-[12px] font-semibold py-1.5 rounded-t-lg border-b-2 transition-colors ${
                  mode === "parse" ? "border-acara text-acara bg-paper" : "border-transparent text-inksoft"
                }`}
              >
                {t("chatModeParse", lang)}
              </button>
            </div>
          </div>

          {/* ── Ask mode: message list ── */}
          {mode === "ask" && (
            <>
              <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
                {messages.map((m, i) => (
                  <div key={i} className="flex flex-col">
                    <div
                      className={`max-w-[88%] px-3 py-2 rounded-xl text-[12.5px] leading-relaxed whitespace-pre-wrap ${
                        m.role === "user"
                          ? "self-end bg-acara text-white rounded-br-sm"
                          : "self-start bg-cardbg text-ink border border-paperline rounded-bl-sm"
                      }`}
                    >
                      {m.content}
                    </div>
                    {/* Add to Agenda button for parse results */}
                    {m.role === "assistant" && m.parsedJson && (
                      <div className="self-start mt-1.5 ml-1">
                        {addStatus[i] === "added" ? (
                          <span className="text-[11px] text-lainnya font-semibold">{t("chatAdded", lang)}</span>
                        ) : addStatus[i] === "error" ? (
                          <span className="text-[11px] text-red font-semibold">{t("chatAddFail", lang)}</span>
                        ) : (
                          <button
                            onClick={() => addToAgenda(i, m.parsedJson!)}
                            disabled={addStatus[i] === "loading"}
                            className="text-[11.5px] font-semibold bg-acara text-white px-2.5 py-1 rounded-lg disabled:opacity-50"
                          >
                            {addStatus[i] === "loading" ? "..." : t("chatAddToAgenda", lang)}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="self-start bg-cardbg text-inksoft border border-paperline rounded-xl rounded-bl-sm px-3 py-2 text-[12.5px] italic">
                    {t("chatThinking", lang)}
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input row */}
              <div className="border-t border-paperline px-3 py-2.5 flex gap-2 bg-cardbg">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
                  placeholder={t("chatPlaceholder", lang)}
                  className="flex-1 rounded-lg border border-paperline bg-paper px-2.5 py-1.5 text-sm text-ink focus:outline-none"
                  disabled={loading}
                />
                <button
                  onClick={sendChat}
                  disabled={loading || !input.trim()}
                  className="bg-acara text-white text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-40"
                >
                  {t("chatSend", lang)}
                </button>
              </div>
            </>
          )}

          {/* ── Parse mode: paste announcement ── */}
          {mode === "parse" && (
            <div className="flex-1 flex flex-col px-3 py-3 gap-2">
              <p className="text-[11.5px] text-inksoft leading-relaxed">
                {t("chatParseHint", lang)}
              </p>
              <textarea
                value={parseInput}
                onChange={(e) => setParseInput(e.target.value)}
                placeholder={t("chatParsePlaceholder", lang)}
                className="flex-1 rounded-xl border border-paperline bg-cardbg px-3 py-2.5 text-[13px] text-ink resize-none focus:outline-none focus:border-acara"
                disabled={loading}
              />
              <button
                onClick={sendParse}
                disabled={loading || !parseInput.trim()}
                className="w-full bg-acara text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-40"
              >
                {loading ? t("chatThinking", lang) : t("chatParseBtn", lang)}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
