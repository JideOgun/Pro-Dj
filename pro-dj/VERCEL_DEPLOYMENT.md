# 🚀 Vercel Deployment Guide

## Prerequisites Checklist

- [ ] GitHub repository is up to date
- [ ] Project builds successfully (`npm run build`)
- [ ] Stripe account created (can use test keys initially)
- [ ] Google OAuth app created
- [ ] AWS S3 bucket set up

## Step 1: Vercel Account Setup

### 1.1 Create Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub account
3. Grant necessary permissions

### 1.2 Install Vercel CLI (Optional)

```bash
npm i -g vercel
vercel login
```

## Step 2: Import Project

### 2.1 Import from GitHub

1. Click **"New Project"**
2. Select your GitHub repository: `Pro-Dj`
3. Choose the `pro-dj` folder as root directory
4. Framework: **Next.js** (auto-detected)
5. Build Command: `npm run build`
6. Output Directory: `.next` (default)

### 2.2 Configure Build Settings

```bash
# Build Command
npm run build

# Install Command
npm install

# Development Command
npm run dev
```

## Step 3: Environment Variables

### 3.1 Required Variables

Add these in Vercel Dashboard > Settings > Environment Variables:

```bash
# App Configuration
NODE_ENV=production
NEXTAUTH_URL=https://your-vercel-app.vercel.app
NEXTAUTH_SECRET=your-32-character-secret-here

# Database (will set up in Step 4)
DATABASE_URL=postgresql://username:password@host:port/database

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Stripe (start with test keys)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_DJ_BASIC_PRICE_ID=price_test_basic
STRIPE_DJ_PRO_PRICE_ID=price_test_pro

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name

# Email (optional, can set up later)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password

# Admin User
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=secure-admin-password
```

### 3.2 Generate Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate admin password
openssl rand -base64 16
```

## Step 4: Database Setup

### 4.1 Create Vercel Postgres

1. Go to your project dashboard
2. Click **Storage** tab
3. Click **Create Database**
4. Select **Postgres**
5. Name: `pro-dj-production`
6. Click **Create**

### 4.2 Get Database URL

1. Click on your database
2. Go to **Settings** tab
3. Copy the connection string
4. Add to environment variables as `DATABASE_URL`

### 4.3 Run Migrations

```bash
# Connect to your Vercel project
vercel link

# Pull environment variables
vercel env pull .env.local

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database
npm run seed
```

## Step 5: Deploy & Test

### 5.1 Deploy

1. Push to your main branch
2. Vercel auto-deploys
3. Check deployment logs
4. Visit your app URL

### 5.2 Test Core Functions

- [ ] User registration/login
- [ ] DJ profile creation
- [ ] File uploads
- [ ] Booking system
- [ ] Payment flow (with test cards)

## Step 6: Custom Domain (Optional)

### 6.1 Add Domain

1. Go to project Settings > Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### 6.2 Update Environment Variables

```bash
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 6.3 Update OAuth Settings

- Update Google OAuth redirect URIs
- Update Stripe webhook URLs

## Step 7: Production Configuration

### 7.1 Switch to Live Stripe Keys

```bash
STRIPE_SECRET_KEY=sk_live_your_live_secret
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
```

### 7.2 Configure Webhooks

1. Create webhook in Stripe Dashboard
2. URL: `https://your-domain.com/api/webhooks/stripe-subscriptions`
3. Events: `customer.subscription.*`, `invoice.*`, `checkout.session.completed`

### 7.3 Final Testing

- [ ] Test with real payment methods
- [ ] Verify webhook delivery
- [ ] Check all user flows

## Step 8: Monitoring & Analytics

### 8.1 Vercel Analytics

1. Enable in project settings
2. Monitor performance metrics
3. Track Core Web Vitals

### 8.2 Error Monitoring

Consider adding:

- Sentry for error tracking
- LogRocket for user sessions
- Google Analytics for usage

## Troubleshooting

### Common Issues

#### Build Failures

```bash
# Check build logs in Vercel dashboard
# Common fixes:
# 1. Update node version in package.json
# 2. Fix TypeScript errors
# 3. Check environment variables
```

#### Database Connection

```bash
# Test connection locally
npm run db:generate
npx prisma db push
```

#### Function Timeouts

- Vercel free tier: 10s timeout
- Pro tier: 60s timeout
- Optimize heavy operations

### Debug Commands

```bash
# Local testing with production env
vercel dev

# Check deployment logs
vercel logs

# Test production build locally
npm run build
npm start
```

## Performance Optimization

### 8.1 Image Optimization

- Already configured with Next.js Image component
- Vercel handles automatic optimization

### 8.2 Caching

- Static files cached automatically
- API routes cached based on headers

### 8.3 Bundle Analysis

```bash
# Analyze bundle size
npm install @next/bundle-analyzer
ANALYZE=true npm run build
```

## Security Checklist

- [ ] Environment variables set correctly
- [ ] No sensitive data in client code
- [ ] HTTPS enabled (automatic)
- [ ] Rate limiting configured
- [ ] Input validation in place

## Scaling Considerations

### When to Upgrade

- Function execution time > 10s
- High bandwidth usage
- Need for background jobs
- Custom server requirements

### Migration Path

- Vercel Pro ($20/month)
- Railway/DigitalOcean for more control
- AWS for enterprise scale

---

**Ready to deploy?** Follow these steps in order and you'll have your Pro-DJ platform live in about an hour! 🎉
