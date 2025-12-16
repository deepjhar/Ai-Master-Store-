import React, { useState, useEffect } from 'react';
import { UserProfile, AppSettings } from '../types';
import { Button, cn } from './ui';
import { ShoppingBag, User, LogOut, Menu, X, LayoutDashboard, Package, Image as ImageIcon, ShoppingCart, Search, ArrowLeft, Settings } from 'lucide-react';
import { APP_NAME } from '../constants';
import { dataService } from '../lib/supabase';

interface LayoutProps {
  children: React.ReactNode;
  user: UserProfile | null;
  onLogout: () => void;
  currentPath: string;
  navigate: (path: string) => void;
  onSearch?: (query: string) => void;
  searchTerm?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, currentPath, navigate, onSearch, searchTerm = '' }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({ app_name: APP_NAME, icon_url: '' });
  const isAdmin = user?.is_admin;
  const isAdminRoute = currentPath.startsWith('/admin');

  useEffect(() => {
      // Fetch settings on mount
      dataService.getSettings().then(setSettings);
      
      // Listen for local updates to refresh immediately
      const handleStorage = () => dataService.getSettings().then(setSettings);
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSearch) {
        onSearch(e.target.value);
        if (e.target.value && currentPath !== '/') {
            navigate('/');
        }
    }
  };

  const AppLogo = ({ dark = false }) => (
      settings.icon_url ? (
          <img src={settings.icon_url} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
      ) : (
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xl", dark ? "bg-indigo-600 text-white" : "bg-white text-indigo-900")}>
             {settings.app_name ? settings.app_name[0].toUpperCase() : 'A'}
          </div>
      )
  );

  // Sidebar for Admin (Keep Light/Clean Theme for Admin Dashboard)
  if (isAdmin && isAdminRoute) {
    return (
      <div className="flex min-h-screen bg-slate-50 text-slate-900">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col fixed h-full">
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
             <AppLogo dark />
             <h1 className="text-xl font-bold tracking-tight text-indigo-400 whitespace-nowrap overflow-hidden text-ellipsis">
                 {settings.app_name || APP_NAME} <span className="text-xs text-slate-400 block font-normal">Admin Panel</span>
             </h1>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <AdminNavLink icon={<LayoutDashboard size={20}/>} label="Dashboard" active={currentPath === '/admin'} onClick={() => navigate('/admin')} />
            <AdminNavLink icon={<Package size={20}/>} label="Products" active={currentPath === '/admin/products'} onClick={() => navigate('/admin/products')} />
            <AdminNavLink icon={<ImageIcon size={20}/>} label="Banners" active={currentPath === '/admin/banners'} onClick={() => navigate('/admin/banners')} />
            <AdminNavLink icon={<ShoppingCart size={20}/>} label="Orders" active={currentPath === '/admin/orders'} onClick={() => navigate('/admin/orders')} />
            <AdminNavLink icon={<Settings size={20}/>} label="Settings" active={currentPath === '/admin/settings'} onClick={() => navigate('/admin/settings')} />
          </nav>
          <div className="p-4 border-t border-slate-800">
             <div className="flex items-center gap-3 mb-4 px-2">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold">A</div>
                <div className="text-sm truncate">
                    <p className="font-medium">Admin</p>
                    <p className="text-slate-400 text-xs truncate">{user?.email}</p>
                </div>
             </div>
             <Button variant="danger" className="w-full text-sm" onClick={onLogout}><LogOut size={16}/> Logout</Button>
             <Button variant="ghost" className="w-full text-sm mt-2 text-slate-400" onClick={() => navigate('/')}>Back to Store</Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    );
  }

  // User Theme (Navy Blue / Dark / White Mix)
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* BACKGROUND GRADIENT */}
      <div className="fixed inset-0 -z-20 bg-slate-950"></div>
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950"></div>
      <div className="fixed top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-blue-950/20 to-transparent -z-10 pointer-events-none"></div>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          
          {/* MOBILE SEARCH MODE */}
          {onSearch && isMobileSearchOpen ? (
             <div className="flex md:hidden flex-1 items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <button onClick={() => setIsMobileSearchOpen(false)} className="text-slate-300 p-1">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1 relative">
                    <input 
                      autoFocus
                      type="text"
                      placeholder="Search..." 
                      className="w-full pl-4 pr-10 py-2 bg-slate-800 border-none rounded-full text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/50"
                      value={searchTerm}
                      onChange={handleSearch}
                    />
                    {searchTerm && (
                        <button 
                            onClick={() => { if(onSearch) onSearch(''); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
             </div>
          ) : (
            <>
              {/* Logo */}
              <div className="flex items-center gap-2 cursor-pointer flex-shrink-0" onClick={() => navigate('/')}>
                <AppLogo />
                <span className="text-xl font-bold tracking-tight text-white hidden sm:block">
                    {settings.app_name || APP_NAME}
                </span>
                {/* Mobile Text */}
                {(!settings.app_name || settings.app_name === APP_NAME) ? null : <span className="sm:hidden font-bold text-white">AI Master</span>}
              </div>

              {/* Search Bar (Desktop) */}
              {onSearch && (
                  <div className="hidden md:flex flex-1 max-w-md relative mx-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                          type="text"
                          placeholder="Search digital assets..." 
                          className="w-full pl-10 pr-4 py-2 bg-white/10 border border-transparent focus:bg-white/20 focus:border-indigo-500/50 rounded-full text-sm text-white placeholder:text-slate-400 transition-all outline-none"
                          value={searchTerm}
                          onChange={handleSearch}
                      />
                  </div>
              )}

              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-6 flex-shrink-0">
                <NavLink label="Home" active={currentPath === '/'} onClick={() => navigate('/')} />
                {user ? (
                  <>
                    <NavLink label="My Purchases" active={currentPath === '/purchases'} onClick={() => navigate('/purchases')} />
                    <div className="h-6 w-px bg-white/10"></div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-300 hidden lg:block">{user.email}</span>
                        {user.is_admin && (
                            <Button variant="secondary" className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white border-none" onClick={() => navigate('/admin')}>Admin Panel</Button>
                        )}
                        <Button variant="ghost" className="p-2 text-slate-300 hover:text-white hover:bg-white/10" onClick={() => navigate('/profile')}><User size={20}/></Button>
                        <Button variant="ghost" className="p-2 text-red-400 hover:bg-red-500/10" onClick={onLogout}><LogOut size={20}/></Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10" onClick={() => navigate('/login')}>Log In</Button>
                    <Button className="bg-white text-indigo-950 hover:bg-slate-200" onClick={() => navigate('/signup')}>Sign Up</Button>
                  </>
                )}
              </nav>

              {/* Mobile Actions */}
              <div className="flex items-center gap-1 md:hidden">
                {onSearch && (
                    <button 
                        className="p-2 text-slate-300 hover:bg-white/10 rounded-full transition-colors"
                        onClick={() => { setIsMobileSearchOpen(true); setIsMobileMenuOpen(false); }}
                    >
                        <Search size={24}/>
                    </button>
                )}
                <button 
                    className="p-2 text-slate-300 hover:bg-white/10 rounded-full" 
                    onClick={() => { setIsMobileMenuOpen(!isMobileMenuOpen); setIsMobileSearchOpen(false); }}
                >
                    {isMobileMenuOpen ? <X size={24}/> : <Menu size={24}/>}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Mobile Nav Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-white/10 p-4 space-y-4 shadow-2xl absolute w-full z-50">
             <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10" onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }}>Home</Button>
             {user ? (
               <>
                 <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10" onClick={() => { navigate('/purchases'); setIsMobileMenuOpen(false); }}>My Purchases</Button>
                 <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10" onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }}>Profile ({user.email})</Button>
                 {user.is_admin && <Button variant="secondary" className="w-full bg-indigo-600 text-white" onClick={() => { navigate('/admin'); setIsMobileMenuOpen(false); }}>Admin Panel</Button>}
                 <Button variant="danger" className="w-full" onClick={onLogout}>Logout</Button>
               </>
             ) : (
               <>
                 <Button variant="ghost" className="w-full text-slate-300 hover:text-white hover:bg-white/10" onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}>Log In</Button>
                 <Button className="w-full bg-white text-indigo-900" onClick={() => { navigate('/signup'); setIsMobileMenuOpen(false); }}>Sign Up</Button>
               </>
             )}
          </div>
        )}
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t border-white/10 py-8 mt-auto bg-slate-950">
        <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} {settings.app_name || APP_NAME}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const NavLink: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={cn(
      "text-sm font-medium transition-all duration-200",
      active ? "text-white font-semibold drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" : "text-slate-400 hover:text-white"
    )}
  >
    {label}
  </button>
);

const AdminNavLink: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full px-3 py-2 rounded-md transition-all",
        active ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
      )}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
);