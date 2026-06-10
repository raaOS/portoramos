// Smoke test: login as admin then hit /api/admin/storage-stats?fresh=true.
// Password is read from $env:ADMIN_PASSWORD (do not commit).
const baseUrl = 'http://localhost:3000';
const password = process.env.ADMIN_PASSWORD;
if (!password) {
  console.error('Set ADMIN_PASSWORD env first.');
  process.exit(1);
}

function parseSetCookie(headers, name) {
  const all =
    typeof headers.getSetCookie === 'function'
      ? headers.getSetCookie()
      : (headers.get('set-cookie') || '').split(/, (?=[A-Za-z0-9_]+=)/);
  for (const line of all) {
    const m = line.match(new RegExp('^' + name + '=([^;]+)'));
    if (m) return m[1];
  }
  return '';
}

const csrfRes = await fetch(baseUrl + '/api/admin/login');
const csrfCookie = parseSetCookie(csrfRes.headers, 'csrf_token');
const csrfBody = await csrfRes.json();

const loginRes = await fetch(baseUrl + '/api/admin/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-csrf-token': csrfBody.csrfToken,
    cookie: 'csrf_token=' + csrfCookie,
  },
  body: JSON.stringify({ password }),
});
if (!loginRes.ok) {
  console.error('login failed:', loginRes.status, await loginRes.text());
  process.exit(1);
}
const adminToken = parseSetCookie(loginRes.headers, 'admin_token');

const statsRes = await fetch(baseUrl + '/api/admin/storage-stats?fresh=true', {
  headers: { cookie: 'admin_token=' + adminToken + '; csrf_token=' + csrfCookie },
});
console.log('stats status    :', statsRes.status);
const stats = await statsRes.json();
console.log(JSON.stringify(stats, null, 2));
