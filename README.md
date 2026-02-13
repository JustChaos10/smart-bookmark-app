# Smart Bookmark App (POC)

Simple bookmark manager built for the Abstrabit micro-challenge.

## Live Submission
- Live URL: `add-your-vercel-url-here`
- GitHub Repo: `add-your-public-repo-url-here`

## Tech Stack
- Next.js (App Router)
- Supabase (Auth + Postgres + Realtime)
- Tailwind CSS

## Features Implemented
1. Google OAuth login only (no email/password flow)
2. Add bookmark with title + URL
3. Private bookmarks per user using Supabase RLS
4. Real-time updates across open tabs
5. Delete own bookmarks
6. Deploy-ready for Vercel

## Local Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` from `.env.example` and fill your values:
   ```bash
   cp .env.example .env.local
   ```
3. Run dev server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000`.

## Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase Setup
1. Create a new Supabase project.
2. In Supabase SQL Editor, run `supabase/schema.sql`.
3. In Auth -> Providers, enable Google.
4. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://your-vercel-domain.vercel.app/auth/callback`
5. Ensure Realtime is enabled for table `public.bookmarks`.

## Database and Policies (SQL)
Schema and RLS policies are in:
- `supabase/schema.sql`

## Deploy to Vercel
1. Push code to public GitHub repo.
2. Import repo in Vercel.
3. Set environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Redeploy after setting env vars.
5. Add the Vercel callback URL to Supabase Google OAuth settings.

## Manual Validation Checklist
1. Login with Google works.
2. Add bookmark works.
3. User A cannot see User B bookmarks.
4. Delete own bookmark works.
5. Two tabs show updates in real-time without refresh.
6. Live Vercel URL works with external tester account.

## Problems I Ran Into and How I Solved Them
1. `create-next-app` failed in folder `Project` because npm package names cannot include uppercase letters.
   - Solution: scaffolded in lowercase folder name and moved project files to root.
2. Session persistence across server/client needed correct Next.js + Supabase cookie handling.
   - Solution: added Supabase SSR middleware and server client helpers from recommended pattern.
3. Real-time updates should stay user-private.
   - Solution: used strict RLS policies and realtime filter `user_id=eq.<current_user_id>`.
