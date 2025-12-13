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
console.log(`Using Key: ${apiKey ? apiKey.substring(0, 5) + '...' : 'NONE'}`);

const genAI = new GoogleGenerativeAI(apiKey);

async function testModels() {
    const modelName = "gemini-1.5-flash";
    console.log(`Testing ${modelName}... `);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Say 'Hello'");
        console.log(`✅ WORKS! Response: ${result.response.text()}`);
    } catch (error) {
        console.log(`❌ FAILED`);
        console.log(`   Reason: ${error.message}`);
    }
}

testModels();
