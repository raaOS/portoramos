/**
 * Test chat system di production Vercel
 * Usage: node scripts/test-production.mjs https://ramos-portofolio.vercel.app
 */
const BASE_URL = process.argv[2] || 'https://ramos-portofolio.vercel.app';
const TEST_VISITOR_ID = `prod_test_${Date.now()}`;

console.log('🧪 Production Chat System Test');
console.log('==============================');
console.log('URL:', BASE_URL);
console.log('Visitor ID:', TEST_VISITOR_ID);
console.log('');

async function test() {
  // Step 1: Check webhook status
  console.log('📡 Step 1: Checking webhook status...');
  console.log('  Webhook info diperiksa via CLI lokal:');
  console.log('    npm run telegram:webhook-info');
  console.log('  Endpoint /api/debug/webhook-status sudah dihapus.');
  console.log('');

  // Step 2: Send message as visitor
  console.log('📤 Step 2: Sending message as visitor...');
  let threadId = null;
  try {
    const sendRes = await fetch(`${BASE_URL}/api/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello from production test!',
        visitorId: TEST_VISITOR_ID,
        pageUrl: '/contact',
      }),
    });

    const sendData = await sendRes.json();
    console.log('  Success:', sendData.success ? '✅' : '❌');

    if (sendData.success) {
      // Wait for CLOUDFLARE_D1
      await new Promise((r) => setTimeout(r, 3000));

      // Get session
      const sessionRes = await fetch(
        `${BASE_URL}/api/debug/chat-session?visitorId=${TEST_VISITOR_ID}`
      );
      const sessionData = await sessionRes.json();

      if (sessionData.session?.telegramThreadId) {
        threadId = sessionData.session.telegramThreadId;
        console.log('  Thread ID:', threadId);
        console.log('  ✅ Topic created successfully!');
      } else {
        console.log('  ⚠️  No topic created (fallback to DM)');
      }
    }
  } catch (e) {
    console.log('  ❌ Failed:', e.message);
  }
  console.log('');

  // Step 3: Check thread mapping
  if (threadId) {
    console.log('🔗 Step 3: Checking thread mapping...');
    try {
      const mapRes = await fetch(`${BASE_URL}/api/debug/webhook-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId }),
      });
      const mapData = await mapRes.json();
      console.log('  Thread:', threadId);
      console.log('  Visitor found:', mapData.result?.visitorId ? '✅' : '❌');
      if (mapData.result?.visitorId) {
        console.log('  Visitor ID:', mapData.result.visitorId);
      }
    } catch (e) {
      console.log('  ❌ Failed:', e.message);
    }
    console.log('');
  }

  // Summary
  console.log('==============================');
  console.log('📋 Summary:');
  console.log('  - Webhook URL perlu diperiksa (lihat Step 1)');
  if (threadId) {
    console.log(`  - Thread ID: ${threadId}`);
    console.log('  - Balas dari Telegram di topik ini');
    console.log('  - Cek log Vercel untuk melihat [Webhook Debug]');
  }
  console.log('');
  console.log('📝 Cara test admin reply:');
  console.log(`  1. Buka topik dengan Thread ID: ${threadId || '(kirim pesan dulu)'}`);
  console.log('  2. Balas pesan dari aplikasi Telegram');
  console.log('  3. Cek log Vercel: npx vercel logs');
  console.log('  4. Refresh halaman contact untuk lihat balasan');
}

test().catch(console.error);
