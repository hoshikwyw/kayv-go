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

## Tests

[Vitest](vitest.config.ts) + Testing Library, jsdom environment. 40 tests, no
network: `src/test/supabase.ts` provides a proxy-based stand-in for the
PostgREST query builder that records every call in the chain, so tests assert on
the exact payload sent to Supabase.

```bash
npm test              # single run
npm run test:watch
npm run test:coverage
```

`.env.test` holds dummy Supabase credentials so the client can be constructed;
every call is mocked.

What is covered:

| Area | Guards against |
| --- | --- |
| `uploadImages` | wrong upload path, lost file extension, a partial batch being saved |
| `deleteImages` | deleting objects from another bucket, cleanup failures surfacing as errors |
| `usePosts` | wrong page offsets, duplicate rows on load-more, a stale filter overwriting results |
| `PostForm` | untrimmed or empty-string fields, inserting after a failed upload, ownership reassignment on edit, photos deleted before the row is saved |
| `ProtectedRoute` | a non-admin reaching the dashboard, deciding access before the profile has loaded |

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

Capacitor uses these too - see the section below.

## Capacitor (Android app shell)

The same `dist/` build runs inside a Capacitor webview. Config lives in
[`capacitor.config.ts`](capacitor.config.ts); the Android project is in
`android/`.

```bash
npm run cap:sync      # build, then copy the web assets into android/
npm run cap:android    # the above, then open Android Studio
```

Building an APK needs Android Studio and a JDK - Capacitor only scaffolds and
syncs the project. iOS is not set up (it needs macOS); on a Mac it is
`npm i -D @capacitor/ios && npx cap add ios`.

**Native camera.** Inside the shell the photo field swaps the file input for
"Take photo" and "Choose photos", backed by `@capacitor/camera`
([`src/lib/nativeCamera.ts`](src/lib/nativeCamera.ts)). Photos are converted to
`File` objects, so they take the same upload path as browser uploads. In any
browser - including the installed PWA - nothing changes.

The service worker is deliberately not registered inside the shell: the assets
are already local and updates ship through the store, so a second cache would
only get in the way.

**Note on the anon key.** `npm run build` inlines `VITE_SUPABASE_*` into the
bundle, which then ships inside the APK. That is expected for the anon key -
RLS is what protects your data, so keep the policies in
[`supabase/policies.sql`](supabase/policies.sql) tight.

## Scripts

```bash
npm run dev      # dev server
npm run build    # tsc -b && vite build
npm run preview  # serve dist/ (the only way to exercise the service worker)
npm run icons    # regenerate PWA icons
npm test         # run the test suite
npm run cap:sync # build and copy into the Android project
npx oxlint src   # lint
```
