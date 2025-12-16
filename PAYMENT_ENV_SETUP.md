# Payment System Environment Variables

This document lists all required environment variables for the 2Checkout payment + Resend email system.

## Required for Production

Add these to your Vercel project settings:

### Database

```env
DATABASE_URL="your_vercel_postgres_connection_string"
```

Get this from Vercel Postgres dashboard. Use the **pooled connection string** for serverless functions.

### Application

```env
NEXT_PUBLIC_SITE_URL="https://tkob-ticketing.vercel.app"
```

Your production domain. Used for return URLs and email links.

### 2Checkout Payment

```env
TWOCHECKOUT_MERCHANT_CODE="your_merchant_sid"
TWOCHECKOUT_SECRET_KEY="your_secret_key"  
TWOCHECKOUT_SANDBOX="false"
```

**Getting 2Checkout Credentials:**

1. Create account at [2Checkout.com](https://www.2checkout.com)
2. Navigate to Integrations > Webhooks & API
3. Copy your Seller ID (Merchant Code)
4. Generate and copy your Secret Key
5. Set `TWOCHECKOUT_SANDBOX="true"` for testing, `"false"` for production

**Configure IPN Webhook:**

1. In 2Checkout dashboard, go to Integrations > Webhooks
2. Add IPN URL: `https://tkob-ticketing.vercel.app/api/payments/2checkout/ipn`
3. Enable all payment notifications (ORDER_CREATED, REFUND_ISSUED, etc.)

### Resend Email

```env
RESEND_API_KEY="re_xxxxxxxxxxxx"
EMAIL_FROM="tickets@teatri.al"
```

**Getting Resend API Key:**

1. Sign up at [Resend.com](https://resend.com)
2. Navigate to API Keys
3. Create new API key
4. For `EMAIL_FROM`:
   - Free tier: Use `onboarding@resend.dev` for testing
   - Production: Add and verify your custom domain

## Optional

### Email Domain (Production Recommendation)

For production, configure a custom sending domain:

1. In Resend dashboard, go to Domains
2. Add your domain (e.g., `teatri.al`)
3. Add DNS records as instructed
4. Verify domain
5. Use `tickets@teatri.al` for professional emails

## Local Development

Create `.env.local` in project root (gitignored):

```env
DATABASE_URL="your_local_postgres_or_use_vercel_connection"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
TWOCHECKOUT_MERCHANT_CODE="..."
TWOCHECKOUT_SECRET_KEY="..."
TWOCHECKOUT_SANDBOX="true"
RESEND_API_KEY="re_..."
EMAIL_FROM="onboarding@resend.dev"
```

## Vercel Cron Setup

Configure cron job for seat lock cleanup:

1. Create `vercel.json` in project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-locks",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

2. Or use Vercel dashboard:
   - Go to Project Settings > Cron Jobs
   - Add: `/api/cron/cleanup-locks`, Schedule: `*/5 * * * *` (every 5 minutes)

## Security Notes

- **Never** commit `.env.local` or any file containing secrets
- Rotate keys if accidentally exposed
- Use different keys for staging and production
- 2Checkout Secret Key is used to verify IPN authenticity - keep it secure

## Testing

### Test 2Checkout Sandbox

Use these test card numbers:
- **Successful payment**: `4222222222222`
- **Declined**: `4000300011112220`

### Test Email Delivery

With Resend free tier:
- Can send to any email address
- 100 emails/day limit
- Use `onboarding@resend.dev` as FROM address

## Deployment Checklist

Before deploying to production:

- [ ] All environment variables added to Vercel
- [ ] DATABASE_URL points to production database
- [ ] TWOCHECKOUT_SANDBOX set to "false"
- [ ] 2Checkout IPN webhook configured
- [ ] Resend custom domain verified (optional but recommended)
- [ ] Vercel Cron configured for cleanup job
- [ ] Test sandbox payment flow works
- [ ] Run `npx prisma db push` to apply schema to production database
