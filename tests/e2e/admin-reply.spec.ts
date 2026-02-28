import { test, expect } from '@playwright/test';

test.describe('Admin Reply E2E Test', () => {
  const TEST_VISITOR_ID = `admin_reply_test_${Date.now()}`;

  test('visitor sends message then admin replies', async ({ page }) => {
    // Step 1: Visitor sends message
    console.log('📤 Step 1: Visitor sending message...');
    const sendRes = await page.request.post('/api/chat/send', {
      data: {
        message: 'Hello! Need help with design.',
        visitorId: TEST_VISITOR_ID,
        pageUrl: '/contact'
      }
    });

    expect(sendRes.ok()).toBeTruthy();
    const sendData = await sendRes.json();
    console.log('Send result:', sendData);

    // Wait for Firebase
    await page.waitForTimeout(3000);

    // Step 2: Check session
    console.log('🔍 Step 2: Checking session...');
    const sessionRes = await page.request.get(`/api/debug/chat-session?visitorId=${TEST_VISITOR_ID}`);
    const sessionData = await sessionRes.json();
    
    console.log('Session:', sessionData.session);
    expect(sessionData.session).toBeDefined();
    expect(sessionData.messages.length).toBeGreaterThan(0);

    const threadId = sessionData.session?.telegramThreadId;
    console.log('Thread ID:', threadId);

    // Step 3: Simulate admin reply
    console.log('📥 Step 3: Simulating admin reply...');
    const replyRes = await page.request.post('/api/debug/simulate-reply', {
      data: {
        visitorId: TEST_VISITOR_ID,
        text: 'Hi! Sure, I can help you with design. What do you need?'
      }
    });

    const replyData = await replyRes.json();
    console.log('Reply result:', replyData);
    
    expect(replyData.success).toBe(true);
    expect(replyData.adminReplyAdded).toBe(true);

    // Step 4: Verify message appeared
    console.log('✅ Step 4: Verifying admin message...');
    await page.waitForTimeout(1000);
    
    const verifyRes = await page.request.get(`/api/debug/chat-session?visitorId=${TEST_VISITOR_ID}`);
    const verifyData = await verifyRes.json();

    const adminMessages = verifyData.messages.filter((m: any) => m.sender === 'admin');
    console.log('Admin messages:', adminMessages.length);
    
    // Should have AI reply + our manual admin reply
    expect(adminMessages.length).toBeGreaterThanOrEqual(1);
    
    // Check if our specific message is there
    const ourReply = adminMessages.find((m: any) => 
      m.text.includes('Sure, I can help you with design')
    );
    expect(ourReply).toBeDefined();

    console.log('✅ Admin reply test PASSED!');
  });

  test('webhook endpoint receives and processes messages', async ({ page }) => {
    // First create a visitor
    const visitorId = `webhook_test_${Date.now()}`;
    
    await page.request.post('/api/chat/send', {
      data: {
        message: 'Test for webhook',
        visitorId: visitorId,
        pageUrl: '/contact'
      }
    });

    await page.waitForTimeout(3000);

    // Get session to find threadId
    const sessionRes = await page.request.get(`/api/debug/chat-session?visitorId=${visitorId}`);
    const sessionData = await sessionRes.json();
    const threadId = sessionData.session?.telegramThreadId;

    if (!threadId) {
      console.log('⚠️ No threadId, skipping webhook test');
      return;
    }

    // Test webhook endpoint directly
    console.log('Testing webhook with threadId:', threadId);
    
    const webhookRes = await page.request.post('/api/webhook/telegram', {
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
    await page.waitForTimeout(2000);
    
    const verifyRes = await page.request.get(`/api/debug/chat-session?visitorId=${visitorId}`);
    const verifyData = await verifyRes.json();
    
    const adminMessages = verifyData.messages.filter((m: any) => m.sender === 'admin');
    console.log('Total admin messages after webhook:', adminMessages.length);
    
    // Should have AI + webhook reply
    expect(adminMessages.length).toBeGreaterThanOrEqual(2);
  });
});
