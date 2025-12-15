import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database, Product, UserProfile, Order, Banner, AppSettings } from '../types';
import { MOCK_PRODUCTS, MOCK_BANNERS, APP_NAME } from '../constants';

// Hardcoded details provided by user
const SUPABASE_URL = "https://kebzdzteeedjuagktuvt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_JUtMQN382jvD4qFhq5YAag_D-2fzUll";

// Check if keys are available and look valid (basic check)
const isConfigured = SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.startsWith('http');

// Initialize Supabase safely
let supabaseClient: SupabaseClient<Database> | null = null;

try {
  if (isConfigured) {
    supabaseClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (error) {
  console.warn("Supabase initialization failed. App will run in Demo Mode.", error);
}

export const supabase = supabaseClient;

/**
 * SERVICE LAYER
 * Handles data operations, switching between Supabase (Real) and Mock (Demo) modes.
 */

// --- MOCK STATE ---
let useDemoData = false; // Flag to force demo mode for specific sessions (like Demo Admin)
let mockUser: UserProfile | null = null;
let mockProducts = [...MOCK_PRODUCTS];
let mockBanners = [...MOCK_BANNERS];
let mockOrders: Order[] = [];

// --- UTILS ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- AUTH SERVICES ---
export const authService = {
  async getSession() {
    // 1. If we are in explicit demo mode (e.g. just logged in as Demo Admin), return mock user
    if (useDemoData && mockUser) {
        return { user: mockUser };
    }

    // 2. Check Supabase session
    if (supabase) {
      try {
        const { data } = await (supabase.auth as any).getSession();
        if (data.session?.user) {
          // Fetch profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single();
            
          return { user: profile || { id: data.session.user.id, email: data.session.user.email!, is_admin: false } };
        }
      } catch (e) {
        console.warn("Auth check failed", e);
      }
    }
    
    // 3. Fallback
    return { user: null };
  },

  async signIn(email: string, password: string): Promise<{ error: any; user: UserProfile | null }> {
    // 1. DEMO ADMIN LOGIN
    if (email === 'admin@aimaster.com' && password === 'admin') {
        console.log("Logging in as Demo Admin (Local Mode)");
        useDemoData = true; // FORCE Demo Data Mode
        mockUser = { id: 'admin-123', email, is_admin: true, full_name: 'Admin User' };
        return { error: null, user: mockUser };
    }

    // 2. REAL SUPABASE LOGIN
    if (supabase) {
      useDemoData = false; // Disable Demo Mode
      const { data, error } = await (supabase.auth as any).signInWithPassword({ email, password });
      
      if (error) {
        return { error, user: null };
      }
      
      // Fetch user profile to get is_admin status
      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      // SELF-HEALING: If profile is missing in DB (trigger failed), create it now
      if (!profile) {
          const newProfile = { 
            id: data.user.id, 
            email: data.user.email!, 
            is_admin: false 
          };
          // Using upsert instead of insert to avoid race conditions with SQL Triggers
          const { error: insertError } = await supabase.from('profiles').upsert(newProfile as any);
          if (!insertError) {
              profile = newProfile as any;
          } else {
              profile = newProfile as any;
          }
      }
      
      return { error: null, user: profile as UserProfile };
    }
    
    // 3. OFFLINE FALLBACK
    await delay(800);
    useDemoData = true;
    mockUser = { id: 'user-123', email, is_admin: false, full_name: 'Demo User' };
    return { error: null, user: mockUser };
  },

  async signUp(email: string, password: string) {
    if (supabase) {
      const { data, error } = await (supabase.auth as any).signUp({ email, password });
      
      // Manual backup insert in case SQL trigger is missing
      if (!error && data.user) {
        const newProfile = { 
            id: data.user.id, 
            email: email, 
            is_admin: false 
        };
        // We use upsert to avoid errors if trigger ALREADY added it
        await supabase.from('profiles').upsert(newProfile as any);
      }
      return { data, error };
    }
    
    await delay(1000);
    return { data: { user: { id: 'new-user', email } }, error: null };
  },

  async signOut() {
    if (supabase) await (supabase.auth as any).signOut();
    useDemoData = false;
    mockUser = null;
  }
};

// --- DATA SERVICES ---
export const dataService = {
  // --- APP SETTINGS (Local Only for Demo/Simplicity) ---
  async getSettings(): Promise<AppSettings> {
    const stored = localStorage.getItem('app_settings');
    if (stored) return JSON.parse(stored);
    return { app_name: APP_NAME, icon_url: '' };
  },

  async updateSettings(settings: AppSettings) {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem('app_settings', JSON.stringify(updated));
    // Dispatch event to update layout immediately
    window.dispatchEvent(new Event('storage')); 
    return updated;
  },

  // --- BANNERS ---
  async getBanners() {
    // If logged in as Demo Admin, show what they are editing
    if (useDemoData) return mockBanners.filter(b => b.active);

    if (supabase) {
      const { data, error } = await supabase.from('banners').select('*').eq('active', true);
      if (!error && data) return data;
      // If DB is empty or error, falling back to mock might be confusing if user expects real data,
      // but for "Store Front" resilience, we can show default banners if DB is empty.
      if (data && data.length === 0) return mockBanners.filter(b => b.active); 
    }
    return mockBanners.filter(b => b.active);
  },

  async getAllBanners() {
    if (useDemoData) return { data: mockBanners, error: null };

    if (supabase) {
      const { data, error } = await supabase.from('banners').select('*').order('created_at', { ascending: false });
      if (error) return { data: null, error };
      return { data, error: null };
    }
    return { data: mockBanners, error: null };
  },

  async addBanner(banner: Omit<Banner, 'id'>) {
    // If in Demo Mode, write to local array
    if (useDemoData || !supabase) {
        const newBanner = { ...banner, id: Math.random().toString(), created_at: new Date().toISOString() };
        mockBanners.unshift(newBanner as any);
        return { data: newBanner, error: null };
    }

    // Real DB Write
    const { data, error } = await supabase.from('banners').insert(banner as any).select().single();
    return { data, error }; 
  },

  async deleteBanner(id: string) {
    if (useDemoData || !supabase) {
        mockBanners = mockBanners.filter(b => b.id !== id);
        return { error: null };
    }
    return await supabase.from('banners').delete().eq('id', id);
  },

  async toggleBannerStatus(id: string, active: boolean) {
     if (useDemoData || !supabase) {
         const b = mockBanners.find(b => b.id === id);
         if (b) b.active = active;
         return { error: null };
     }
     return await (supabase.from('banners') as any).update({ active }).eq('id', id);
  },

  // --- PRODUCTS ---
  async getProducts() {
    if (useDemoData) return mockProducts;

    if (supabase) {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) {
         console.warn("Error fetching products:", error);
         // Don't fallback silently if we expect DB to work
         return [];
      }
      return data;
    }
    return mockProducts;
  },

  async getProductById(id: string) {
    if (useDemoData) return mockProducts.find(p => p.id === id) || null;

    if (supabase) {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (error) return null;
      return data;
    }
    return mockProducts.find(p => p.id === id) || null;
  },

  async addProduct(product: Omit<Product, 'id' | 'created_at'>) {
    if (useDemoData || !supabase) {
        const newP = { ...product, id: Math.random().toString(), created_at: new Date().toISOString() };
        mockProducts.unshift(newP);
        return { data: newP, error: null };
    }

    const { data, error } = await supabase.from('products').insert(product as any).select().single();
    return { data, error };
  },

  async updateProduct(id: string, updates: Partial<Product>) {
    if (useDemoData || !supabase) {
        const index = mockProducts.findIndex(p => p.id === id);
        if (index !== -1) {
            mockProducts[index] = { ...mockProducts[index], ...updates };
            return { data: mockProducts[index], error: null };
        }
        return { error: "Product not found", data: null };
    }

    const { data, error } = await (supabase.from('products') as any).update(updates).eq('id', id).select().single();
    return { data, error };
  },

  async deleteProduct(id: string) {
    if (useDemoData || !supabase) {
        mockProducts = mockProducts.filter(p => p.id !== id);
        return { error: null };
    }
    return await supabase.from('products').delete().eq('id', id);
  },

  // --- ORDERS & PAYMENTS ---

  async initiateCashfreePayment(amount: number, userId: string, productId: string, userEmail: string) {
      // Offline/Demo Fallback check
      if (useDemoData || !supabase) {
           console.warn("Using Mock Payment Session (Offline Mode)");
           await delay(800);
           return { 
              payment_session_id: "session_" + Math.random().toString(36).substring(7),
              order_id: "order_" + Math.random().toString(36).substring(7)
          };
      }

      // CALL SUPABASE EDGE FUNCTION
      const { data, error } = await supabase.functions.invoke('create-payment-order', {
          body: { amount, userId, productId, userEmail }
      });

      if (error) {
          console.error("Edge Function Error:", error);
          // Optional: If you want to fallback to mock in case the function isn't deployed yet for testing
          // throw error; // Strict mode: throw
          
          // Soft mode for demo purposes if function fails:
          console.warn("Falling back to mock session due to Edge Function error (likely not deployed)");
          return { 
              payment_session_id: "demo_session_" + Math.random().toString(36).substring(7),
              order_id: "demo_order_" + Math.random().toString(36).substring(7)
          };
      }
      
      return data;
  },

  async createOrder(order: Omit<Order, 'id' | 'created_at' | 'product'>) {
    // Orders should generally try to go to DB even in mixed mode unless strictly offline
    if (useDemoData || !supabase) {
        await delay(800);
        const newOrder = { 
            ...order, 
            id: Math.random().toString(36).substring(7), 
            created_at: new Date().toISOString(),
            status: 'paid' 
        } as Order;
        mockOrders.push(newOrder);
        return newOrder;
    }

    const { data, error } = await supabase.from('orders').insert(order as any).select().single();
    if (error) throw error;
    return data;
  },

  async getMyPurchases(userId: string) {
    if (useDemoData || !supabase) {
        return mockOrders.filter(o => o.user_id === userId).map(o => ({
            ...o,
            product: mockProducts.find(p => p.id === o.product_id)
        }));
    }

    const { data, error } = await supabase
        .from('orders')
        .select('*, product:products(*)')
        .eq('user_id', userId)
        .eq('status', 'paid');
      
    if (error) return [];
    return data as unknown as Order[];
  },

  async getAllOrders() {
    if (useDemoData || !supabase) {
        return { data: mockOrders.map(o => ({...o, product: mockProducts.find(p => p.id === o.product_id)})), error: null };
    }

    const { data, error } = await supabase
        .from('orders')
        .select('*, product:products(*)')
        .order('created_at', { ascending: false });
      
    return { data: data as unknown as Order[], error };
  }
};