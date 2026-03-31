import * as React from 'react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  query, 
  collection, 
  where, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  ShoppingCart, 
  Users, 
  Banknote, 
  AlertCircle, 
  History, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight,
  Receipt as ReceiptIcon,
  Share2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { auth, db } from '../firebase';
import { useAuth } from './AuthProvider';
import { Sale } from '../types';
import { cn, formatCurrency, formatDate, OperationType, handleFirestoreError } from '../lib/utils';

export const Dashboard = () => {
  const { user } = useAuth();
  const [showHelp, setShowHelp] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [stats, setStats] = useState({
    todaySales: 0,
    totalOrders: 0,
    lowStock: 0,
    activeCustomers: 0
  });
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const salesQuery = user?.role === 'cashier'
      ? query(collection(db, 'sales'), where('date', '>=', today.toISOString()), where('userId', '==', user.uid))
      : query(collection(db, 'sales'), where('date', '>=', today.toISOString()));
    const productsQuery = query(collection(db, 'products'));
    const customersQuery = query(collection(db, 'customers'));
    const recentSalesQuery = user?.role === 'cashier'
      ? query(collection(db, 'sales'), where('userId', '==', user.uid), orderBy('date', 'desc'), limit(5))
      : query(collection(db, 'sales'), orderBy('date', 'desc'), limit(5));

    const unsubSales = onSnapshot(salesQuery, (snapshot) => {
      const total = snapshot.docs.reduce((acc, doc) => acc + doc.data().totalAmount, 0);
      setStats(prev => ({ ...prev, todaySales: total, totalOrders: snapshot.size }));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'sales', auth));

    const unsubRecent = onSnapshot(recentSalesQuery, (snapshot) => {
      setRecentSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'sales', auth));

    const unsubProducts = onSnapshot(productsQuery, (snapshot) => {
      const low = snapshot.docs.filter(doc => doc.data().quantity <= doc.data().lowStockThreshold).length;
      setStats(prev => ({ ...prev, lowStock: low }));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'products', auth));

    const unsubCustomers = onSnapshot(customersQuery, (snapshot) => {
      setStats(prev => ({ ...prev, activeCustomers: snapshot.size }));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'customers', auth));

    const topProductsQuery = user?.role === 'cashier'
      ? query(collection(db, 'sales_items'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(100))
      : query(collection(db, 'sales_items'), orderBy('createdAt', 'desc'), limit(100));

    const unsubTop = onSnapshot(topProductsQuery, (snapshot) => {
      const counts: Record<string, number> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        counts[data.productName] = (counts[data.productName] || 0) + data.quantity;
      });
      const sorted = Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setTopProducts(sorted);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'sales_items', auth));

    return () => {
      unsubSales();
      unsubRecent();
      unsubProducts();
      unsubCustomers();
      unsubTop();
    };
  }, [user]);

  const statCards = [
    { name: 'Today\'s Sales', value: formatCurrency(stats.todaySales), icon: Banknote, color: 'text-green-500', bg: 'bg-green-500/10' },
    { name: 'Total Orders', value: stats.totalOrders, icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    ...(user?.role !== 'cashier' ? [
      { name: 'Low Stock Items', value: stats.lowStock, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
      { name: 'Active Customers', value: stats.activeCustomers, icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    ] : [])
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Welcome back, {user?.name?.split(' ')[0]}</h2>
          <p className="text-sm text-muted-fg">Real-time operational overview</p>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <button onClick={() => setShowShare(true)} className="flex-1 sm:flex-none btn btn-ghost gap-2 border border-border py-2 px-3">
            <Share2 size={16} /> 
            <span className="text-xs">Share</span>
          </button>
          <button onClick={() => setShowHelp(true)} className="flex-1 sm:flex-none btn btn-ghost gap-2 border border-border py-2 px-3">
            <AlertCircle size={16} /> 
            <span className="text-xs">Help</span>
          </button>
          <div className="hidden sm:block px-4 py-2 rounded-xl bg-muted/50 border border-border/50 text-[10px] font-bold text-muted-fg uppercase tracking-widest">
            {formatDate(new Date())}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card group hover:border-accent/50 transition-all duration-300 overflow-hidden relative"
          >
            <div className={cn("absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 blur-3xl opacity-20 transition-all group-hover:opacity-40", stat.bg || "bg-primary/10")} />
            <div className="flex items-start justify-between relative z-10">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-fg">{stat.name}</p>
                <p className="text-2xl sm:text-3xl font-black tracking-tighter">{stat.value}</p>
              </div>
              <div className={cn("p-2 sm:p-3 rounded-2xl border border-border/50 shadow-sm transition-transform group-hover:scale-110", stat.bg || "bg-muted", stat.color)}>
                <stat.icon size={20} className="sm:w-6 sm:h-6" />
              </div>
            </div>
            <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-muted-fg uppercase tracking-widest opacity-60">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span>Live Update</span>
            </div>
          </motion.div>
        ))}
      </div>

      {user?.role === 'cashier' && stats.totalOrders === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-12 text-center space-y-6 bg-accent/5 border-accent/20"
        >
          <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto text-accent border border-accent/20">
            <ShoppingCart size={40} />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-black tracking-tight uppercase">Ready to start selling?</h3>
            <p className="text-sm text-muted-fg">Your dashboard is currently empty because you haven't recorded any sales today. Head over to the POS terminal to process your first transaction.</p>
          </div>
          <Link to="/pos" className="btn btn-primary px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs inline-flex items-center gap-2">
            Go to POS Terminal
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      )}

      {!(user?.role === 'cashier' && stats.totalOrders === 0) && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="card border-border/40 bg-muted/5 p-0 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border/50 flex items-center justify-between bg-muted/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20">
                  <History size={20} />
                </div>
                <h3 className="text-lg font-black tracking-tight uppercase tracking-[0.1em]">Recent Activity</h3>
              </div>
              <button className="text-[10px] font-black text-accent hover:underline uppercase tracking-widest opacity-60">View All</button>
            </div>
            <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[400px] custom-scrollbar">
              {recentSales.map(sale => (
                  <div key={sale.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-bg border border-border/50 hover:border-accent/30 transition-all group gap-3 sm:gap-0">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center group-hover:scale-110 transition-transform border border-accent/20">
                        <ShoppingCart size={20} />
                      </div>
                      <div>
                        <p className="font-black text-lg tracking-tight">{formatCurrency(sale.totalAmount)}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-fg uppercase font-bold tracking-widest">{sale.paymentMethod.replace('_', ' ')}</span>
                          <span className="w-1 h-1 rounded-full bg-muted-fg/30" />
                          <span className="text-[10px] text-accent font-bold uppercase tracking-tighter">#{sale.id.slice(-6).toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-left sm:text-right flex flex-col sm:items-end">
                        <p className="text-xs font-bold text-muted-fg">{formatDate(sale.date)}</p>
                        <div className="mt-1 flex items-center sm:justify-end gap-1 text-[10px] font-black text-green-500 uppercase tracking-widest">
                          <CheckCircle2 size={10} />
                          <span>Completed</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => window.open(`/print/${sale.id}`, '_blank')}
                        className="p-2 rounded-lg bg-accent/10 text-accent hover:bg-accent hover:text-white transition-all"
                        title="View Receipt"
                      >
                        <ReceiptIcon size={16} />
                      </button>
                    </div>
                  </div>
              ))}
              {recentSales.length === 0 && (
                <div className="text-center py-20 space-y-4 opacity-40">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <ShoppingCart size={40} />
                  </div>
                  <div>
                    <p className="font-black text-sm uppercase tracking-widest">No recent transactions</p>
                    <p className="text-xs">Sales will appear here in real-time</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card border-border/40 bg-muted/5 p-0 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border/50 flex items-center justify-between bg-muted/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <TrendingUp size={20} />
                </div>
                <h3 className="text-lg font-black tracking-tight uppercase tracking-[0.1em]">Top Products</h3>
              </div>
              <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">
                Performance
              </div>
            </div>
            <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[400px] custom-scrollbar">
              {topProducts.map((p, i) => (
                <motion.div 
                  key={p.name} 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-bg border border-border/50 hover:border-primary/30 transition-all group gap-3 sm:gap-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xs font-black text-muted-fg group-hover:bg-primary group-hover:text-primary-fg transition-all border border-border/50">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-bold text-base tracking-tight group-hover:text-primary transition-colors">{p.name}</p>
                      <p className="text-[10px] text-muted-fg font-bold uppercase tracking-widest opacity-60">Best Seller</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-left sm:text-right">
                      <p className="text-lg font-black tracking-tighter text-primary">{p.count}</p>
                      <p className="text-[10px] font-bold text-muted-fg uppercase tracking-widest">Units Sold</p>
                    </div>
                    <div className="w-24 sm:w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (p.count / (topProducts[0]?.count || 1)) * 100)}%` }}
                        className="h-full bg-primary"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
              {topProducts.length === 0 && (
                <div className="text-center py-20 space-y-4 opacity-40">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <TrendingUp size={40} />
                  </div>
                  <div>
                    <p className="font-black text-sm uppercase tracking-widest">No data available</p>
                    <p className="text-xs">Complete sales to see top products</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showShare && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowShare(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="card max-w-sm w-full relative z-10 space-y-8 text-center"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black tracking-tight uppercase">Share Application</h3>
                <button onClick={() => setShowShare(false)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="bg-white p-8 rounded-3xl inline-block mx-auto shadow-inner border border-border/50">
                <QRCodeSVG 
                  value={window.location.origin} 
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="font-black text-lg tracking-tight">Access on Mobile</p>
                  <p className="text-xs text-muted-fg leading-relaxed">Scan this code to open the POS on your phone or tablet.</p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left">
                  <div className="flex gap-3">
                    <AlertCircle className="text-amber-500 shrink-0" size={18} />
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Important Note</p>
                      <p className="text-[10px] font-bold text-amber-700 leading-normal">
                        To access this app from another device, you must use the <span className="underline">Shared App URL</span> from the AI Studio interface. The development URL is private and will show a 403 error.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={() => setShowShare(false)} className="btn btn-primary w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs">
                Got it
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHelp && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHelp(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card max-w-lg w-full relative z-10 space-y-6">
              <h3 className="text-2xl font-bold">Nexus POS Guide</h3>
              <div className="space-y-4 text-sm">
                <section>
                  <h4 className="font-bold mb-1">POS System</h4>
                  <p className="text-muted-fg">Use the POS tab to process sales. Search for products, add them to the cart, and select a payment method.</p>
                </section>
                <section>
                  <h4 className="font-bold mb-1">Inventory</h4>
                  <p className="text-muted-fg">Admins and Managers can add products and track stock levels. Low stock alerts will appear on the dashboard.</p>
                </section>
                <section>
                  <h4 className="font-bold mb-1">Customers</h4>
                  <p className="text-muted-fg">Register customers to track their purchase history and award loyalty points.</p>
                </section>
                <section>
                  <h4 className="font-bold mb-1">Reports</h4>
                  <p className="text-muted-fg">View detailed sales history and performance analytics in the Reports tab.</p>
                </section>
              </div>
              <button onClick={() => setShowHelp(false)} className="btn btn-primary w-full">Got it</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
