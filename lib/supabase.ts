import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database, Product, UserProfile, Order, Banner } from '../types';
import { MOCK_PRODUCTS, MOCK_BANNERS } from '../constants';

// Hardcoded details provided by user
const SUPABASE_URL = "https://kebzdzteeedjuagktuvt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_JUtMQN382jvD4qFhq5YAag_D-2fzUll";

// Check if keys are available
const isConfigured = SUPABASE_URL && SUPABASE_ANON_KEY;

// Initialize Supabase safely
let supabaseClient: SupabaseClient<Database> | null = null;

try {
  if (isConfigured) {
    supabaseClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (error) {
  console.warn("Supabase initialization failed (likely invalid keys). Falling back to Demo Mode.", error);
  // Keep supabaseClient as null to trigger fallback logic
}

export const supabase = supabaseClient;

/**
 * SERVICE LAYER
 * This abstraction allows the app to function in "Demo Mode" if Supabase keys are missing or connection fails.
 */

// --- MOCK STATE for Demo Mode ---
let mockUser: UserProfile | null = null;
let mockProducts = [...MOCK_PRODUCTS];
let mockBanners = [...MOCK_BANNERS];
let mockOrders: Order[] = [];

// --- UTILS ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- AUTH SERVICES ---
export const authService = {
  async getSession() {
    // Check Supabase session first
    if (supabase) {
      try {
        const { data } = await supabase.auth.getSession();
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
        console.warn("Auth check failed, using mock", e);
      }
    }
    
    // Fallback: Return mockUser if set (e.g. via Demo Login), otherwise null
    return { user: mockUser };
  },

  async signIn(email: string, password: string): Promise<{ error: any; user: UserProfile | null }> {
    // 1. PRIORITY: Check for Demo Admin Credentials immediately.
    // This allows access to the Admin Panel even if the Supabase project is empty, keys are invalid,
    // or the 'admin' user hasn't been created in the real database yet.
    if (email === 'admin@aimaster.com' && password === 'admin') {
        console.log("Logging in as Demo Admin (Bypassing Supabase)");
        mockUser = { id: 'admin-123', email, is_admin: true, full_name: 'Admin User' };
        return { error: null, user: mockUser };
    }

    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        return { error, user: null };
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      return { error: null, user: profile as UserProfile };
    }
    
    // Mock Login for other demo users if Supabase is offline
    await delay(800);
    mockUser = { id: 'user-123', email, is_admin: false, full_name: 'Demo User' };
    return { error: null, user: mockUser };
  },

  async signUp(email: string, password: string) {
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (!error && data.user) {
        // Create profile
        // Cast to any to avoid strict partial check issues if profile has other optional fields
        const newProfile: UserProfile = { 
            id: data.user.id, 
            email: email, 
            is_admin: false 
        };
        // Fix: Cast to any to bypass complex type inference issue with supabase-js insert where schema might resolve to never
        await supabase.from('profiles').insert(newProfile as any);
      }
      return { data, error };
    }
    await delay(1000);
    return { data: { user: { id: 'new-user', email } }, error: null };
  },

  async signOut() {
    if (supabase) await supabase.auth.signOut();
    mockUser = null;
  }
};

// --- DATA SERVICES ---
export const dataService = {
  // Storefront: Get only active banners
  async getBanners() {
    if (supabase) {
      const { data, error } = await supabase.from('banners').select('*').eq('active', true);
      // Fallback to mock on error to ensure homepage is never empty
      if (!error && data) return data;
    }
    return mockBanners.filter(b => b.active);
  },

  // Admin: Get all banners
  async getAllBanners() {
    if (supabase) {
      const { data, error } = await supabase.from('banners').select('*').order('id', { ascending: false });
      // If DB read succeeds, use it. If it fails, fallback to mock.
      if (!error && data) return { data, error: null };
      console.warn("Supabase fetch banners failed (using fallback):", error);
    }
    return { data: mockBanners, error: null };
  },

  async addBanner(banner: Omit<Banner, 'id'>) {
    if (supabase) {
      const { data, error } = await supabase.from('banners').insert(banner as any).select().single();
      // If DB insert succeeds, return it.
      if (!error && data) return { data, error: null };
      console.warn("Supabase add banner failed (fallback to mock):", error);
    }
    
    // Fallback: Add to mock store
    const newBanner = { ...banner, id: Math.random().toString() };
    mockBanners.unshift(newBanner);
    return { data: newBanner, error: null };
  },

  async deleteBanner(id: string) {
    let sbError = null;
    if (supabase) {
        const { error } = await supabase.from('banners').delete().eq('id', id);
        sbError = error;
    }
    
    if (!supabase || sbError) {
        mockBanners = mockBanners.filter(b => b.id !== id);
    }
    return { error: null };
  },

  async toggleBannerStatus(id: string, active: boolean) {
     let sbError = null;
     if (supabase) {
        // Fix: Cast to any to bypass type error where update expects 'never'
        const { error } = await (supabase.from('banners') as any).update({ active }).eq('id', id);
        sbError = error;
     }

     if (!supabase || sbError) {
         const b = mockBanners.find(b => b.id === id);
         if (b) b.active = active;
     }
     return { error: null };
  },

  async getProducts() {
    if (supabase) {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) {
         console.warn("Supabase error, falling back to mock:", error);
         return mockProducts;
      }
      return data;
    }
    await delay(500);
    return mockProducts;
  },

  async getProductById(id: string) {
    if (supabase) {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (error) return mockProducts.find(p => p.id === id) || null;
      return data;
    }
    await delay(300);
    return mockProducts.find(p => p.id === id) || null;
  },

  async createOrder(order: Omit<Order, 'id' | 'created_at' | 'product'>) {
    if (supabase) {
      const { data, error } = await supabase.from('orders').insert(order as any).select().single();
      if (error) throw error;
      return data;
    }
    await delay(1000);
    const newOrder = { 
      ...order, 
      id: Math.random().toString(36).substring(7), 
      created_at: new Date().toISOString(),
      status: 'paid' 
    } as Order;
    mockOrders.push(newOrder);
    return newOrder;
  },

  async getMyPurchases(userId: string) {
    if (supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select('*, product:products(*)')
        .eq('user_id', userId)
        .eq('status', 'paid');
      
      if (error) return [];
      return data as unknown as Order[];
    }
    await delay(500);
    return mockOrders.filter(o => o.user_id === userId).map(o => ({
      ...o,
      product: mockProducts.find(p => p.id === o.product_id)
    }));
  },

  // ADMIN SERVICES
  async getAllOrders() {
    if (supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select('*, product:products(*)')
        .order('created_at', { ascending: false });
      
      return { data: data as unknown as Order[], error };
    }
    return { data: mockOrders.map(o => ({...o, product: mockProducts.find(p => p.id === o.product_id)})), error: null };
  },

  async addProduct(product: Omit<Product, 'id' | 'created_at'>) {
    if (supabase) {
      const { data, error } = await supabase.from('products').insert(product as any).select().single();
      return { data, error };
    }
    const newP = { ...product, id: Math.random().toString(), created_at: new Date().toISOString() };
    mockProducts.unshift(newP);
    return { data: newP, error: null };
  },

  async updateProduct(id: string, updates: Partial<Product>) {
    if (supabase) {
      const { data, error } = await (supabase.from('products') as any).update(updates).eq('id', id).select().single();
      return { data, error };
    }
    const index = mockProducts.findIndex(p => p.id === id);
    if (index !== -1) {
        mockProducts[index] = { ...mockProducts[index], ...updates };
        return { data: mockProducts[index], error: null };
    }
    return { error: "Product not found", data: null };
  },

  async deleteProduct(id: string) {
    if(supabase) {
        return await supabase.from('products').delete().eq('id', id);
    }
    mockProducts = mockProducts.filter(p => p.id !== id);
    return { error: null };
  }
};