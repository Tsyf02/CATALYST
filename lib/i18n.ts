export type Lang = "id" | "en";

export const T = {
  // AppShell
  tabHome: { id: "Home", en: "Home" },
  tabAgenda: { id: "Agenda", en: "Agenda" },
  logout: { id: "Keluar", en: "Sign out" },
  switchToEnglish: { id: "EN", en: "EN" },
  switchToIndo: { id: "ID", en: "ID" },
  darkMode: { id: "Gelap", en: "Dark" },
  lightMode: { id: "Terang", en: "Light" },

  // Greeting
  goodMorning: { id: "Selamat pagi", en: "Good morning" },
  goodAfternoon: { id: "Selamat siang", en: "Good afternoon" },
  goodEvening: { id: "Selamat malam", en: "Good evening" },

  // Stats
  activeTasks: { id: "Task aktif", en: "Active tasks" },
  todaySchedule: { id: "Jadwal hari ini", en: "Today's schedule" },
  todayHabit: { id: "Habit hari ini", en: "Today's habits" },
  upcoming: { id: "akan datang", en: "upcoming" },
  noHabitYet: { id: "belum ada habit", en: "no habits yet" },
  allDone: { id: "semua ✓", en: "all done ✓" },

  // Dashboard sections
  sectionAgenda3Days: { id: "📅 Agenda 3 Hari ke Depan", en: "📅 Agenda — Next 3 Days" },
  sectionTasks: { id: "✅ Task & Tugas", en: "✅ Tasks & Assignments" },
  sectionHabits: { id: "🔥 Habit Tracker", en: "🔥 Habit Tracker" },
  sectionNotes: { id: "📝 Catatan Cepat", en: "📝 Quick Notes" },

  // Tasks
  addBtn: { id: "+ Tambah", en: "+ Add" },
  taskPlaceholder: { id: "Judul task / tugas...", en: "Task title..." },
  save: { id: "Simpan", en: "Save" },
  cancel: { id: "Batal", en: "Cancel" },
  filterActive: { id: "Aktif", en: "Active" },
  filterAll: { id: "Semua", en: "All" },
  filterDone: { id: "Selesai", en: "Done" },
  taskDoneCount: { id: "selesai", en: "done" },
  noActiveTasks: { id: "Tidak ada task aktif. Bagus!", en: "No active tasks. Great!" },
  noDoneTasks: { id: "Belum ada task yang selesai.", en: "No completed tasks yet." },
  taskTitleEmpty: { id: "Judul task kosong", en: "Task title is empty" },
  taskAdded: { id: "Task ditambahkan", en: "Task added" },
  taskDeleted: { id: "Task dihapus", en: "Task deleted" },

  // Task categories
  catKuliah: { id: "Kuliah", en: "College" },
  catOrganisasi: { id: "Organisasi", en: "Organization" },
  catPribadi: { id: "Pribadi", en: "Personal" },
  catLainnya: { id: "Lainnya", en: "Other" },

  // Priority
  priorityHigh: { id: "tinggi", en: "high" },
  priorityMid: { id: "sedang", en: "medium" },
  priorityLow: { id: "rendah", en: "low" },

  // Habits
  habitPlaceholder: { id: "Nama kebiasaan... (mis. Baca buku)", en: "Habit name... (e.g. Read a book)" },
  noHabits: { id: "Belum ada habit. Tambah kebiasaan yang ingin kamu track!", en: "No habits yet. Add habits you want to track!" },
  habitNameEmpty: { id: "Nama habit kosong", en: "Habit name is empty" },
  habitAdded: { id: "Habit ditambahkan", en: "Habit added" },
  habitDeleted: { id: "Habit dihapus", en: "Habit deleted" },

  // Notes
  noNotes: { id: "Belum ada catatan. Tulis sesuatu!", en: "No notes yet. Write something!" },
  editNote: { id: "Edit catatan", en: "Edit note" },
  newNote: { id: "Catatan baru", en: "New note" },
  noteTitlePlaceholder: { id: "Judul (opsional)", en: "Title (optional)" },
  noteBodyPlaceholder: { id: "Tulis catatanmu di sini...", en: "Write your note here..." },
  noteEmpty: { id: "Catatan kosong", en: "Note is empty" },
  noteSaved: { id: "Catatan disimpan", en: "Note saved" },
  noteDeleted: { id: "Catatan dihapus", en: "Note deleted" },

  // Loading
  loadingDashboard: { id: "Memuat dashboard...", en: "Loading dashboard..." },
  loading: { id: "Memuat...", en: "Loading..." },

  // Agenda
  allCat: { id: "Semua", en: "All" },
  catAcara: { id: "Acara", en: "Event" },
  catKerja: { id: "Kerja", en: "Work" },
  catLomba: { id: "Lomba", en: "Contest" },
  catAgendaLainnya: { id: "Lainnya", en: "Other" },
  viewList: { id: "List", en: "List" },
  viewCal: { id: "Kalender", en: "Calendar" },
  addSchedule: { id: "Tambah jadwal", en: "Add schedule" },
  editSchedule: { id: "Edit jadwal", en: "Edit schedule" },
  newSchedule: { id: "Jadwal baru", en: "New schedule" },
  overdueLabel: { id: "sudah lewat deadline", en: "past deadline" },
  soonLabel: { id: "perlu diingat", en: "coming up soon" },
  fieldTitle: { id: "Judul", en: "Title" },
  fieldCat: { id: "Kategori", en: "Category" },
  fieldDeadline: { id: "Deadline / waktu", en: "Deadline / time" },
  fieldRemind: { id: "Ingatkan sebelumnya", en: "Remind me" },
  fieldNotes: { id: "Catatan", en: "Notes" },
  fieldAttach: { id: "Lampiran", en: "Attachments" },
  titleEmpty: { id: "Judul belum diisi", en: "Title is required" },
  deadlineEmpty: { id: "Deadline belum diisi", en: "Deadline is required" },
  saved: { id: "Tersimpan", en: "Saved" },
  failSave: { id: "Gagal menyimpan", en: "Failed to save" },
  failSaveChange: { id: "Gagal menyimpan perubahan", en: "Failed to save changes" },
  failDelete: { id: "Gagal menghapus", en: "Failed to delete" },
  addPhoto: { id: "📷 Tambah foto", en: "📷 Add photo" },
  recordVN: { id: "🎙️ Rekam VN", en: "🎙️ Record voice note" },
  stopRecord: { id: "⏹ Stop rekam", en: "⏹ Stop recording" },
  uploadAudio: { id: "📎 Upload audio", en: "📎 Upload audio" },
  recording: { id: "Merekam... tekan lagi untuk berhenti.", en: "Recording... tap again to stop." },
  deletePhoto: { id: "hapus foto", en: "remove photo" },
  deleteAudio: { id: "hapus audio", en: "remove audio" },
  micError: { id: 'Mic tidak tersedia — pakai "Upload audio" ya', en: 'Mic unavailable — use "Upload audio" instead' },
  confirmDelete: { id: "Hapus jadwal ini?", en: "Delete this schedule?" },

  // Notebook
  tabNotebook: { id: "Notebook", en: "Notebook" },
  nbNewPage: { id: "Halaman Baru", en: "New Page" },
  nbPageOf: { id: "dari", en: "of" },
  nbTitlePlaceholder: { id: "Judul halaman...", en: "Page title..." },
  nbBodyPlaceholder: { id: "Tulis catatanmu di sini...", en: "Write your notes here..." },
  nbSave: { id: "Simpan", en: "Save" },
  nbCancel: { id: "Batal", en: "Cancel" },
  nbDelete: { id: "Hapus Halaman", en: "Delete Page" },
  nbConfirmDelete: { id: "Hapus halaman ini?", en: "Delete this page?" },
  nbEmpty: { id: "Notebook kosong. Ketuk + untuk mulai menulis!", en: "Notebook is empty. Tap + to start writing!" },
  nbSaved: { id: "Tersimpan", en: "Saved" },
  nbDeleted: { id: "Halaman dihapus", en: "Page deleted" },
  nbLoading: { id: "Memuat notebook...", en: "Loading notebook..." },
  nbPageLabel: { id: "Hal.", en: "Pg." },
  nbPrev: { id: "‹", en: "‹" },
  nbNext: { id: "›", en: "›" },
  nbEditHint: { id: "Ketuk untuk edit", en: "Tap to edit" },

  // Chatbot
  chatTitle: { id: "Tanya AI Agenda", en: "Ask AI about Agenda" },
  chatPlaceholder: { id: "Tanya agenda minggu ini...", en: "Ask about this week's agenda..." },
  chatSend: { id: "Kirim", en: "Send" },
  chatWelcome: { id: "Halo! Tanya aku soal jadwal, task, atau habit kamu 📅\n\nAtau ketuk 📋 untuk paste teks pengumuman dan aku bantu ubah jadi jadwal!", en: "Hi! Ask me about your schedule, tasks, or habits 📅\n\nOr tap 📋 to paste an announcement and I'll turn it into a schedule!" },
  chatThinking: { id: "Sedang menganalisis...", en: "Analyzing..." },
  chatError: { id: "Gagal mendapatkan respons. Coba lagi.", en: "Failed to get response. Please try again." },
  chatModeAsk: { id: "💬 Tanya", en: "💬 Ask" },
  chatModeParse: { id: "📋 Pengumuman", en: "📋 Announcement" },
  chatParsePlaceholder: { id: "Paste teks pengumuman di sini...", en: "Paste announcement text here..." },
  chatParseBtn: { id: "Analisis →", en: "Analyze →" },
  chatAddToAgenda: { id: "➕ Tambah ke Agenda", en: "➕ Add to Agenda" },
  chatAdded: { id: "✅ Berhasil ditambahkan ke Agenda!", en: "✅ Added to Agenda!" },
  chatAddFail: { id: "Gagal menambahkan. Coba lagi.", en: "Failed to add. Please try again." },
  chatParseHint: { id: "Paste teks pengumuman lomba, acara, atau lowongan — AI akan ubah jadi jadwal terstruktur.", en: "Paste announcement text for a contest, event, or job — AI will turn it into a structured schedule." },
} as const;

export type TransKey = keyof typeof T;

export function t(key: TransKey, lang: Lang): string {
  return T[key][lang];
}
