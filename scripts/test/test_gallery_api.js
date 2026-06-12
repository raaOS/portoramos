/**
 * Gallery API Test — Integration test untuk endpoint gallery.
 *
 * Menguji endpoint `/api/gallery` dan `/api/admin/gallery` terhadap
 * dev server lokal untuk memverifikasi operasi CRUD gallery.
 *
 * @module scripts/test/test-gallery-api
 */
const http = require('http');

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('--- Admin Gallery API Test ---');

  const getRes = await fetch(`${BASE_URL}/api/gallery/featured`);
  const data = await getRes.json();
  console.log('Existing Featured Project IDs:', data.featuredProjectIds);

  const originalIds = data.featuredProjectIds || [];
  const newIds = [...originalIds, 'test-id-123'];

  console.log('\n[0] Getting CSRF Token...');
  const csrfRes = await fetch(`${BASE_URL}/api/admin/login`);
  const csrfData = await csrfRes.json();
  const csrfHeaderToken = csrfData.csrfToken;
  const csrfCookieStr = csrfRes.headers.get('set-cookie')?.split(';')[0] || '';

  console.log('\n[1] Logging in...');
  const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: csrfCookieStr,
      'x-csrf-token': csrfHeaderToken,
      'x-test-bypass': 'true',
    },
    body: JSON.stringify({ password: 'Urgent2025!' }),
  });

  if (!loginRes.ok) {
    console.error('Login failed:', loginRes.status, await loginRes.text());
    return;
  }

  const adminCookieStr = loginRes.headers.get('set-cookie')?.split(';')[0] || '';
  const allCookies = `${csrfCookieStr}; ${adminCookieStr}`;

  const headers = {
    'Content-Type': 'application/json',
    Cookie: allCookies,
    'x-csrf-token': csrfHeaderToken,
  };

  console.log('\n[2] Updating Gallery Featured IDs...');
  const putRes = await fetch(`${BASE_URL}/api/gallery/featured`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ featuredProjectIds: newIds }),
  });

  if (!putRes.ok) {
    console.error('Failed to update gallery:', await putRes.text());
  } else {
    const result = await putRes.json();
    console.log('Update successful! New IDs:', result.data.featuredProjectIds);

    console.log('\n[3] Reverting Gallery Featured IDs...');
    const revertRes = await fetch(`${BASE_URL}/api/gallery/featured`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ featuredProjectIds: originalIds }),
    });

    if (revertRes.ok) {
      console.log('Reverted successfully!');
    } else {
      console.error('Failed to revert:', await revertRes.text());
    }
  }
}

runTests().catch(console.error);
