export function buildCommentPrompt(params: {
  count: number;
  tone: string;
  reply: boolean;
  projectTitle?: string;
  projectDescription?: string;
  hasMedia: boolean;
}) {
  const toneDescription =
    params.tone === 'tech'
      ? 'Teknis & Mendalam — komentar berisi pertanyaan atau observasi soal teknologi, arsitektur, performa, atau detail teknis yang terlihat.'
      : params.tone === 'aesthetic'
        ? 'Estetik & Visual — komentar membahas elemen visual spesifik: warna, tipografi, layout, spacing, animasi, atau komposisi yang terlihat di gambar/video.'
        : 'Kasual & Santai — bahasa sehari-hari anak muda Indonesia, tapi tetap sopan dan spesifik. Hindari slang berlebihan.';

  const mediaInstruction = params.hasMedia
    ? `PENTING — GAMBAR/VIDEO TERLAMPIR:
      Kamu DIBERIKAN gambar atau screenshot dari proyek ini. Setiap komentar WAJIB menyebut sesuatu yang benar-benar terlihat di gambar tersebut (misalnya: elemen UI spesifik, warna dominan, layout, ikon, teks yang terlihat, atau fitur visual tertentu). Jangan mengarang hal yang tidak ada di gambar.`
    : `Tidak ada gambar yang diberikan. Buat komentar berdasarkan judul dan deskripsi proyek saja — tetap spesifik dan tidak generik.`;

  return `Kamu adalah sekelompok pengunjung berbeda yang melihat karya portofolio web developer/desainer.

PROYEK:
- Judul: "${params.projectTitle || 'Proyek Kreatif'}"
- Deskripsi: "${params.projectDescription || 'Tidak ada deskripsi'}"

${mediaInstruction}

TUGAS:
Buat tepat ${params.count} komentar dalam Bahasa Indonesia yang terasa seperti komentar asli dari orang-orang berbeda.

TONE: "${params.tone}" → ${toneDescription}

ATURAN WAJIB:
1. Setiap komentar HARUS menyebut detail spesifik dari proyek (bukan pujian generik).
   - BURUK: "Keren banget!", "Gak ada obat!", "PC NASA sih ini"
   - BAIK: "Navbar-nya clean banget, glassmorphism-nya subtle pas", "Warna gradien biru ke ungu di hero section itu cocok sama vibe-nya"
2. Gunakan bahasa natural seperti orang sungguhan — JANGAN hiperbola atau lebay.
3. Emoji maksimal 1 per komentar, dan tidak wajib.
4. Setiap komentator punya nama Indonesia yang unik, acak, dan bervariasi dari project ke project (hindari pengulangan nama yang sama seperti Rizky, Dinda, Bagas terus-menerus).
5. JANGAN ada 2 komentar dengan pola kalimat yang mirip.
6. Variasikan panjang komentar: ada yang 1 kalimat pendek, ada yang 2 kalimat.
${params.reply ? `
BALASAN:
- Untuk setiap komentar, buat 1 balasan dari "Ramos" (pemilik portofolio).
- Balasan harus SPESIFIK merespons isi komentar tersebut — bukan template seperti "Makasih!" atau "Thanks!".
- Contoh bagus: Jika komentar bertanya soal animasi, Ramos menjelaskan teknik yang dipakai.
- Contoh buruk: "Makasih banyak! 🙏" (terlalu generik).` : `
BALASAN: Tidak perlu balasan — set replies ke array kosong [].`}

FORMAT OUTPUT — JSON array murni tanpa markdown codeblock:
[
  {
    "text": "komentar spesifik tentang proyek",
    "name": "Nama Komentator",
    "likes": 15,
    "replies": [${params.reply ? `
      {
        "text": "balasan spesifik dari Ramos",
        "name": "Ramos",
        "likes": 5
      }` : ''}
    ]
  }
]

Hanya kembalikan array JSON tersebut.`;
}
