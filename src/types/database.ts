export const POST_CATEGORIES = ['restaurant', 'campsite', 'trip_story'] as const

export type PostCategory = (typeof POST_CATEGORIES)[number]

export const CATEGORY_LABELS: Record<PostCategory, string> = {
  restaurant: 'Restaurant',
  campsite: 'Campsite',
  trip_story: 'Trip Story',
}

export type Profile = {
  id: string
  username: string | null
  is_admin: boolean
  created_at: string
}

export type Post = {
  id: string
  user_id: string
  title: string
  content: string
  category: PostCategory
  location_name: string | null
  rating: number | null
  image_urls: string[] | null
  created_at: string
}

/** Shape accepted by `supabase.from('posts').insert(...)`. */
export type NewPost = {
  user_id: string
  title: string
  content: string
  category: PostCategory
  location_name: string | null
  rating: number | null
  image_urls: string[]
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile> & { id: string }
        Update: Partial<Profile>
        Relationships: []
      }
      posts: {
        Row: Post
        Insert: NewPost
        Update: Partial<NewPost>
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}
