# 💳 Stripe Production Setup Guide

## 1. Stripe Account Setup

### Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete business verification
3. Add bank account for payouts
4. Enable live payments

### Get API Keys

1. Go to **Developers > API Keys**
2. Copy **Publishable key** (starts with `pk_live_`)
3. Copy **Secret key** (starts with `sk_live_`)

## 2. Create Products & Prices

### DJ Basic Plan

```bash
# Create Product
curl https://api.stripe.com/v1/products \
  -u sk_live_xxx: \
  -d name="DJ Basic Plan" \
  -d description="Basic DJ subscription with essential features"

# Create Price (Monthly)
curl https://api.stripe.com/v1/prices \
  -u sk_live_xxx: \
  -d unit_amount=500 \
  -d currency=usd \
  -d recurring[interval]=month \
  -d product=prod_xxx
```

### DJ Pro Plan

```bash
# Create Product
curl https://api.stripe.com/v1/products \
  -u sk_live_xxx: \
  -d name="DJ Pro Plan" \
  -d description="Professional DJ subscription with advanced features"

# Create Price (Monthly)
curl https://api.stripe.com/v1/prices \
  -u sk_live_xxx: \
  -d unit_amount=1500 \
  -d currency=usd \
  -d recurring[interval]=month \
  -d product=prod_xxx
```

## 3. Webhook Configuration

### Create Webhook Endpoint

1. Go to **Developers > Webhooks**
2. Click **Add endpoint**
3. URL: `https://your-domain.com/api/webhooks/stripe-subscriptions`
4. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `checkout.session.completed`

### Get Webhook Secret

1. Click on your webhook endpoint
2. Copy the **Signing secret** (starts with `whsec_`)

## 4. Environment Variables

Add these to your `.env.production`:

```bash
# Stripe Live Keys
STRIPE_SECRET_KEY=sk_live_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Price IDs from step 2
STRIPE_DJ_BASIC_PRICE_ID=price_basic_plan_id
STRIPE_DJ_PRO_PRICE_ID=price_pro_plan_id
```

## 5. Testing Webhook

### Test Webhook Locally

```bash
# Install Stripe CLI
curl -s https://packages.stripe.com/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.com/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update
sudo apt install stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe-subscriptions
```

### Test Webhook in Production

1. Create a test subscription
2. Check webhook logs in Stripe dashboard
3. Verify database updates

## 6. Subscription Features

### Trial Period Setup

- 30-day free trial for new users
- Automatic billing after trial
- Cancel anytime during trial

### Plan Features

#### DJ Basic ($5/month)

- Unlimited mix uploads
- Unlimited event photos
- Basic analytics
- Standard support

#### DJ Pro ($15/month)

- Everything in Basic
- Advanced analytics
- Priority support
- Featured profile placement
- Custom branding options

## 7. Payment Flow

1. User clicks "Upgrade" button
2. Redirect to Stripe Checkout
3. Customer completes payment
4. Webhook updates database
5. User gets access to premium features

## 8. Error Handling

### Common Issues

- **Failed payments**: Retry logic with exponential backoff
- **Webhook failures**: Queue system for retry
- **Subscription cancellations**: Graceful downgrade

### Monitoring

- Set up alerts for failed payments
- Monitor webhook delivery success
- Track subscription metrics

## 9. Compliance

### PCI Compliance

- Stripe handles all sensitive card data
- No PCI compliance requirements for your app

### Tax Handling

- Configure tax collection in Stripe dashboard
- Set up tax rates for different regions

## 10. Dashboard Integration

### Stripe Dashboard Access

- Monitor payments and subscriptions
- Handle disputes and chargebacks
- Generate financial reports

### Custom Analytics

- Track subscription metrics
- Monitor churn rates
- Revenue forecasting

---

**Next Step**: Set up your Stripe account and get your live API keys.
