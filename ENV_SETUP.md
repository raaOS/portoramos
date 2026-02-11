# Environment Setup Guide

This guide helps you set up the required environment variables for the portfolio application.

## Required Environment Variables

Copy these to your `.env.local` file:

```bash
# Authentication
JWT_SECRET="your-secure-jwt-secret-key-min-32-chars-long"
ADMIN_PASSWORD_SCRYPT="$(node -e "console.log(require('crypto').scryptSync('your-admin-password', 'your-salt', 64).toString('hex'))")"
PASSWORD_SALT="your-random-salt-string"

# Database (Upstash Redis)
UPSTASH_REDIS_REST_URL="https://your-region-upstash-com.rest"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
UPSTASH_REDIS_KEY="portfolio:projects:v1"

# Optional: Telegram Notifications
TELEGRAM_BOT_TOKEN="123456789:ABCdefGHIjklMNOpqrSTUvwxyz"
TELEGRAM_CHAT_ID="-1001234567890"

# Optional: AI Features
GOOGLE_GENERATIVE_AI_API_KEY="your-google-ai-api-key"

# Site Configuration
NEXT_PUBLIC_SITE_URL="https://your-domain.com"
```

## Quick Setup

1. **Generate Admin Password Hash:**
   ```bash
   node -e "console.log(require('crypto').scryptSync('your-admin-password', 'your-salt', 64).toString('hex'))"
   ```

2. **Get Upstash Redis:**
   - Sign up at https://upstash.com
   - Create a new Redis database
   - Copy the REST URL and Token

3. **Validate Your Setup:**
   ```bash
   node scripts/validate-env-fixed.js
   ```

## GitHub Actions Secrets

For CI/CD, add these to your GitHub repository secrets:

- `JWT_SECRET`
- `ADMIN_PASSWORD_SCRYPT`
- `PASSWORD_SALT`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `TELEGRAM_BOT_TOKEN` (optional)
- `TELEGRAM_CHAT_ID` (optional)

## Local Development

For local development, create a `.env.local` file in the project root with the required variables.