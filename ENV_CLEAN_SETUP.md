# Clean Environment Setup Guide

## 🎯 Simplified Auth System (Scrypt Only)

This guide helps you set up a clean, secure authentication system using **scrypt only**.

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# Core Authentication (Scrypt Only)
JWT_SECRET="your-secure-jwt-secret-key-min-32-chars-long"
ADMIN_PASSWORD_SCRYPT="your-scrypt-hashed-password-here"
PASSWORD_SALT="your-random-salt-string"

# Optional Features
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"     # Optional
TELEGRAM_CHAT_ID="your-telegram-chat-id"       # Optional
```

## Quick Setup

### 1. Generate Admin Password Hash

```bash
# Generate hash for your password (e.g., "Urgent2025!")
node scripts/generate-admin-hash.js "Urgent2025!"

# Or with custom salt
node scripts/generate-admin-hash.js "Urgent2025!" "your-custom-salt"
```

### 2. Update Environment Variables

Copy the output from step 1 and add to your `.env.local`:

```bash
# Example output:
ADMIN_PASSWORD_SCRYPT="99c75b59b090beea7adccdd1d76dce20cfaa0695304c4077df1f4fab2c10388c33a0255eeb535c4fd3d2d968c6cc626242f0d7cb47f25a1ff2b32db19bfd2908"
PASSWORD_SALT="0f1978905a2fc3cf2126ff9d9ce87076"
```

### 3. Verify Setup

```bash
# Test your configuration
node scripts/verify-admin-config.js

# Expected output:
# ✅ Hash is VALID! Login should work.
# ✅ Admin password configuration is correct.
```

## GitHub Actions Setup

Add these secrets to your GitHub repository:

```
JWT_SECRET=your-secure-jwt-secret-key-min-32-chars-long
ADMIN_PASSWORD_SCRYPT=your-scrypt-hashed-password-here
PASSWORD_SALT=your-random-salt-string
TELEGRAM_BOT_TOKEN=your-telegram-bot-token    # Optional
TELEGRAM_CHAT_ID=your-telegram-chat-id        # Optional
```

## Removed Dependencies

✅ **No Redis required** - System works without external database
✅ **No ADMIN_PASSWORD_HASH** - Clean scrypt only
✅ **No complex fallbacks** - Single secure algorithm

## Security Features

- 🔒 **Scrypt hashing** - Industry standard, GPU-resistant
- 🛡️ **Timing-safe comparison** - Prevents timing attacks
- ⏰ **2-hour JWT expiry** - Secure token lifetime
- 🚫 **Rate limiting** - Prevents brute force attacks
- 📱 **Telegram alerts** - Real-time security notifications

## Troubleshooting

### Login Fails
1. Run `node scripts/verify-admin-config.js`
2. Check JWT_SECRET length (minimum 32 characters)
3. Verify hash is complete (128 characters)
4. Check browser console for errors

### Environment Issues
1. Ensure `.env.local` exists in project root
2. Check all required variables are set
3. Verify no typos in variable names

### Rate Limited
- Wait 30 minutes for block to expire
- Or restart development server

## Test Commands

```bash
# Test auth system
node scripts/test-auth-env.js

# Generate new hash
node scripts/generate-admin-hash.js "new-password"

# Verify configuration
node scripts/verify-admin-config.js
```

## Migration from Old System

If you had the old system:

1. **Backup old `.env.local`**
2. **Generate new scrypt hash** with your password
3. **Remove old variables**:
   - `ADMIN_PASSWORD_HASH` ❌
   - `ADMIN_PASSWORD` ❌
   - Redis variables ❌
4. **Add new variables**:
   - `ADMIN_PASSWORD_SCRYPT` ✅
   - `PASSWORD_SALT` ✅

## Success Indicators

✅ **Login successful if:**
- Hash verification passes
- JWT token generated
- Redirect to `/admin` works
- Telegram notification (if configured)

❌ **Login failed if:**
- "Invalid password" message
- Hash verification fails
- Missing environment variables
- Rate limit exceeded

## Clean CI/CD

The GitHub Actions workflow now uses:
- ✅ Conditional secrets with fallbacks
- ✅ No Redis dependencies
- ✅ Clean scrypt authentication
- ✅ Proper error handling

**System ini siap untuk Tier S! 🚀**