import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });

const BASE_URL = 'http://localhost:3000';

async function runStressTest() {
  console.log('--- STARTING STRESS TEST FOR MAGIC-COMPLETE ENDPOINT ---');

  // 1. Get CSRF Token
  console.log('\n[1] Fetching CSRF Token...');
  let csrfRes;
  try {
    csrfRes = await fetch(`${BASE_URL}/api/admin/login`);
  } catch (err: any) {
    console.error(
      `❌ Could not connect to dev server at ${BASE_URL}. Is it running? Error:`,
      err.message
    );
    process.exit(1);
  }

  const csrfData = (await csrfRes.json()) as any;
  const csrfHeaderToken = csrfData.csrfToken;
  const csrfSetCookie = csrfRes.headers.getSetCookie();
  const csrfCookieStr = csrfSetCookie
    ? csrfSetCookie.map((c: string) => c.split(';')[0]).join('; ')
    : '';

  console.log(`Got CSRF Token: ${csrfHeaderToken ? 'YES' : 'NO'}`);

  // 2. Login
  console.log('\n[2] Logging in as admin...');
  const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: csrfCookieStr,
      'x-csrf-token': csrfHeaderToken,
    },
    body: JSON.stringify({ password: 'Urgent2025!' }),
  });

  if (!loginRes.ok) {
    console.error('❌ Login failed:', loginRes.status, await loginRes.text());
    process.exit(1);
  }

  const setCookieHeader = loginRes.headers.getSetCookie();
  const adminCookieStr = setCookieHeader.map((c: string) => c.split(';')[0]).join('; ');
  const allCookies = `${csrfCookieStr}; ${adminCookieStr}`;

  console.log('✅ Login successful. Cookies acquired.');

  const headers = {
    'Content-Type': 'application/json',
    Cookie: allCookies,
    'x-csrf-token': csrfHeaderToken,
  };

  // 3. Define request payloads
  const payload = {
    slug: 'stress-test-project',
    commentCount: 5,
    tone: 'casual',
    reply: true,
    projectTitle: 'Stress Test Portfolio Item',
    projectDescription: 'A heavy-duty testing item to verify performance.',
  };

  // 4. Start concurrent requests
  const TOTAL_REQUESTS = 50;
  const CONCURRENCY = 10;
  console.log(
    `\n[3] Running stress test: ${TOTAL_REQUESTS} requests, concurrency batch size = ${CONCURRENCY}...`
  );

  const durations: number[] = [];
  let successCount = 0;
  let failureCount = 0;

  const startTotalTime = Date.now();

  for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENCY) {
    const batchPromises = [];
    const batchSize = Math.min(CONCURRENCY, TOTAL_REQUESTS - i);
    console.log(`Sending batch ${i / CONCURRENCY + 1} (${batchSize} requests)...`);

    for (let j = 0; j < batchSize; j++) {
      batchPromises.push(
        (async (reqIndex) => {
          const start = Date.now();
          try {
            const res = await fetch(`${BASE_URL}/api/admin/projects/magic-complete`, {
              method: 'POST',
              headers,
              body: JSON.stringify(payload),
            });
            const duration = Date.now() - start;
            durations.push(duration);

            if (res.ok) {
              const data = (await res.json()) as any;
              if (data.success && Array.isArray(data.comments)) {
                successCount++;
              } else {
                failureCount++;
                console.error(
                  `Request #${reqIndex} succeeded HTTP but returned invalid body:`,
                  data
                );
              }
            } else {
              failureCount++;
              console.error(
                `Request #${reqIndex} failed with status ${res.status}:`,
                await res.text()
              );
            }
          } catch (err: any) {
            const duration = Date.now() - start;
            durations.push(duration);
            failureCount++;
            console.error(`Request #${reqIndex} threw network error:`, err.message);
          }
        })(i + j)
      );
    }

    await Promise.all(batchPromises);
  }

  const totalTime = Date.now() - startTotalTime;

  // 5. Calculate statistics
  const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);

  console.log('\n=======================================');
  console.log('📊 STRESS TEST RESULTS');
  console.log('=======================================');
  console.log(`Total Requests:  ${TOTAL_REQUESTS}`);
  console.log(
    `Success Rate:    ${((successCount / TOTAL_REQUESTS) * 100).toFixed(1)}% (${successCount}/${TOTAL_REQUESTS})`
  );
  console.log(
    `Failure Rate:    ${((failureCount / TOTAL_REQUESTS) * 100).toFixed(1)}% (${failureCount}/${TOTAL_REQUESTS})`
  );
  console.log(`Total Duration:  ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`Avg Latency:     ${avgDuration.toFixed(1)}ms`);
  console.log(`Min Latency:     ${minDuration}ms`);
  console.log(`Max Latency:     ${maxDuration}ms`);
  console.log('=======================================');

  if (failureCount > 0) {
    console.error('❌ Stress test completed with failures.');
    process.exit(1);
  } else {
    console.log('🎉 Stress test passed successfully with 100% success rate and zero failures!');
    process.exit(0);
  }
}

runStressTest().catch((err) => {
  console.error('❌ Script failed unexpectedly:', err);
  process.exit(1);
});
