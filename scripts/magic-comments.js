const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
const fs = require('fs');
const https = require('https');

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing from .env.local");
    process.exit(1);
}
const projectsFile = path.join(__dirname, '../src/data/projects.json');
const commentsFile = path.join(__dirname, '../src/data/comments.json');

const NAMES = ["Bagas", "Dinda", "Rizky", "Siti", "Adit", "Fajri", "Tiara", "Gilang", "Putri", "Zaki"];

async function downloadImage(url) {
    return new Promise((resolve, reject) => {
        let targetUrl = url;
        if (url.includes('cloudinary') && url.endsWith('.mp4')) {
            targetUrl = url.replace('.mp4', '.jpg');
        }
        https.get(targetUrl, (res) => {
            const data = [];
            res.on('data', chunk => data.push(chunk));
            res.on('end', () => resolve(Buffer.concat(data)));
            res.on('error', reject);
        }).on('error', reject);
    });
}

async function startGemini(buffer, projectTitle) {
    const model = 'gemini-flash-latest';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
    const base64Image = buffer.toString('base64');

    const prompt = `Analisis gambar/karya ini (Judul: ${projectTitle}). 
    Buatlah 2-3 komentar netizen Indonesia yang SANGAT NATURAL, GAUL, dan MENGGUNAKAN TREN TERKINI.
    Gunakan variasi gaya: 
    1. Gaya "Suhu/Sepuh" (contoh: "Tutor suhu", "Kelas abangku 🔥").
    2. Gaya "Hyperbole/King" (contoh: "Mantap king, mahkotanya lagi di JNE Cakung").
    3. Gaya "Gen-Z Casual" (contoh: "Gak ada obat!", "Vibesnya dapet bgt parah").
    WAJIB TAMBAHKAN EMOTICON YANG SESUAI (🔥, 🙏, 😎, 👑, ✨).
    
    Juga buatlah 1 balasan (reply) dari pemilik portofolio untuk salah satu komentar tersebut dengan gaya yang santai pula.
    
    Output JSON murni:
    [
      {
        "text": "isi komentar netizen",
        "author": "Nama Random",
        "reply": "isi balasan pemilik"
      },
      ...
    ]`;

    const requestBody = {
        contents: [{
            parts: [
                { text: prompt },
                { inline_data: { mime_type: "image/jpeg", data: base64Image } }
            ]
        }]
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonText);
}

async function run() {
    console.log("💬 Generating Magic Comments (Indonesian Slang)...");

    const projectsData = JSON.parse(fs.readFileSync(projectsFile, 'utf8'));
    const commentsData = JSON.parse(fs.readFileSync(commentsFile, 'utf8'));

    for (const project of projectsData.projects) {
        const slug = project.slug;

        // Skip if already has genuine-looking comments (length > 2)
        if (commentsData.comments[slug] && commentsData.comments[slug].length > 0) {
            console.log(`⏩ Skipping ${slug} (already has comments)`);
            continue;
        }

        async function generateWithRetry(retries = 3) {
            try {
                const buffer = await downloadImage(project.cover);
                return await startGemini(buffer, project.title);
            } catch (e) {
                if (e.message.includes('429') && retries > 0) {
                    console.log("   ⏳ Rate limit hit. Waiting 30s...");
                    await new Promise(r => setTimeout(r, 30000));
                    return generateWithRetry(retries - 1);
                }
                throw e;
            }
        }

        try {
            const aiComments = await generateWithRetry();

            const formattedComments = aiComments.map((c, i) => ({
                id: `ai-${Date.now()}-${i}`,
                text: c.text,
                author: c.author || NAMES[Math.floor(Math.random() * NAMES.length)],
                time: `${Math.floor(Math.random() * 59) + 1} menit yang lalu`,
                likes: Math.floor(Math.random() * 50),
                replies: c.reply ? [{
                    id: `air-${Date.now()}-${i}`,
                    text: c.reply,
                    author: "Admin", // Or owner name
                    time: "Baru saja",
                    likes: Math.floor(Math.random() * 10)
                }] : []
            }));

            commentsData.comments[slug] = formattedComments;

            // Save after each project
            fs.writeFileSync(commentsFile, JSON.stringify(commentsData, null, 2));
            console.log(`   ✅ Added ${formattedComments.length} comments.`);

            // Wait 25s for rate limit
            await new Promise(r => setTimeout(r, 25000));
        } catch (e) {
            console.error(`   ❌ Error for ${slug}: ${e.message}`);
        }
    }

    console.log("🎉 All comments generated!");
}

run();
