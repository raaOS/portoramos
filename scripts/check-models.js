const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
let apiKey = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GEMINI_API_KEY=(.*)/);
    if (match && match[1]) {
        apiKey = match[1].trim();
    }
} catch (err) {
    console.error('Could not read .env.local');
}

if (!apiKey) {
    console.error('No API Key found in .env.local');
    process.exit(1);
}

console.log('Testing Key:', apiKey.substring(0, 10) + '...');

async function checkModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.error) {
            console.error('API Error:', JSON.stringify(data.error, null, 2));
            return;
        }

        if (data.models) {
            console.log('Available Models:');
            data.models.forEach(m => console.log(`- ${m.name}`));
        } else {
            console.log('No models returned. Response:', data);
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

checkModels();
