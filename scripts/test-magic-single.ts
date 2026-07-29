import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });

const BASE_URL = 'http://localhost:3000';

async function testSingleRequest() {
  console.log('--- TESTING MAGIC-COMPLETE ENDPOINT ---');

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
    body: JSON.stringify({ password: 'Urgent2025!' }), // Default dev password
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

  // 3. Define request payload
  const payload = {
    slug: 'test-viral-project',
    commentCount: 3,
    tone: 'casual',
    reply: true,
    projectTitle: 'E-Commerce Dashboard',
    projectDescription: 'A React and Next.js admin dashboard utilizing charts and table listings.',
  };

  console.log('\n[3] Sending request to magic-complete...');
  const res = await fetch(`${BASE_URL}/api/admin/projects/magic-complete`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    const data = (await res.json()) as any;
    console.log('\n✅ Success! Response data:');
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.error(`❌ Request failed with status ${res.status}:`, await res.text());
  }
}

testSingleRequest();
