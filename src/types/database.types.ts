export type Database = {
  public: {
    Tables: {
      audio_stories: {
        Row: {
          audio_url: string
          category: string
          cover_image_url: string
          created_at: string
          id: string
          title: string
          uploaded_by: string
        }
        Insert: {
          audio_url: string
          category?: string
          cover_image_url?: string
          created_at?: string
          id?: string
          title: string
          uploaded_by: string
        }
        Update: {
          audio_url?: string
          category?: string
          cover_image_url?: string
          created_at?: string
          id?: string
          title?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          name: string | null
          avatar_url: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          name?: string | null
          avatar_url?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          avatar_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      followers: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "followers_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followers_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {}
    Functions: {
      get_user_stats: {
        Args: {
          user_id: string
        }
        Returns: {
          followers_count: number
          following_count: number
        }[]
      }
    }
    Enums: {}
    CompositeTypes: {}
  }
}
