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
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
             {/* Background Effects */}
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-950 to-slate-950 -z-10"></div>
            
            <div className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/10">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-indigo-900 mb-2">Ai Master</h1>
                    <p className="text-slate-500">{mode === 'login' ? 'Welcome back, Creator' : 'Join the future of creativity'}</p>
                </div>
                
                {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-white" />
                    <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-white" />
                    
                    <Button className="w-full py-3 shadow-lg shadow-indigo-500/20" isLoading={isLoading}>
                        {mode === 'login' ? 'Sign In' : 'Create Account'}
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-500">
                    {mode === 'login' ? (
                        <>Don't have an account? <a onClick={() => navigate('/signup')} className="text-indigo-600 font-semibold cursor-pointer hover:underline">Sign up</a></>
                    ) : (
                        <>Already have an account? <a onClick={() => navigate('/login')} className="text-indigo-600 font-semibold cursor-pointer hover:underline">Log in</a></>
                    )}
                </div>
                {mode === 'login' && <div className="mt-4 text-center text-xs text-slate-400">Demo Admin: admin@aimaster.com / admin</div>}
            </div>
        </div>
    );
};