-- Run once in the Supabase SQL editor.
-- Assumes `profiles` and `posts` already exist.

-- ---------------------------------------------------------------- profiles
alter table public.profiles enable row level security;

create policy "Profiles are readable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Keep `is_admin` out of reach of the anon/authenticated roles: only grant it
-- from the SQL editor or a service-role key.
revoke update (is_admin) on public.profiles from anon, authenticated;

-- ------------------------------------------------------------------- posts
alter table public.posts enable row level security;

create policy "Posts are readable by everyone"
  on public.posts for select
  using (true);

create policy "Admins can insert their own posts"
  on public.posts for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin
    )
  );

create policy "Admins can update their own posts"
  on public.posts for update
  using (
    auth.uid() = user_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

create policy "Admins can delete their own posts"
  on public.posts for delete
  using (
    auth.uid() = user_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- ----------------------------------------------------------------- storage
-- Create the bucket in Dashboard > Storage (name: post-images, Public: on),
-- or uncomment the insert below.
-- insert into storage.buckets (id, name, public) values ('post-images', 'post-images', true);

create policy "Post images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'post-images');

-- Uploads land in <bucket>/<user-id>/<uuid>.<ext>, so the first path segment
-- must match the uploader.
create policy "Admins can upload post images"
  on storage.objects for insert
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

create policy "Admins can delete their own post images"
  on storage.objects for delete
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
