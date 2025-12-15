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

    useEffect(() => { loadProducts(); }, []);

    const loadProducts = () => dataService.getProducts().then(setProducts);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!formData.title || !formData.price) return;
        
        // In a real app, upload image/file here first via Supabase Storage
        await dataService.addProduct({
            title: formData.title,
            description: formData.description || '',
            price: Number(formData.price),
            image_url: formData.image_url || 'https://picsum.photos/800/600',
            file_url: formData.file_url || 'https://example.com',
        });
        setIsModalOpen(false);
        setFormData({});
        loadProducts();
    };

    const handleDelete = async (id: string) => {
        if(window.confirm('Delete this product?')) {
            await dataService.deleteProduct(id);
            loadProducts();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Products</h2>
                <Button onClick={() => setIsModalOpen(true)}><Plus size={18}/> Add Product</Button>
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
                            <tr key={p.id} className="hover:bg-slate-50">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <img src={p.image_url} className="w-10 h-10 rounded object-cover bg-slate-200" />
                                        <span className="font-medium text-slate-900">{p.title}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-slate-600">{CURRENCY} {p.price}</td>
                                <td className="p-4">
                                    <div className="flex gap-2">
                                        <button className="text-blue-600 hover:text-blue-800 p-1"><Edit size={16}/></button>
                                        <button className="text-red-500 hover:text-red-700 p-1" onClick={() => handleDelete(p.id)}><Trash2 size={16}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Product">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Title" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} required />
                    <Input label="Price" type="number" value={formData.price || ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} required />
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Description</label>
                        <textarea className="w-full p-2 border rounded-lg" rows={3} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                    </div>
                    <Input label="Image URL (Demo)" value={formData.image_url || ''} onChange={e => setFormData({...formData, image_url: e.target.value})} placeholder="https://..." />
                    <Input label="File Download URL (Demo)" value={formData.file_url || ''} onChange={e => setFormData({...formData, file_url: e.target.value})} placeholder="https://..." />
                    <Button type="submit" className="w-full">Create Product</Button>
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
    // Placeholder for banner management similar to products
    return (
        <div className="p-8 text-center border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
            <h3 className="text-lg font-medium text-slate-500">Banner Management Module</h3>
            <p className="text-sm text-slate-400 mt-2">Allows uploading and activating carousel images.</p>
        </div>
    )
}
