import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Button, cn } from './ui';
import { ShoppingBag, User, LogOut, Menu, X, LayoutDashboard, Package, Image as ImageIcon, ShoppingCart, Search } from 'lucide-react';
import { APP_NAME } from '../constants';

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
  const isAdmin = user?.is_admin;
  const isAdminRoute = currentPath.startsWith('/admin');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSearch) {
        onSearch(e.target.value);
        if (e.target.value && currentPath !== '/') {
            navigate('/');
        }
    }
  };

  // Sidebar for Admin
  if (isAdmin && isAdminRoute) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col fixed h-full">
          <div className="p-6 border-b border-slate-800">
            <h1 className="text-2xl font-bold tracking-tight text-indigo-400">{APP_NAME} <span className="text-xs text-slate-400">Admin</span></h1>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <AdminNavLink icon={<LayoutDashboard size={20}/>} label="Dashboard" active={currentPath === '/admin'} onClick={() => navigate('/admin')} />
            <AdminNavLink icon={<Package size={20}/>} label="Products" active={currentPath === '/admin/products'} onClick={() => navigate('/admin/products')} />
            <AdminNavLink icon={<ImageIcon size={20}/>} label="Banners" active={currentPath === '/admin/banners'} onClick={() => navigate('/admin/banners')} />
            <AdminNavLink icon={<ShoppingCart size={20}/>} label="Orders" active={currentPath === '/admin/orders'} onClick={() => navigate('/admin/orders')} />
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

  // Navbar for Users
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white sticky top-0 z-40 border-b border-slate-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 cursor-pointer flex-shrink-0" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">A</div>
            <span className="text-xl font-bold tracking-tight text-slate-900 hidden sm:block">{APP_NAME}</span>
          </div>

          {/* Search Bar (Desktop) */}
          {onSearch && (
              <div className="hidden md:flex flex-1 max-w-md relative mx-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                      type="text"
                      placeholder="Search digital assets..." 
                      className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-transparent focus:bg-white focus:border-indigo-500 rounded-full text-sm transition-all outline-none"
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
                <div className="h-6 w-px bg-slate-200"></div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-600 hidden lg:block">{user.email}</span>
                    {user.is_admin && (
                        <Button variant="secondary" className="px-3 py-1 text-xs" onClick={() => navigate('/admin')}>Admin Panel</Button>
                    )}
                    <Button variant="ghost" className="p-2" onClick={() => navigate('/profile')}><User size={20}/></Button>
                    <Button variant="ghost" className="p-2 text-red-500 hover:bg-red-50" onClick={onLogout}><LogOut size={20}/></Button>
                </div>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/login')}>Log In</Button>
                <Button onClick={() => navigate('/signup')}>Sign Up</Button>
              </>
            )}
          </nav>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden p-2 text-slate-600" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24}/> : <Menu size={24}/>}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-4 shadow-lg absolute w-full z-50">
             {onSearch && (
                 <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                          type="text"
                          placeholder="Search..." 
                          className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-lg text-sm outline-none border border-transparent focus:border-indigo-500"
                          value={searchTerm}
                          onChange={handleSearch}
                      />
                 </div>
             )}
             <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }}>Home</Button>
             {user ? (
               <>
                 <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate('/purchases'); setIsMobileMenuOpen(false); }}>My Purchases</Button>
                 <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }}>Profile ({user.email})</Button>
                 {user.is_admin && <Button variant="secondary" className="w-full" onClick={() => { navigate('/admin'); setIsMobileMenuOpen(false); }}>Admin Panel</Button>}
                 <Button variant="danger" className="w-full" onClick={onLogout}>Logout</Button>
               </>
             ) : (
               <>
                 <Button variant="ghost" className="w-full" onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}>Log In</Button>
                 <Button className="w-full" onClick={() => { navigate('/signup'); setIsMobileMenuOpen(false); }}>Sign Up</Button>
               </>
             )}
          </div>
        )}
      </header>

      <main className="flex-1 bg-gray-50">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const NavLink: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={cn(
      "text-sm font-medium transition-colors hover:text-indigo-600",
      active ? "text-indigo-600 font-semibold" : "text-slate-600"
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