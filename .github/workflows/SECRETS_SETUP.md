# GitHub Actions Secrets Setup

This guide helps you set up the required secrets for GitHub Actions CI/CD.

## Required Secrets

Add these secrets to your GitHub repository:

### 🔒 Required Secrets (Must Have)

1. **JWT_SECRET**
   - Description: Secret key for JWT token generation
   - Format: Random string, minimum 32 characters
   - Example: `your-super-secure-jwt-secret-key-min-32-chars`

2. **ADMIN_PASSWORD_SCRYPT**
   - Description: Scrypt hashed admin password
   - How to generate:
     ```bash
     node -e "console.log(require('crypto').scryptSync('your-admin-password', 'your-salt', 64).toString('hex'))"
     ```

3. **PASSWORD_SALT**
   - Description: Salt for password hashing
   - Format: Random string
   - Example: `your-random-salt-string-123`

4. **UPSTASH_REDIS_REST_URL**
   - Description: Upstash Redis REST URL
   - Get from: https://upstash.com
   - Example: `https://your-region-upstash-com.rest`

5. **UPSTASH_REDIS_REST_TOKEN**
   - Description: Upstash Redis REST token
   - Get from: Upstash dashboard
   - Example: `your-upstash-rest-token`

### 📱 Optional Secrets (Nice to Have)

6. **TELEGRAM_BOT_TOKEN**
   - Description: Telegram bot token for notifications
   - Get from: @BotFather on Telegram
   - Example: `123456789:ABCdefGHIjklMNOpqrSTUvwxyz`

7. **TELEGRAM_CHAT_ID**
   - Description: Telegram chat ID for notifications
   - Get from: @userinfobot on Telegram
   - Example: `-1001234567890`

## How to Add Secrets

1. Go to your GitHub repository
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret with its name and value

## Security Best Practices

- ✅ Use strong, unique values
- ✅ Never commit secrets to code
- ✅ Rotate secrets regularly
- ✅ Use different secrets for different environments
- ❌ Don't use default or weak passwords

## Validation

After setting up secrets, the CI will automatically validate them:

```bash
# You can also validate locally
node scripts/validate-env-fixed.js
```

## Troubleshooting

If CI fails with secret errors:

1. Check if all required secrets are added
2. Verify secret values are correct
3. Check GitHub Actions logs for specific errors
4. Ensure secrets are available in the workflow context

## Fallback for PRs

The CI workflow includes fallbacks for PRs from forks where secrets might not be available:

```yaml
JWT_SECRET: ${{ secrets.JWT_SECRET != '' && secrets.JWT_SECRET || 'ci-dummy-jwt-secret' }}
```

This ensures CI runs even without full secrets.