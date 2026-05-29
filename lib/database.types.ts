export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      admin_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: string
          description: string | null
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: string
          description?: string | null
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: string
          description?: string | null
          updated_by?: string | null
          updated_at?: string
        }
      }
      blog_comments: {
        Row: {
          id: string
          post_id: string
          author_name: string
          author_email: string
          content: string
          is_approved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_name: string
          author_email: string
          content: string
          is_approved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          author_name?: string
          author_email?: string
          content?: string
          is_approved?: boolean
          created_at?: string
        }
      }
      blog_posts: {
        Row: {
          id: string
          author_id: string
          title: string
          slug: string
          excerpt: string | null
          content: string
          featured_image_url: string | null
          category: string
          tags: string[] | null
          status: string
          published_at: string | null
          view_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          title: string
          slug: string
          excerpt?: string | null
          content: string
          featured_image_url?: string | null
          category: string
          tags?: string[] | null
          status?: string
          published_at?: string | null
          view_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          title?: string
          slug?: string
          excerpt?: string | null
          content?: string
          featured_image_url?: string | null
          category?: string
          tags?: string[] | null
          status?: string
          published_at?: string | null
          view_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          space_id: string
          guest_id: string
          host_id: string
          start_date: string
          end_date: string
          total_hours: number
          price_per_hour: number
          total_amount: number
          service_fee: number
          tax_amount: number
          final_amount: number
          status: string
          payment_status: string
          payment_intent_id: string | null
          special_requests: string | null
          guest_count: number
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          space_id: string
          guest_id: string
          host_id: string
          start_date: string
          end_date: string
          total_hours: number
          price_per_hour: number
          total_amount: number
          service_fee?: number
          tax_amount?: number
          final_amount: number
          status?: string
          payment_status?: string
          payment_intent_id?: string | null
          special_requests?: string | null
          guest_count?: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          space_id?: string
          guest_id?: string
          host_id?: string
          start_date?: string
          end_date?: string
          total_hours?: number
          price_per_hour?: number
          total_amount?: number
          service_fee?: number
          tax_amount?: number
          final_amount?: number
          status?: string
          payment_status?: string
          payment_intent_id?: string | null
          special_requests?: string | null
          guest_count?: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          space_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          space_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          space_id?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          booking_id: string | null
          sender_id: string
          recipient_id: string
          subject: string | null
          content: string
          is_read: boolean
          message_type: string
          created_at: string
        }
        Insert: {
          id?: string
          booking_id?: string | null
          sender_id: string
          recipient_id: string
          subject?: string | null
          content: string
          is_read?: boolean
          message_type?: string
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string | null
          sender_id?: string
          recipient_id?: string
          subject?: string | null
          content?: string
          is_read?: boolean
          message_type?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          is_read: boolean
          action_url: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: string
          is_read?: boolean
          action_url?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          is_read?: boolean
          action_url?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          display_name: string | null
          username: string | null
          bio: string | null
          phone: string | null
          profile_image_url: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          country: string | null
          neighbor: string | null
          website_url: string | null
          linkedin_url: string | null
          twitter_url: string | null
          instagram_url: string | null
          facebook_url: string | null
          airbnb_url: string | null
          pinterest_url: string | null
          payout_method: string | null
          payout_details: Json | null
          is_host: boolean
          is_admin: boolean
          is_superuser: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          display_name?: string | null
          username?: string | null
          bio?: string | null
          phone?: string | null
          profile_image_url?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          country?: string | null
          neighbor?: string | null
          website_url?: string | null
          linkedin_url?: string | null
          twitter_url?: string | null
          instagram_url?: string | null
          facebook_url?: string | null
          airbnb_url?: string | null
          pinterest_url?: string | null
          payout_method?: string | null
          payout_details?: Json | null
          is_host?: boolean
          is_admin?: boolean
          is_superuser?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          display_name?: string | null
          username?: string | null
          bio?: string | null
          phone?: string | null
          profile_image_url?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          country?: string | null
          neighbor?: string | null
          website_url?: string | null
          linkedin_url?: string | null
          twitter_url?: string | null
          instagram_url?: string | null
          facebook_url?: string | null
          airbnb_url?: string | null
          pinterest_url?: string | null
          payout_method?: string | null
          payout_details?: Json | null
          is_host?: boolean
          is_admin?: boolean
          is_superuser?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          booking_id: string
          space_id: string
          reviewer_id: string
          reviewee_id: string
          rating: number
          title: string | null
          comment: string | null
          review_type: string
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          space_id: string
          reviewer_id: string
          reviewee_id: string
          rating: number
          title?: string | null
          comment?: string | null
          review_type: string
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          space_id?: string
          reviewer_id?: string
          reviewee_id?: string
          rating?: number
          title?: string | null
          comment?: string | null
          review_type?: string
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      space_categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon_name: string | null
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          icon_name?: string | null
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          icon_name?: string | null
          image_url?: string | null
          created_at?: string
        }
      }
      spaces: {
        Row: {
          id: string
          host_id: string
          title: string
          description: string
          short_description: string | null
          category_id: string | null
          space_type: string
          address_line1: string
          address_line2: string | null
          city: string
          state: string
          zip_code: string
          country: string | null
          latitude: number | null
          longitude: number | null
          price_per_hour: number | null
          price_per_day: number | null
          capacity: number | null
          size_sqft: number | null
          amenities: string[] | null
          rules: string[] | null
          images: string[] | null
          video_url: string | null
          is_featured: boolean
          is_active: boolean
          availability_schedule: Json | null
          instant_book: boolean
          minimum_booking_hours: number | null
          maximum_booking_hours: number | null
          cancellation_policy: string | null
          rating_average: number | null
          rating_count: number | null
          view_count: number | null
          booking_count: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          host_id: string
          title: string
          description: string
          short_description?: string | null
          category_id?: string | null
          space_type: string
          address_line1: string
          address_line2?: string | null
          city: string
          state: string
          zip_code: string
          country?: string | null
          latitude?: number | null
          longitude?: number | null
          price_per_hour?: number | null
          price_per_day?: number | null
          capacity?: number | null
          size_sqft?: number | null
          amenities?: string[] | null
          rules?: string[] | null
          images?: string[] | null
          video_url?: string | null
          is_featured?: boolean
          is_active?: boolean
          availability_schedule?: Json | null
          instant_book?: boolean
          minimum_booking_hours?: number | null
          maximum_booking_hours?: number | null
          cancellation_policy?: string | null
          rating_average?: number | null
          rating_count?: number | null
          view_count?: number | null
          booking_count?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          host_id?: string
          title?: string
          description?: string
          short_description?: string | null
          category_id?: string | null
          space_type?: string
          address_line1?: string
          address_line2?: string | null
          city?: string
          state?: string
          zip_code?: string
          country?: string | null
          latitude?: number | null
          longitude?: number | null
          price_per_hour?: number | null
          price_per_day?: number | null
          capacity?: number | null
          size_sqft?: number | null
          amenities?: string[] | null
          rules?: string[] | null
          images?: string[] | null
          video_url?: string | null
          is_featured?: boolean
          is_active?: boolean
          availability_schedule?: Json | null
          instant_book?: boolean
          minimum_booking_hours?: number | null
          maximum_booking_hours?: number | null
          cancellation_policy?: string | null
          rating_average?: number | null
          rating_count?: number | null
          view_count?: number | null
          booking_count?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      user_activities: {
        Row: {
          id: string
          user_id: string
          username: string | null
          activity_type: string
          activity_description: string
          metadata: Json | null
          ip_address: string | null
          user_agent: string | null
          device_type: string | null
          browser: string | null
          operating_system: string | null
          country: string | null
          city: string | null
          is_suspicious: boolean
          is_admin_action: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          username?: string | null
          activity_type: string
          activity_description: string
          metadata?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          device_type?: string | null
          browser?: string | null
          operating_system?: string | null
          country?: string | null
          city?: string | null
          is_suspicious?: boolean
          is_admin_action?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          username?: string | null
          activity_type?: string
          activity_description?: string
          metadata?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          device_type?: string | null
          browser?: string | null
          operating_system?: string | null
          country?: string | null
          city?: string | null
          is_suspicious?: boolean
          is_admin_action?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
