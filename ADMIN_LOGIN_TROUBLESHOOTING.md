# Admin Login Troubleshooting Guide

## Problem: Cannot Login as Admin

### ✅ Step 1: Verify Password Configuration

Run this command to check if your password hash is valid:
```bash
node scripts/verify-admin-config.js
```

**Expected Output:**
```
✅ Hash is VALID! Login should work.
✅ Admin password configuration is correct.
```

### 🔍 Step 2: Check Environment Variables

Verify all required environment variables:
```bash
node scripts/validate-env-fixed.js
```

**Required Variables:**
- `JWT_SECRET` (minimum 32 characters)
- `ADMIN_PASSWORD_SCRYPT` (valid scrypt hash)
- `PASSWORD_SALT` (salt used for hashing)

### 🚀 Step 3: Test Login Process

1. **Check Network Request:**
   - Open browser DevTools → Network tab
   - Try login with `Urgent2025!`
   - Look for POST request to `/api/admin/login`
   - Check response status and message

2. **Check Server Logs:**
   ```bash
   # In development
   npm run dev
   
   # Check terminal for error messages
   ```

3. **Check Browser Console:**
   - Open DevTools → Console
   - Look for JavaScript errors
   - Check for CORS or network issues

### 🔧 Step 4: Common Issues & Solutions

#### Issue: "Invalid password" but hash is valid
**Possible Causes:**
- Rate limiting (too many failed attempts)
- JWT_SECRET not configured
- Cookie settings issue

**Solutions:**
1. Wait 5 minutes for rate limit to reset
2. Check JWT_SECRET length (minimum 32 chars)
3. Clear browser cookies and try again

#### Issue: "Authentication service error"
**Possible Causes:**
- Missing environment variables
- JWT_SECRET not configured

**Solutions:**
1. Run `node scripts/validate-env-fixed.js`
2. Ensure JWT_SECRET is set and valid

#### Issue: 429 "Too many login attempts"
**Solution:**
- Wait 30 minutes for block to expire
- Or restart development server

### 📊 Step 5: Debug Rate Limiting

Check if you're being rate limited:
```bash
# Check current rate limit status
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"password":"test"}' \
  -v
```

### 🔑 Step 6: Generate New Password Hash (if needed)

If you need to change the admin password:
```bash
# Generate new hash for your password
node scripts/generate-admin-hash.js "YourNewPassword"

# Update .env.local with the new hash
```

### 🐛 Step 7: Check for JavaScript Errors

Common JavaScript issues:
1. **Console Errors:** Check browser console
2. **Network Failures:** Check Network tab
3. **Cookie Issues:** Check Application → Cookies

### 📱 Step 8: Telegram Notifications (if configured)

If Telegram is configured, you'll get notifications for:
- ✅ Successful logins
- ❌ Failed login attempts
- 🚫 Rate limit blocks

### 🧪 Step 9: Test with Curl

Test login directly:
```bash
curl -X POST https://your-domain.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"password":"Urgent2025!"}' \
  -c cookies.txt \
  -v
```

### 🔍 Step 10: Check Server-Side Logs

Add debug logging to `/api/admin/login`:
```typescript
// Add this temporarily to debug
console.log('Login attempt:', { 
  hasPassword: !!password, 
  passwordLength: password?.length,
  hasScrypt: !!ADMIN_PASSWORD_SCRYPT,
  hasSalt: !!PASSWORD_SALT 
});
```

## Quick Fix Commands

```bash
# 1. Verify configuration
node scripts/verify-admin-config.js

# 2. Check environment
node scripts/validate-env-fixed.js

# 3. Clear browser cache
# Press Ctrl+Shift+R or Cmd+Shift+R

# 4. Restart development server
npm run fresh-start

# 5. Generate new hash (if needed)
node scripts/generate-admin-hash.js "Urgent2025!" "0f1978905a2fc3cf2126ff9d9ce87076"
```

## Still Not Working?

1. **Check browser compatibility** (Chrome/Firefox recommended)
2. **Disable browser extensions** temporarily
3. **Try incognito/private mode**
4. **Check if API routes are accessible**: Visit `/api/health`
5. **Verify JWT_SECRET length**: Must be ≥32 characters

## Success Indicators

✅ **Login successful if:**
- You get redirected to `/admin`
- Cookie `admin_token` is set
- No error messages
- Telegram notification (if configured)

❌ **Login failed if:**
- "Invalid password" message
- Rate limit error (429)
- Authentication service error
- No redirect happens