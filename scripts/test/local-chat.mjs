/**
 * Test script untuk chat system di local
 * Run: node scripts/test-local-chat.mjs
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

const BASE_URL = 'http://localhost:3000';
const TEST_VISITOR_ID = `local_test_${Date.now()}`;

console.log('🧪 Local Chat System Test');
console.log('==========================');
console.log('Visitor ID:', TEST_VISITOR_ID);
console.log('');

async function test() {
  // Step 1: Send message as visitor
  console.log('📤 Step 1: Sending message as visitor...');
  const sendRes = await fetch(`${BASE_URL}/api/chat/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Hello from local test!',
      visitorId: TEST_VISITOR_ID,
      pageUrl: '/contact',
    }),
  });

  const sendData = await sendRes.json();
  console.log('Result:', sendData.success ? '✅ Success' : '❌ Failed');
  console.log('');

  // Wait for CLOUDFLARE_D1
  await new Promise((r) => setTimeout(r, 2000));

  // Step 2: Check session
  console.log('🔍 Step 2: Checking session...');
  const sessionRes = await fetch(`${BASE_URL}/api/debug/chat-session?visitorId=${TEST_VISITOR_ID}`);
  const sessionData = await sessionRes.json();

  if (sessionData.session?.telegramThreadId) {
    console.log('✅ Topic created! Thread ID:', sessionData.session.telegramThreadId);
  } else {
    console.log('⚠️ No topic created (fallback to DM)');
  }
  console.log('');

  // Step 3: Simulate admin reply
  console.log('📥 Step 3: Simulating admin reply...');
  const replyRes = await fetch(`${BASE_URL}/api/debug/simulate-reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      visitorId: TEST_VISITOR_ID,
      text: 'Hello! This is admin reply from local test.',
    }),
  });

  const replyData = await replyRes.json();
  console.log('Result:', replyData.success ? '✅ Reply added' : '❌ Failed');
  console.log('Admin messages count:', replyData.totalAdminMessages);
  console.log('');

  // Step 4: Verify messages
  console.log('✅ Step 4: Verifying messages...');
  const verifyRes = await fetch(`${BASE_URL}/api/debug/chat-session?visitorId=${TEST_VISITOR_ID}`);
  const verifyData = await verifyRes.json();

  console.log('All messages:');
  verifyData.messages?.forEach((m, i) => {
    const icon = m.sender === 'visitor' ? '👤' : '🤖';
    console.log(`  ${i + 1}. ${icon} [${m.sender}]: ${m.text.substring(0, 50)}...`);
  });

  console.log('');
  console.log('==========================');
  console.log(replyData.success ? '✅ Test PASSED!' : '❌ Test FAILED!');
  console.log('');
  console.log('To test webhook manually:');
  console.log(
    `  curl -X POST "${BASE_URL}/api/debug/simulate-reply" \\\n    -H "Content-Type: application/json" \\\n    -d '{"visitorId":"${TEST_VISITOR_ID}","text":"Another reply"}'`
  );
}

test().catch(console.error);
