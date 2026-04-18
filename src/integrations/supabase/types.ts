export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      banners: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          link_url: string | null
          position: string
          sort_order: number
          starts_at: string | null
          subtitle: string | null
          title: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          position?: string
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          position?: string
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title?: string
        }
        Relationships: []
      }
      call_logs: {
        Row: {
          caller_id: string
          conversation_id: string | null
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          receiver_id: string
          started_at: string
          status: string
        }
        Insert: {
          caller_id: string
          conversation_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          receiver_id: string
          started_at?: string
          status?: string
        }
        Update: {
          caller_id?: string
          conversation_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          receiver_id?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          user_id: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          user_id: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          user_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          accent_color: string | null
          banner_type: string | null
          banner_url: string | null
          created_at: string
          description: string | null
          flash_sale_ends_at: string | null
          icon: string | null
          icon_url: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          is_flash_sale: boolean
          meta_description: string | null
          meta_keywords: string | null
          meta_title: string | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          accent_color?: string | null
          banner_type?: string | null
          banner_url?: string | null
          created_at?: string
          description?: string | null
          flash_sale_ends_at?: string | null
          icon?: string | null
          icon_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          is_flash_sale?: boolean
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          accent_color?: string | null
          banner_type?: string | null
          banner_url?: string | null
          created_at?: string
          description?: string | null
          flash_sale_ends_at?: string | null
          icon?: string | null
          icon_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          is_flash_sale?: boolean
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_filters: {
        Row: {
          category_id: string
          created_at: string
          filter_name: string
          filter_values: string[]
          id: string
          is_active: boolean
          sort_order: number
        }
        Insert: {
          category_id: string
          created_at?: string
          filter_name: string
          filter_values?: string[]
          id?: string
          is_active?: boolean
          sort_order?: number
        }
        Update: {
          category_id?: string
          created_at?: string
          filter_name?: string
          filter_values?: string[]
          id?: string
          is_active?: boolean
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "category_filters_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_pages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_published: boolean
          meta_description: string | null
          meta_title: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          first_order_only: boolean
          id: string
          is_active: boolean
          max_discount_amount: number | null
          min_items: number | null
          min_order_amount: number | null
          per_user_limit: number | null
          starts_at: string | null
          target_categories: string[] | null
          target_products: string[] | null
          usage_limit: number | null
          used_count: number | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          first_order_only?: boolean
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          min_items?: number | null
          min_order_amount?: number | null
          per_user_limit?: number | null
          starts_at?: string | null
          target_categories?: string[] | null
          target_products?: string[] | null
          usage_limit?: number | null
          used_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          first_order_only?: boolean
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          min_items?: number | null
          min_order_amount?: number | null
          per_user_limit?: number | null
          starts_at?: string | null
          target_categories?: string[] | null
          target_products?: string[] | null
          usage_limit?: number | null
          used_count?: number | null
        }
        Relationships: []
      }
      delivery_offers: {
        Row: {
          created_at: string
          description: string | null
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          min_order_amount: number | null
          offer_type: string
          starts_at: string | null
          target_areas: string[] | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          min_order_amount?: number | null
          offer_type?: string
          starts_at?: string | null
          target_areas?: string[] | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          min_order_amount?: number | null
          offer_type?: string
          starts_at?: string | null
          target_areas?: string[] | null
          title?: string
        }
        Relationships: []
      }
      email_subscriptions: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          expires_at: string | null
          icon: string | null
          id: string
          is_read: boolean
          link_url: string | null
          message: string | null
          priority: string
          scheduled_at: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          icon?: string | null
          id?: string
          is_read?: boolean
          link_url?: string | null
          message?: string | null
          priority?: string
          scheduled_at?: string | null
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          icon?: string | null
          id?: string
          is_read?: boolean
          link_url?: string | null
          message?: string | null
          priority?: string
          scheduled_at?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_image: string | null
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          product_image?: string | null
          product_name: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          product_image?: string | null
          product_name?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          coupon_code: string | null
          coupon_discount: number | null
          created_at: string
          gift_message: string | null
          gift_wrap: boolean | null
          id: string
          notes: string | null
          order_number: string
          payment_method: string
          shipping_address: Json
          shipping_fee: number
          shipping_method_id: string | null
          status: string
          subtotal: number
          total: number
          tracking_number: string | null
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          coupon_code?: string | null
          coupon_discount?: number | null
          created_at?: string
          gift_message?: string | null
          gift_wrap?: boolean | null
          id?: string
          notes?: string | null
          order_number: string
          payment_method?: string
          shipping_address?: Json
          shipping_fee?: number
          shipping_method_id?: string | null
          status?: string
          subtotal?: number
          total?: number
          tracking_number?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          coupon_code?: string | null
          coupon_discount?: number | null
          created_at?: string
          gift_message?: string | null
          gift_wrap?: boolean | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string
          shipping_address?: Json
          shipping_fee?: number
          shipping_method_id?: string | null
          status?: string
          subtotal?: number
          total?: number
          tracking_number?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_shipping_method_id_fkey"
            columns: ["shipping_method_id"]
            isOneToOne: false
            referencedRelation: "shipping_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      page_analytics: {
        Row: {
          created_at: string
          duration_ms: number | null
          event_type: string
          id: string
          metadata: Json | null
          page: string
          section_id: string | null
          session_id: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          event_type?: string
          id?: string
          metadata?: Json | null
          page?: string
          section_id?: string | null
          session_id?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          event_type?: string
          id?: string
          metadata?: Json | null
          page?: string
          section_id?: string | null
          session_id?: string | null
        }
        Relationships: []
      }
      pathao_shipments: {
        Row: {
          cod_amount: number | null
          consignment_id: string
          created_at: string
          delivery_fee: number | null
          environment: string
          id: string
          invoice_id: string | null
          last_synced_at: string | null
          merchant_order_id: string | null
          order_id: string
          order_status: string | null
          order_status_slug: string | null
          raw_response: Json | null
          recipient_area: number | null
          recipient_city: number | null
          recipient_city_name: string | null
          recipient_zone: number | null
          recipient_zone_name: string | null
          shipment_type: string
          updated_at: string
        }
        Insert: {
          cod_amount?: number | null
          consignment_id: string
          created_at?: string
          delivery_fee?: number | null
          environment?: string
          id?: string
          invoice_id?: string | null
          last_synced_at?: string | null
          merchant_order_id?: string | null
          order_id: string
          order_status?: string | null
          order_status_slug?: string | null
          raw_response?: Json | null
          recipient_area?: number | null
          recipient_city?: number | null
          recipient_city_name?: string | null
          recipient_zone?: number | null
          recipient_zone_name?: string | null
          shipment_type?: string
          updated_at?: string
        }
        Update: {
          cod_amount?: number | null
          consignment_id?: string
          created_at?: string
          delivery_fee?: number | null
          environment?: string
          id?: string
          invoice_id?: string | null
          last_synced_at?: string | null
          merchant_order_id?: string | null
          order_id?: string
          order_status?: string | null
          order_status_slug?: string | null
          raw_response?: Json | null
          recipient_area?: number | null
          recipient_city?: number | null
          recipient_city_name?: string | null
          recipient_zone?: number | null
          recipient_zone_name?: string | null
          shipment_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pathao_shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pathao_tokens: {
        Row: {
          access_token: string
          environment: string
          expires_at: string
          id: string
          refresh_token: string | null
          updated_at: string
        }
        Insert: {
          access_token: string
          environment: string
          expires_at: string
          id?: string
          refresh_token?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string
          environment?: string
          expires_at?: string
          id?: string
          refresh_token?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_proofs: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          id: string
          order_id: string
          payment_method: string
          screenshot_url: string
          sheet_synced: boolean
          status: string
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          order_id: string
          payment_method: string
          screenshot_url: string
          sheet_synced?: boolean
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          order_id?: string
          payment_method?: string
          screenshot_url?: string
          sheet_synced?: boolean
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_proofs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      popups: {
        Row: {
          animation_style: string
          bg_color: string | null
          created_at: string
          display_type: string
          duration_hours: number | null
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          link_text: string | null
          link_url: string | null
          max_views: number | null
          message: string | null
          position: string
          starts_at: string | null
          text_color: string | null
          title: string
          trigger_type: string
          trigger_value: number
        }
        Insert: {
          animation_style?: string
          bg_color?: string | null
          created_at?: string
          display_type?: string
          duration_hours?: number | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_text?: string | null
          link_url?: string | null
          max_views?: number | null
          message?: string | null
          position?: string
          starts_at?: string | null
          text_color?: string | null
          title: string
          trigger_type?: string
          trigger_value?: number
        }
        Update: {
          animation_style?: string
          bg_color?: string | null
          created_at?: string
          display_type?: string
          duration_hours?: number | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_text?: string | null
          link_url?: string | null
          max_views?: number | null
          message?: string | null
          position?: string
          starts_at?: string | null
          text_color?: string | null
          title?: string
          trigger_type?: string
          trigger_value?: number
        }
        Relationships: []
      }
      product_import_requests: {
        Row: {
          admin_notes: string | null
          conversation_id: string | null
          created_at: string
          id: string
          notes: string | null
          product_images: string[] | null
          product_url: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          product_images?: string[] | null
          product_url: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          product_images?: string[] | null
          product_url?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_import_requests_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      product_requests: {
        Row: {
          admin_notes: string | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          product_name: string
          reference_url: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          product_name: string
          reference_url?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          product_name?: string
          reference_url?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          color: string | null
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          price_override: number | null
          product_id: string
          size: string | null
          sku: string | null
          sort_order: number
          stock_quantity: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          price_override?: number | null
          product_id: string
          size?: string | null
          sku?: string | null
          sort_order?: number
          stock_quantity?: number
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          price_override?: number | null
          product_id?: string
          size?: string | null
          sku?: string | null
          sort_order?: number
          stock_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          avg_rating: number | null
          category_id: string | null
          compare_at_price: number | null
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          is_active: boolean
          is_featured: boolean
          meta_description: string | null
          meta_keywords: string | null
          meta_title: string | null
          name: string
          price: number
          review_count: number | null
          short_description: string | null
          sku: string | null
          slug: string
          specifications: Json | null
          stock_quantity: number
          tags: string[] | null
          thumbnail: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          avg_rating?: number | null
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean
          is_featured?: boolean
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          name: string
          price?: number
          review_count?: number | null
          short_description?: string | null
          sku?: string | null
          slug: string
          specifications?: Json | null
          stock_quantity?: number
          tags?: string[] | null
          thumbnail?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          avg_rating?: number | null
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean
          is_featured?: boolean
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          name?: string
          price?: number
          review_count?: number | null
          short_description?: string | null
          sku?: string | null
          slug?: string
          specifications?: Json | null
          stock_quantity?: number
          tags?: string[] | null
          thumbnail?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: Json | null
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          preferences: Json | null
          updated_at: string
        }
        Insert: {
          address?: Json | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          preferences?: Json | null
          updated_at?: string
        }
        Update: {
          address?: Json | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          preferences?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      return_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          order_id: string
          reason: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          order_id: string
          reason: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          order_id?: string
          reason?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          images: string[] | null
          is_approved: boolean
          product_id: string
          rating: number
          title: string | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          images?: string[] | null
          is_approved?: boolean
          product_id: string
          rating: number
          title?: string | null
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          images?: string[] | null
          is_approved?: boolean
          product_id?: string
          rating?: number
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_methods: {
        Row: {
          cod_enabled: boolean
          created_at: string
          description: string | null
          estimated_days: string | null
          id: string
          is_active: boolean
          min_order_free: number | null
          name: string
          price: number
          sort_order: number | null
        }
        Insert: {
          cod_enabled?: boolean
          created_at?: string
          description?: string | null
          estimated_days?: string | null
          id?: string
          is_active?: boolean
          min_order_free?: number | null
          name: string
          price?: number
          sort_order?: number | null
        }
        Update: {
          cod_enabled?: boolean
          created_at?: string
          description?: string | null
          estimated_days?: string | null
          id?: string
          is_active?: boolean
          min_order_free?: number | null
          name?: string
          price?: number
          sort_order?: number | null
        }
        Relationships: []
      }
      showcase_slides: {
        Row: {
          created_at: string
          cta_link: string | null
          cta_text: string | null
          description: string | null
          id: string
          image_url: string
          is_active: boolean
          product_id: string | null
          sort_order: number
          subtitle: string | null
          text_align: string
          text_color: string | null
          title: string
          transition_type: string
        }
        Insert: {
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          description?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          product_id?: string | null
          sort_order?: number
          subtitle?: string | null
          text_align?: string
          text_color?: string | null
          title: string
          transition_type?: string
        }
        Update: {
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          description?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          product_id?: string | null
          sort_order?: number
          subtitle?: string | null
          text_align?: string
          text_color?: string | null
          title?: string
          transition_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "showcase_slides_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      steadfast_shipments: {
        Row: {
          cod_amount: number | null
          consignment_id: string
          created_at: string
          delivery_charge: number | null
          id: string
          invoice: string | null
          last_synced_at: string | null
          note: string | null
          order_id: string
          raw_response: Json | null
          recipient_address: string | null
          recipient_name: string | null
          recipient_phone: string | null
          status: string | null
          tracking_code: string | null
          tracking_message: string | null
          updated_at: string
        }
        Insert: {
          cod_amount?: number | null
          consignment_id: string
          created_at?: string
          delivery_charge?: number | null
          id?: string
          invoice?: string | null
          last_synced_at?: string | null
          note?: string | null
          order_id: string
          raw_response?: Json | null
          recipient_address?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          status?: string | null
          tracking_code?: string | null
          tracking_message?: string | null
          updated_at?: string
        }
        Update: {
          cod_amount?: number | null
          consignment_id?: string
          created_at?: string
          delivery_charge?: number | null
          id?: string
          invoice?: string | null
          last_synced_at?: string | null
          note?: string | null
          order_id?: string
          raw_response?: Json | null
          recipient_address?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          status?: string | null
          tracking_code?: string | null
          tracking_message?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stock_notifications: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_notified: boolean
          product_id: string
          user_id: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_notified?: boolean
          product_id: string
          user_id: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_notified?: boolean
          product_id?: string
          user_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_notifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_notifications_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      support_conversations: {
        Row: {
          assigned_to: string | null
          created_at: string
          id: string
          is_ai: boolean
          status: string
          subject: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          is_ai?: boolean
          status?: string
          subject?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          is_ai?: boolean
          status?: string
          subject?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string | null
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_type?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_promo_claims: {
        Row: {
          claimed_at: string
          dismissed: boolean
          id: string
          is_used: boolean
          promo_id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          claimed_at?: string
          dismissed?: boolean
          id?: string
          is_used?: boolean
          promo_id: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          claimed_at?: string
          dismissed?: boolean
          id?: string
          is_used?: boolean
          promo_id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_promo_claims_promo_id_fkey"
            columns: ["promo_id"]
            isOneToOne: false
            referencedRelation: "user_promos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_promos: {
        Row: {
          condition_type: string
          condition_value: Json | null
          coupon_code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_discount_amount: number | null
          min_order_amount: number | null
          popup_bg_color: string | null
          popup_image_url: string | null
          popup_message: string | null
          popup_text_color: string | null
          popup_title: string | null
          starts_at: string | null
          target_user_ids: string[] | null
          title: string
          usage_limit: number | null
          used_count: number | null
        }
        Insert: {
          condition_type?: string
          condition_value?: Json | null
          coupon_code: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          min_order_amount?: number | null
          popup_bg_color?: string | null
          popup_image_url?: string | null
          popup_message?: string | null
          popup_text_color?: string | null
          popup_title?: string | null
          starts_at?: string | null
          target_user_ids?: string[] | null
          title: string
          usage_limit?: number | null
          used_count?: number | null
        }
        Update: {
          condition_type?: string
          condition_value?: Json | null
          coupon_code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          min_order_amount?: number | null
          popup_bg_color?: string | null
          popup_image_url?: string | null
          popup_message?: string | null
          popup_text_color?: string | null
          popup_title?: string | null
          starts_at?: string | null
          target_user_ids?: string[] | null
          title?: string
          usage_limit?: number | null
          used_count?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string | null
          images: string[] | null
          is_approved: boolean | null
          product_id: string | null
          rating: number | null
          title: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          images?: string[] | null
          is_approved?: boolean | null
          product_id?: string | null
          rating?: number | null
          title?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          images?: string[] | null
          is_approved?: boolean | null
          product_id?: string | null
          rating?: number | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_product_requests: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string | null
          product_name: string | null
          reference_url: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          product_name?: string | null
          reference_url?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          product_name?: string | null
          reference_url?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
