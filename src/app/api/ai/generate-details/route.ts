import { NextRequest, NextResponse } from 'next/server';

/**
 * MOCK AI - Replaced Real Gemini AI as per user request.
 * Simulates intelligent analysis for demo purposes without external API dependencies.
 */
export async function POST(req: NextRequest) {
    // Simulate network delay for "AI thinking" effect
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
        const { imageUrl, style = 'estetik', maxTitleWords = 5, sentenceCount = 2 } = await req.json();

        // Mock Logic: Pick random templates based on style
        const titles = [
            "Harmoni dalam Visual",
            "Eksplorasi Dimensi Baru",
            "Sentuhan Modern Minimalis",
            "Refleksi Cahaya Malam",
            "Dinamika Warna Alam"
        ];

        const aesthetics = [
            "Karya ini menonjolkan keseimbangan antara warna dan ruang negatif yang memberikan kesan tenang.",
            "Penggunaan elemen visual yang berani menciptakan fokus utama yang kuat dan memikat.",
            "Detail tekstur yang halus memberikan kedalaman dimensi yang kaya pada komposisi ini.",
            "Nuansa yang dihadirkan terasa sangat personal, menggugah emosi melalui palet warna yang hangat.",
            "Sebuah representasi visual yang modern, menggabungkan estetika masa kini dengan sentuhan klasik."
        ];

        const genZ = [
            "Vibe-nya dapet banget, chill tapi tetep estetik parah.",
            "Lowkey keren sih ini, komposisinya gak berisik tapi ngena.",
            "Mood-nya dapet, definisi visual yang calming buat mata.",
            "Simple, clean, dan gak neko-neko. Asli keren.",
            "Styling-nya on point, cocok banget buat referensi masa kini."
        ];

        const selectedDesc = style.includes('santai') || style.includes('Gen-Z')
            ? genZ
            : aesthetics;

        // Random Selection
        const title = titles[Math.floor(Math.random() * titles.length)];
        const desc1 = selectedDesc[Math.floor(Math.random() * selectedDesc.length)];
        let desc2 = selectedDesc[Math.floor(Math.random() * selectedDesc.length)];

        // Ensure desc2 is different
        while (desc1 === desc2) {
            desc2 = selectedDesc[Math.floor(Math.random() * selectedDesc.length)];
        }

        return NextResponse.json({
            title: title + (Math.random() > 0.5 ? " Abadi" : ""), // Add slight variation
            description: `${desc1} ${desc2}`
        });

    } catch (error: any) {
        console.error('Mock AI Error:', error);
        return NextResponse.json({ error: 'Failed to generate mock response' }, { status: 500 });
    }
}
