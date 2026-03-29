import * as React from 'react';
import { useState, useEffect, Component, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  Sun, 
  Moon,
  Menu,
  X,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  QrCode,
  CreditCard,
  Banknote,
  Smartphone,
  Download,
  Printer,
  Truck,
  Mail,
  Phone,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Loader2,
  TrendingUp,
  FileText,
  History
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { ThemeProvider, useTheme } from './components/ThemeProvider';
import { auth } from './firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { cn, formatCurrency, formatDate, OperationType, handleFirestoreError } from './lib/utils';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  increment, 
  serverTimestamp,
  getDocs,
  getDoc,
  getDocFromServer,
  where,
  orderBy,
  limit,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { Product, Sale, SaleItem, Customer, Supplier } from './types';

// --- Components ---

const Sidebar = ({ isOpen, setIsOpen, mobile }: { isOpen: boolean, setIsOpen: (open: boolean) => void, mobile?: boolean }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'cashier'] },
    { name: 'POS', path: '/pos', icon: ShoppingCart, roles: ['admin', 'manager', 'cashier'] },
    { name: 'Inventory', path: '/inventory', icon: Package, roles: ['admin', 'manager'] },
    { name: 'Suppliers', path: '/suppliers', icon: Truck, roles: ['admin', 'manager'] },
    { name: 'Customers', path: '/customers', icon: Users, roles: ['admin', 'manager', 'cashier'] },
    { name: 'Reports', path: '/reports', icon: BarChart3, roles: ['admin', 'manager'] },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['admin', 'manager', 'cashier'] },
  ];

  const filteredItems = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <>
      {/* Mobile Overlay */}
      {mobile && isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden"
        />
      )}

      <aside className={cn(
        "fixed left-0 top-0 h-full glass z-[70] transition-all duration-500 flex flex-col border-r border-border/50",
        isOpen ? "w-64 translate-x-0" : "w-20 -translate-x-full md:translate-x-0",
        mobile && !isOpen && "hidden"
      )}>
        <div className="p-6 flex items-center justify-between mb-4">
          {(isOpen || mobile) && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-fg shadow-lg shadow-primary/20">
                <ShieldCheck size={24} />
              </div>
              <h1 className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-fg to-muted-fg">
                NEXUS
              </h1>
            </motion.div>
          )}
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-fg hover:text-fg"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => mobile && setIsOpen(false)}
                className={cn(
                  "group relative flex items-center p-3.5 rounded-2xl transition-all duration-300",
                  isActive 
                    ? "bg-primary text-primary-fg shadow-xl shadow-primary/10" 
                    : "hover:bg-muted text-muted-fg hover:text-fg"
                )}
              >
                <item.icon size={22} className={cn("transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} />
                {isOpen && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="ml-4 font-bold text-sm tracking-tight"
                  >
                    {item.name}
                  </motion.span>
                )}
                {isActive && (
                  <motion.div 
                    layoutId="active-pill"
                    className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <div className={cn(
            "p-4 rounded-2xl bg-muted/30 border border-border/50 transition-all duration-300",
            !isOpen && "p-2 items-center justify-center flex"
          )}>
            {isOpen ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black border border-primary/20">
                    {user?.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black truncate tracking-tight">{user?.name || 'User'}</p>
                    <p className="text-[10px] text-muted-fg uppercase tracking-widest font-bold opacity-60">{user?.role}</p>
                  </div>
                </div>
                <button 
                  onClick={() => signOut()}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all font-bold text-xs border border-transparent hover:border-red-500/20"
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={() => signOut()}
                className="p-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                title="Sign Out"
              >
                <LogOut size={22} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

const Header = ({ onMenuClick }: { onMenuClick?: () => void }) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <header className="h-20 glass sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between transition-all duration-300 border-b border-border/50">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 hover:bg-muted rounded-xl transition-colors text-muted-fg hover:text-fg"
        >
          <Menu size={24} />
        </button>
        <div className="hidden md:block">
          <h2 className="text-sm font-black text-muted-fg uppercase tracking-[0.2em]">Nexus Terminal</h2>
          <p className="text-[10px] text-muted-fg/40 font-mono tracking-widest">v2.4.0-stable // SYSTEM_READY</p>
        </div>
        <div className="md:hidden">
          <h2 className="text-xs font-black text-muted-fg uppercase tracking-widest">Nexus</h2>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-full bg-muted/30 border border-border/50 shadow-inner">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-fg opacity-80">Online</span>
        </div>

        <div className="hidden sm:block h-8 w-px bg-border/50" />

        <button 
          onClick={toggleTheme}
          className="p-2.5 hover:bg-muted rounded-xl transition-all text-muted-fg hover:text-fg border border-transparent hover:border-border group"
        >
          {theme === 'dark' ? <Sun size={20} className="group-hover:rotate-90 transition-transform duration-500" /> : <Moon size={20} className="group-hover:-rotate-12 transition-transform duration-500" />}
        </button>
      </div>
    </header>
  );
};

const ReceiptContent = ({ sale, items }: { sale: Sale; items: SaleItem[] }) => {
  return (
    <div 
      className="bg-white text-black w-full max-w-sm p-8 rounded-none shadow-2xl relative z-10 font-mono text-sm mx-auto"
      id="receipt-content"
    >
      <div className="text-center space-y-2 border-b border-dashed border-black pb-4 mb-4">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-black">NEXUS INVOICE</h2>
        <p className="text-xs text-black">123 Innovation Drive, Tech City</p>
        <p className="text-xs text-black">Tel: +1 234 567 890</p>
        <div className="pt-2">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 text-black">Official Invoice</p>
        </div>
      </div>

      <div className="space-y-1 mb-6 text-xs text-black">
        <div className="flex justify-between">
          <span className="font-bold">Date/Time:</span> 
          <span>{formatDate(sale.date)}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Transaction ID:</span> 
          <span className="font-bold">{sale.id.toUpperCase()}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Payment Method:</span> 
          <span className="uppercase">{sale.paymentMethod.replace('_', ' ')}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Cashier:</span> 
          <span>{sale.userId.slice(-6).toUpperCase()}</span>
        </div>
      </div>

      <div className="border-b border-dashed border-black pb-2 mb-2">
        <div className="grid grid-cols-6 font-bold text-[10px] uppercase tracking-wider text-black">
          <span className="col-span-3">Item Description</span>
          <span className="text-center">Qty</span>
          <span className="col-span-2 text-right">Amount</span>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {items.map((item, i) => (
          <div key={i} className="grid grid-cols-6 text-xs leading-tight text-black">
            <div className="col-span-3">
              <p className="font-bold">{item.productName}</p>
              <p className="text-[10px] opacity-60">@{formatCurrency(item.price)}</p>
            </div>
            <span className="text-center self-center">x{item.quantity}</span>
            <span className="col-span-2 text-right self-center font-bold">
              {formatCurrency(item.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-black pt-4 space-y-2 text-black">
        <div className="flex justify-between text-xs">
          <span>Subtotal:</span> 
          <span>{formatCurrency(sale.totalAmount - sale.tax)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>Tax (8%):</span> 
          <span>{formatCurrency(sale.tax)}</span>
        </div>
        <div className="flex justify-between text-lg font-black pt-2 border-t border-black">
          <span>TOTAL:</span> 
          <span>{formatCurrency(sale.totalAmount)}</span>
        </div>
      </div>

      <div className="mt-10 text-center space-y-6 text-black">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest">Thank you for your business!</p>
          <p className="text-[10px]">Please keep this invoice for your records.</p>
        </div>
        
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-white border border-black/10 rounded-2xl shadow-sm">
            <QRCodeSVG 
              value={`${window.location.origin}/print/${sale.id}`} 
              size={160} 
              level="H" 
              includeMargin={true}
            />
          </div>
          <div className="space-y-1">
            <p className="text-[8px] font-mono opacity-40">{sale.id}</p>
            <button 
              onClick={() => {
                const url = `${window.location.origin}/print/${sale.id}`;
                navigator.clipboard.writeText(url);
                toast.success('Link copied to clipboard');
              }}
              className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline"
            >
              Copy Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Receipt = ({ sale, items, onClose }: { sale: Sale; items: SaleItem[]; onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative z-10 w-full max-w-sm"
      >
        <ReceiptContent sale={sale} items={items} />
        
        <div className="mt-8 flex gap-2 no-print relative z-20">
          <button 
            onClick={() => window.print()} 
            className="flex-1 btn btn-primary py-3 font-bold"
          >
            Print
          </button>
          <button 
            onClick={onClose} 
            className="flex-1 btn btn-ghost border border-white/20 bg-white/10 backdrop-blur-md py-3 font-bold text-white hover:bg-white/20"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const PrintPage = () => {
  const { saleId } = useParams<{ saleId: string }>();
  const [data, setData] = useState<{ sale: Sale; items: SaleItem[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!saleId) return;
      console.log('Fetching invoice data for:', saleId);
      try {
        const saleDoc = await getDoc(doc(db, 'sales', saleId)).catch(e => handleFirestoreError(e, OperationType.GET, `sales/${saleId}`, auth));
        if (saleDoc && saleDoc.exists()) {
          const sale = { id: saleDoc.id, ...saleDoc.data() } as Sale;
          const itemsSnapshot = await getDocs(query(collection(db, 'sales_items'), where('saleId', '==', saleId))).catch(e => handleFirestoreError(e, OperationType.GET, 'sales_items', auth));
          const items = itemsSnapshot ? itemsSnapshot.docs.map(d => d.data() as SaleItem) : [];
          setData({ sale, items });
          console.log('Invoice data loaded successfully');
        } else {
          console.warn('Invoice not found in Firestore');
        }
      } catch (error) {
        console.error('Error loading invoice:', error);
        toast.error('Failed to load invoice data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [saleId]);

  useEffect(() => {
    if (data) {
      const timer = setTimeout(() => {
        window.print();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [data]);

  if (loading) return <div className="h-screen flex items-center justify-center font-bold tracking-tighter text-2xl animate-pulse">PREPARING INVOICE...</div>;
  
  if (!data) return (
    <div className="h-screen flex flex-col items-center justify-center p-4 space-y-4">
      <div className="font-bold text-xl">Invoice not found</div>
      <div className="text-sm text-muted-fg bg-muted p-4 rounded-lg font-mono">
        ID: {saleId || 'None'}
      </div>
      <p className="text-xs text-center max-w-xs">
        Please ensure the URL is correct and the sale was successfully completed.
      </p>
      <Link to="/" className="btn btn-primary">Go to Dashboard</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-white p-4">
      <ReceiptContent sale={data.sale} items={data.items} />
      <div className="mt-8 text-center no-print">
        <p className="text-xs text-gray-500 mb-4">If the print dialog didn't open, click the button below.</p>
        <button onClick={() => window.print()} className="btn btn-primary px-8">Print Invoice</button>
      </div>
    </div>
  );
};

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '' });

  useEffect(() => {
    const q = query(collection(db, 'customers'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'customers', auth));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'customers'), { ...newCustomer, loyaltyPoints: 0, createdAt: new Date().toISOString() }).catch(e => handleFirestoreError(e, OperationType.CREATE, 'customers', auth));
      toast.success('Customer added');
      setShowAdd(false);
      setNewCustomer({ name: '', phone: '', email: '', address: '' });
    } catch (error) { 
      console.error(error);
      if (!(error instanceof Error && error.message.startsWith('{'))) {
        toast.error('Failed to add customer'); 
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
        <button onClick={() => setShowAdd(true)} className="btn btn-primary gap-2"><Plus size={20} /> Add Customer</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map(customer => (
          <motion.div 
            key={customer.id} 
            layout 
            whileHover={{ y: -4 }}
            className="card group hover:border-primary/50 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl font-black shadow-inner">
                {customer.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-lg truncate">{customer.name}</h4>
                <div className="flex items-center gap-1 text-muted-fg">
                  <Smartphone size={12} />
                  <p className="text-xs font-medium">{customer.phone || 'No phone'}</p>
                </div>
              </div>
            </div>
            <div className="pt-4 mt-4 border-t border-border flex justify-between items-center">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-fg block">Loyalty Points</span>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                  <span className="text-xl font-black tracking-tighter text-accent">{customer.loyaltyPoints}</span>
                </div>
              </div>
              <button className="p-2 hover:bg-muted rounded-xl text-muted-fg hover:text-primary transition-colors">
                <Settings size={18} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card max-w-md w-full relative z-10 space-y-6">
              <h3 className="text-2xl font-bold">Add Customer</h3>
              <form onSubmit={handleAdd} className="space-y-4">
                <input required placeholder="Name" className="input" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
                <input placeholder="Phone" className="input" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
                <input type="email" placeholder="Email" className="input" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} />
                <textarea placeholder="Address" className="input" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} />
                <button type="submit" className="btn btn-primary w-full">Save Customer</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    category: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'suppliers'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setSuppliers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'suppliers', auth));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await updateDoc(doc(db, 'suppliers', editingSupplier.id), {
          ...newSupplier
        }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `suppliers/${editingSupplier.id}`, auth));
        toast.success('Supplier updated');
      } else {
        await addDoc(collection(db, 'suppliers'), {
          ...newSupplier,
          createdAt: new Date().toISOString()
        }).catch(e => handleFirestoreError(e, OperationType.CREATE, 'suppliers', auth));
        toast.success('Supplier added');
      }
      setShowAdd(false);
      setEditingSupplier(null);
      setNewSupplier({ name: '', contactPerson: '', phone: '', email: '', address: '', category: '' });
    } catch (error) {
      console.error(error);
      toast.error('Failed to save supplier');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      try {
        await deleteDoc(doc(db, 'suppliers', id)).catch(e => handleFirestoreError(e, OperationType.DELETE, `suppliers/${id}`, auth));
        toast.success('Supplier deleted');
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete supplier');
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Suppliers</h2>
          <p className="text-muted-fg">Manage your product suppliers and contacts</p>
        </div>
        <button onClick={() => { setShowAdd(true); setEditingSupplier(null); }} className="btn btn-primary gap-2">
          <Plus size={20} /> Add Supplier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map(supplier => (
          <motion.div 
            key={supplier.id} 
            layout 
            whileHover={{ y: -4 }}
            className="card group hover:border-primary/50 transition-all"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center shadow-inner">
                  <Truck size={28} />
                </div>
                <div>
                  <h4 className="font-bold text-lg leading-tight">{supplier.name}</h4>
                  <p className="text-xs font-bold text-muted-fg uppercase tracking-widest mt-0.5">{supplier.category || 'General'}</p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => {
                    setEditingSupplier(supplier);
                    setNewSupplier({
                      name: supplier.name,
                      contactPerson: supplier.contactPerson,
                      phone: supplier.phone,
                      email: supplier.email || '',
                      address: supplier.address || '',
                      category: supplier.category || ''
                    });
                    setShowAdd(true);
                  }}
                  className="p-2 hover:bg-muted rounded-xl text-muted-fg hover:text-primary transition-colors"
                >
                  <Settings size={18} />
                </button>
                <button onClick={() => handleDelete(supplier.id)} className="p-2 hover:bg-red-500/10 rounded-xl text-muted-fg hover:text-red-500 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-fg uppercase tracking-wider">Contact</p>
                <p className="text-sm font-bold truncate">{supplier.contactPerson}</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[10px] font-bold text-muted-fg uppercase tracking-wider">Phone</p>
                <p className="text-sm font-bold">{supplier.phone}</p>
              </div>
              {supplier.email && (
                <div className="col-span-2 space-y-1">
                  <p className="text-[10px] font-bold text-muted-fg uppercase tracking-wider">Email Address</p>
                  <p className="text-sm font-medium truncate text-primary">{supplier.email}</p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card max-w-md w-full relative z-10 space-y-6">
              <h3 className="text-2xl font-bold">{editingSupplier ? 'Edit Supplier' : 'Add Supplier'}</h3>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-muted-fg">Supplier Name</label>
                  <input required className="input" value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-fg">Contact Person</label>
                    <input required className="input" value={newSupplier.contactPerson} onChange={e => setNewSupplier({...newSupplier, contactPerson: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-fg">Phone</label>
                    <input required className="input" value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-muted-fg">Email (Optional)</label>
                  <input type="email" className="input" value={newSupplier.email} onChange={e => setNewSupplier({...newSupplier, email: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-muted-fg">Category</label>
                  <input className="input" placeholder="e.g. Electronics, Food" value={newSupplier.category} onChange={e => setNewSupplier({...newSupplier, category: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-muted-fg">Address</label>
                  <textarea className="input" value={newSupplier.address} onChange={e => setNewSupplier({...newSupplier, address: e.target.value})} />
                </div>
                <button type="submit" className="btn btn-primary w-full py-3">{editingSupplier ? 'Update Supplier' : 'Save Supplier'}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Reports = () => {
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
    const salesQuery = query(collection(db, 'sales'), orderBy('date', 'desc'), limit(100));
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
  }, []);

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
          className="card p-6 bg-primary/5 border-primary/20 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -mr-8 -mt-8 blur-2xl group-hover:scale-150 transition-transform" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">Total Revenue</p>
          <h3 className="text-3xl font-black tracking-tighter">{formatCurrency(totalRevenue)}</h3>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-muted-fg uppercase tracking-widest opacity-60">
            <TrendingUp size={12} className="text-primary" />
            <span>Lifetime earnings</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6 bg-accent/5 border-accent/20 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-full -mr-8 -mt-8 blur-2xl group-hover:scale-150 transition-transform" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mb-2">Stock Value</p>
          <h3 className="text-3xl font-black tracking-tighter">{formatCurrency(totalStockValue)}</h3>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-muted-fg uppercase tracking-widest opacity-60">
            <Package size={12} className="text-accent" />
            <span>Current inventory worth</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6 bg-red-500/5 border-red-500/20 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full -mr-8 -mt-8 blur-2xl group-hover:scale-150 transition-transform" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 mb-2">Low Stock Items</p>
          <h3 className="text-3xl font-black tracking-tighter text-red-500">{lowStockCount}</h3>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-muted-fg uppercase tracking-widest opacity-60">
            <AlertCircle size={12} className="text-red-500" />
            <span>Items needing restock</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6 bg-green-500/5 border-green-500/20 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full -mr-8 -mt-8 blur-2xl group-hover:scale-150 transition-transform" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500 mb-2">Total Sales</p>
          <h3 className="text-3xl font-black tracking-tighter text-green-500">{sales.length}</h3>
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
                <Line type="monotone" dataKey="amount" stroke="var(--accent)" strokeWidth={3} dot={{ r: 6, fill: 'var(--accent)' }} activeDot={{ r: 8 }} />
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

const LoginPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const { signIn, signInWithEmail, signUp, isSigningIn } = useAuth();

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
    
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    if (isSignUp) {
      if (!name) newErrors.name = 'Username is required';
      if (!phone) newErrors.phone = 'Phone number is required';
      else if (!/^\d{10}$/.test(phone.replace(/\s/g, ''))) newErrors.phone = 'Invalid phone number (10 digits)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getPasswordStrength = () => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSigningIn || isSuccess) return;
    
    if (!validate()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      if (isSignUp) {
        await signUp(email, password, name, phone);
        try {
          await fetch('/api/notify-signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name, phone }),
          });
        } catch (err) {
          console.error('Failed to send notifications:', err);
        }
        setIsSuccess(true);
        toast.success('Account created successfully');
      } else {
        await signInWithEmail(email, password);
        setIsSuccess(true);
        toast.success('Welcome back');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
      setErrors({ auth: error.message || 'Authentication failed' });
    }
  };

  const handleGoogleLogin = async () => {
    if (isSigningIn || isSuccess) return;
    try {
      await signIn();
      setIsSuccess(true);
      toast.success('Welcome to Nexus POS');
    } catch (error) {
      toast.error('Login failed');
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 max-w-sm w-full"
        >
          <div className="w-20 h-20 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Success!</h2>
            <p className="text-muted-fg">Redirecting you to the dashboard...</p>
          </div>
          <div className="pt-4">
            <Loader2 className="w-6 h-6 text-accent animate-spin mx-auto" />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-bg">
      {/* Left Side: Branding & Info (Hidden on Mobile) */}
      <div className="hidden md:flex md:w-1/2 bg-primary p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.2)_0%,transparent_50%)]" />
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.2)_0%,transparent_50%)]" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-primary-fg mb-12">
            <div className="w-10 h-10 bg-primary-fg text-primary rounded-xl flex items-center justify-center font-black text-xl">N</div>
            <span className="text-2xl font-black tracking-tighter">NEXUS POS</span>
          </div>
          
          <div className="space-y-6 max-w-lg">
            <h1 className="text-6xl font-black tracking-tighter text-primary-fg leading-[0.9]">
              Business, <span className="text-accent">simplified.</span>
            </h1>
            <p className="text-primary-fg/60 text-lg font-medium">
              The intelligent POS ecosystem.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex gap-8 text-primary-fg/40 text-sm font-bold uppercase tracking-widest">
          <span>Fast</span>
          <span>Secure</span>
          <span>Reliable</span>
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-md w-full space-y-8"
        >
          <div className="md:hidden flex items-center gap-3 mb-12">
            <div className="w-8 h-8 bg-primary text-primary-fg rounded-lg flex items-center justify-center font-black text-lg">N</div>
            <span className="text-xl font-black tracking-tighter">NEXUS</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight">{isSignUp ? 'Create an account' : 'Welcome back'}</h2>
            {isSignUp && (
              <p className="text-muted-fg font-medium">
                Join the Nexus ecosystem today.
              </p>
            )}
          </div>

          <div className="flex p-1 bg-muted rounded-xl border border-border/50">
            <button 
              onClick={() => { setIsSignUp(false); setErrors({}); }}
              className={cn(
                "flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200",
                !isSignUp ? "bg-bg shadow-sm text-fg" : "text-muted-fg hover:text-fg"
              )}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setIsSignUp(true); setErrors({}); }}
              className={cn(
                "flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200",
                isSignUp ? "bg-bg shadow-sm text-fg" : "text-muted-fg hover:text-fg"
              )}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {isSignUp && (
                <motion.div 
                  key="signup-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-fg ml-1">Username</label>
                    <div className="relative group">
                      <UserIcon className={cn("absolute left-3 top-1/2 -translate-y-1/2 transition-colors", errors.name ? "text-red-500" : "text-muted-fg group-focus-within:text-primary")} size={18} />
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => { setName(e.target.value); if(errors.name) setErrors({...errors, name: ''}); }}
                        className={cn(
                          "input w-full pl-14 h-12",
                          errors.name && "border-red-500 bg-red-500/5 animate-shake"
                        )} 
                        placeholder="John Doe"
                        disabled={isSigningIn}
                      />
                    </div>
                    {errors.name && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.name}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-fg ml-1">Phone Number</label>
                    <div className="relative group">
                      <Phone className={cn("absolute left-3 top-1/2 -translate-y-1/2 transition-colors", errors.phone ? "text-red-500" : "text-muted-fg group-focus-within:text-primary")} size={18} />
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value); if(errors.phone) setErrors({...errors, phone: ''}); }}
                        className={cn(
                          "input w-full pl-14 h-12",
                          errors.phone && "border-red-500 bg-red-500/5 animate-shake"
                        )} 
                        placeholder="0244123456"
                        disabled={isSigningIn}
                      />
                    </div>
                    {errors.phone && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.phone}</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-fg ml-1">Email Address</label>
              <div className="relative group">
                <Mail className={cn("absolute left-3 top-1/2 -translate-y-1/2 transition-colors", errors.email ? "text-red-500" : "text-muted-fg group-focus-within:text-primary")} size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if(errors.email) setErrors({...errors, email: ''}); }}
                  className={cn(
                    "input w-full pl-14 h-12",
                    errors.email && "border-red-500 bg-red-500/5 animate-shake"
                  )} 
                  placeholder="name@company.com"
                  disabled={isSigningIn}
                />
              </div>
              {errors.email && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-fg">Password</label>
                {!isSignUp && (
                  <button type="button" className="text-xs font-bold text-primary hover:underline underline-offset-4">
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative group">
                <Lock className={cn("absolute left-3 top-1/2 -translate-y-1/2 transition-colors", errors.password ? "text-red-500" : "text-muted-fg group-focus-within:text-primary")} size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if(errors.password) setErrors({...errors, password: ''}); }}
                  className={cn(
                    "input w-full pl-14 pr-10 h-12",
                    errors.password && "border-red-500 bg-red-500/5 animate-shake"
                  )} 
                  placeholder="••••••••"
                  disabled={isSigningIn}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-fg hover:text-fg transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.password}</p>}
              
              {isSignUp && password.length > 0 && (
                <div className="flex gap-1 mt-2 px-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div 
                      key={step}
                      className={cn(
                        "flex-1 h-1 rounded-full transition-all",
                        getPasswordStrength() >= step ? "bg-accent" : "bg-muted"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            {!isSignUp && (
              <div className="flex items-center gap-2 px-1 pb-2">
                <button 
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className={cn(
                    "w-4 h-4 rounded border transition-all flex items-center justify-center",
                    rememberMe ? "bg-primary border-primary" : "border-border bg-bg"
                  )}
                >
                  {rememberMe && <div className="w-2 h-2 bg-primary-fg rounded-full" />}
                </button>
                <span className="text-xs font-medium text-muted-fg">Keep me signed in</span>
              </div>
            )}

            <button 
              type="submit"
              disabled={isSigningIn}
              className="btn btn-primary w-full h-12 text-base font-bold shadow-lg shadow-primary/10 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isSigningIn ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <div className="flex items-center justify-center gap-2">
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight size={18} />
                </div>
              )}
            </button>
          </form>

          <div className="space-y-4 py-2">
            <div className="border-t border-border w-full" />
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-fg">
                Or continue with
              </span>
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={isSigningIn}
            className="btn btn-ghost w-full h-12 border border-border flex items-center justify-center gap-3 font-bold hover:bg-muted transition-all disabled:opacity-50"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Google
          </button>

          <p className="text-center text-xs text-muted-fg font-medium">
            By continuing, you agree to our <span className="text-fg font-bold underline underline-offset-4 cursor-pointer">Terms</span> and <span className="text-fg font-bold underline underline-offset-4 cursor-pointer">Privacy</span>.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [showHelp, setShowHelp] = useState(false);
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

    const salesQuery = query(collection(db, 'sales'), where('date', '>=', today.toISOString()));
    const productsQuery = query(collection(db, 'products'));
    const customersQuery = query(collection(db, 'customers'));
    const recentSalesQuery = query(collection(db, 'sales'), orderBy('date', 'desc'), limit(5));

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

    const unsubTop = onSnapshot(query(collection(db, 'sales_items'), orderBy('createdAt', 'desc'), limit(100)), (snapshot) => {
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
  }, []);

  const statCards = [
    { name: 'Today\'s Sales', value: formatCurrency(stats.todaySales), icon: Banknote, color: 'text-green-500', bg: 'bg-green-500/10' },
    { name: 'Total Orders', value: stats.totalOrders, icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { name: 'Low Stock Items', value: stats.lowStock, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
    { name: 'Active Customers', value: stats.activeCustomers, icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Terminal Dashboard</h2>
          <p className="text-sm text-muted-fg">Real-time operational overview</p>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
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
                <p className="text-3xl font-black tracking-tighter">{stat.value}</p>
              </div>
              <div className={cn("p-3 rounded-2xl border border-border/50 shadow-sm transition-transform group-hover:scale-110", stat.bg || "bg-muted", stat.color)}>
                <stat.icon size={24} />
              </div>
            </div>
            <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-muted-fg uppercase tracking-widest opacity-60">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span>Live Update</span>
            </div>
          </motion.div>
        ))}
      </div>

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
              <motion.div 
                key={sale.id} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-bg border border-border/50 hover:border-accent/30 transition-all group gap-3 sm:gap-0"
              >
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
                <div className="text-left sm:text-right flex flex-col sm:items-end">
                  <p className="text-xs font-bold text-muted-fg">{formatDate(sale.date)}</p>
                  <div className="mt-1 flex items-center sm:justify-end gap-1 text-[10px] font-black text-green-500 uppercase tracking-widest">
                    <CheckCircle2 size={10} />
                    <span>Completed</span>
                  </div>
                </div>
              </motion.div>
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
                      animate={{ width: `${Math.min(100, (p.count / topProducts[0].count) * 100)}%` }}
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

const POS = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile_money' | 'mtn_momo' | 'telecel_cash'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [lastSale, setLastSale] = useState<{ sale: Sale; items: SaleItem[] } | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('name'));
    const unsub = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (search.trim()) {
      const exactMatch = products.find(p => p.barcode === search.trim());
      if (exactMatch) {
        addToCart(exactMatch);
        setSearch('');
        toast.success(`Added ${exactMatch.name} to cart`);
      }
    }
  }, [search, products]);

  const addToCart = (product: Product) => {
    if (product.quantity <= 0) {
      toast.error('Out of stock');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          toast.error('Insufficient stock');
          return prev;
        }
        return prev.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        if (newQty > item.product.quantity) {
          toast.error('Insufficient stock');
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!user) return;

    setIsProcessing(true);
    try {
      if (paymentMethod === 'mobile_money' || paymentMethod === 'mtn_momo' || paymentMethod === 'telecel_cash') {
        if (!(window as any).PaystackPop) {
          toast.error('Payment system not loaded. Please refresh.');
          setIsProcessing(false);
          return;
        }
        const paystack = (window as any).PaystackPop.setup({
          key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_your_public_key',
          email: user.email,
          amount: Math.round(total * 100),
          currency: 'GHS',
          channels: ['mobile_money'],
          ref: `nexus_${Date.now()}`,
          metadata: {
            custom_fields: [
              { display_name: "Customer Name", variable_name: "customer_name", value: user.name },
              { display_name: "Customer Phone", variable_name: "customer_phone", value: user.phoneNumber || "" },
              { display_name: "Payment Provider", variable_name: "payment_provider", value: paymentMethod }
            ]
          },
          callback: (response: any) => {
            completeSale(response.reference);
          },
          onClose: () => {
            setIsProcessing(false);
            toast.error('Payment cancelled');
          }
        });
        paystack.openIframe();
      } else {
        await completeSale();
      }
    } catch (error) {
      console.error(error);
      setIsProcessing(false);
      toast.error('Payment initialization failed');
    }
  };

  const completeSale = async (paymentRef?: string) => {
    if (!user) return;
    try {
      // 1. Create Sale
      const saleData = {
        date: new Date().toISOString(),
        userId: user.uid,
        totalAmount: total,
        paymentMethod,
        paymentReference: paymentRef || null,
        discount: 0,
        tax,
        createdAt: new Date().toISOString()
      };
      const saleRef = await addDoc(collection(db, 'sales'), saleData).catch(e => handleFirestoreError(e, OperationType.CREATE, 'sales', auth));
      if (!saleRef) return;

      // 2. Create Sale Items & Update Inventory
      for (const item of cart) {
        await addDoc(collection(db, 'sales_items'), {
          saleId: saleRef.id,
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          createdAt: new Date().toISOString()
        }).catch(e => handleFirestoreError(e, OperationType.CREATE, 'sales_items', auth));

        await updateDoc(doc(db, 'products', item.product.id), {
          quantity: increment(-item.quantity)
        }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `products/${item.product.id}`, auth));

        await addDoc(collection(db, 'inventory_logs'), {
          productId: item.product.id,
          type: 'sale',
          quantity: -item.quantity,
          userId: user.uid,
          createdAt: new Date().toISOString()
        }).catch(e => handleFirestoreError(e, OperationType.CREATE, 'inventory_logs', auth));
      }

      toast.success('Transaction completed successfully');
      setCart([]);
      setShowSuccessAnimation(true);
      setTimeout(() => setShowSuccessAnimation(false), 3000);
      
      // Fetch items for receipt
      const itemsSnapshot = await getDocs(query(collection(db, 'sales_items'), where('saleId', '==', saleRef.id))).catch(e => handleFirestoreError(e, OperationType.GET, 'sales_items', auth));
      const items = itemsSnapshot ? itemsSnapshot.docs.map(d => d.data() as SaleItem) : [];
      setLastSale({ sale: { id: saleRef.id, ...saleData } as Sale, items });
    } catch (error) {
      console.error(error);
      if (!(error instanceof Error && error.message.startsWith('{'))) {
        toast.error('Transaction failed');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.barcode.includes(search) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full lg:h-[calc(100vh-120px)] flex flex-col lg:flex-row gap-6 lg:gap-8 overflow-hidden">
      {/* Success Animation Overlay */}
      <AnimatePresence>
        {showSuccessAnimation && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md"
            onClick={() => setShowSuccessAnimation(false)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 100 }}
              className="card max-w-md w-full relative z-10 text-center space-y-6 p-12 border-primary/50 shadow-[0_0_50px_rgba(var(--primary),0.3)]"
            >
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary border-4 border-primary/20">
                <CheckCircle2 size={64} className="animate-bounce" />
              </div>
              <div className="space-y-2">
                <h2 className="text-4xl font-black tracking-tighter">SUCCESS!</h2>
                <p className="text-muted-fg font-bold uppercase tracking-widest text-xs">Transaction completed successfully</p>
              </div>
              <div className="pt-6 flex flex-col gap-3">
                <button 
                  onClick={() => setShowSuccessAnimation(false)}
                  className="btn btn-primary w-full py-4 rounded-2xl font-black uppercase tracking-widest"
                >
                  New Transaction
                </button>
                {lastSale && (
                  <button 
                    onClick={() => {
                      setShowSuccessAnimation(false);
                      // Receipt is already shown by lastSale state
                    }}
                    className="btn bg-muted/50 hover:bg-muted w-full py-4 rounded-2xl font-black uppercase tracking-widest"
                  >
                    View Receipt
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Selection */}
      <div className="flex-1 flex flex-col space-y-6">
        <div className="flex gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-fg group-focus-within:text-primary transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search products by name, category or barcode..." 
              className="w-full pl-12 pr-4 py-4 bg-muted/30 border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold tracking-tight"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <button 
            onClick={() => setIsScanning(!isScanning)}
            className={cn(
              "p-4 rounded-2xl border transition-all flex items-center gap-2 font-bold uppercase tracking-widest text-xs",
              isScanning ? "bg-primary text-primary-fg border-primary shadow-lg shadow-primary/20" : "bg-muted/30 border-border/50 text-muted-fg hover:bg-muted"
            )}
          >
            <QrCode size={20} />
            <span className="hidden lg:inline">{isScanning ? "Stop Scanner" : "Scan Barcode"}</span>
          </button>
        </div>

        {isScanning && (
          <div className="card p-0 overflow-hidden relative h-64 bg-black flex items-center justify-center rounded-3xl border-accent/50">
            <div className="text-white text-center space-y-2 relative z-10">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-accent/40">
                <QrCode className="text-accent animate-pulse" size={32} />
              </div>
              <p className="text-sm font-black uppercase tracking-[0.2em]">Scanner Active</p>
              <p className="text-[10px] opacity-60 uppercase tracking-widest">Type barcode in search to simulate scan</p>
            </div>
            <div className="absolute inset-0 border-2 border-accent/30 animate-pulse pointer-events-none rounded-3xl" />
            <div className="absolute inset-0 bg-gradient-to-t from-accent/10 to-transparent pointer-events-none" />
          </div>
        )}

        <div className="flex-1 overflow-y-auto grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 pr-2 custom-scrollbar">
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => addToCart(product)}
              className={cn(
                "group card p-0 overflow-hidden cursor-pointer border-border/40 hover:border-primary/50 transition-all hover:shadow-2xl relative",
                product.quantity <= 0 && "opacity-50 grayscale pointer-events-none"
              )}
            >
              <div className="aspect-square bg-muted/30 flex items-center justify-center relative overflow-hidden">
                <Package size={48} className="text-muted-fg/20 group-hover:scale-110 group-hover:text-primary/20 transition-all duration-500" />
                {product.quantity <= product.lowStockThreshold && product.quantity > 0 && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-md shadow-lg animate-pulse">
                    Low Stock
                  </div>
                )}
                {product.quantity <= 0 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="px-3 py-1 bg-red-500 text-white text-xs font-black uppercase tracking-widest rounded-full">Out of Stock</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <button className="w-full py-2 bg-primary text-primary-fg rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                    Quick Add
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-black text-sm tracking-tight leading-tight line-clamp-2 group-hover:text-primary transition-colors">{product.name}</h3>
                  <span className="text-xs font-black text-primary">{formatCurrency(product.price)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-fg font-mono opacity-60 uppercase tracking-widest">#{product.barcode}</p>
                  <p className={cn("text-[10px] font-bold uppercase tracking-widest", product.quantity <= product.lowStockThreshold ? "text-red-500" : "text-green-500")}>
                    {product.quantity} left
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Cart & Checkout */}
      <div className="w-full lg:w-96 flex flex-col gap-6 h-full lg:h-auto">
        <div className="card flex-1 flex flex-col p-0 overflow-hidden border-border/40 shadow-2xl min-h-[400px]">
          <div className="p-6 border-b border-border/50 flex items-center justify-between bg-muted/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <ShoppingCart size={20} />
              </div>
              <h2 className="font-black text-lg tracking-tight">Cart</h2>
            </div>
            <span className="px-3 py-1 bg-muted rounded-full text-[10px] font-black uppercase tracking-widest opacity-60">
              {cart.reduce((acc, item) => acc + item.quantity, 0)} items
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {cart.map((item) => (
                <motion.div 
                  key={item.product.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="group flex gap-4 p-3 rounded-2xl bg-muted/20 border border-transparent hover:border-border/50 transition-all"
                >
                  <div className="h-16 w-16 rounded-xl bg-bg border border-border flex items-center justify-center text-muted-fg group-hover:text-primary transition-colors">
                    <Package size={24} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm tracking-tight truncate">{item.product.name}</h4>
                      <button 
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 text-muted-fg hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="font-black text-sm text-primary">{formatCurrency(item.product.price * item.quantity)}</p>
                      <div className="flex items-center gap-3 bg-bg border border-border rounded-lg p-1">
                        <button 
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="p-1 hover:bg-muted rounded-md text-muted-fg transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-black min-w-[1.5rem] text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="p-1 hover:bg-muted rounded-md text-muted-fg transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40 space-y-4">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                  <ShoppingCart size={40} />
                </div>
                <div>
                  <p className="font-black text-sm uppercase tracking-widest">Cart is empty</p>
                  <p className="text-xs">Scan or search items to begin</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-muted/10 border-t border-border/50 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold text-muted-fg">
                <span className="uppercase tracking-widest text-[10px]">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-muted-fg">
                <span className="uppercase tracking-widest text-[10px]">Tax (8%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between text-xl font-black pt-2 border-t border-border/50">
                <span className="tracking-tighter">Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'cash', icon: Banknote, label: 'Cash' },
                { id: 'card', icon: CreditCard, label: 'Card' },
                { id: 'mtn_momo', icon: Smartphone, label: 'MoMo' },
                { id: 'telecel_cash', icon: Smartphone, label: 'Telecel' },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as any)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-2 rounded-xl border transition-all",
                    paymentMethod === method.id 
                      ? "bg-primary text-primary-fg border-primary shadow-lg shadow-primary/20" 
                      : "bg-bg border-border/50 text-muted-fg hover:bg-muted"
                  )}
                >
                  <method.icon size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-center">{method.label}</span>
                </button>
              ))}
            </div>

            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0 || isProcessing}
              className="w-full btn btn-primary py-4 rounded-2xl flex items-center justify-center gap-3 text-base font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 disabled:opacity-50 disabled:grayscale"
            >
              {isProcessing ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle2 size={24} />}
              {isProcessing ? 'Processing...' : 'Complete Sale'}
            </button>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {lastSale && <Receipt sale={lastSale.sale} items={lastSale.items} onClose={() => setLastSale(null)} />}
      </AnimatePresence>
    </div>
  );
};

const Inventory = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProductForQR, setSelectedProductForQR] = useState<Product | null>(null);
  const [filter, setFilter] = useState<'all' | 'low'>('all');
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    price: 0,
    quantity: 0,
    barcode: '',
    lowStockThreshold: 5,
    supplierId: ''
  });

  useEffect(() => {
    const pq = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubProducts = onSnapshot(pq, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'products', auth));

    const sq = query(collection(db, 'suppliers'), orderBy('name', 'asc'));
    const unsubSuppliers = onSnapshot(sq, (snapshot) => {
      setSuppliers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'suppliers', auth));

    return () => {
      unsubProducts();
      unsubSuppliers();
    };
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'products'), {
        ...newProduct,
        createdAt: new Date().toISOString()
      }).catch(e => handleFirestoreError(e, OperationType.CREATE, 'products', auth));
      toast.success('Product added successfully');
      setShowAddModal(false);
      setNewProduct({ name: '', category: '', price: 0, quantity: 0, barcode: '', lowStockThreshold: 5, supplierId: '' });
    } catch (error) {
      console.error(error);
      if (!(error instanceof Error && error.message.startsWith('{'))) {
        toast.error('Failed to add product');
      }
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const { id, ...data } = editingProduct;
      await updateDoc(doc(db, 'products', id), data).catch(e => handleFirestoreError(e, OperationType.UPDATE, `products/${id}`, auth));
      toast.success('Product updated successfully');
      setEditingProduct(null);
    } catch (error) {
      console.error(error);
      if (!(error instanceof Error && error.message.startsWith('{'))) {
        toast.error('Failed to update product');
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Inventory</h2>
          <p className="text-sm text-muted-fg">Manage your products and stock levels</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex bg-muted p-1 rounded-xl w-full sm:w-auto">
            <button 
              onClick={() => setFilter('all')}
              className={cn("flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all", filter === 'all' ? "bg-bg shadow-sm" : "text-muted-fg")}
            >
              All Items
            </button>
            <button 
              onClick={() => setFilter('low')}
              className={cn("flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all", filter === 'low' ? "bg-bg shadow-sm" : "text-muted-fg")}
            >
              Low Stock
            </button>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary gap-2 w-full sm:w-auto py-2.5">
            <Plus size={18} /> <span className="text-xs">Add Product</span>
          </button>
        </div>
      </div>

      <div className="card overflow-hidden p-0 border-border/40 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="p-5 font-bold text-[10px] uppercase tracking-[0.2em] text-muted-fg">Product Details</th>
                <th className="p-5 font-bold text-[10px] uppercase tracking-[0.2em] text-muted-fg">Category</th>
                <th className="p-5 font-bold text-[10px] uppercase tracking-[0.2em] text-muted-fg">Supplier</th>
                <th className="p-5 font-bold text-[10px] uppercase tracking-[0.2em] text-muted-fg">Price</th>
                <th className="p-5 font-bold text-[10px] uppercase tracking-[0.2em] text-muted-fg">Stock Level</th>
                <th className="p-5 font-bold text-[10px] uppercase tracking-[0.2em] text-muted-fg">Status</th>
                <th className="p-5 font-bold text-[10px] uppercase tracking-[0.2em] text-muted-fg text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {products
                .filter(p => filter === 'all' || p.quantity <= p.lowStockThreshold)
                .map((product) => (
                <tr key={product.id} className="group hover:bg-primary/[0.02] transition-colors">
                  <td className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-bg border border-border flex items-center justify-center text-muted-fg group-hover:bg-primary/10 group-hover:text-primary transition-all group-hover:scale-110">
                        <Package size={22} />
                      </div>
                      <div>
                        <p className="font-black text-base tracking-tight leading-tight">{product.name}</p>
                        <p className="text-[10px] text-muted-fg font-mono mt-0.5 opacity-60 uppercase tracking-widest">#{product.barcode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className="text-[10px] font-bold px-3 py-1 bg-accent/10 text-accent rounded-full uppercase tracking-widest border border-accent/20 transition-colors group-hover:bg-accent group-hover:text-accent-fg">
                      {product.category}
                    </span>
                  </td>
                  <td className="p-5 text-sm font-bold tracking-tight opacity-80">
                    {suppliers.find(s => s.id === product.supplierId)?.name || <span className="text-muted-fg italic opacity-40">No Supplier</span>}
                  </td>
                  <td className="p-5 font-black text-lg tracking-tighter">{formatCurrency(product.price)}</td>
                  <td className="p-5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                        <span className={cn(
                          product.quantity <= product.lowStockThreshold ? "text-red-500" : "text-green-500"
                        )}>
                          {product.quantity} units
                        </span>
                        <span className="text-muted-fg opacity-40">Min: {product.lowStockThreshold}</span>
                      </div>
                      <div className="h-1.5 w-32 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all duration-500",
                            product.quantity <= product.lowStockThreshold ? "bg-red-500" : "bg-green-500"
                          )}
                          style={{ width: `${Math.min(100, (product.quantity / (product.lowStockThreshold * 3)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className={cn(
                      "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest inline-flex items-center gap-1.5",
                      product.quantity <= product.lowStockThreshold 
                        ? "bg-red-500/10 text-red-500 border border-red-500/20" 
                        : "bg-green-500/10 text-green-500 border border-green-500/20"
                    )}>
                      <div className={cn("w-1.5 h-1.5 rounded-full", product.quantity <= product.lowStockThreshold ? "bg-red-500 animate-pulse" : "bg-green-500")} />
                      {product.quantity <= product.lowStockThreshold ? 'Low Stock' : 'Healthy'}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setSelectedProductForQR(product)}
                        className="p-2 rounded-xl bg-bg border border-border text-muted-fg hover:text-accent hover:border-accent transition-all hover:scale-110"
                        title="Generate QR Code"
                      >
                        <QrCode size={18} />
                      </button>
                      <button 
                        onClick={() => setEditingProduct(product)}
                        className="p-2 rounded-xl bg-bg border border-border text-muted-fg hover:text-primary hover:border-primary transition-all hover:scale-110"
                        title="Edit Product"
                      >
                        <Settings size={18} />
                      </button>
                      {(user?.role === 'admin' || user?.role === 'manager') && (
                        <button 
                          onClick={async () => {
                            if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
                              try {
                                await deleteDoc(doc(db, 'products', product.id)).catch(e => handleFirestoreError(e, OperationType.DELETE, `products/${product.id}`, auth));
                                toast.success('Product deleted successfully');
                              } catch (error) {
                                console.error(error);
                                toast.error('Failed to delete product');
                              }
                            }
                          }}
                          className="p-2 rounded-xl bg-bg border border-border text-muted-fg hover:text-red-500 hover:border-red-500 transition-all hover:scale-110"
                          title="Delete Product"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Product Modal */}
      <AnimatePresence>
        {editingProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingProduct(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="card max-w-lg w-full relative z-10 space-y-6"
            >
              <h3 className="text-2xl font-bold tracking-tight">Edit Product</h3>
              <form onSubmit={handleEditProduct} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-fg">Name</label>
                    <input required className="input" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-fg">Category</label>
                    <input required className="input" value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-fg">Price</label>
                    <input required type="number" step="0.01" className="input" value={isNaN(editingProduct.price) ? '' : editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-fg">Quantity</label>
                    <input required type="number" className="input" value={isNaN(editingProduct.quantity) ? '' : editingProduct.quantity} onChange={e => setEditingProduct({...editingProduct, quantity: parseInt(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-fg">Barcode</label>
                    <input required className="input" value={editingProduct.barcode} onChange={e => setEditingProduct({...editingProduct, barcode: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-fg">Low Stock Alert</label>
                    <input required type="number" className="input" value={isNaN(editingProduct.lowStockThreshold) ? '' : editingProduct.lowStockThreshold} onChange={e => setEditingProduct({...editingProduct, lowStockThreshold: parseInt(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-fg">Supplier</label>
                    <select 
                      className="input w-full"
                      value={editingProduct.supplierId}
                      onChange={e => setEditingProduct({...editingProduct, supplierId: e.target.value})}
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setEditingProduct(null)} className="btn btn-ghost flex-1">Cancel</button>
                  <button type="submit" className="btn btn-primary flex-1">Update Product</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Product Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="card max-w-lg w-full relative z-10 space-y-6"
            >
              <h3 className="text-2xl font-bold tracking-tight">Add New Product</h3>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-fg">Name</label>
                    <input required className="input" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-fg">Category</label>
                    <input required className="input" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-fg">Price</label>
                    <input required type="number" step="0.01" className="input" value={isNaN(newProduct.price) ? '' : newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-fg">Quantity</label>
                    <input required type="number" className="input" value={isNaN(newProduct.quantity) ? '' : newProduct.quantity} onChange={e => setNewProduct({...newProduct, quantity: parseInt(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-fg">Barcode</label>
                    <input required className="input" value={newProduct.barcode} onChange={e => setNewProduct({...newProduct, barcode: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-fg">Low Stock Alert</label>
                    <input required type="number" className="input" value={isNaN(newProduct.lowStockThreshold) ? '' : newProduct.lowStockThreshold} onChange={e => setNewProduct({...newProduct, lowStockThreshold: parseInt(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-fg">Supplier</label>
                    <select 
                      className="input w-full"
                      value={newProduct.supplierId}
                      onChange={e => setNewProduct({...newProduct, supplierId: e.target.value})}
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-ghost flex-1">Cancel</button>
                  <button type="submit" className="btn btn-primary flex-1">Save Product</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {selectedProductForQR && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProductForQR(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="card max-w-sm w-full relative z-10 space-y-6 text-center"
            >
              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight">{selectedProductForQR.name}</h3>
                <p className="text-muted-fg font-mono text-sm">Barcode: {selectedProductForQR.barcode}</p>
              </div>

              <div className="bg-white p-6 rounded-2xl flex items-center justify-center shadow-inner mx-auto w-fit">
                <div id="qr-code-container">
                  <QRCodeSVG 
                    value={selectedProductForQR.barcode} 
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button 
                  onClick={() => {
                    const svg = document.querySelector('#qr-code-container svg') as SVGGraphicsElement;
                    if (!svg) return;
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const img = new Image();
                    img.onload = () => {
                      canvas.width = img.width;
                      canvas.height = img.height;
                      ctx?.drawImage(img, 0, 0);
                      const pngFile = canvas.toDataURL('image/png');
                      const downloadLink = document.createElement('a');
                      downloadLink.download = `QR_${selectedProductForQR.name}_${selectedProductForQR.barcode}.png`;
                      downloadLink.href = pngFile;
                      downloadLink.click();
                    };
                    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                  }}
                  className="btn btn-outline gap-2"
                >
                  <Download size={18} /> Download
                </button>
                <button 
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (!printWindow) return;
                    const svg = document.querySelector('#qr-code-container svg') as SVGGraphicsElement;
                    if (!svg) return;
                    const svgData = new XMLSerializer().serializeToString(svg);
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Print QR Code - ${selectedProductForQR.name}</title>
                          <style>
                            body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
                            .container { text-align: center; border: 1px solid #eee; padding: 40px; border-radius: 20px; }
                            h1 { margin-bottom: 10px; }
                            p { color: #666; margin-bottom: 30px; }
                          </style>
                        </head>
                        <body>
                          <div class="container">
                            <h1>${selectedProductForQR.name}</h1>
                            <p>Barcode: ${selectedProductForQR.barcode}</p>
                            <div>${svgData}</div>
                          </div>
                          <script>
                            window.onload = () => {
                              window.print();
                              window.close();
                            };
                          </script>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                  }}
                  className="btn btn-primary gap-2"
                >
                  <Printer size={18} /> Print
                </button>
              </div>
              <button 
                onClick={() => setSelectedProductForQR(null)} 
                className="btn btn-ghost w-full"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Error Boundary ---

class ErrorBoundary extends Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if ((this as any).state.hasError) {
      let errorMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse((this as any).state.error.message);
        if (parsed.error) errorMessage = parsed.error;
      } catch (e) {}

      return (
        <div className="h-screen flex items-center justify-center p-8 bg-bg">
          <div className="card max-w-md w-full text-center space-y-6">
            <div className="h-20 w-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Application Error</h2>
              <p className="text-muted-fg">{errorMessage}</p>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-primary w-full"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

const SettingsPage = () => {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async (format: 'json' | 'csv' = 'json') => {
    setIsExporting(true);
    try {
      const collections = ['products', 'sales', 'sales_items', 'inventory_logs', 'customers', 'users'];
      const backupData: any = {};

      for (const collName of collections) {
        const snapshot = await getDocs(collection(db, collName));
        backupData[collName] = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      }

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nexus_pos_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        toast.success('Data exported successfully as JSON');
      } else {
        // Export Sales as CSV
        const sales = backupData['sales'];
        if (sales.length > 0) {
          const headers = Object.keys(sales[0]).join(',');
          const rows = sales.map((s: any) => Object.values(s).map(v => `"${v}"`).join(',')).join('\n');
          const csv = `${headers}\n${rows}`;
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `nexus_sales_export_${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          toast.success('Sales data exported as CSV');
        } else {
          toast.info('No sales data to export');
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Users size={24} />
            </div>
            <div>
              <h3 className="font-bold">Account Profile</h3>
              <p className="text-sm text-muted-fg">Manage your business information</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-muted-fg">Business Name</label>
              <input className="input" value={user?.name} readOnly />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-muted-fg">Email Address</label>
              <input className="input" value={user?.email} readOnly />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-muted-fg">Role</label>
              <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold w-fit uppercase">
                {user?.role}
              </div>
            </div>
          </div>
        </div>

        <div className="card space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
              <Download size={24} />
            </div>
            <div>
              <h3 className="font-bold">Backup & Recovery</h3>
              <p className="text-sm text-muted-fg">Export your data for safe keeping</p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-fg">
              Download a complete backup of your products, sales, and customer data.
            </p>
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => handleExportData('json')}
                disabled={isExporting}
                className="btn btn-primary w-full gap-2"
              >
                <Download size={18} />
                {isExporting ? 'Exporting...' : 'Export Full Backup (JSON)'}
              </button>
              <button 
                onClick={() => handleExportData('csv')}
                disabled={isExporting}
                className="btn btn-outline w-full gap-2"
              >
                <FileText size={18} />
                {isExporting ? 'Exporting...' : 'Export Sales (CSV)'}
              </button>
            </div>
          </div>
        </div>

        <div className="card space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="font-bold">System Status</h3>
              <p className="text-sm text-muted-fg">Current platform health</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
              <span className="text-xs font-bold uppercase tracking-widest opacity-60">Database</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold">Connected</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
              <span className="text-xs font-bold uppercase tracking-widest opacity-60">Auth Service</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold">Operational</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
              <span className="text-xs font-bold uppercase tracking-widest opacity-60">Storage</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold">Healthy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center font-bold tracking-tighter text-2xl animate-pulse">NEXUS</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

const AppContent = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Auto-close sidebar on mobile
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error: any) {
        if (error.message.includes('the client is offline')) {
          toast.error("Firebase connection failed. Please check your configuration.");
        }
      }
    }
    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      {user && <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} mobile={window.innerWidth < 768} />}
      <div className={cn(
        "transition-all duration-500", 
        user ? (sidebarOpen ? "md:ml-64" : "md:ml-20") : ""
      )}>
        {user && <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />}
        <main className={cn("p-4 md:p-8", !user ? "p-0" : "")}>
          <Routes>
            <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
            <Route path="/print/:saleId" element={<PrintPage />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/pos" element={<ProtectedRoute><POS /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
            <Route path="/suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
