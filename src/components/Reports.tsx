import * as React from 'react';
import { useState, useEffect } from 'react';
import { 
  query, 
  collection, 
  orderBy, 
  onSnapshot, 
  limit, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { 
  TrendingUp, 
  Package, 
  AlertCircle, 
  ShoppingCart, 
  FileText 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { toast } from 'sonner';
import { auth, db } from '../firebase';
import { useAuth } from './AuthProvider';
import { Sale, Product, SaleItem } from '../types';
import { cn, formatCurrency, formatDate, handleFirestoreError, OperationType } from '../lib/utils';
import { Receipt } from './Receipt';

export const Reports = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<{ sale: Sale; items: SaleItem[] } | null>(null);

  const viewReceipt = async (sale: Sale) => {
    try {
      const itemsSnapshot = await getDocs(query(collection(db, 'sales_items'), where('saleId', '==', sale.id))).catch(e => handleFirestoreError(e, OperationType.GET, 'sales_items', auth));
      const items = itemsSnapshot ? itemsSnapshot.docs.map(d => d.data() as SaleItem) : [];
      setSelectedSale({ sale, items });
    } catch (error) {
      console.error(error);
      toast.error('Failed to load receipt');
    }
  };

  useEffect(() => {
    let salesQuery = query(collection(db, 'sales'), orderBy('date', 'desc'), limit(100));
    
    if (user?.role === 'cashier') {
      salesQuery = query(collection(db, 'sales'), where('userId', '==', auth.currentUser?.uid), orderBy('date', 'desc'), limit(100));
    }

    const productsQuery = query(collection(db, 'products'));

    const unsubSales = onSnapshot(salesQuery, (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)));
    });

    const unsubProducts = onSnapshot(productsQuery, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setLoading(false);
    });

    return () => {
      unsubSales();
      unsubProducts();
    };
  }, [user]);

  const chartData = sales.slice(0, 10).reverse().map(sale => ({
    date: new Date(sale.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    amount: sale.totalAmount
  }));

  const totalRevenue = sales.reduce((a, b) => a + b.totalAmount, 0);
  const totalStockValue = products.reduce((a, b) => a + (b.price * b.quantity), 0);
  const lowStockCount = products.filter(p => p.quantity <= p.lowStockThreshold).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics & Reports</h2>
          <p className="text-muted-fg">Comprehensive overview of your business performance</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-4 sm:p-6 bg-primary/5 border-primary/20 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -mr-8 -mt-8 blur-2xl group-hover:scale-150 transition-transform" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">Total Revenue</p>
          <h3 className="text-2xl sm:text-3xl font-black tracking-tighter">{formatCurrency(totalRevenue)}</h3>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-muted-fg uppercase tracking-widest opacity-60">
            <TrendingUp size={12} className="text-primary" />
            <span>Lifetime earnings</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-4 sm:p-6 bg-accent/5 border-accent/20 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-full -mr-8 -mt-8 blur-2xl group-hover:scale-150 transition-transform" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mb-2">Stock Value</p>
          <h3 className="text-2xl sm:text-3xl font-black tracking-tighter">{formatCurrency(totalStockValue)}</h3>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-muted-fg uppercase tracking-widest opacity-60">
            <Package size={12} className="text-accent" />
            <span>Current inventory worth</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-4 sm:p-6 bg-red-500/5 border-red-500/20 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full -mr-8 -mt-8 blur-2xl group-hover:scale-150 transition-transform" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 mb-2">Low Stock Items</p>
          <h3 className="text-2xl sm:text-3xl font-black tracking-tighter text-red-500">{lowStockCount}</h3>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-muted-fg uppercase tracking-widest opacity-60">
            <AlertCircle size={12} className="text-red-500" />
            <span>Items needing restock</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-4 sm:p-6 bg-green-500/5 border-green-500/20 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full -mr-8 -mt-8 blur-2xl group-hover:scale-150 transition-transform" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500 mb-2">Total Sales</p>
          <h3 className="text-2xl sm:text-3xl font-black tracking-tighter text-green-500">{sales.length}</h3>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-muted-fg uppercase tracking-widest opacity-60">
            <ShoppingCart size={12} className="text-green-500" />
            <span>Completed transactions</span>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <div className="card h-[400px]">
            <h3 className="text-lg font-bold mb-6">Revenue Trend (Last 10 Sales)</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="date" stroke="var(--muted-fg)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-fg)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `GHC ${v}`} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px' }}
                  itemStyle={{ color: 'var(--fg)' }}
                />
                <Line type="monotone" dataKey="amount" stroke="var(--accent)" strokeWidth={3} strokeLinecap="round" dot={{ r: 6, fill: 'var(--accent)' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold mb-6">Recent Transactions</h3>
            <div className="space-y-4">
              {sales.slice(0, 10).map(sale => (
                <div key={sale.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-muted/30 border border-border group hover:border-primary/50 transition-all gap-3 sm:gap-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-bg rounded-lg flex items-center justify-center text-accent border border-border group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <ShoppingCart size={18} />
                    </div>
                    <div>
                      <p className="font-bold">{formatCurrency(sale.totalAmount)}</p>
                      <p className="text-xs text-muted-fg">{formatDate(sale.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-left sm:text-right">
                      <p className="text-xs font-bold uppercase text-accent">{sale.paymentMethod.replace('_', ' ')}</p>
                      <p className="text-[10px] text-muted-fg">ID: {sale.id.slice(-6).toUpperCase()}</p>
                    </div>
                    <button 
                      onClick={() => viewReceipt(sale)}
                      className="btn btn-ghost btn-sm gap-2"
                    >
                      <FileText size={16} />
                      <span className="hidden sm:inline">View Receipt</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
          
        <div className="space-y-8">
          <div className="card">
            <h3 className="text-lg font-bold mb-6">Inventory Performance</h3>
            <div className="space-y-6">
              {products.slice(0, 5).map(product => (
                <div key={product.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{product.name}</span>
                    <span className="text-muted-fg">{product.quantity} left</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all duration-500",
                        product.quantity <= product.lowStockThreshold ? "bg-red-500" : "bg-primary"
                      )}
                      style={{ width: `${Math.min(100, (product.quantity / (product.lowStockThreshold * 3)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card bg-accent text-white">
            <h3 className="text-lg font-bold mb-2">Pro Tip</h3>
            <p className="text-sm opacity-90 leading-relaxed">
              Regularly export your data from the Settings page to ensure you have a local backup of your business records.
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedSale && (
          <Receipt 
            sale={selectedSale.sale} 
            items={selectedSale.items} 
            onClose={() => setSelectedSale(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};
