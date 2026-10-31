# Agenda

Notes + kalender + reminder + upload foto/VN untuk jadwal acara, kerja, dan lomba. Dibuat dengan Next.js (App Router) + TypeScript + Tailwind, login pakai NextAuth, dan siap deploy ke Vercel.

## Fitur

- Tambah jadwal dengan kategori (Acara/Kerja/Lomba/Lainnya), deadline, dan reminder lead-time.
- Lampiran foto (otomatis dikompres) dan voice note (rekam langsung atau upload file audio).
- Banner otomatis untuk jadwal yang sudah lewat atau akan jatuh tempo.
- Tampilan List dan Kalender bulanan.
- Tombol **"Tambah ke Kalender HP"** — download file `.ics` untuk diimport ke Google/Apple Calendar, supaya notifikasi benar-benar bunyi di HP kamu (bukan cuma saat web ini dibuka).
- Login satu akun (kamu sendiri) via email + password, session dengan NextAuth.

## 1. Jalankan di lokal

```bash
npm install
cp .env.example .env.local
```

Isi `.env.local`:

1. **AUTH_EMAIL** — email yang mau kamu pakai login.
2. **AUTH_PASSWORD_HASH** — jalankan:
   ```bash
   npm run hash-password -- "passwordkamu"
   ```
   lalu salin hasil `AUTH_PASSWORD_HASH=...` ke `.env.local`.
3. **NEXTAUTH_SECRET** — generate string acak:
   ```bash
   openssl rand -base64 32
   ```
4. **NEXTAUTH_URL** — biarkan `http://localhost:3000` untuk dev.

Lalu jalankan:

```bash
npm run dev
```

Buka `http://localhost:3000`, login dengan email + password yang kamu set. Tanpa `KV_REST_API_URL`/`KV_REST_API_TOKEN`, data tersimpan sementara di memori server (cukup untuk coba-coba lokal, tapi akan hilang tiap restart `npm run dev`).

## 2. Deploy ke Vercel

1. Push project ini ke GitHub (repo baru).
2. Di [vercel.com](https://vercel.com), klik **Add New → Project**, import repo tadi.
3. Sebelum deploy pertama, buka tab **Storage** di project Vercel kamu → **Create Database** → pilih **KV** (atau integrasi Redis dari Marketplace kalau KV sudah tidak tersedia) → connect ke project ini. Ini WAJIB supaya data jadwal kamu tidak hilang — server Vercel bersifat serverless/stateless, jadi tanpa database eksternal, data akan hilang.
4. Vercel otomatis menambahkan `KV_REST_API_URL` dan `KV_REST_API_TOKEN` ke Environment Variables project kamu.
5. Tambahkan environment variables manual di **Settings → Environment Variables**:
   - `AUTH_EMAIL`
   - `AUTH_PASSWORD_HASH` (hasil dari `npm run hash-password`)
   - `NEXTAUTH_SECRET` (hasil dari `openssl rand -base64 32`)
   - `NEXTAUTH_URL` → isi dengan URL Vercel kamu, misal `https://agenda-kamu.vercel.app` (update lagi setelah domain final diketahui)
6. Deploy. Setelah selesai, buka URL-nya, login, dan mulai isi jadwal.

## Struktur singkat

```
app/
  page.tsx              -> halaman utama (cek session, render AgendaClient)
  login/page.tsx         -> halaman login
  api/auth/[...nextauth] -> NextAuth handler
  api/entries            -> GET (list) & POST (tambah)
  api/entries/[id]       -> PATCH (update/selesai) & DELETE (hapus)
components/AgendaClient.tsx -> semua UI & logic (list, kalender, modal form, upload)
lib/auth.ts             -> konfigurasi login single-user
lib/store.ts            -> penyimpanan data (Vercel KV di produksi)
lib/types.ts            -> tipe data Entry
middleware.ts           -> proteksi semua halaman kecuali /login
```

## Kalau mau ganti ke banyak user / database penuh

Setup ini sengaja simpel (satu login, data disimpan sebagai satu daftar di KV) karena dirancang untuk dipakai sendiri. Kalau nanti butuh multi-user beneran, ganti `lib/auth.ts` untuk cek ke database (misal Postgres via Prisma) dan `lib/store.ts` untuk menyimpan data per user id, bukan satu key global.
