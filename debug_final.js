
const https = require('https');
const fs = require('fs');

async function test() {
    console.log('--- FINAL DIAGNOSTICS ---');

    // 0. Load Key
    let key = '';
    try {
        key = fs.readFileSync('.env.local', 'utf8').match(/GOOGLE_GENERATIVE_AI_API_KEY=(.+)/)[1].trim();
        console.log(`Key loaded: ${key.substring(0, 5)}...`);
    } catch (e) { console.error("Key Load Error", e.message); return; }

    // 1. Image Fetch with Headers
    const imgUrl = "https://res.cloudinary.com/dcb3dslfw/video/upload/v1766766027/AQMTv6W-b3QiMojlLzH-irXdIIj4j-g_7OtQduJu4_qY3HVIN71jt83j0WU7O-VH2O1kKIbBiO-q5vQfSp4P97Wnazp7uDOQ_wxarha.jpg";
    console.log('\n--> Testing Image Fetch with User-Agent...');

    try {
        const res = await fetch(imgUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        if (res.ok) console.log(`✅ Image Fetch Success: ${res.status}`);
        else console.log(`❌ Image Fetch Failed: ${res.status} ${res.statusText}`);
    } catch (e) {
        console.log(`❌ Image Fetch Error: ${e.message}`);
    }

    // 2. Test Models
    const models = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-pro', 'gemini-1.0-pro'];
    console.log('\n--> Testing Gemini Models...');

    for (const m of models) {
        console.log(`\nChecking model: ${m}`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`;
        const body = JSON.stringify({ contents: [{ parts: [{ text: "Hi" }] }] });

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body
            });
            const text = await res.text();
            if (res.ok) {
                console.log(`✅ SUCCESS! Model ${m} is working.`);
                break; // Stop on first success
            } else {
                console.log(`❌ Failed: ${res.status} - ${text.substring(0, 100)}...`);
            }
        } catch (e) {
            console.log(`❌ Network Error: ${e.message}`);
        }
    }
}

test();
