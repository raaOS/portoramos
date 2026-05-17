import { test, expect } from '@playwright/test';

/**
 * Admin Reply E2E Tests
 * 
 * Tests end-to-end chat flow:
 * Visitor sends message → CLOUDFLARE_D1 stores it → Telegram notification → Admin replies
 * 
 * REQUIREMENTS TO RUN:
 * - Set ENABLE_DEBUG_TESTS=true in environment
 * - OR run in development mode (NODE_ENV=development)
 * - CLOUDFLARE_D1 must be configured and accessible
 * 
 * These tests are skipped by default in production/CI because they require
 * debug endpoints and external services (Telegram, CLOUDFLARE_D1).
 */

const isDebugEnabled = () => {
  return process.env.ENABLE_DEBUG_TESTS === 'true' || 
         process.env.NODE_ENV === 'development';
};

test.describe('Admin Reply E2E Test', () => {
  const TEST_VISITOR_ID = `admin_reply_test_${Date.now()}`;

  test('visitor sends message then admin replies', async ({ page, request }) => {
    // Skip if debug mode not enabled
    if (!isDebugEnabled()) {
      console.log('ℹ️ Admin reply test skipped. Set ENABLE_DEBUG_TESTS=true to run.');
      test.skip();
      return;
    }

    // Check if debug endpoints are available
    const debugCheck = await request.get('/api/debug/chat-session?visitorId=test');
    if (debugCheck.status() === 404) {
      console.log('⚠️ Debug endpoints not available. Ensure dev server is running with debug routes.');
      test.skip();
      return;
    }

    // Step 1: Visitor sends message
    console.log('📤 Step 1: Visitor sending message...');
    const sendRes = await request.post('/api/chat/send', {
      data: {
        message: 'Hello! Need help with design.',
        visitorId: TEST_VISITOR_ID,
        pageUrl: '/contact'
      }
    });

    expect(sendRes.ok()).toBeTruthy();
    const sendData = await sendRes.json();
    console.log('Send result:', sendData);

    // Wait for CLOUDFLARE_D1
    await page.waitForTimeout(3000);

    // Step 2: Check session
    console.log('🔍 Step 2: Checking session...');
    const sessionRes = await request.get(`/api/debug/chat-session?visitorId=${TEST_VISITOR_ID}`);
    
    if (sessionRes.status() !== 200) {
      console.log('⚠️ Debug endpoint not available');
      test.skip();
      return;
    }
    
    const sessionData = await sessionRes.json();
    
    console.log('Session:', sessionData.session);
    expect(sessionData.session).toBeDefined();
    expect(sessionData.messages.length).toBeGreaterThan(0);

    const threadId = sessionData.session?.telegramThreadId;
    console.log('Thread ID:', threadId);

    // Step 3: Simulate admin reply
    console.log('📥 Step 3: Simulating admin reply...');
    const replyRes = await request.post('/api/debug/simulate-reply', {
      data: {
        visitorId: TEST_VISITOR_ID,
        text: 'Hi! Sure, I can help you with design. What do you need?'
      }
    });

    if (replyRes.status() !== 200) {
      console.log('⚠️ Simulate reply endpoint not available');
      test.skip();
      return;
    }

    const replyData = await replyRes.json();
    console.log('Reply result:', replyData);
    
    expect(replyData.success).toBe(true);
    expect(replyData.adminReplyAdded).toBe(true);

    // Step 4: Verify message appeared
    console.log('✅ Step 4: Verifying admin message...');
    await page.waitForTimeout(1000);
    
    const verifyRes = await request.get(`/api/debug/chat-session?visitorId=${TEST_VISITOR_ID}`);
    const verifyData = await verifyRes.json();

    const adminMessages = verifyData.messages.filter((m: { sender?: string }) => m.sender === 'admin');
    console.log('Admin messages:', adminMessages.length);
    
    // Should have AI reply + our manual admin reply
    expect(adminMessages.length).toBeGreaterThanOrEqual(1);
    
    // Check if our specific message is there
    const ourReply = adminMessages.find((m: { text?: string }) => 
      m.text?.includes('Sure, I can help you with design')
    );
    expect(ourReply).toBeDefined();

    console.log('✅ Admin reply test PASSED!');
  });

  test('webhook endpoint receives and processes messages', async ({ request }) => {
    // Skip if debug mode not enabled
    if (!isDebugEnabled()) {
      console.log('ℹ️ Webhook test skipped. Set ENABLE_DEBUG_TESTS=true to run.');
      test.skip();
      return;
    }

    // First create a visitor
    const visitorId = `webhook_test_${Date.now()}`;
    
    await request.post('/api/chat/send', {
      data: {
        message: 'Test for webhook',
        visitorId: visitorId,
        pageUrl: '/contact'
      }
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Get session to find threadId
    const sessionRes = await request.get(`/api/debug/chat-session?visitorId=${visitorId}`);
    if (sessionRes.status() !== 200) {
      console.log('⚠️ Debug endpoint not available');
      test.skip();
      return;
    }
    
    const sessionData = await sessionRes.json();
    const threadId = sessionData.session?.telegramThreadId;

    if (!threadId) {
      console.log('⚠️ No threadId, skipping webhook test');
      test.skip();
      return;
    }

    // Test webhook endpoint directly
    console.log('Testing webhook with threadId:', threadId);
    
    const webhookRes = await request.post('/api/webhook/telegram', {
      data: {
        message: {
          message_id: Date.now(),
          chat: { id: -1003417160849 }, // GROUP_ID
          message_thread_id: threadId,
          text: 'Test reply from webhook',
          from: { id: 6116803120 } // ADMIN_CHAT_ID
        }
      }
    });

    expect(webhookRes.ok()).toBeTruthy();
    
    // Wait and verify
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const verifyRes = await request.get(`/api/debug/chat-session?visitorId=${visitorId}`);
    const verifyData = await verifyRes.json();
    
    const adminMessages = verifyData.messages.filter((m: { sender?: string }) => m.sender === 'admin');
    console.log('Total admin messages after webhook:', adminMessages.length);
    
    // Should have AI + webhook reply
    expect(adminMessages.length).toBeGreaterThanOrEqual(2);
  });
});
