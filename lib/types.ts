export type Category = "acara" | "kerja" | "lomba" | "lainnya";

export interface Entry {
  id: string;
  title: string;
  cat: Category;
  deadline: string; // ISO datetime, local (yyyy-MM-ddTHH:mm)
  remind: number; // minutes before deadline to be reminded
  desc: string;
  photo: string | null; // base64 data URL
  audio: string | null; // base64 data URL
  done: boolean;
  createdAt: string;
}

// ── Task (to-do kuliah / kegiatan) ──────────────────────────────
export type TaskPriority = "tinggi" | "sedang" | "rendah";
export type TaskCategory = "kuliah" | "organisasi" | "pribadi" | "lainnya";

export interface Task {
  id: string;
  title: string;
  priority: TaskPriority;
  cat: TaskCategory;
  dueDate: string | null; // yyyy-MM-dd
  done: boolean;
  createdAt: string;
}

// ── Note (catatan cepat) ─────────────────────────────────────────
export type NoteColor = "default" | "yellow" | "blue" | "green" | "pink";

export interface Note {
  id: string;
  title: string;
  body: string;
  color: NoteColor;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Habit / Kebiasaan tracker ────────────────────────────────────
export interface Habit {
  id: string;
  name: string;
  emoji: string;
  logs: string[]; // array of yyyy-MM-dd strings (dates completed)
  createdAt: string;
}

// ── Notebook (buku catatan dengan halaman) ───────────────────────
export interface NotebookPage {
  id: string;
  pageNumber: number;
  title: string;       // judul halaman (bisa kosong)
  body: string;        // isi tulisan
  color: NoteColor;    // warna halaman
  createdAt: string;
  updatedAt: string;
}
