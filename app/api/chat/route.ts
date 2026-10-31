import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";
import { getEntries, getTasks, getHabits } from "@/lib/store";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GROQ_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      reply: "⚠️ AI chatbot belum dikonfigurasi. Tambahkan GROQ_API_KEY ke file .env.local.",
    });
  }

  const isGroq = !!process.env.GROQ_API_KEY;
  const openai = new OpenAI({
    apiKey,
    ...(isGroq && { baseURL: "https://api.groq.com/openai/v1" }),
  });
  // Groq model: fast & free. Falls back to OpenAI gpt-4o-mini if using OpenAI key.
  const model = isGroq ? "llama-3.1-8b-instant" : "gpt-4o-mini";

  const { message, lang, mode } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "Empty message" }, { status: 400 });

  const now = new Date();
  const todayStr = now.toLocaleDateString("en-CA"); // yyyy-MM-dd
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = weekEnd.toLocaleDateString("en-CA");

  // ── Mode: Parse Pengumuman ──────────────────────────────────────
  if (mode === "parse") {
    const systemPrompt = `Anda adalah asisten agenda yang bertugas membantu mahasiswa mengelola informasi acara, lomba, dan lowongan kerja atau magang.
Tujuan Anda adalah mengubah teks pengumuman yang berantakan menjadi jadwal yang jelas, lengkap dengan rekomendasi pengingat dan persiapan.

Tanggal hari ini: ${todayStr}

Aturan analisis:
- Gunakan hanya informasi yang ada di teks pengumuman.
- Jika deadline, lokasi, atau syarat tidak disebutkan, tulis "tidak disebutkan". Jangan menebak atau mengarang.
- Ubah tanggal relatif (misal "Jumat depan" atau "akhir bulan") menjadi tanggal lengkap berdasarkan tanggal hari ini.
- Tentukan satu kategori: Acara, Kerja, Lomba, atau Lainnya.
- Jika teks memuat lebih dari satu pengumuman, proses satu per satu dan urutkan dari deadline terdekat.
- Jika deadline sudah lewat dari tanggal hari ini, beri peringatan di bagian ringkasan.

Gaya jawaban:
- Gunakan bahasa Indonesia yang jelas, ringkas, dan informatif.
- Gunakan format terstruktur agar mudah dibaca.
- Hindari penjelasan yang terlalu panjang.

Format output yang harus digunakan (WAJIB ikuti persis):

RINGKASAN
Judul:
Kategori:
Deadline:
Lokasi / Link pendaftaran:

SYARAT DAN DOKUMEN
(daftar singkat)

REKOMENDASI PENGINGAT
(kapan sebaiknya diingatkan, misalnya H-7, H-3, H-1, beserta alasan singkat)

CHECKLIST PERSIAPAN
(langkah-langkah yang perlu disiapkan sebelum deadline)

DATA JSON UNTUK APLIKASI AGENDA
\`\`\`json
{"title": "", "cat": "acara/kerja/lomba/lainnya", "deadline": "YYYY-MM-DDTHH:mm", "remind": 1440, "desc": ""}
\`\`\`

Pastikan field "cat" hanya salah satu dari: acara, kerja, lomba, lainnya (huruf kecil).
Pastikan "remind" adalah angka menit (contoh: 1440 = 1 hari, 10080 = 7 hari).`;

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: 800,
    });

    const reply = completion.choices[0]?.message?.content ?? "Tidak ada respons.";
    return NextResponse.json({ reply, mode: "parse" });
  }

  // ── Mode: Chat biasa (tanya agenda) ────────────────────────────
  const [entries, tasks, habits] = await Promise.all([
    getEntries(),
    getTasks(),
    getHabits(),
  ]);

  // Strip large binary data (photo/audio) to keep prompt lean
  const entriesLean = entries.map(({ photo: _p, audio: _a, ...rest }) => rest);

  const systemPrompt = lang === "en"
    ? `You are a helpful personal agenda assistant. Today is ${todayStr}. Answer questions about the user's schedule, tasks, and habits concisely. Use the data provided. If asked about "this week", include entries from today up to ${weekEndStr}. If asked about "upcoming" or "next week" events, filter accordingly.

Current data:
- Agenda entries: ${JSON.stringify(entriesLean)}
- Tasks: ${JSON.stringify(tasks)}
- Habits: ${JSON.stringify(habits)}

Rules:
- Keep replies short and helpful.
- Format dates in a human-friendly way (e.g. "Saturday, Nov 2 at 09:00").
- If there are no matching items, say so clearly.
- Never invent data that is not in the provided lists.`
    : `Kamu adalah asisten agenda pribadi yang membantu mahasiswa. Hari ini adalah ${todayStr}. Jawab pertanyaan tentang jadwal, task, dan habit pengguna secara ringkas dan jelas. Untuk "minggu ini", sertakan jadwal dari hari ini hingga ${weekEndStr}.

Data pengguna saat ini:
- Jadwal (entries): ${JSON.stringify(entriesLean)}
- Task: ${JSON.stringify(tasks)}
- Habit: ${JSON.stringify(habits)}

Aturan:
- Jawab singkat dan langsung ke inti.
- Format tanggal dengan cara yang mudah dibaca (contoh: "Sabtu, 2 Nov pukul 09.00").
- Jika tidak ada jadwal yang cocok, katakan dengan jelas.
- Jangan mengarang data yang tidak ada di daftar.
- Bisa bantu prioritaskan atau rangkum jadwal jika diminta.`;

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ],
    max_tokens: 500,
  });

  const reply = completion.choices[0]?.message?.content ?? (lang === "en" ? "No response." : "Tidak ada respons.");
  return NextResponse.json({ reply });
}
