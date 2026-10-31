"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import type { Category, Entry } from "@/lib/types";
import { useLang } from "./Providers";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

const CAT_COLOR: Record<Category, string> = {
  acara: "bg-acara",
  kerja: "bg-kerja",
  lomba: "bg-lomba",
  lainnya: "bg-lainnya",
};

function catLabel(cat: Category, lang: Lang): string {
  const map: Record<Category, string> = {
    acara: t("catAcara", lang),
    kerja: t("catKerja", lang),
    lomba: t("catLomba", lang),
    lainnya: t("catAgendaLainnya", lang),
  };
  return map[cat];
}

function remindOptions(lang: Lang) {
  if (lang === "en") {
    return [
      { value: 0, label: "At the time" },
      { value: 30, label: "30 minutes before" },
      { value: 60, label: "1 hour before" },
      { value: 180, label: "3 hours before" },
      { value: 1440, label: "1 day before" },
      { value: 4320, label: "3 days before" },
    ];
  }
  return [
    { value: 0, label: "Tepat waktu" },
    { value: 30, label: "30 menit sebelum" },
    { value: 60, label: "1 jam sebelum" },
    { value: 180, label: "3 jam sebelum" },
    { value: 1440, label: "1 hari sebelum" },
    { value: 4320, label: "3 hari sebelum" },
  ];
}

function fmtDate(iso: string, lang: Lang) {
  const d = new Date(iso);
  const locale = lang === "en" ? "en-US" : "id-ID";
  return (
    d.toLocaleDateString(locale, { day: "numeric", month: "short" }) +
    " · " +
    d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
  );
}

function countdownLabel(iso: string, lang: Lang) {
  const diff = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  const hrs = Math.round(abs / 3600000);
  const days = Math.round(abs / 86400000);
  let txt: string;
  if (lang === "en") {
    if (mins < 60) txt = mins + " min";
    else if (hrs < 24) txt = hrs + " hr";
    else txt = days + " day" + (days !== 1 ? "s" : "");
    return diff < 0 ? "Overdue " + txt : txt + " left";
  } else {
    if (mins < 60) txt = mins + " mnt";
    else if (hrs < 24) txt = hrs + " jam";
    else txt = days + " hari";
    return diff < 0 ? "Lewat " + txt : txt + " lagi";
  }
}

function urgency(e: Entry): "overdue" | "soon" | "" {
  if (e.done) return "";
  const now = Date.now();
  const dl = new Date(e.deadline).getTime();
  if (dl < now) return "overdue";
  const remindAt = dl - e.remind * 60000;
  if (remindAt <= now) return "soon";
  return "";
}

function icsExport(e: Entry) {
  const dl = new Date(e.deadline);
  const pad = (n: number) => String(n).padStart(2, "0");
  const toIcs = (d: Date) =>
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    "00Z";
  const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Agenda//ID
BEGIN:VEVENT
UID:${e.id}@agenda
DTSTAMP:${toIcs(new Date())}
DTSTART:${toIcs(dl)}
DTEND:${toIcs(new Date(dl.getTime() + 3600000))}
SUMMARY:${e.title}
DESCRIPTION:${e.desc || ""}
BEGIN:VALARM
TRIGGER:-PT${e.remind}M
ACTION:DISPLAY
DESCRIPTION:Reminder
END:VALARM
END:VEVENT
END:VCALENDAR`;
  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = e.title.replace(/[^a-z0-9]/gi, "_") + ".ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

type FormState = {
  title: string;
  cat: Category;
  deadline: string;
  remind: number;
  desc: string;
  photo: string | null;
  audio: string | null;
};

const emptyForm = (): FormState => {
  const now = new Date(Date.now() + 3600000);
  now.setMinutes(0);
  return {
    title: "",
    cat: "acara",
    deadline: now.toISOString().slice(0, 16),
    remind: 60,
    desc: "",
    photo: null,
    audio: null,
  };
};

export default function AgendaClient({ hideHeader = false }: { hideHeader?: boolean }) {
  const { lang } = useLang();

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<Category | "semua">("semua");
  const [view, setView] = useState<"list" | "cal">("list");
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [isRecording, setIsRecording] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [tick, setTick] = useState(0);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    fetch("/api/entries")
      .then((r) => r.json())
      .then((data) => setEntries(data.entries ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTick((x) => x + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  function toast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 1800);
  }

  async function refreshFromServer() {
    const r = await fetch("/api/entries");
    const data = await r.json();
    setEntries(data.entries ?? []);
  }

  async function createEntry(payload: Omit<Entry, "id" | "done" | "createdAt">) {
    const r = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) { toast(t("failSave", lang)); return; }
    await refreshFromServer();
  }

  async function updateEntry(id: string, updates: Partial<Entry>) {
    const r = await fetch(`/api/entries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!r.ok) { toast(t("failSaveChange", lang)); return; }
    await refreshFromServer();
  }

  async function deleteEntry(id: string) {
    if (!confirm(t("confirmDelete", lang))) return;
    const r = await fetch(`/api/entries/${id}`, { method: "DELETE" });
    if (!r.ok) { toast(t("failDelete", lang)); return; }
    await refreshFromServer();
  }

  function openNew() {
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
  }

  function openEdit(e: Entry) {
    setEditingId(e.id);
    setForm({
      title: e.title,
      cat: e.cat,
      deadline: e.deadline.slice(0, 16),
      remind: e.remind,
      desc: e.desc,
      photo: e.photo,
      audio: e.audio,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    stopRecordingIfActive();
  }

  async function handleSave() {
    if (!form.title.trim()) return toast(t("titleEmpty", lang));
    if (!form.deadline) return toast(t("deadlineEmpty", lang));
    stopRecordingIfActive();
    if (editingId) {
      await updateEntry(editingId, { ...form, title: form.title.trim(), desc: form.desc.trim() });
    } else {
      await createEntry({ ...form, title: form.title.trim(), desc: form.desc.trim() });
    }
    setModalOpen(false);
    toast(t("saved", lang));
  }

  function handlePhotoFile(file: File) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const max = 900;
        let w = img.width;
        let h = img.height;
        if (w > max || h > max) {
          const scale = max / Math.max(w, h);
          w *= scale;
          h *= scale;
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
        setForm((f) => ({ ...f, photo: canvas.toDataURL("image/jpeg", 0.75) }));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  function handleAudioFile(file: File) {
    const reader = new FileReader();
    reader.onload = (ev) => setForm((f) => ({ ...f, audio: ev.target?.result as string }));
    reader.readAsDataURL(file);
  }

  async function toggleRecord() {
    if (isRecording) { stopRecordingIfActive(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = (ev) => setForm((f) => ({ ...f, audio: ev.target?.result as string }));
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((tr) => tr.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
    } catch {
      toast(t("micError", lang));
    }
  }

  function stopRecordingIfActive() {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }

  const filteredSorted = useMemo(() => {
    let list = entries.slice();
    if (activeCat !== "semua") list = list.filter((e) => e.cat === activeCat);
    list.sort(
      (a, b) => Number(a.done) - Number(b.done) || new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    );
    return list;
  }, [entries, activeCat]);

  const overdue = useMemo(
    () =>
      entries
        .filter((e) => !e.done && urgency(e) === "overdue")
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries, tick]
  );
  const soon = useMemo(
    () =>
      entries
        .filter((e) => !e.done && urgency(e) === "soon")
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries, tick]
  );

  const REMIND_OPTIONS = remindOptions(lang);
  const calLocale = lang === "en" ? "en-US" : "id-ID";

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-28">
      {!hideHeader && (
        <header className="pb-3 flex items-start justify-between">
          <div>
            <h1 className="font-display italic font-semibold text-3xl text-ink">Agenda</h1>
            <p className="text-inksoft text-[13.5px]">
              {new Date().toLocaleDateString(calLocale, {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs text-inksoft border border-paperline rounded-md px-2.5 py-1.5 mt-1"
          >
            {t("logout", lang)}
          </button>
        </header>
      )}

      {overdue.length > 0 && (
        <div className="bg-cardbg border-l-4 border-red rounded-md px-3 py-2.5 mb-2 shadow-sm">
          <div className="text-red font-bold text-[13px] mb-1.5">
            ⚠ {overdue.length} {t("overdueLabel", lang)}
          </div>
          {overdue.slice(0, 3).map((e) => (
            <div key={e.id} className="flex justify-between text-[13.5px] py-0.5">
              <span className="text-ink">{e.title}</span>
              <span className="font-mono text-xs text-inksoft">{countdownLabel(e.deadline, lang)}</span>
            </div>
          ))}
        </div>
      )}
      {soon.length > 0 && (
        <div className="bg-cardbg border-l-4 border-amber rounded-md px-3 py-2.5 mb-2 shadow-sm">
          <div className="text-amber font-bold text-[13px] mb-1.5">⏰ {soon.length} {t("soonLabel", lang)}</div>
          {soon.slice(0, 3).map((e) => (
            <div key={e.id} className="flex justify-between text-[13.5px] py-0.5">
              <span className="text-ink">{e.title}</span>
              <span className="font-mono text-xs text-inksoft">{countdownLabel(e.deadline, lang)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1.5 overflow-x-auto py-3 -mx-1 px-1">
        {(["semua", "acara", "kerja", "lomba", "lainnya"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setActiveCat(c)}
            className={`flex-none px-3.5 py-1.5 rounded-2xl text-xs font-semibold text-white ${
              c === "semua" ? "bg-ink" : CAT_COLOR[c as Category]
            } ${activeCat === c ? "opacity-100 shadow" : "opacity-50"}`}
          >
            {c === "semua" ? t("allCat", lang) : catLabel(c as Category, lang)}
          </button>
        ))}
      </div>

      <div className="flex border-[1.5px] border-ink rounded-lg overflow-hidden w-fit mb-4">
        <button
          onClick={() => setView("list")}
          className={`px-4 py-1.5 text-[13px] font-semibold ${view === "list" ? "bg-ink text-paper" : "text-ink"}`}
        >
          {t("viewList", lang)}
        </button>
        <button
          onClick={() => setView("cal")}
          className={`px-4 py-1.5 text-[13px] font-semibold ${view === "cal" ? "bg-ink text-paper" : "text-ink"}`}
        >
          {t("viewCal", lang)}
        </button>
      </div>

      {loading ? (
        <p className="text-inksoft text-sm">{t("loading", lang)}</p>
      ) : view === "list" ? (
        <ListView entries={filteredSorted} lang={lang} onEdit={openEdit} onDelete={deleteEntry} onToggleDone={updateEntry} />
      ) : (
        <CalendarView
          entries={entries.filter((e) => activeCat === "semua" || e.cat === activeCat)}
          calMonth={calMonth}
          setCalMonth={setCalMonth}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          lang={lang}
          onEdit={openEdit}
          onDelete={deleteEntry}
          onToggleDone={updateEntry}
        />
      )}

      <button
        onClick={openNew}
        className="fixed bottom-20 right-6 w-14 h-14 rounded-full bg-red text-white text-3xl shadow-lg leading-[0]"
        aria-label={t("addSchedule", lang)}
      >
        +
      </button>

      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/45 flex items-end justify-center z-[100]"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-paper w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-t-2xl px-4 pt-4 pb-6">
            <h2 className="font-display italic text-xl mb-3 text-ink">{editingId ? t("editSchedule", lang) : t("newSchedule", lang)}</h2>

            <Field label={t("fieldTitle", lang)}>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder={lang === "en" ? "e.g. Apply for ISPHORIA 2026" : "Misal: Apply lomba ISPHORIA 2026"}
                className="w-full rounded-lg border-[1.5px] border-paperline bg-cardbg px-2.5 py-2 text-sm text-ink"
              />
            </Field>

            <Field label={t("fieldCat", lang)}>
              <div className="flex gap-1.5 flex-wrap">
                {(["acara", "kerja", "lomba", "lainnya"] as Category[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm((f) => ({ ...f, cat: c }))}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border-[1.5px] ${
                      form.cat === c ? `text-white border-transparent ${CAT_COLOR[c]}` : "text-inksoft border-paperline bg-cardbg"
                    }`}
                  >
                    {catLabel(c, lang)}
                  </button>
                ))}
              </div>
            </Field>

            <Field label={t("fieldDeadline", lang)}>
              <input
                type="datetime-local"
                value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                className="w-full rounded-lg border-[1.5px] border-paperline bg-cardbg px-2.5 py-2 text-sm text-ink"
              />
            </Field>

            <Field label={t("fieldRemind", lang)}>
              <select
                value={form.remind}
                onChange={(e) => setForm((f) => ({ ...f, remind: Number(e.target.value) }))}
                className="w-full rounded-lg border-[1.5px] border-paperline bg-cardbg px-2.5 py-2 text-sm text-ink"
              >
                {REMIND_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={t("fieldNotes", lang)}>
              <textarea
                value={form.desc}
                onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
                placeholder={lang === "en" ? "Details, registration link, requirements, etc." : "Detail, link pendaftaran, syarat, dll."}
                className="w-full rounded-lg border-[1.5px] border-paperline bg-cardbg px-2.5 py-2 text-sm min-h-[56px] text-ink"
              />
            </Field>

            <Field label={t("fieldAttach", lang)}>
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="text-xs px-2.5 py-2 rounded-lg border-[1.5px] border-dashed border-inksoft text-inksoft bg-cardbg"
                >
                  {t("addPhoto", lang)}
                </button>
                <button
                  type="button"
                  onClick={toggleRecord}
                  className={`text-xs px-2.5 py-2 rounded-lg border-[1.5px] border-dashed ${
                    isRecording ? "bg-red text-white border-red" : "border-inksoft text-inksoft bg-cardbg"
                  }`}
                >
                  {isRecording ? t("stopRecord", lang) : t("recordVN", lang)}
                </button>
                <button
                  type="button"
                  onClick={() => audioInputRef.current?.click()}
                  className="text-xs px-2.5 py-2 rounded-lg border-[1.5px] border-dashed border-inksoft text-inksoft bg-cardbg"
                >
                  {t("uploadAudio", lang)}
                </button>
              </div>
              {isRecording && <p className="text-xs text-inksoft mt-1">{t("recording", lang)}</p>}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handlePhotoFile(f);
                  e.target.value = "";
                }}
              />
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAudioFile(f);
                  e.target.value = "";
                }}
              />
              <div className="flex gap-2 items-center flex-wrap mt-2">
                {form.photo && (
                  <div className="flex items-center gap-1.5">
                    <img src={form.photo} className="w-12 h-12 object-cover rounded-md" alt="preview" />
                    <button
                      className="text-[11px] text-red underline"
                      onClick={() => setForm((f) => ({ ...f, photo: null }))}
                    >
                      {t("deletePhoto", lang)}
                    </button>
                  </div>
                )}
                {form.audio && (
                  <div className="flex items-center gap-1.5">
                    <audio controls src={form.audio} className="h-8" />
                    <button
                      className="text-[11px] text-red underline"
                      onClick={() => setForm((f) => ({ ...f, audio: null }))}
                    >
                      {t("deleteAudio", lang)}
                    </button>
                  </div>
                )}
              </div>
            </Field>

            <div className="flex gap-2 mt-5">
              <button
                onClick={closeModal}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold border-[1.5px] border-paperline text-inksoft bg-cardbg"
              >
                {t("cancel", lang)}
              </button>
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-ink text-paper">
                {t("save", lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-ink text-paper px-4 py-2 rounded-full text-[13px] z-[200]">
          {toastMsg}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <label className="block text-[11px] font-bold uppercase tracking-wide text-inksoft mb-1">{label}</label>
      {children}
    </div>
  );
}

function EntryCard({
  e,
  lang,
  onEdit,
  onDelete,
  onToggleDone,
}: {
  e: Entry;
  lang: Lang;
  onEdit: (e: Entry) => void;
  onDelete: (id: string) => void;
  onToggleDone: (id: string, updates: Partial<Entry>) => void;
}) {
  const urg = urgency(e);
  const dlColor = urg === "overdue" ? "text-red font-bold" : urg === "soon" ? "text-amber font-bold" : "text-inksoft";

  return (
    <div className={`relative bg-cardbg rounded-md shadow-sm border border-black/[0.07] dark:border-white/[0.07] mb-3 overflow-hidden ${e.done ? "opacity-55" : ""}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-[5px] ${CAT_COLOR[e.cat]}`} />
      <div className="pl-[18px] pr-3.5 py-3">
        <div className="flex justify-between items-start gap-2">
          <div className={`font-bold text-[15.5px] leading-tight text-ink ${e.done ? "line-through" : ""}`}>{e.title}</div>
          <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide whitespace-nowrap ${CAT_COLOR[e.cat]}`}>
            {catLabel(e.cat, lang)}
          </span>
        </div>
        <div className="flex justify-between items-center mt-1.5">
          <span className={`font-mono text-xs ${dlColor}`}>{fmtDate(e.deadline, lang)}</span>
          <span className={`font-mono text-xs ${dlColor}`}>{countdownLabel(e.deadline, lang)}</span>
        </div>
        {e.desc && <p className="text-[13px] text-inksoft mt-1.5 leading-snug">{e.desc}</p>}
        {(e.photo || e.audio) && (
          <div className="flex gap-2 mt-2 flex-wrap items-center">
            {e.photo && (
              <img
                src={e.photo}
                className="w-14 h-14 object-cover rounded-md border border-paperline cursor-pointer"
                onClick={() => window.open(e.photo!, "_blank")}
                alt=""
              />
            )}
            {e.audio && <audio controls src={e.audio} className="h-8 max-w-[200px]" />}
          </div>
        )}
        <div className="flex gap-1.5 flex-wrap mt-2.5">
          <button
            onClick={() => onToggleDone(e.id, { done: !e.done })}
            className="text-[11.5px] font-semibold border border-black/[0.18] dark:border-white/[0.18] bg-ink text-paper rounded-md px-2.5 py-1.5"
          >
            {e.done
              ? (lang === "en" ? "Mark undone" : "Batal selesai")
              : (lang === "en" ? "Mark done" : "Tandai selesai")}
          </button>
          <button
            onClick={() => onEdit(e)}
            className="text-[11.5px] font-semibold border border-black/[0.18] dark:border-white/[0.18] bg-cardbg text-ink rounded-md px-2.5 py-1.5"
          >
            {lang === "en" ? "Edit" : "Edit"}
          </button>
          <button
            onClick={() => icsExport(e)}
            className="text-[11.5px] font-semibold border border-black/[0.18] dark:border-white/[0.18] bg-cardbg text-ink rounded-md px-2.5 py-1.5"
          >
            {lang === "en" ? "📅 Add to Calendar" : "📅 Tambah ke Kalender HP"}
          </button>
          <button
            onClick={() => onDelete(e.id)}
            className="text-[11.5px] font-semibold border border-red/35 text-red bg-cardbg rounded-md px-2.5 py-1.5"
          >
            {lang === "en" ? "Delete" : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ListView({
  entries,
  lang,
  onEdit,
  onDelete,
  onToggleDone,
}: {
  entries: Entry[];
  lang: Lang;
  onEdit: (e: Entry) => void;
  onDelete: (id: string) => void;
  onToggleDone: (id: string, updates: Partial<Entry>) => void;
}) {
  if (!entries.length) {
    return (
      <div className="text-center py-12 px-5 text-inksoft">
        <b className="block font-display italic text-lg text-ink mb-1.5">
          {lang === "en" ? "No schedules yet" : "Belum ada jadwal"}
        </b>
        {lang === "en"
          ? "Tap + to add an event, work, or contest you want to track."
          : "Tekan tombol + untuk menambah acara, kerja, atau lomba yang mau kamu ikuti."}
      </div>
    );
  }
  return (
    <div>
      {entries.map((e) => (
        <EntryCard key={e.id} e={e} lang={lang} onEdit={onEdit} onDelete={onDelete} onToggleDone={onToggleDone} />
      ))}
    </div>
  );
}

function CalendarView({
  entries,
  calMonth,
  setCalMonth,
  selectedDay,
  setSelectedDay,
  lang,
  onEdit,
  onDelete,
  onToggleDone,
}: {
  entries: Entry[];
  calMonth: Date;
  setCalMonth: (d: Date) => void;
  selectedDay: string | null;
  setSelectedDay: (d: string | null) => void;
  lang: Lang;
  onEdit: (e: Entry) => void;
  onDelete: (id: string) => void;
  onToggleDone: (id: string, updates: Partial<Entry>) => void;
}) {
  const year = calMonth.getFullYear();
  const month = calMonth.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calLocale = lang === "en" ? "en-US" : "id-ID";
  // Generate weekday headers: Mon–Sun
  const dows = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2023, 0, 2 + i); // Mon Jan 2 2023
    return d.toLocaleDateString(calLocale, { weekday: "short" }).slice(0, 1).toUpperCase();
  });
  const today = new Date();

  const cells: JSX.Element[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(<div key={"e" + i} />);
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayEntries = entries.filter((e) => e.deadline.slice(0, 10) === dateStr);
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
    const isSel = selectedDay === dateStr;
    cells.push(
      <div
        key={dateStr}
        onClick={() => setSelectedDay(selectedDay === dateStr ? null : dateStr)}
        className={`aspect-square rounded-md bg-cardbg border text-xs flex flex-col items-center justify-start pt-1 cursor-pointer text-ink ${
          isToday ? "border-ink border-[1.5px]" : "border-paperline"
        } ${isSel ? "bg-ink text-paper" : ""}`}
      >
        <div>{day}</div>
        <div className="flex gap-0.5 flex-wrap justify-center mt-1">
          {dayEntries.slice(0, 4).map((e) => (
            <span key={e.id} className={`w-[5px] h-[5px] rounded-full ${CAT_COLOR[e.cat]}`} />
          ))}
        </div>
      </div>
    );
  }

  const dayList = selectedDay
    ? entries
        .filter((e) => e.deadline.slice(0, 10) === selectedDay)
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    : [];

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <button onClick={() => setCalMonth(new Date(year, month - 1, 1))} className="text-lg px-2.5 py-1 text-ink">
          ‹
        </button>
        <div className="font-bold text-[15px] text-ink">
          {calMonth.toLocaleDateString(calLocale, { month: "long", year: "numeric" })}
        </div>
        <button onClick={() => setCalMonth(new Date(year, month + 1, 1))} className="text-lg px-2.5 py-1 text-ink">
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-[3px]">
        {dows.map((d, i) => (
          <div key={i} className="text-center text-[10.5px] text-inksoft font-bold pb-1">
            {d}
          </div>
        ))}
        {cells}
      </div>
      <div className="mt-3.5">
        {selectedDay && dayList.length === 0 && (
          <div className="text-center py-8 text-inksoft text-sm">
            {lang === "en" ? "No schedules on this date." : "Tidak ada jadwal di tanggal ini."}
          </div>
        )}
        {dayList.map((e) => (
          <EntryCard key={e.id} e={e} lang={lang} onEdit={onEdit} onDelete={onDelete} onToggleDone={onToggleDone} />
        ))}
      </div>
    </div>
  );
}
