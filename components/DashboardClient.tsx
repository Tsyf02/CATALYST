"use client";

import { useEffect, useState, useMemo } from "react";
import type { Task, Note, Habit, Entry, TaskPriority, TaskCategory, NoteColor } from "@/lib/types";
import { useLang } from "./Providers";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

// ── helpers ──────────────────────────────────────────────────────
function todayStr() {
  return new Date().toLocaleDateString("en-CA"); // yyyy-MM-dd
}

function fmtShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function last7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString("en-CA");
  });
}

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  tinggi: "bg-red text-white",
  sedang: "bg-amber text-white",
  rendah: "bg-lainnya text-white",
};
const PRIORITY_BORDER: Record<TaskPriority, string> = {
  tinggi: "border-l-red",
  sedang: "border-l-amber",
  rendah: "border-l-lainnya",
};
function taskCatLabel(cat: TaskCategory, lang: Lang): string {
  const map: Record<TaskCategory, string> = {
    kuliah: t("catKuliah", lang),
    organisasi: t("catOrganisasi", lang),
    pribadi: t("catPribadi", lang),
    lainnya: t("catLainnya", lang),
  };
  return map[cat];
}
const TASK_CAT_COLOR: Record<TaskCategory, string> = {
  kuliah: "bg-acara",
  organisasi: "bg-lomba",
  pribadi: "bg-kerja",
  lainnya: "bg-lainnya",
};
const NOTE_BG: Record<NoteColor, string> = {
  default: "bg-cardbg",
  yellow: "bg-[#FFFBE6] dark:bg-[#3a3510]",
  blue: "bg-[#EEF4FF] dark:bg-[#141e36]",
  green: "bg-[#F0FAF0] dark:bg-[#12301a]",
  pink: "bg-[#FFF0F3] dark:bg-[#361219]",
};
const NOTE_COLORS: NoteColor[] = ["default", "yellow", "blue", "green", "pink"];
const NOTE_COLOR_DOT: Record<NoteColor, string> = {
  default: "bg-paperline",
  yellow: "bg-[#F5C518]",
  blue: "bg-[#6699DD]",
  green: "bg-[#55AA77]",
  pink: "bg-[#EE7799]",
};

// ── sub-components ────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="bg-cardbg border border-black/[0.07] dark:border-white/[0.07] rounded-xl px-4 py-3 shadow-sm flex-1 min-w-0">
      <div className={`text-2xl font-bold font-display ${accent ?? "text-ink"}`}>{value}</div>
      <div className="text-[11px] font-bold uppercase tracking-wide text-inksoft mt-0.5">{label}</div>
      {sub && <div className="text-[11px] text-inksoft mt-0.5">{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mt-5 mb-2">
      <h2 className="font-display italic text-[17px] font-semibold text-ink">{title}</h2>
      {action}
    </div>
  );
}

// ── Task Item ─────────────────────────────────────────────────────
function TaskItem({
  task,
  lang,
  onToggle,
  onDelete,
}: {
  task: Task;
  lang: Lang;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const isOverdue = !task.done && task.dueDate && task.dueDate < todayStr();
  const priorityLabel: Record<TaskPriority, string> = {
    tinggi: t("priorityHigh", lang),
    sedang: t("priorityMid", lang),
    rendah: t("priorityLow", lang),
  };

  return (
    <div
      className={`flex items-start gap-2.5 bg-cardbg border border-black/[0.07] dark:border-white/[0.07] border-l-4 ${PRIORITY_BORDER[task.priority]} rounded-md px-3 py-2.5 mb-2 shadow-sm ${
        task.done ? "opacity-50" : ""
      }`}
    >
      <button
        onClick={() => onToggle(task.id)}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-none flex items-center justify-center transition-colors ${
          task.done ? "bg-ink border-ink" : "border-inksoft bg-white dark:bg-paperline"
        }`}
      >
        {task.done && <span className="text-white text-[10px]">✓</span>}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-[14px] leading-snug font-medium ${task.done ? "line-through text-inksoft" : "text-ink"}`}>
          {task.title}
        </p>
        <div className="flex gap-1.5 flex-wrap mt-1 items-center">
          <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full uppercase ${TASK_CAT_COLOR[task.cat]}`}>
            {taskCatLabel(task.cat, lang)}
          </span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase ${PRIORITY_COLOR[task.priority]}`}>
            {priorityLabel[task.priority]}
          </span>
          {task.dueDate && (
            <span className={`font-mono text-[11px] ${isOverdue ? "text-red font-bold" : "text-inksoft"}`}>
              {isOverdue ? "⚠ " : ""}
              {fmtShortDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>
      <button onClick={() => onDelete(task.id)} className="text-inksoft/50 hover:text-red text-lg leading-none mt-0.5 flex-none">
        ×
      </button>
    </div>
  );
}

// ── Note Card ─────────────────────────────────────────────────────
function NoteCard({
  note,
  onPin,
  onDelete,
  onClick,
}: {
  note: Note;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (note: Note) => void;
}) {
  return (
    <div
      onClick={() => onClick(note)}
      className={`${NOTE_BG[note.color]} border border-black/[0.07] dark:border-white/[0.07] rounded-xl p-3 shadow-sm cursor-pointer relative`}
    >
      {note.pinned && (
        <span className="absolute top-2 right-2 text-[10px] text-amber font-bold uppercase tracking-wide">📌</span>
      )}
      {note.title && <p className="font-bold text-[13.5px] text-ink leading-snug mb-1 pr-5">{note.title}</p>}
      {note.body && (
        <p className="text-[12.5px] text-inksoft leading-relaxed line-clamp-4 whitespace-pre-wrap">{note.body}</p>
      )}
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10.5px] text-inksoft/70">{fmtShortDate(note.updatedAt)}</span>
        <div className="flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onPin(note.id); }}
            className="text-[11px] text-inksoft/60 hover:text-amber px-1"
            title="Pin"
          >
            {note.pinned ? "📌" : "📍"}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
            className="text-[11px] text-inksoft/60 hover:text-red px-1"
            title="Delete"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Habit Row ─────────────────────────────────────────────────────
function HabitRow({
  habit,
  days,
  lang,
  onToggle,
  onDelete,
}: {
  habit: Habit;
  days: string[];
  lang: Lang;
  onToggle: (id: string, date: string) => void;
  onDelete: (id: string) => void;
}) {
  const streak = useMemo(() => {
    let s = 0;
    const today = todayStr();
    let cursor = new Date();
    while (true) {
      const d = cursor.toLocaleDateString("en-CA");
      if (!habit.logs.includes(d)) break;
      s++;
      cursor.setDate(cursor.getDate() - 1);
      if (d === today && s === 1) continue;
    }
    return s;
  }, [habit.logs]);

  const dayLocale = lang === "en" ? "en-US" : "id-ID";

  return (
    <div className="bg-cardbg border border-black/[0.07] dark:border-white/[0.07] rounded-xl px-3 py-2.5 mb-2 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{habit.emoji}</span>
          <span className="font-medium text-[14px] text-ink">{habit.name}</span>
          {streak > 0 && (
            <span className="text-[11px] font-bold text-amber bg-amber/10 px-1.5 py-0.5 rounded-full">
              🔥 {streak}
            </span>
          )}
        </div>
        <button onClick={() => onDelete(habit.id)} className="text-inksoft/40 hover:text-red text-lg leading-none">
          ×
        </button>
      </div>
      <div className="flex gap-1.5 justify-between">
        {days.map((day) => {
          const done = habit.logs.includes(day);
          const isToday = day === todayStr();
          const label = new Date(day).toLocaleDateString(dayLocale, { weekday: "short" }).slice(0, 1).toUpperCase();
          return (
            <div key={day} className="flex flex-col items-center gap-1 flex-1">
              <span className={`text-[9px] font-bold uppercase ${isToday ? "text-ink" : "text-inksoft/60"}`}>
                {label}
              </span>
              <button
                onClick={() => onToggle(habit.id, day)}
                className={`w-7 h-7 rounded-full border-2 text-[12px] transition-all ${
                  done
                    ? "bg-lainnya border-lainnya text-white"
                    : isToday
                    ? "border-ink bg-white dark:bg-paperline"
                    : "border-paperline bg-white dark:bg-paperline"
                }`}
              >
                {done ? "✓" : ""}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────
export default function DashboardClient() {
  const { lang } = useLang();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  // Task form
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("sedang");
  const [taskCat, setTaskCat] = useState<TaskCategory>("kuliah");
  const [taskDue, setTaskDue] = useState("");
  const [taskFilter, setTaskFilter] = useState<"semua" | "aktif" | "selesai">("aktif");

  // Note form / edit
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [noteColor, setNoteColor] = useState<NoteColor>("default");

  // Habit form
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [habitName, setHabitName] = useState("");
  const [habitEmoji, setHabitEmoji] = useState("✅");

  const [toast, setToast] = useState("");
  const days7 = useMemo(() => last7Days(), []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  }

  // ── fetch all ──
  useEffect(() => {
    Promise.all([
      fetch("/api/tasks").then((r) => r.json()),
      fetch("/api/notes").then((r) => r.json()),
      fetch("/api/habits").then((r) => r.json()),
      fetch("/api/entries").then((r) => r.json()),
    ]).then(([tk, n, h, e]) => {
      setTasks(tk.tasks ?? []);
      setNotes(n.notes ?? []);
      setHabits(h.habits ?? []);
      setEntries(e.entries ?? []);
    }).finally(() => setLoading(false));
  }, []);

  // ── stats ──
  const stats = useMemo(() => {
    const today = todayStr();
    const activeTasks = tasks.filter((t) => !t.done).length;
    const overdueTasks = tasks.filter((t) => !t.done && t.dueDate && t.dueDate < today).length;
    const todayEntries = entries.filter((e) => e.deadline.slice(0, 10) === today).length;
    const upcomingEntries = entries.filter(
      (e) => !e.done && e.deadline.slice(0, 10) > today
    ).length;
    const totalHabitToday = habits.filter((h) => h.logs.includes(today)).length;
    return { activeTasks, overdueTasks, todayEntries, upcomingEntries, totalHabitToday };
  }, [tasks, entries, habits]);

  const filteredTasks = useMemo(() => {
    let list = tasks.slice();
    if (taskFilter === "aktif") list = list.filter((t) => !t.done);
    if (taskFilter === "selesai") list = list.filter((t) => t.done);
    list.sort((a, b) => {
      if (a.done !== b.done) return Number(a.done) - Number(b.done);
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
    return list;
  }, [tasks, taskFilter]);

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      if (a.pinned !== b.pinned) return Number(b.pinned) - Number(a.pinned);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [notes]);

  // ── upcoming agenda (next 3 days) ──
  const upcomingAgenda = useMemo(() => {
    const today = todayStr();
    const in3 = new Date();
    in3.setDate(in3.getDate() + 3);
    const in3Str = in3.toLocaleDateString("en-CA");
    return entries
      .filter((e) => !e.done && e.deadline.slice(0, 10) >= today && e.deadline.slice(0, 10) <= in3Str)
      .sort((a, b) => a.deadline.localeCompare(b.deadline))
      .slice(0, 5);
  }, [entries]);

  // ── task actions ──
  async function addTask() {
    if (!taskTitle.trim()) return showToast(t("taskTitleEmpty", lang));
    const r = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: taskTitle.trim(), priority: taskPriority, cat: taskCat, dueDate: taskDue || null }),
    });
    const data = await r.json();
    if (data.task) {
      setTasks((prev) => [data.task, ...prev]);
      setTaskTitle(""); setTaskDue(""); setShowTaskForm(false);
      showToast(t("taskAdded", lang));
    }
  }

  async function toggleTask(id: string) {
    const task = tasks.find((tk) => tk.id === id);
    if (!task) return;
    const r = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !task.done }),
    });
    const data = await r.json();
    if (data.task) setTasks((prev) => prev.map((tk) => (tk.id === id ? data.task : tk)));
  }

  async function deleteTask(id: string) {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((tk) => tk.id !== id));
    showToast(t("taskDeleted", lang));
  }

  // ── note actions ──
  function openNoteEdit(note: Note) {
    setEditNote(note);
    setNoteTitle(note.title);
    setNoteBody(note.body);
    setNoteColor(note.color);
    setShowNoteForm(true);
  }

  function openNoteNew() {
    setEditNote(null);
    setNoteTitle(""); setNoteBody(""); setNoteColor("default");
    setShowNoteForm(true);
  }

  async function saveNote() {
    if (!noteTitle.trim() && !noteBody.trim()) return showToast(t("noteEmpty", lang));
    if (editNote) {
      const r = await fetch(`/api/notes/${editNote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: noteTitle, body: noteBody, color: noteColor }),
      });
      const data = await r.json();
      if (data.note) setNotes((prev) => prev.map((n) => (n.id === editNote.id ? data.note : n)));
    } else {
      const r = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: noteTitle, body: noteBody, color: noteColor }),
      });
      const data = await r.json();
      if (data.note) setNotes((prev) => [data.note, ...prev]);
    }
    setShowNoteForm(false);
    showToast(t("noteSaved", lang));
  }

  async function pinNote(id: string) {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    const r = await fetch(`/api/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !note.pinned }),
    });
    const data = await r.json();
    if (data.note) setNotes((prev) => prev.map((n) => (n.id === id ? data.note : n)));
  }

  async function deleteNote(id: string) {
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    setNotes((prev) => prev.filter((n) => n.id !== id));
    showToast(t("noteDeleted", lang));
  }

  // ── habit actions ──
  async function addHabit() {
    if (!habitName.trim()) return showToast(t("habitNameEmpty", lang));
    const r = await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: habitName.trim(), emoji: habitEmoji }),
    });
    const data = await r.json();
    if (data.habit) {
      setHabits((prev) => [...prev, data.habit]);
      setHabitName(""); setHabitEmoji("✅"); setShowHabitForm(false);
      showToast(t("habitAdded", lang));
    }
  }

  async function toggleHabit(id: string, date: string) {
    const r = await fetch(`/api/habits/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toggleDate: date }),
    });
    const data = await r.json();
    if (data.habit) setHabits((prev) => prev.map((h) => (h.id === id ? data.habit : h)));
  }

  async function deleteHabit(id: string) {
    await fetch(`/api/habits/${id}`, { method: "DELETE" });
    setHabits((prev) => prev.filter((h) => h.id !== id));
    showToast(t("habitDeleted", lang));
  }

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 pt-10 text-inksoft text-sm">{t("loadingDashboard", lang)}</div>;
  }

  const today = new Date();
  const hour = today.getHours();
  const greeting = hour < 12 ? t("goodMorning", lang) : hour < 17 ? t("goodAfternoon", lang) : t("goodEvening", lang);

  const dateLocale = lang === "en" ? "en-US" : "id-ID";
  const entryDateLocale = lang === "en" ? "en-US" : "id-ID";

  const priorityKeys: TaskPriority[] = ["tinggi", "sedang", "rendah"];
  const catKeys: TaskCategory[] = ["kuliah", "organisasi", "pribadi", "lainnya"];

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-28">

      {/* ── Greeting ── */}
      <div className="mb-4">
        <p className="text-inksoft text-[13px]">{greeting} 👋</p>
        <p className="text-[12.5px] text-inksoft/70">
          {today.toLocaleDateString(dateLocale, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* ── Stats row ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <StatCard
          label={t("activeTasks", lang)}
          value={stats.activeTasks}
          sub={stats.overdueTasks > 0 ? `${stats.overdueTasks} overdue` : undefined}
          accent={stats.overdueTasks > 0 ? "text-red" : "text-ink"}
        />
        <StatCard
          label={t("todaySchedule", lang)}
          value={stats.todayEntries}
          sub={`+${stats.upcomingEntries} ${t("upcoming", lang)}`}
        />
        <StatCard
          label={t("todayHabit", lang)}
          value={`${stats.totalHabitToday}/${habits.length}`}
          sub={habits.length === 0 ? t("noHabitYet", lang) : stats.totalHabitToday === habits.length ? t("allDone", lang) : undefined}
          accent={stats.totalHabitToday === habits.length && habits.length > 0 ? "text-lainnya" : "text-ink"}
        />
      </div>

      {/* ── Upcoming Agenda ── */}
      {upcomingAgenda.length > 0 && (
        <>
          <SectionHeader title={t("sectionAgenda3Days", lang)} />
          <div className="bg-cardbg border border-black/[0.07] dark:border-white/[0.07] rounded-xl overflow-hidden shadow-sm">
            {upcomingAgenda.map((e, i) => (
              <div
                key={e.id}
                className={`flex justify-between items-center px-3.5 py-2.5 text-[13.5px] ${
                  i < upcomingAgenda.length - 1 ? "border-b border-paperline" : ""
                }`}
              >
                <span className="font-medium text-ink truncate max-w-[60%]">{e.title}</span>
                <span className="font-mono text-[11.5px] text-inksoft whitespace-nowrap">
                  {new Date(e.deadline).toLocaleDateString(entryDateLocale, { day: "numeric", month: "short" })}
                  {" · "}
                  {new Date(e.deadline).toLocaleTimeString(entryDateLocale, { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Tasks ── */}
      <SectionHeader
        title={t("sectionTasks", lang)}
        action={
          <button
            onClick={() => setShowTaskForm((v) => !v)}
            className="text-[11.5px] font-semibold border border-ink rounded-md px-2.5 py-1 text-ink bg-cardbg"
          >
            {t("addBtn", lang)}
          </button>
        }
      />

      {/* Task add form */}
      {showTaskForm && (
        <div className="bg-cardbg border border-paperline rounded-xl px-3.5 py-3 mb-3 shadow-sm">
          <input
            autoFocus
            type="text"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder={t("taskPlaceholder", lang)}
            className="w-full rounded-lg border-[1.5px] border-paperline bg-paper px-2.5 py-2 text-sm mb-2 text-ink"
          />
          <div className="flex gap-2 flex-wrap mb-2">
            {catKeys.map((c) => (
              <button
                key={c}
                onClick={() => setTaskCat(c)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border-[1.5px] ${
                  taskCat === c ? `text-white border-transparent ${TASK_CAT_COLOR[c]}` : "text-inksoft border-paperline bg-paper"
                }`}
              >
                {taskCatLabel(c, lang)}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mb-2">
            {priorityKeys.map((p) => {
              const pLabel: Record<TaskPriority, string> = {
                tinggi: t("priorityHigh", lang),
                sedang: t("priorityMid", lang),
                rendah: t("priorityLow", lang),
              };
              return (
                <button
                  key={p}
                  onClick={() => setTaskPriority(p)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border-[1.5px] ${
                    taskPriority === p ? `${PRIORITY_COLOR[p]} border-transparent` : "text-inksoft border-paperline bg-paper"
                  }`}
                >
                  {pLabel[p]}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={taskDue}
              onChange={(e) => setTaskDue(e.target.value)}
              className="flex-1 rounded-lg border-[1.5px] border-paperline bg-paper px-2.5 py-1.5 text-sm text-ink"
            />
            <button onClick={addTask} className="flex-none bg-ink text-paper rounded-lg px-4 py-1.5 text-sm font-bold">
              {t("save", lang)}
            </button>
            <button
              onClick={() => setShowTaskForm(false)}
              className="flex-none text-inksoft border border-paperline rounded-lg px-3 py-1.5 text-sm"
            >
              {t("cancel", lang)}
            </button>
          </div>
        </div>
      )}

      {/* Task filter */}
      <div className="flex gap-1.5 mb-3">
        {(["aktif", "semua", "selesai"] as const).map((f) => {
          const filterLabel: Record<string, string> = {
            aktif: t("filterActive", lang),
            semua: t("filterAll", lang),
            selesai: t("filterDone", lang),
          };
          return (
            <button
              key={f}
              onClick={() => setTaskFilter(f)}
              className={`px-3 py-1 rounded-2xl text-xs font-semibold border-[1.5px] ${
                taskFilter === f ? "bg-ink text-paper border-ink" : "bg-cardbg text-inksoft border-paperline"
              }`}
            >
              {filterLabel[f]}
            </button>
          );
        })}
        <span className="ml-auto text-xs text-inksoft self-center">
          {tasks.filter((tk) => tk.done).length}/{tasks.length} {t("taskDoneCount", lang)}
        </span>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-8 text-inksoft text-sm italic">
          {taskFilter === "selesai" ? t("noDoneTasks", lang) : t("noActiveTasks", lang)}
        </div>
      ) : (
        filteredTasks.map((tk) => (
          <TaskItem key={tk.id} task={tk} lang={lang} onToggle={toggleTask} onDelete={deleteTask} />
        ))
      )}

      {/* ── Habit Tracker ── */}
      <SectionHeader
        title={t("sectionHabits", lang)}
        action={
          <button
            onClick={() => setShowHabitForm((v) => !v)}
            className="text-[11.5px] font-semibold border border-ink rounded-md px-2.5 py-1 text-ink bg-cardbg"
          >
            {t("addBtn", lang)}
          </button>
        }
      />

      {showHabitForm && (
        <div className="bg-cardbg border border-paperline rounded-xl px-3.5 py-3 mb-3 shadow-sm">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={habitEmoji}
              onChange={(e) => setHabitEmoji(e.target.value)}
              className="w-12 text-center rounded-lg border-[1.5px] border-paperline bg-paper px-1 py-2 text-lg"
              maxLength={2}
            />
            <input
              autoFocus
              type="text"
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addHabit()}
              placeholder={t("habitPlaceholder", lang)}
              className="flex-1 rounded-lg border-[1.5px] border-paperline bg-paper px-2.5 py-2 text-sm text-ink"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={addHabit} className="flex-1 bg-ink text-paper rounded-lg py-1.5 text-sm font-bold">
              {t("save", lang)}
            </button>
            <button
              onClick={() => setShowHabitForm(false)}
              className="text-inksoft border border-paperline rounded-lg px-4 py-1.5 text-sm"
            >
              {t("cancel", lang)}
            </button>
          </div>
        </div>
      )}

      {habits.length === 0 ? (
        <div className="text-center py-8 text-inksoft text-sm italic">
          {t("noHabits", lang)}
        </div>
      ) : (
        habits.map((h) => (
          <HabitRow key={h.id} habit={h} days={days7} lang={lang} onToggle={toggleHabit} onDelete={deleteHabit} />
        ))
      )}

      {/* ── Notes ── */}
      <SectionHeader
        title={t("sectionNotes", lang)}
        action={
          <button
            onClick={openNoteNew}
            className="text-[11.5px] font-semibold border border-ink rounded-md px-2.5 py-1 text-ink bg-cardbg"
          >
            {t("addBtn", lang)}
          </button>
        }
      />

      {sortedNotes.length === 0 ? (
        <div className="text-center py-8 text-inksoft text-sm italic">
          {t("noNotes", lang)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {sortedNotes.map((n) => (
            <NoteCard key={n.id} note={n} onPin={pinNote} onDelete={deleteNote} onClick={openNoteEdit} />
          ))}
        </div>
      )}

      {/* ── Note modal ── */}
      {showNoteForm && (
        <div
          className="fixed inset-0 bg-black/45 flex items-end justify-center z-[100]"
          onClick={(e) => e.target === e.currentTarget && setShowNoteForm(false)}
        >
          <div className={`${NOTE_BG[noteColor]} w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-t-2xl px-4 pt-4 pb-8`}>
            <h2 className="font-display italic text-xl mb-3 text-ink">{editNote ? t("editNote", lang) : t("newNote", lang)}</h2>

            {/* Color picker */}
            <div className="flex gap-2 mb-3">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNoteColor(c)}
                  className={`w-7 h-7 rounded-full border-2 ${NOTE_COLOR_DOT[c]} ${
                    noteColor === c ? "border-ink scale-110" : "border-transparent"
                  } transition-transform`}
                />
              ))}
            </div>

            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder={t("noteTitlePlaceholder", lang)}
              className="w-full rounded-lg border-[1.5px] border-paperline bg-white/70 dark:bg-white/10 px-2.5 py-2 text-sm font-semibold mb-2 text-ink"
            />
            <textarea
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              placeholder={t("noteBodyPlaceholder", lang)}
              className="w-full rounded-lg border-[1.5px] border-paperline bg-white/70 dark:bg-white/10 px-2.5 py-2 text-sm min-h-[140px] resize-none text-ink"
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowNoteForm(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold border-[1.5px] border-paperline text-inksoft bg-paper"
              >
                {t("cancel", lang)}
              </button>
              <button onClick={saveNote} className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-ink text-paper">
                {t("save", lang)}
              </button>
            </div>
          </div>
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
