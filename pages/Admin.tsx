import React, { useEffect, useState } from 'react';
import { Product, Banner, Order } from '../types';
import { dataService } from '../lib/supabase';
import { Button, Input, Card, Modal, cn } from '../components/ui';
import { Edit, Trash2, Plus, Image as ImageIcon, DollarSign, Package } from 'lucide-react';
import { CURRENCY } from '../constants';

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0 });

    useEffect(() => {
        // Simple aggregate for dashboard
        Promise.all([
            dataService.getAllOrders(),
            dataService.getProducts()
        ]).then(([{ data: orders }, products]) => {
            const revenue = orders?.reduce((acc, o) => acc + (o.status === 'paid' ? o.amount : 0), 0) || 0;
            setStats({
                revenue,
                orders: orders?.length || 0,
                products: products?.length || 0
            });
        });
    }, []);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 flex items-center gap-4 border-l-4 border-l-indigo-500">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full"><DollarSign size={24}/></div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Total Revenue</p>
                        <h3 className="text-2xl font-bold text-slate-900">{CURRENCY} {stats.revenue.toLocaleString()}</h3>
                    </div>
                </Card>
                <Card className="p-6 flex items-center gap-4 border-l-4 border-l-emerald-500">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full"><Package size={24}/></div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Total Orders</p>
                        <h3 className="text-2xl font-bold text-slate-900">{stats.orders}</h3>
                    </div>
                </Card>
                <Card className="p-6 flex items-center gap-4 border-l-4 border-l-blue-500">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-full"><ImageIcon size={24}/></div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Active Products</p>
                        <h3 className="text-2xl font-bold text-slate-900">{stats.products}</h3>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export const AdminProducts: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Product>>({});
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => { loadProducts(); }, []);

    const loadProducts = () => dataService.getProducts().then(setProducts);

    const openAddModal = () => {
        setFormData({});
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const openEditModal = (product: Product) => {
        setFormData({ ...product });
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!formData.title || !formData.price) return;
        
        const payload = {
            title: formData.title,
            description: formData.description || '',
            price: Number(formData.price),
            image_url: formData.image_url || 'https://picsum.photos/800/600',
            file_url: formData.file_url || 'https://example.com',
        };

        if (isEditing && formData.id) {
            // Update existing
            await dataService.updateProduct(formData.id, payload);
        } else {
            // Create new
            await dataService.addProduct(payload);
        }

        setIsModalOpen(false);
        setFormData({});
        loadProducts();
    };

    const handleDelete = async (id: string) => {
        if(window.confirm('Are you sure you want to delete this product? This cannot be undone.')) {
            await dataService.deleteProduct(id);
            loadProducts();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Products Management</h2>
                <Button onClick={openAddModal}><Plus size={18}/> Add Product</Button>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-slate-600">Product</th>
                            <th className="p-4 text-sm font-semibold text-slate-600">Price</th>
                            <th className="p-4 text-sm font-semibold text-slate-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {products.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <img src={p.image_url} alt={p.title} className="w-12 h-12 rounded-lg object-cover bg-slate-200 border border-slate-100" />
                                        <div>
                                            <span className="font-bold text-slate-900 block">{p.title}</span>
                                            <span className="text-xs text-slate-400 max-w-xs truncate block">{p.description}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 font-medium text-slate-700">{CURRENCY} {p.price}</td>
                                <td className="p-4">
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => openEditModal(p)}
                                            className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors" 
                                            title="Edit Product"
                                        >
                                            <Edit size={18}/>
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(p.id)}
                                            className="text-slate-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors" 
                                            title="Delete Product"
                                        >
                                            <Trash2 size={18}/>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                         {products.length === 0 && (
                            <tr>
                                <td colSpan={3} className="p-8 text-center text-slate-500">No products found. Start by adding one.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Edit Product" : "Add New Product"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Title" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Product Name" required />
                    <Input label="Price" type="number" value={formData.price || ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} placeholder="0.00" required />
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Description</label>
                        <textarea 
                            className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm" 
                            rows={4} 
                            value={formData.description || ''} 
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            placeholder="Describe your digital product..."
                        ></textarea>
                    </div>
                    <Input label="Image URL (Public Link)" value={formData.image_url || ''} onChange={e => setFormData({...formData, image_url: e.target.value})} placeholder="https://..." />
                    <Input label="File Download URL (Secure Link)" value={formData.file_url || ''} onChange={e => setFormData({...formData, file_url: e.target.value})} placeholder="https://..." />
                    
                    <div className="pt-2 flex gap-3">
                         <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                         <Button type="submit" className="flex-1">{isEditing ? "Save Changes" : "Create Product"}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export const AdminOrders: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    
    useEffect(() => {
        dataService.getAllOrders().then(({ data }) => setOrders(data || []));
    }, []);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Recent Orders</h2>
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-slate-600">Order ID</th>
                            <th className="p-4 text-sm font-semibold text-slate-600">Product</th>
                            <th className="p-4 text-sm font-semibold text-slate-600">Amount</th>
                            <th className="p-4 text-sm font-semibold text-slate-600">Status</th>
                            <th className="p-4 text-sm font-semibold text-slate-600">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {orders.map(o => (
                            <tr key={o.id} className="hover:bg-slate-50">
                                <td className="p-4 text-xs font-mono text-slate-500">#{o.id.slice(0, 8)}</td>
                                <td className="p-4 font-medium text-slate-900">{o.product?.title || 'Unknown'}</td>
                                <td className="p-4 text-slate-600">{CURRENCY} {o.amount}</td>
                                <td className="p-4">
                                    <span className={cn(
                                        "px-2 py-1 rounded-full text-xs font-medium",
                                        o.status === 'paid' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                    )}>
                                        {o.status.toUpperCase()}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-slate-500">{new Date(o.created_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export const AdminBanners: React.FC = () => {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Banner>>({ active: true });

    useEffect(() => { loadBanners(); }, []);

    const loadBanners = () => dataService.getAllBanners().then(({ data }) => setBanners(data || []));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!formData.title || !formData.image_url) return;
        
        await dataService.addBanner({
            title: formData.title,
            image_url: formData.image_url,
            active: formData.active ?? true,
        });
        setIsModalOpen(false);
        setFormData({ active: true });
        loadBanners();
    };

    const handleDelete = async (id: string) => {
        if(window.confirm('Delete this banner?')) {
            await dataService.deleteBanner(id);
            loadBanners();
        }
    };

    const handleToggle = async (banner: Banner) => {
        await dataService.toggleBannerStatus(banner.id, !banner.active);
        loadBanners();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Store Banners</h2>
                <Button onClick={() => setIsModalOpen(true)}><Plus size={18}/> Add Banner</Button>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-slate-600">Preview</th>
                            <th className="p-4 text-sm font-semibold text-slate-600">Title</th>
                            <th className="p-4 text-sm font-semibold text-slate-600">Status</th>
                            <th className="p-4 text-sm font-semibold text-slate-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {banners.map(b => (
                            <tr key={b.id} className="hover:bg-slate-50">
                                <td className="p-4">
                                    <img src={b.image_url} alt={b.title} className="h-16 w-32 object-cover rounded bg-slate-100 border border-slate-200" />
                                </td>
                                <td className="p-4 font-medium text-slate-900">{b.title}</td>
                                <td className="p-4">
                                    <button 
                                        onClick={() => handleToggle(b)}
                                        className={cn(
                                            "px-3 py-1 rounded-full text-xs font-bold transition-colors border",
                                            b.active 
                                                ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200" 
                                                : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                                        )}
                                    >
                                        {b.active ? 'ACTIVE' : 'INACTIVE'}
                                    </button>
                                </td>
                                <td className="p-4">
                                    <button className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors" onClick={() => handleDelete(b.id)}>
                                        <Trash2 size={18}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {banners.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-slate-500">No banners found. Add one to feature on the homepage.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Homepage Banner">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Banner Title" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Summer Sale" required />
                    <Input label="Image URL" value={formData.image_url || ''} onChange={e => setFormData({...formData, image_url: e.target.value})} placeholder="https://..." required />
                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="active" 
                            checked={formData.active} 
                            onChange={e => setFormData({...formData, active: e.target.checked})}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="active" className="text-sm font-medium text-slate-700">Set Active Immediately</label>
                    </div>
                    <Button type="submit" className="w-full">Publish Banner</Button>
                </form>
            </Modal>
        </div>
    );
}