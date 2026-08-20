# Kayv Go

Travel blog, restaurant reviews and campsite sharing. React + Vite + TypeScript,
Tailwind CSS v4, Supabase (Postgres + Auth + Storage). Deploys to Vercel.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL + anon key
npm run dev
```

`.env.local`:

| Variable | Notes |
| --- | --- |
| `VITE_SUPABASE_URL` | Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Project Settings → API → anon public key |
| `VITE_SUPABASE_POST_BUCKET` | Storage bucket for photos (default `post-images`) |

Vite only reads env vars at startup — restart the dev server after editing.

## Supabase setup

1. **Storage** → create a bucket named `post-images` with **Public** enabled.
2. **SQL editor** → run [`supabase/policies.sql`](supabase/policies.sql) (RLS for
   `profiles`, `posts` and `storage.objects`).
3. **Authentication → Users** → create your admin user (email + password).
4. Give that user a profile row and admin rights:

   ```sql
   insert into public.profiles (id, username, is_admin)
   values ('<your-auth-user-uuid>', 'kayv', true)
   on conflict (id) do update set is_admin = true;
   ```

## Routes

| Route | What it does |
| --- | --- |
| `/` | Public blog feed (placeholder for now) |
| `/login` | Email + password sign-in |
| `/admin` | Protected dashboard — requires `profiles.is_admin = true` |

## Layout

```
src/
  supabaseClient.ts        typed client + bucket name
  types/database.ts        Post, Profile, category union, Database types
  context/                 AuthProvider + context (session, profile, isAdmin)
  hooks/useAuth.ts
  components/
    ProtectedRoute.tsx     session gate + admin gate
    admin/PostForm.tsx     create a post (upload photos, then insert)
    admin/ImagePicker.tsx  multi-file input with previews
    admin/StarRatingInput.tsx
  lib/uploadImages.ts      validation + parallel upload to Storage
  pages/                   HomePage, LoginPage, AdminDashboard
```

## Scripts

```bash
npm run dev      # dev server
npm run build    # tsc -b && vite build
npm run preview  # serve dist/
npx oxlint src   # lint
```
