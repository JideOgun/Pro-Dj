# Pro-DJ 🎧

A comprehensive DJ booking platform that connects clients with professional DJs. Features include real-time booking management, payment processing, DJ profiles, and an intelligent matching system.

## 🌟 Key Features

### For Clients

- **Smart DJ Discovery**: Intelligent matching based on event type, music genres, and availability
- **Flexible Booking System**: Hourly rate + add-ons pricing model
- **Real-time Updates**: Live booking status updates via WebSocket
- **Payment Processing**: Secure Stripe integration with refund capabilities
- **Booking Recovery**: Easy rebooking after refunds with pre-filled data

### For DJs

- **Profile Management**: Customizable profiles with event-specific pricing
- **Add-on Services**: DJ-specific add-ons (lighting, MC services, etc.)
- **Booking Control**: Toggle availability and manage existing bookings
- **Real-time Dashboard**: Live statistics and booking notifications
- **Event Type Specialization**: Set different rates for different event types

### For Admins

- **DJ Approval System**: Review and approve new DJ registrations
- **Platform Management**: Monitor bookings, payments, and user activity
- **Analytics**: Track platform performance and revenue

## 🛠️ Tech Stack

**Frontend:**

- [Next.js 15](https://nextjs.org/) (App Router, TypeScript)
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Framer Motion](https://www.framer.com/motion/) for animations
- [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) for form handling
- [Socket.IO](https://socket.io/) for real-time updates
- [React Hot Toast](https://react-hot-toast.com/) for notifications

**Backend:**

- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/router-handlers)
- [Prisma](https://www.prisma.io/) + PostgreSQL for database
- [NextAuth.js](https://next-auth.js.org/) with Google OAuth + JWT
- [Stripe](https://stripe.com/) for payment processing and refunds
- [Socket.IO](https://socket.io/) for real-time communication

**Dev Tools:**

- [Docker](https://www.docker.com/) for development environment
- ESLint + Prettier for code quality
- Git + GitHub for version control

## 🌐 Live Demo

Coming soon via [Vercel](https://vercel.com)

---

## 🛠️ Tech Stack

**Frontend:**

- [Next.js](https://nextjs.org/) (App Router, TypeScript)
- [Tailwind CSS](https://tailwindcss.com/)
- [ShadCN](https://ui.shadcn.com/) for beautiful UI components
- [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) for form handling and validation

**Backend:**

- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/router-handlers)
- [Prisma](https://www.prisma.io/) + PostgreSQL
- [NextAuth.js](https://next-auth.js.org/) with Google OAuth + JWT
- [Stripe](https://stripe.com/) for payment processing
- [Firebase Storage](https://firebase.google.com/docs/storage) for large audio files
- [Cloudinary](https://cloudinary.com/) for event and promotional images

**Dev Tools:**

- [Cursor IDE](https://www.cursor.so/)
- ESLint + Prettier
- Git + GitHub

---

## 📁 Project Structure

```
pro-dj/
├── app/                    # App router pages & layouts
│   ├── api/               # API routes
│   ├── book/              # Booking pages
│   ├── dashboard/         # Dashboard pages (admin, DJ, client)
│   ├── dj/                # DJ-specific pages
│   └── auth/              # Authentication pages
├── components/            # Reusable UI components
├── lib/                   # Utilities (Prisma, Auth, Stripe, etc.)
├── prisma/               # Database schema and migrations
├── public/               # Static assets
├── docker-compose.dev.yml # Development environment
└── README.md
```

---

## 🔐 Authentication & Authorization

- **Google OAuth** via NextAuth.js for seamless login
- **Role-based Access Control**: Admin, DJ, and Client roles
- **JWT Tokens** for secure session management
- **Admin Approval System** for DJ registrations

## 💸 Payment System

- **Stripe Integration** for secure payment processing
- **Refund Management** with partial and full refund capabilities
- **Payment Links** for easy client payment completion
- **Webhook Processing** for real-time payment confirmation

## 🎵 Booking System

- **Intelligent DJ Matching** based on event type, genres, and availability
- **Flexible Pricing Model**: Hourly rates + customizable add-ons
- **Event-Specific Pricing** for different event types (weddings, clubs, etc.)
- **Real-time Status Updates** via WebSocket connections
- **Booking Recovery** for easy rebooking after refunds

## 📊 Real-time Features

- **Live Dashboard Updates** for all user types
- **WebSocket Integration** for instant notifications
- **Booking Status Tracking** with timeout management
- **Real-time Chat** (planned feature)

---

## ✅ To Run Locally

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- PostgreSQL database

### Quick Start

```bash
# Clone the repository
git clone https://github.com/JideOgun/Pro-Dj.git
cd Pro-Dj

# Copy environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development environment with Docker
docker-compose -f docker-compose.dev.yml up -d

# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev --name init

# Seed the database
npx prisma db seed

# Start the development server
npm run dev
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_SECRET="your-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Admin
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="secure-password"
```

---

## 🚀 Deployment

### Production Setup

- **Frontend & API**: [Vercel](https://vercel.com)
- **Database**: [Railway](https://railway.app) or [Supabase](https://supabase.com)
- **Payments**: [Stripe](https://stripe.com) with webhook configuration
- **Environment**: Docker containers for consistent deployment

### Environment Configuration

```bash
# Production environment variables
NODE_ENV=production
DATABASE_URL="your-production-db-url"
NEXTAUTH_URL="https://your-domain.com"
STRIPE_SECRET_KEY="sk_live_..."
```

## 🧪 Testing

### API Testing

```bash
# Test booking creation
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"bookingType": "Wedding", "eventDate": "2025-01-15"}'

# Test DJ search
curl http://localhost:3000/api/djs?eventType=Wedding
```

### Database Testing

```bash
# Reset database
npx prisma migrate reset

# Seed with test data
npx prisma db seed
```

## 📈 Roadmap

### Phase 1 (Current) ✅

- [x] Core booking system
- [x] Payment processing
- [x] DJ profiles and management
- [x] Real-time updates

### Phase 2 (Next)

- [ ] Real-time chat between clients and DJs
- [ ] Advanced analytics dashboard
- [ ] Mobile app development
- [ ] Calendar integration

### Phase 3 (Future)

- [ ] AI-powered DJ recommendations
- [ ] Event planning tools
- [ ] Social features and reviews
- [ ] Multi-language support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## © 2025 Jide Ogunbanjo — DJ, Dev, & Doer

Built with ❤️ and lots of ☕
