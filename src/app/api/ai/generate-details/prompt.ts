interface ProjectDetailsPromptInput {
  style: string;
  maxTitleWords: number;
  sentenceCount: number;
}

export function buildProjectDetailsPrompt({
  style,
  maxTitleWords,
  sentenceCount,
}: ProjectDetailsPromptInput) {
  return `Analisis gambar ini secara mendalam. 
        BERTINDAK SEBAGAI: Desainer yang fokus pada detail, kualitas eksekusi, dan kejujuran dalam berkarya.
        
        TONE/GAYA BAHASA (WAJIB):
        - Style: "${style}" (Gunakan ini sebagai landasan, tapi tetap LOW PROFILE).
        - HINDARI: Hiperbola (revolusioner, luar biasa, terbaik), kata-kata "menjual diri", atau kesan haus pujian.
        - HINDARI: Bahasa "marketing" atau "branding" yang terlalu kaku dan terkesan "baca pasar".
        - TUJUAN: Merendah tapi tidak rendah. Tunjukkan kualitas lewat kejujuran proses dan detail, bukan lewat klaim besar.
        - BAHASA: Indonesia yang tenang, lugas, dan apa adanya. Bisa menggunakan istilah teknis jika perlu.
        
        Karakter Style:
        - professional: Fokus pada kejelasan fungsi, tanggung jawab eksekusi, dan keteraturan.
        - creative: Fokus pada rasa ingin tahu (curiosity), eksperimen kecil, dan eksplorasi visual.
        - minimalist: Fokus pada esensi, efisiensi, dan menghilangkan hal yang tidak perlu.
        
        Isi Detail:
        1. JUDUL: (max ${maxTitleWords} kata, deskriptif & tidak berlebihan)
        2. DESKRIPSI: (max ${sentenceCount} kalimat) Jelaskan inti visual secara jujur.
        3. CLIENT: (Identitas brand atau "Personal Exploration").
        4. TAGS: (3-5 kata kunci teknis).
        5. SOFTWARE: (Max 2 software UTAMA yang kemungkinan besar digunakan: photoshop, illustrator, indesign, figma, affinity_designer, affinity_photo, capcut, finalcut, davinci).
        6. TYPE: "visual_art" atau "commercial".
        
        CASE STUDY DETAILS (Berdasarkan pengamatan visual yang nyata):
        - ROLE: (Cth: "UI Execution", "Visual Development", "3D Modeling")
        - TEAM: (Cth: "Independent Project", "Small Group Collaboration")
        - TIMELINE: (Cth: "Short Sprint", "Weekend Exploration")
        
        NARRATIVE (Gunakan sudut pandang "Belajar & Berproses"):
        Jika Commercial:
        - challenge: (Konteks bisnis dan masalah utama apa yang menantang?)
        - solution: (Langkah apa yang kamu ambil untuk mencoba menyelesaikan masalah tersebut?)
        - impact: (Hasil kecil atau pelajaran apa yang didapat dari project ini?)
        
        Jika Visual Art:
        - concept: (Rasa ingin tahu atau eksperimen apa yang mendasari karya ini?)
        - process: (Bagaimana cara kamu mengerjakannya secara teknis?)
        - detail: (Detail kecil apa yang menarik untuk diperhatikan?)
        
        Output JSON murni:
        {
          "title": "...",
          "description": "...",
          "client": "...",
          "tags": "...",
          "software": ["photoshop", "figma"],
          "type": "commercial | visual_art",
          "role": "...",
          "team": "...",
          "timeline": "...",
          "narrative": {
             "challenge": "...", "solution": "...", "impact": "...",
             "concept": "...", "process": "...", "detail": "..."
          }
        }`;
}
