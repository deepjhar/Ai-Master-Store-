import React, { useEffect, useState } from 'react';
import { Product, Banner, Order, UserProfile } from '../types';
import { dataService, authService } from '../lib/supabase';
import { Button, Card, cn } from '../components/ui';
import { Download, CheckCircle, ShieldCheck, Zap, Lock } from 'lucide-react';
import { CURRENCY, RAZORPAY_KEY_ID } from '../constants';

// --- HOME PAGE ---
export const Home: React.FC<{ navigate: (p: string) => void }> = ({ navigate }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeBanner, setActiveBanner] = useState(0);

  useEffect(() => {
    dataService.getProducts().then(setProducts);
    dataService.getBanners().then(setBanners);
  }, []);

  // Auto scroll banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);

  return (
    <div className="space-y-12 pb-12">
      {/* Hero / Banners */}
      <div className="relative w-auto aspect-video m-5 rounded-2xl overflow-hidden bg-slate-900 shadow-2xl group">
        {banners.length > 0 ? (
            banners.map((banner, index) => (
                <div 
                    key={banner.id}
                    className={cn(
                        "absolute inset-0 transition-all duration-700 ease-in-out flex items-center justify-center",
                        index === activeBanner ? "opacity-100 z-10 scale-100" : "opacity-0 z-0 scale-105 pointer-events-none"
                    )}
                >
                    {/* Overlay reduced for better image visibility since text is removed */}
                    <div className="absolute inset-0 bg-black/10 z-10" />
                    <img 
                        src={banner.image_url} 
                        alt={banner.title} 
                        className="w-full h-full object-cover" 
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/1200x675?text=Image+Not+Found'; }}
                    />
                    <div className="relative z-20 text-center px-4 max-w-4xl pt-32">
                        {/* Text Removed as requested */}
                        <Button 
                            variant="primary" 
                            className="mx-auto text-lg px-8 py-3 rounded-full shadow-lg shadow-indigo-500/30 hover:scale-105 transition-transform" 
                            onClick={() => document.getElementById('products')?.scrollIntoView({behavior: 'smooth'})}
                        >
                            Explore Products
                        </Button>
                    </div>
                </div>
            ))
        ) : (
             <div className="flex items-center justify-center h-full text-white bg-slate-800">
                <div className="text-center p-6">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to Ai Master</h1>
                    <p className="text-xl text-slate-300">Premium Digital Assets for the Future</p>
                </div>
             </div>
        )}

        {/* Indicators */}
        {banners.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 z-30 flex justify-center gap-3">
                {banners.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setActiveBanner(idx)}
                        className={cn(
                            "h-2 rounded-full transition-all duration-300 shadow-sm",
                            idx === activeBanner ? "bg-white w-8" : "bg-white/40 w-2 hover:bg-white/60"
                        )}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        )}
      </div>

      {/* Products Grid */}
      <div id="products" className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-bold text-slate-900">Featured Assets</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 border-none ring-1 ring-slate-200">
              <div className="relative h-48 overflow-hidden bg-slate-100">
                <img 
                    src={product.image_url} 
                    alt={product.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Product'; }}
                />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold text-indigo-600 shadow-sm">
                   DIGITAL
                </div>
              </div>
              <div className="p-5">
                <h4 className="font-semibold text-lg text-slate-900 mb-2 line-clamp-1">{product.title}</h4>
                <p className="text-slate-500 text-sm mb-4 line-clamp-2 h-10">{product.description}</p>
                <div className="flex items-center justify-between mt-auto">
                    <span className="text-xl font-bold text-slate-900">{CURRENCY} {product.price}</span>
                    <Button variant="secondary" className="px-4 py-1.5 text-sm" onClick={() => navigate(`/product/${product.id}`)}>
                        Details
                    </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="bg-white py-12 border-y border-slate-100">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center gap-3">
                <div className="p-4 bg-indigo-50 rounded-full text-indigo-600"><Zap size={32}/></div>
                <h4 className="font-bold text-slate-900">Instant Download</h4>
                <p className="text-slate-500 text-sm">Access your files immediately after secure payment.</p>
            </div>
            <div className="flex flex-col items-center gap-3">
                <div className="p-4 bg-emerald-50 rounded-full text-emerald-600"><ShieldCheck size={32}/></div>
                <h4 className="font-bold text-slate-900">Secure Payments</h4>
                <p className="text-slate-500 text-sm">Powered by Razorpay. UPI, Card, NetBanking supported.</p>
            </div>
             <div className="flex flex-col items-center gap-3">
                <div className="p-4 bg-purple-50 rounded-full text-purple-600"><CheckCircle size={32}/></div>
                <h4 className="font-bold text-slate-900">Verified Quality</h4>
                <p className="text-slate-500 text-sm">All AI assets are tested and verified for premium quality.</p>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- PRODUCT DETAIL PAGE ---
export const ProductDetails: React.FC<{ id: string; user: UserProfile | null; navigate: (p:string) => void }> = ({ id, user, navigate }) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dataService.getProductById(id).then(setProduct);
  }, [id]);

  const handleBuyNow = async () => {
    if (!user) {
        navigate('/login');
        return;
    }
    if (!product) return;

    setLoading(true);
    
    const options = {
        key: RAZORPAY_KEY_ID,
        amount: product.price * 100, // Amount is in currency subunits
        currency: CURRENCY,
        name: "Ai Master",
        description: `Purchase ${product.title}`,
        image: "https://via.placeholder.com/150", // Logo
        handler: async function (response: any) {
            // Success Callback
            try {
                await dataService.createOrder({
                    user_id: user.id,
                    product_id: product.id,
                    amount: product.price,
                    razorpay_payment_id: response.razorpay_payment_id,
                    status: 'paid'
                });
                alert('Payment Successful! You can now download the product.');
                navigate('/purchases');
            } catch (err) {
                console.error(err);
                alert('Order recording failed. Please contact support.');
            }
        },
        prefill: {
            name: user.full_name || user.email,
            email: user.email,
        },
        theme: {
            color: "#4f46e5"
        }
    };

    const rzp1 = new (window as any).Razorpay(options);
    rzp1.open();
    rzp1.on('payment.failed', function (response: any){
        alert("Payment Failed: " + response.error.description);
        setLoading(false);
    });
  };

  if (!product) return <div className="p-12 text-center">Loading product...</div>;

  return (
    <div className="container mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
            <div className="bg-slate-100 flex items-center justify-center p-8">
                <img src={product.image_url} alt={product.title} className="rounded-lg shadow-lg max-w-full max-h-[500px] object-contain" />
            </div>
            <div className="p-8 md:p-12 flex flex-col justify-center">
                <h1 className="text-3xl font-bold text-slate-900 mb-4">{product.title}</h1>
                <div className="flex items-center gap-4 mb-6">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">Premium Asset</span>
                    <span className="text-slate-500 text-sm">Instant Delivery</span>
                </div>
                <p className="text-slate-600 leading-relaxed mb-8">{product.description}</p>
                
                <div className="border-t border-slate-100 pt-8 mt-auto">
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-slate-500">Price</span>
                        <span className="text-4xl font-bold text-slate-900">{CURRENCY} {product.price}</span>
                    </div>
                    <Button 
                        onClick={handleBuyNow} 
                        className="w-full py-4 text-lg shadow-indigo-200" 
                        isLoading={loading}
                    >
                        Buy Now
                    </Button>
                    <p className="text-xs text-center text-slate-400 mt-4 flex items-center justify-center gap-1">
                        <Lock size={12}/> Secure checkout via Razorpay
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};

// --- MY PURCHASES PAGE ---
export const MyPurchases: React.FC<{ user: UserProfile }> = ({ user }) => {
    const [orders, setOrders] = useState<Order[]>([]);
  
    useEffect(() => {
      dataService.getMyPurchases(user.id).then(setOrders);
    }, [user]);
  
    return (
      <div className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">My Purchases</h2>
          {orders.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
                  <p className="text-slate-500 mb-4">You haven't purchased anything yet.</p>
                  <Button variant="secondary" onClick={() => window.location.hash = '#'}>Browse Store</Button>
              </div>
          ) : (
              <div className="space-y-4">
                  {orders.map(order => (
                      <div key={order.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1">
                              <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                                  {order.product?.image_url && <img src={order.product.image_url} className="w-full h-full object-cover"/>}
                              </div>
                              <div>
                                  <h4 className="font-bold text-slate-900">{order.product?.title || 'Unknown Product'}</h4>
                                  <p className="text-sm text-slate-500">Purchased on {new Date(order.created_at).toLocaleDateString()}</p>
                                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">Paid • {CURRENCY}{order.amount}</span>
                              </div>
                          </div>
                          {order.product?.file_url && (
                              <a href={order.product.file_url} target="_blank" rel="noopener noreferrer" className="w-full md:w-auto">
                                <Button variant="outline" className="w-full md:w-auto">
                                    <Download size={18}/> Download Asset
                                </Button>
                              </a>
                          )}
                      </div>
                  ))}
              </div>
          )}
      </div>
    );
};