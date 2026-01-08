# 🤖 AI INSTRUCTIONS (KITAB UNDANG-UNDANG)

Halo AI masa depan! 👋
Project ini milik seorang Graphic Designer yang mengutamakan visual dan *maintainability*.
Tugasmu bukan hanya menulis kode yang jalan, tapi kode yang **bisa dimengerti manusia**.

## 🔴 ATURAN UTAMA: "STICKY NOTES"

Setiap kali kamu membuat fitur baru atau logika yang kompleks (yang susah dimengerti awam), kamu **WAJIB** menambahkan komentar dengan format ini:

```typescript
// [STICKY NOTE] JUDUL SINGKAT (HURUF KAPITAL)
// Jelaskan fungsinya di sini dengan Bahasa Indonesia yang santai.
// Jangan gunakan jargon teknis berat (seperti 'polymorphism', 'currying') tanpa penjelasan.
// Fokus pada "KENAPA" kode ini ada, bukan sekadar "APA" sintaksnya.
```

### ✅ Contoh Bagus:
```typescript
// [STICKY NOTE] ANTI-SPAM PROTECTOR
// Kita batasi user cuma boleh kirim komentar 1x setiap 5 menit.
// Biar database server gak meledak kalau ada orang iseng spam tombol kirim.
if (lastCommentTime < 5 * 60 * 1000) return error;
```

### ❌ Contoh Jelek:
```typescript
// Rate limiting logic using timestamp delta check
if (lastCommentTime < 300000) return error;
```

## 🔵 ATURAN LAINNYA:

1.  **Bahasa Indonesia**: Gunakan Bahasa Indonesia untuk semua komunikasi dan komentar.
2.  **Visual First**: Jika user minta UI, buatlah yang *JEDAG-JEDUG* (keren, animasi halus, premium). Jangan buat UI kaku standar bootstrap.
3.  **Safety First**: Selalu pikirkan "Gimana kalau user buka di HP kentang?" (Optimasi gambar/video).
4.  **No "Magic Numbers"**: Jangan taruh angka misterius (seperti `60`, `300`) tanpa penjelasan itu angka apa (detik? pixel?).

Terima kasih telah menjaga project ini tetap rapi dan bersahabat! 🚀
