const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

function getEnvVar(key) {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
        if (match) return match[1].trim();
    }
    return process.env[key];
}

const apiKey = getEnvVar('GEMINI_API_KEY');
const genAI = new GoogleGenerativeAI(apiKey);
const logFile = path.resolve(process.cwd(), 'models_list.txt');

async function list() {
    try {
        // Need to find how to list models via SDK or REST
        // The SDK might not expose listModels easily on the top level object in this version
        // Let's rely on REST API if SDK fails or try to guess.
        // But SDK usually has `getGenerativeModel`... 
        // Actually, standard google-generative-ai package doesn't always expose listModels directly in the main class.
        // Let's try to fetch via fetch() using the key.

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        fs.writeFileSync(logFile, JSON.stringify(data, null, 2));

    } catch (error) {
        fs.writeFileSync(logFile, `Error: ${error.message}`);
    }
}

list();
