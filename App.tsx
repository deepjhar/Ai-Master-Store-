import React, { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { Home, ProductDetails, MyPurchases } from './pages/Store';
import { AdminDashboard, AdminProducts, AdminOrders, AdminBanners, AdminSettings } from './pages/Admin';
import { authService } from './lib/supabase';
import { UserProfile } from './types';
import { Input, Button, Card } from './components/ui';

// Simple Router Hook
const useRoute = () => {
  const [route, setRoute] = useState(window.location.hash.slice(1) || '/');
  useEffect(() => {
    const handler = () => setRoute(window.location.hash.slice(1) || '/');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  const navigate = (path: string) => window.location.hash = path;
  return { route, navigate };
};

export default function App() {
  const { route, navigate } = useRoute();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Initial Session Check
  useEffect(() => {
    authService.getSession().then(({ user }) => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  const handleLogout = async () => {
    await authService.signOut();
    setUser(null);
    navigate('/');
  };

  // --- Auth Pages (Inline for simplicity) ---
  if (route === '/login' || route === '/signup') {
    return (
        <AuthPage 
            mode={route === '/login' ? 'login' : 'signup'} 
            onSuccess={(u) => { setUser(u); navigate(u.is_admin ? '/admin' : '/'); }}
            navigate={navigate}
        />
    );
  }

  // Loading State
  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-950 text-indigo-400">Loading App...</div>;

  // --- Router Switch ---
  let content;
  
  // Admin Routes
  if (route.startsWith('/admin')) {
      if (!user?.is_admin) {
          // Redirect if not admin
          setTimeout(() => navigate('/'), 0);
          return null;
      }
      
      switch (route) {
          case '/admin': content = <AdminDashboard navigate={navigate} />; break;
          case '/admin/products': content = <AdminProducts navigate={navigate} />; break;
          case '/admin/orders': content = <AdminOrders navigate={navigate} />; break;
          case '/admin/banners': content = <AdminBanners navigate={navigate} />; break;
          case '/admin/settings': content = <AdminSettings navigate={navigate} />; break;
          default: content = <AdminDashboard navigate={navigate} />;
      }
  } 
  // User Routes
  else if (route.startsWith('/product/')) {
    const id = route.split('/')[2];
    content = <ProductDetails id={id} user={user} navigate={navigate} />;
  } else {
    switch (route) {
        case '/': content = <Home navigate={navigate} searchQuery={searchQuery} />; break;
        case '/purchases': 
            if(!user) { setTimeout(()=>navigate('/login'),0); return null; }
            content = <MyPurchases user={user} />; 
            break;
        case '/profile':
             // Simple profile placeholder
             content = (
                <div className="container mx-auto px-4 py-12">
                    <Card className="max-w-md mx-auto p-8 text-center border-none ring-1 ring-white/10 shadow-2xl">
                        <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                            {user?.email[0].toUpperCase()}
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">{user?.email}</h2>
                        <p className="text-slate-500 mb-6">{user?.is_admin ? 'Administrator' : 'Customer'}</p>
                        <Button variant="outline" className="w-full mb-2">Change Password</Button>
                        <Button variant="danger" className="w-full" onClick={handleLogout}>Logout</Button>
                    </Card>
                </div>
             );
             break;
        default: content = <Home navigate={navigate} searchQuery={searchQuery} />;
    }
  }

  return (
    <Layout 
        user={user} 
        onLogout={handleLogout} 
        currentPath={route} 
        navigate={navigate}
        onSearch={setSearchQuery}
        searchTerm={searchQuery}
    >
      {content}
    </Layout>
  );
}

// Auth Component
const AuthPage: React.FC<{ mode: 'login' | 'signup', onSuccess: (u: UserProfile) => void, navigate: (p:string)=>void }> = ({ mode, onSuccess, navigate }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (mode === 'login') {
                const { user, error } = await authService.signIn(email, password);
                if (error) throw error;
                if (user) onSuccess(user);
            } else {
                const { data, error } = await authService.signUp(email, password);
                if (error) throw error;
                // Auto login after signup in this mock, or ask to check email
                if (data.user) onSuccess({ id: data.user.id, email: data.user.email!, is_admin: false });
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden isolate">
             {/* Enhanced Background */}
             <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950 -z-20"></div>
             <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] -z-10 animate-pulse"></div>
             <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] -z-10 animate-pulse" style={{ animationDelay: '2s'}}></div>
            
            <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border border-white/10 ring-1 ring-black/5 animate-fade-in-up">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 mb-4 border border-indigo-500/30">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Ai Master</h1>
                    <p className="text-slate-400 text-sm">{mode === 'login' ? 'Welcome back! Please enter your details.' : 'Create an account to start your journey.'}</p>
                </div>
                
                {error && (
                    <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-sm mb-6 border border-red-500/20 flex items-center gap-2">
                         <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-300 ml-1">Email</label>
                        <Input 
                            type="email" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            required 
                            className="bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/20"
                            placeholder="name@example.com"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
                        <Input 
                            type="password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            required 
                            className="bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/20"
                            placeholder="••••••••"
                        />
                    </div>
                    
                    <Button className="w-full py-3 shadow-lg shadow-indigo-500/20 text-base font-semibold mt-2" isLoading={isLoading}>
                        {mode === 'login' ? 'Sign In' : 'Create Account'}
                    </Button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-500">
                    {mode === 'login' ? (
                        <>Don't have an account? <button onClick={() => navigate('/signup')} className="text-indigo-400 font-semibold cursor-pointer hover:text-indigo-300 transition-colors ml-1">Sign up</button></>
                    ) : (
                        <>Already have an account? <button onClick={() => navigate('/login')} className="text-indigo-400 font-semibold cursor-pointer hover:text-indigo-300 transition-colors ml-1">Log in</button></>
                    )}
                </div>
            </div>
        </div>
    );
};