# 🔧 Environment Setup Guide

## 1. Production Environment Variables

Create a `.env.production` file in your project root with these variables:

### Core Application

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-32-character-secret-key-here
```

### Database

```bash
DATABASE_URL=postgresql://username:password@host:port/database_name
```

### Authentication (Google OAuth)

```bash
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Stripe (Production Keys)

```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_DJ_BASIC_PRICE_ID=price_...
STRIPE_DJ_PRO_PRICE_ID=price_...
```

### AWS S3 (File Storage)

```bash
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name
```

### Email Configuration

```bash
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
```

### Admin Setup

```bash
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=secure-admin-password
```

## 2. Environment Variable Generation

### Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

### Generate Strong Admin Password

```bash
openssl rand -base64 16
```

## 3. Service Setup Order

1. **Domain & DNS** - Set up your domain first
2. **Database** - PostgreSQL database
3. **Stripe** - Payment processing
4. **AWS S3** - File storage
5. **Google OAuth** - Authentication
6. **Email Service** - Notifications
7. **Deployment Platform** - Vercel/hosting

## 4. Validation Checklist

- [ ] All environment variables set
- [ ] Domain purchased and configured
- [ ] SSL certificate active
- [ ] Database accessible
- [ ] Stripe webhooks configured
- [ ] S3 bucket permissions set
- [ ] Google OAuth redirect URIs configured
- [ ] Email service tested

## 5. Security Notes

- Never commit `.env` files to git
- Use different keys for development/production
- Rotate secrets regularly
- Monitor for unauthorized access
- Set up alerts for failed authentications

---

**Next Step**: Choose your deployment platform and configure the first service.
