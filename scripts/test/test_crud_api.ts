import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
    console.log('--- Admin Dashboard CRUD Test ---');

    // 0. Get CSRF Token
    console.log('\n[0] Getting CSRF Token...');
    const csrfRes = await fetch(`${BASE_URL}/api/admin/login`);
    const csrfData = await csrfRes.json();
    const csrfHeaderToken = csrfData.csrfToken;
    
    const csrfSetCookie = csrfRes.headers.raw()['set-cookie'];
    const csrfCookieStr = csrfSetCookie ? csrfSetCookie.map(c => c.split(';')[0]).join('; ') : '';

    // 1. Login
    console.log('\n[1] Logging in...');
    const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Cookie': csrfCookieStr,
            'x-csrf-token': csrfHeaderToken,
            'x-test-bypass': 'true'
        },
        body: JSON.stringify({ password: 'Urgent2025!' })
    });

    if (!loginRes.ok) {
        console.error('Login failed:', loginRes.status, await loginRes.text());
        return;
    }

    const setCookieHeader = loginRes.headers.raw()['set-cookie'];
    const adminCookieStr = setCookieHeader.map(c => c.split(';')[0]).join('; ');
    const allCookies = `${csrfCookieStr}; ${adminCookieStr}`;
    
    console.log('Login successful. Cookies grabbed.');

    const headers = {
        'Content-Type': 'application/json',
        'Cookie': allCookies,
        'x-csrf-token': csrfHeaderToken
    };

    // 2. Test About (GET and PUT)
    console.log('\n[2] Testing About CRUD...');
    
    const aboutGetRes = await fetch(`${BASE_URL}/api/about`, { headers });
    const aboutData = await aboutGetRes.json();
    console.log('Got existing about data. Hero title:', aboutData.hero?.title);

    const originalTitle = aboutData.hero?.title || '';
    const newTitle = originalTitle + ' (Tested)';

    const payload = {
        hero: {
            ...aboutData.hero,
            title: newTitle
        }
    };

    const aboutPutRes = await fetch(`${BASE_URL}/api/about`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
    });

    if (!aboutPutRes.ok) {
        console.error('Failed to update about:', await aboutPutRes.text());
    } else {
        console.log('About updated successfully. New title:', newTitle);
        
        // Revert
        const revertPayload = {
            hero: {
                ...aboutData.hero,
                title: originalTitle
            }
        };

        const aboutRevertRes = await fetch(`${BASE_URL}/api/about`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(revertPayload)
        });
        if (aboutRevertRes.ok) {
            console.log('About reverted successfully via PUT.');
        } else {
             console.error('Failed to revert about:', await aboutRevertRes.text());
        }
    }

    console.log('\nAll tests completed.');
}

runTests().catch(console.error);
