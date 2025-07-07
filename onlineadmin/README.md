# CBT Admin Dashboard (Next.js)

This project is a modern admin dashboard for managing a Computer-Based Test (CBT) platform. Built with Next.js 14+, TypeScript, Tailwind CSS, and MongoDB Atlas, it allows remote management of questions, results, users, and classes. Designed for deployment on Vercel.

## Features

- Secure admin authentication
- CRUD for questions, results, users, and classes
- Dashboard analytics
- Cloud sync endpoints for offline Electron/SQLite student app
- Ready for Vercel deployment

## Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   - Copy `.env.example` to `.env.local` and fill in your MongoDB Atlas URI and any secrets.

3. **Run the development server:**

   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000) in your browser.**

## Deployment

- Deploy to Vercel for best results.

## Customization

- Update pages and components in `src/` as needed.
- Add your MongoDB models and API routes in `src/app/api/`.

---

For more details, see the `.github/copilot-instructions.md` file.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
