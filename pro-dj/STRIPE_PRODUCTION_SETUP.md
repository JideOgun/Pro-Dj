# 🚀 Stripe Production Setup Guide

## Current Status

- ✅ **Temporary Fix Applied**: DJs can now accept bookings without payment processing
- ⚠️ **Payment Processing**: Not configured in production yet
- 🔧 **Next Steps**: Configure Stripe for live payments

## Quick Setup (5 minutes)

### 1. Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete business verification
3. Get your live API keys

### 2. Get Your Stripe Keys

1. Go to Stripe Dashboard → Developers → API Keys
2. Copy your **Live Secret Key** (starts with `sk_live_`)
3. Copy your **Live Publishable Key** (starts with `pk_live_`)

### 3. Add Environment Variables to Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add these variables:

```bash
STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 4. Set Up Webhooks (Optional but Recommended)

1. In Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://www.bookprodj.com/api/webhooks/stripe-subscriptions`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the webhook secret and add to environment variables

### 5. Redeploy

1. Push any changes to trigger a new deployment
2. Or manually redeploy from Vercel dashboard

## Testing

1. Create a test booking
2. Accept the booking as a DJ
3. Verify payment link is generated
4. Test payment flow (use Stripe test cards)

## Test Cards for Development

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Expired**: `4000 0000 0000 0069`

## Support

If you need help setting up Stripe:

1. Check [Stripe Documentation](https://stripe.com/docs)
2. Contact Stripe Support
3. Review our [STRIPE_SETUP.md](./STRIPE_SETUP.md) for detailed instructions

## Current Workaround

Until Stripe is configured:

- ✅ DJs can accept bookings
- ✅ Bookings are marked as "ACCEPTED"
- ⚠️ No payment links are generated
- ⚠️ Clients need to arrange payment separately

## Next Steps After Stripe Setup

1. Test payment flow end-to-end
2. Set up refund handling
3. Configure email notifications
4. Set up analytics and reporting

---

# 🎯 **IMMEDIATE ACTION REQUIRED**

## Step 1: Get Your Stripe Keys (2 minutes)

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Click "Developers" → "API Keys"
3. Copy your **Live Secret Key** (starts with `sk_live_`)
4. Copy your **Live Publishable Key** (starts with `pk_live_`)

## Step 2: Add to Vercel (2 minutes)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your Pro-DJ project
3. Go to Settings → Environment Variables
4. Add these 2 variables:

```bash
STRIPE_SECRET_KEY=sk_live_your_actual_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_publishable_key
```

## Step 3: Test (1 minute)

1. Go to your live site: https://www.bookprodj.com
2. Create a test booking
3. Accept it as a DJ
4. Verify payment link appears

## That's it! 🎉

Your payment processing will be live in under 5 minutes. No webhooks needed for basic functionality - we can add those later for advanced features.

**Need help?** Just let me know and I'll walk you through it step by step!
