# Pro-Dj
# Pro-DJ 🎧

A full-stack professional DJ portfolio app for myself built to showcase my sets, past events, accept bookings, and take payments — all while flexing my full-stack dev chops.

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
├── app/                # App router pages & layouts
├── components/         # Reusable UI components
├── lib/                # Prisma, Auth, Stripe, etc.
├── prisma/             # Prisma schema and migrations
├── public/             # Static assets
├── styles/             # Tailwind/global styles
├── utils/              # Helper functions
├── .env.example        # Sample environment variables
└── README.md
```

---

## 🔐 Authentication
- Google OAuth via NextAuth.js
- JWT fallback for admin login
- Role-based access for admin vs clients

---

## 💸 Payments with Stripe
- Booking requests are paired with one-time Stripe checkout sessions
- Webhook confirms payment and logs booking

---

## 📦 Media Storage
- Mixes hosted via Firebase Storage (resumable uploads, streamable audio)
- Images served via Cloudinary with automatic optimization

---

## ✅ To Run Locally
```bash
git clone https://github.com/JideOgun/Pro-Dj.git
cd Pro-Dj
cp .env.example .env # then fill in your secrets
pnpm install
npx prisma migrate dev --name init
pnpm dev
```

---

## 📚 Learning Goals
- Solidify Next.js full-stack skills
- Practice Stripe, NextAuth, and Prisma in production setup
- Reinforce OAuth + JWT patterns
- Gain experience with media storage & delivery

---

## 🚀 Deployment
- [ ] Frontend & API hosted on [Vercel](https://vercel.com)
- [ ] Postgres hosted on [Railway](https://railway.app) or [Supabase](https://supabase.com)
- [ ] Stripe dashboard for live/test payment tracking

---

## © 2025 Jide Ogunbanjo — DJ, Dev, & Doer
