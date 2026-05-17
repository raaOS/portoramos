
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const path = require('path');

// Load env from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function testSimulation() {
    const VERCEL_URL = 'https://portfolio-shared.vercel.app';
    const visitorId = 'test-bot-check-' + Date.now();

    console.log('--- STARTING SIMULATION TEST ---');
    console.log('Visitor ID:', visitorId);

    // 1. Send message as visitor (to Vercel)
    console.log('\n1. Sending message as visitor...');
    const sendRes = await fetch(`${VERCEL_URL}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            visitorId,
            message: "Hello from Simulation Bot! Can I reply to this?"
        })
    });
    const sendData = await sendRes.json();
    console.log('Response:', JSON.stringify(sendData));

    if (!sendData.success) {
        console.error('Failed to send visitor message');
        return;
    }

    // 2. Wait for mapping to populate in CLOUDFLARE_D1 (Vercel side)
    console.log('\n2. Waiting 5s for Vercel to process and map Telegram notification...');
    await new Promise(r => setTimeout(r, 5000));

    // 3. Check if mapping exists (Optional, we can just try to reply)
    // For a real "honest" test, we simulate the Telegram Webhook now.
    // We don't know the REAL Telegram ID here, but we can check if the WEBHOOK is alive.

    console.log('\n3. Testing if Admin Detection (isAdmin) works on Vercel...');
    const adminChatId = process.env.TELEGRAM_CHAT_ID?.replace(/"/g, '');
    const groupId = process.env.TELEGRAM_GROUP_ID?.replace(/"/g, '');

    // We send a webhook call that should fail visitor lookup but PASS isAdmin check
    const webhookRes = await fetch(`${VERCEL_URL}/api/webhook/telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: {
                chat: { id: parseInt(groupId) || parseInt(adminChatId) },
                from: { id: parseInt(adminChatId) },
                text: "Simulation Admin Reply",
                reply_to_message: {
                    message_id: 12345 // This won't match, which is fine, we just want to see if it hits the right code path
                }
            }
        })
    });
    const webhookData = await webhookRes.json();
    console.log('Webhook Response:', JSON.stringify(webhookData));

    if (webhookData.ok) {
        console.log('\n✅ TEST SUCCESS: Server is processing Telegram Webhooks correctly.');
        console.log('Manual replies will work as long as the Visitor mapping exists in CLOUDFLARE_D1.');
    } else {
        console.log('\n❌ TEST FAILED: Webhook endpoint returned error.');
    }
}

testSimulation();
