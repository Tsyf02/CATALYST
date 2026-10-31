import type { Entry, Task, Note, Habit, NotebookPage } from "./types";

const KEYS = {
  entries: "agenda:entries",
  tasks: "agenda:tasks",
  notes: "agenda:notes",
  habits: "agenda:habits",
  notebook: "agenda:notebook",
};

const hasKv = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

// In-memory fallback so `npm run dev` works without any storage set up.
const g = global as unknown as {
  __agendaEntries?: Entry[];
  __agendaTasks?: Task[];
  __agendaNotes?: Note[];
  __agendaHabits?: Habit[];
  __agendaNotebook?: NotebookPage[];
};
if (!g.__agendaEntries) g.__agendaEntries = [];
if (!g.__agendaTasks) g.__agendaTasks = [];
if (!g.__agendaNotes) g.__agendaNotes = [];
if (!g.__agendaHabits) g.__agendaHabits = [];
if (!g.__agendaNotebook) g.__agendaNotebook = [];

async function getKv() {
  const { kv } = await import("@vercel/kv");
  return kv;
}

// ── Entries ──────────────────────────────────────────────────────
export async function getEntries(): Promise<Entry[]> {
  if (hasKv) {
    const kv = await getKv();
    return (await kv.get<Entry[]>(KEYS.entries)) ?? [];
  }
  return g.__agendaEntries!;
}
export async function saveEntries(entries: Entry[]): Promise<void> {
  if (hasKv) { const kv = await getKv(); await kv.set(KEYS.entries, entries); return; }
  g.__agendaEntries = entries;
}

// ── Tasks ────────────────────────────────────────────────────────
export async function getTasks(): Promise<Task[]> {
  if (hasKv) {
    const kv = await getKv();
    return (await kv.get<Task[]>(KEYS.tasks)) ?? [];
  }
  return g.__agendaTasks!;
}
export async function saveTasks(tasks: Task[]): Promise<void> {
  if (hasKv) { const kv = await getKv(); await kv.set(KEYS.tasks, tasks); return; }
  g.__agendaTasks = tasks;
}

// ── Notes ────────────────────────────────────────────────────────
export async function getNotes(): Promise<Note[]> {
  if (hasKv) {
    const kv = await getKv();
    return (await kv.get<Note[]>(KEYS.notes)) ?? [];
  }
  return g.__agendaNotes!;
}
export async function saveNotes(notes: Note[]): Promise<void> {
  if (hasKv) { const kv = await getKv(); await kv.set(KEYS.notes, notes); return; }
  g.__agendaNotes = notes;
}

// ── Habits ───────────────────────────────────────────────────────
export async function getHabits(): Promise<Habit[]> {
  if (hasKv) {
    const kv = await getKv();
    return (await kv.get<Habit[]>(KEYS.habits)) ?? [];
  }
  return g.__agendaHabits!;
}
export async function saveHabits(habits: Habit[]): Promise<void> {
  if (hasKv) { const kv = await getKv(); await kv.set(KEYS.habits, habits); return; }
  g.__agendaHabits = habits;
}

// ── Notebook Pages ───────────────────────────────────────────────
export async function getPages(): Promise<NotebookPage[]> {
  if (hasKv) {
    const kv = await getKv();
    return (await kv.get<NotebookPage[]>(KEYS.notebook)) ?? [];
  }
  return g.__agendaNotebook!;
}
export async function savePages(pages: NotebookPage[]): Promise<void> {
  if (hasKv) { const kv = await getKv(); await kv.set(KEYS.notebook, pages); return; }
  g.__agendaNotebook = pages;
}

export const storageIsPersistent = hasKv;
