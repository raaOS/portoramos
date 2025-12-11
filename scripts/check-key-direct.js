const apiKey = 'AIzaSyAujS66RvZMoOWVSA8RpXBs5Xo2LzRA1BE';

console.log('Testing Key Direct:', apiKey.substring(0, 10) + '...');

async function checkModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.error) {
            console.error('API Error:', JSON.stringify(data.error, null, 2));
            return;
        }

        if (data.models) {
            console.log('SUCCESS! Available Models:');
            const names = data.models.map(m => m.name);
            console.log(names.join(', '));

            // Specific check for flash
            const hasFlash = names.some(n => n.includes('gemini-1.5-flash'));
            console.log('\nHas gemini-1.5-flash?', hasFlash);
        } else {
            console.log('No models returned. Response:', data);
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

checkModels();
