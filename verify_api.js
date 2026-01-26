// Native fetch is available in Node 18+

async function checkApi() {
    try {
        const res = await fetch('http://localhost:3000/api/admin/icons');
        if (!res.ok) {
            console.error('API Error:', res.status, res.statusText);
            return;
        }
        const data = await res.json();
        console.log('Icons found:', data.icons.length);
        const banana = data.icons.find(i => i.includes('banana') || i.includes('test_converted'));
        if (banana) {
            console.log('✅ Found banana icon in API:', banana);
        } else {
            console.log('❌ Banana icon NOT found in API list.');
            console.log('Sample icons:', data.icons.slice(0, 5));
        }
    } catch (e) {
        console.error('Fetch failed:', e.message);
    }
}

checkApi();
