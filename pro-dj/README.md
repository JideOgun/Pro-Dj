# Pro-DJ - Professional DJ Booking Platform

A full-stack Next.js application for booking professional DJs for events. Built with Next.js 15, React 19, Prisma, and deployed on Vercel.

## Current Status

**Production Status: LIVE**

- **Live URL**: https://www.bookprodj.com
- **Deployment**: Vercel (Production)
- **Status**: Fully operational and deployed
- **Last Updated**: December 2024

### Recent Updates (December 2024)

- **Security**: Upgraded Next.js to 15.5.9 (fixes CVE-2025-55182)
- **SSR Fixes**: Resolved hydration errors in PWA components
- **Build**: Fixed Vercel deployment issues (Prisma, nodemailer conflicts)
- **Performance**: Optimized static file serving and CDN caching
- **Dependencies**: Updated React to 19.2.3, nodemailer to 7.0.11

## Tech Stack

### Core Framework

- **Next.js**: 15.5.9 (App Router)
- **React**: 19.2.3
- **TypeScript**: 5.x
- **Node.js**: 20+

### Backend & Database

- **Prisma**: 6.13.0 (PostgreSQL)
- **NextAuth.js**: 4.24.11 (Authentication)
- **Socket.IO**: 4.8.1 (Real-time updates - development only)

### Styling & UI

- **Tailwind CSS**: 4.x
- **Framer Motion**: 12.23.12 (Animations)
- **Lucide React**: 0.539.0 (Icons)

### Services & Integrations

- **Stripe**: 18.4.0 (Payments)
- **AWS S3**: 3.864.0 (File storage)
- **Nodemailer**: 7.0.11 (Email)
- **Resend**: 6.0.1 (Email service)

### Development Tools

- **ESLint**: 9.x
- **TypeScript**: 5.x
- **Prisma Studio**: Database management

## Features

### For Clients

- Browse and search DJs by genre, location, and availability
- View DJ profiles with portfolios, mixes, and reviews
- Book DJs for events with calendar integration
- Secure payment processing via Stripe
- Real-time booking updates
- Event gallery and photo sharing

### For DJs

- Professional profile management
- Portfolio and mix uploads
- Booking calendar and availability management
- Earnings tracking and analytics
- Client communication tools
- Performance analytics

### For Admins

- User management and moderation
- DJ approval and verification
- Booking oversight
- Payment and earnings management
- Platform analytics

## Getting Started

### Prerequisites

- Node.js 20+ installed
- PostgreSQL database (local or cloud)
- npm or yarn package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/JideOgun/Pro-Dj.git
   cd Pro-Dj/pro-dj
   ```

2. **Install dependencies**

   ```bash
   npm install --legacy-peer-deps
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Fill in your environment variables (see [Environment Setup](#environment-setup))

4. **Set up the database**

   ```bash
   # Generate Prisma client
   npm run db:generate

   # Run migrations
   npm run db:migrate

   # Seed initial data (optional)
   npm run seed
   ```

5. **Start development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Available Scripts

```bash
# Development
npm run dev              # Start development server with Socket.IO

# Building
npm run build            # Build for production
npm start                # Start production server

# Database
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run database migrations
npm run db:reset         # Reset database (WARNING: deletes all data)
npm run seed             # Seed database with initial data

# Deployment
npm run vercel:deploy    # Deploy to Vercel production

# Utilities
npm run lint             # Run ESLint
npm run cleanup          # Memory cleanup script
```

## Environment Setup

Create a `.env` file in the `pro-dj` directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# AWS S3
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"

# Email (optional)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"

# App Configuration
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Deployment

### Vercel Deployment

The app is configured for automatic deployment on Vercel:

1. **Connect GitHub repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy automatically** on push to `main` branch

Configuration files:

- `vercel.json` - Vercel deployment settings
- `.npmrc` - npm configuration (legacy-peer-deps)

### Build Configuration

- **Framework**: Next.js (auto-detected)
- **Build Command**: `npm run build`
- **Install Command**: `npm install --legacy-peer-deps`
- **Output Directory**: Auto-detected by Vercel

## Project Structure

```
pro-dj/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   ├── book/              # Booking pages
│   └── page.tsx           # Homepage
├── components/            # React components
├── lib/                   # Utility libraries
├── prisma/                # Database schema and migrations
├── public/                # Static assets
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
├── next.config.ts         # Next.js configuration
├── vercel.json            # Vercel deployment config
└── package.json           # Dependencies and scripts
```

## Security

- Next.js 15.5.9 (latest security patches)
- React 19.2.3 (latest version)
- Secure authentication with NextAuth.js
- Environment variable protection
- Input validation and sanitization
- HTTPS enforced in production

## Troubleshooting

### Common Issues

**Build fails with Prisma errors**

```bash
npm run db:generate
npm run build
```

**Static chunk 404 errors**

- Clear browser cache (hard refresh: `Cmd+Shift+R` / `Ctrl+Shift+R`)
- Purge Vercel CDN cache in dashboard
- Redeploy without build cache

**Port already in use**

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**Database connection issues**

- Verify `DATABASE_URL` in `.env`
- Check database is running and accessible
- Verify SSL settings for production databases

## Documentation

- [Deployment Guide](./VERCEL_DEPLOYMENT.md)
- [Database Setup](./DATABASE_SETUP.md)
- [Stripe Setup](./STRIPE_SETUP.md)
- [AWS S3 Setup](./AWS_S3_SETUP.md)
- [Environment Setup](./ENVIRONMENT_SETUP.md)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For issues, questions, or support:

- Check existing documentation in the `/docs` folder
- Review deployment guides for setup help
- Contact: support@prodj.com

---

**Built with Next.js and deployed on Vercel**
