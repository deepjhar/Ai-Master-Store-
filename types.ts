export interface UserProfile {
  id: string;
  email: string;
  is_admin: boolean;
  full_name?: string;
  avatar_url?: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  file_url: string;
  created_at: string;
}

export interface Banner {
  id: string;
  image_url: string;
  title: string;
  active: boolean;
}

export interface Order {
  id: string;
  user_id: string;
  product_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  razorpay_payment_id?: string;
  created_at: string;
  product?: Product; // For join queries
}

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
}

// Supabase Database Types Helper
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: UserProfile
        Insert: UserProfile
        Update: Partial<UserProfile>
        Relationships: []
      }
      products: {
        Row: Product
        Insert: Omit<Product, 'id' | 'created_at'>
        Update: Partial<Product>
        Relationships: []
      }
      orders: {
        Row: Omit<Order, 'product'>
        Insert: Omit<Order, 'id' | 'created_at' | 'product'>
        Update: Partial<Omit<Order, 'product'>>
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      banners: {
        Row: Banner
        Insert: Omit<Banner, 'id'>
        Update: Partial<Banner>
        Relationships: []
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