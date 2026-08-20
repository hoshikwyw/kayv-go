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
| `/` | Public blog feed - paginated grid, category filter, photo lightbox |
| `/post/:id` | Single post - full content and every photo |
| `/login` | Email + password sign-in |
| `/admin` | Protected dashboard - create, edit and delete posts (requires `profiles.is_admin = true`) |

## Layout

```
src/
  supabaseClient.ts        typed client + bucket name
  types/database.ts        Post, Profile, category union, Database types
  context/                 AuthProvider + context (session, profile, isAdmin)
  hooks/useAuth.ts
  components/
    ProtectedRoute.tsx     session gate + admin gate
    admin/PostForm.tsx     create or edit a post (upload photos, then save)
    admin/ExistingImages.tsx  detach photos already on a post
    admin/ImagePicker.tsx  multi-file input with previews
    admin/StarRatingInput.tsx
    blog/PostCard.tsx      one post: badge, stars, location, gallery, content
    blog/ImageGallery.tsx  responsive photo grid + keyboard-driven lightbox
  hooks/usePosts.ts        paginated feed query, optionally filtered by category
  hooks/usePost.ts         single post by id, with a not-found state
  lib/uploadImages.ts      validation + parallel upload to Storage
  lib/deleteImages.ts      public URL -> object path, best-effort cleanup
  pages/                   HomePage (feed), PostPage, LoginPage, AdminDashboard
```

## PWA

The app is installable and works offline. Built with `vite-plugin-pwa`
(Workbox) - see the `VitePWA` block in [`vite.config.ts`](vite.config.ts).

- **App shell** is precached on first visit.
- **Post photos** use cache-first. Every upload gets a fresh uuid, so a cached
  image can never be stale.
- **Feed queries** use network-first with a 5s timeout, falling back to the last
  successful response. Auth endpoints are deliberately never cached.
- **Updates** are opt-in: a new build shows a "Reload" prompt rather than
  swapping the page out mid-scroll.

The service worker only runs in a real build - `npm run dev` does not register
one. To test it:

```bash
npm run build && npm run preview
```

Then open DevTools → Application → Service Workers / Manifest. Installability
also requires HTTPS, which you get on Vercel and on `localhost`.

### Icons

`public/icons/*` are generated placeholders:

```bash
npm run icons     # node scripts/generate-icons.mjs
```

Replace them with real artwork at the same filenames and sizes (192, 512,
maskable 512, apple-touch 180) when you have it - no config change needed.

### Capacitor

Not wired up yet. The PWA above is browser-installable on Android and iOS;
Capacitor is only needed for app-store distribution and native APIs.

## Scripts

```bash
npm run dev      # dev server
npm run build    # tsc -b && vite build
npm run preview  # serve dist/ (the only way to exercise the service worker)
npm run icons    # regenerate PWA icons
npx oxlint src   # lint
```
