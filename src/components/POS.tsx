import * as React from 'react';
import { useState, useEffect } from 'react';
import { 
  query, 
  collection, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  Search, 
  LayoutGrid, 
  List, 
  QrCode, 
  Package, 
  ShoppingCart,
  Trash2,
  Minus,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { useCart } from './CartContext';
import { Product } from '../types';
import { cn, formatCurrency } from '../lib/utils';

export const POS = () => {
  const { cart, addToCart, removeFromCart, updateQuantity, updateItemDiscount, subtotal, total } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
      }
    }
  }, [search, products]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.barcode.includes(search) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-120px)] flex gap-6 max-w-screen-2xl mx-auto overflow-hidden">
      <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-fg group-focus-within:text-primary transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="w-full pl-12 pr-4 py-4 bg-muted/30 border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold tracking-tight"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="flex gap-3">
            <div className="flex bg-muted/30 p-1 rounded-2xl border border-border/50">
              <button 
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-3 rounded-xl transition-all",
                  viewMode === 'grid' ? "bg-primary text-primary-fg shadow-lg" : "text-muted-fg hover:bg-muted"
                )}
              >
                <LayoutGrid size={20} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-3 rounded-xl transition-all",
                  viewMode === 'list' ? "bg-primary text-primary-fg shadow-lg" : "text-muted-fg hover:bg-muted"
                )}
              >
                <List size={20} />
              </button>
            </div>

            <button 
              onClick={() => setIsScanning(!isScanning)}
              className={cn(
                "p-4 rounded-2xl border transition-all flex items-center gap-2 font-bold uppercase tracking-widest text-xs",
                isScanning ? "bg-primary text-primary-fg border-primary shadow-lg" : "bg-muted/30 border-border/50 text-muted-fg hover:bg-muted"
              )}
            >
              <QrCode size={20} />
            </button>
          </div>
        </div>

        {isScanning && (
          <div className="card p-0 overflow-hidden relative h-32 bg-black flex items-center justify-center rounded-3xl border-accent/50">
            <div className="text-white text-center space-y-1 relative z-10">
              <QrCode className="text-accent animate-pulse mx-auto" size={24} />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Scanner Active</p>
            </div>
            <div className="absolute inset-0 border-2 border-accent/30 animate-pulse pointer-events-none rounded-3xl" />
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => addToCart(product)}
                  className={cn(
                    "group card p-0 overflow-hidden cursor-pointer border-border/40 hover:border-primary/50 transition-all hover:shadow-xl relative",
                    product.quantity <= 0 && "opacity-50 grayscale pointer-events-none"
                  )}
                >
                  <div className="aspect-square bg-muted/30 flex items-center justify-center relative overflow-hidden">
                    <Package size={48} className="text-muted-fg/20 group-hover:scale-110 group-hover:text-primary/20 transition-all duration-500" />
                    {product.quantity <= product.lowStockThreshold && product.quantity > 0 && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 bg-red-500 text-white text-[8px] font-black uppercase tracking-widest rounded shadow-lg">
                        Low Stock
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-black text-sm tracking-tight leading-tight group-hover:text-primary transition-colors line-clamp-2">{product.name}</h3>
                      <p className="text-sm font-black text-primary">{formatCurrency(product.price)}</p>
                    </div>
                    <p className={cn("text-[10px] font-black uppercase tracking-widest", product.quantity <= product.lowStockThreshold ? "text-red-500" : "text-green-500")}>
                      {product.quantity} units
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => addToCart(product)}
                  className={cn(
                    "group card p-3 cursor-pointer border-border/40 hover:border-primary/50 transition-all hover:shadow-md flex items-center gap-4",
                    product.quantity <= 0 && "opacity-50 grayscale pointer-events-none"
                  )}
                >
                  <div className="h-12 w-12 bg-muted/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package size={24} className="text-muted-fg/20" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-sm tracking-tight truncate">{product.name}</h3>
                    <p className="text-[10px] text-muted-fg font-mono opacity-60 uppercase tracking-widest">#{product.barcode}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-primary">{formatCurrency(product.price)}</p>
                    <p className={cn("text-[10px] font-black uppercase tracking-widest", product.quantity <= product.lowStockThreshold ? "text-red-500" : "text-green-500")}>
                      {product.quantity} units
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-96 flex flex-col space-y-6 overflow-hidden">
        <div className="card flex-1 flex flex-col p-0 overflow-hidden border-primary/20 shadow-xl bg-muted/5">
          <div className="p-4 border-b border-border/50 bg-muted/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} className="text-primary" />
              <h3 className="font-black uppercase tracking-widest text-xs">Current Cart</h3>
            </div>
            <span className="text-[10px] font-black bg-primary text-primary-fg px-2 py-0.5 rounded-full uppercase tracking-widest">
              {cart.length} Items
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {cart.map((item) => (
              <motion.div 
                key={item.product.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-2 pb-4 border-b border-border/30 last:border-0"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-black tracking-tight truncate">{item.product.name}</h4>
                    <p className="text-[10px] font-bold text-primary">{formatCurrency(item.product.price)}</p>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-muted-fg hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 bg-bg p-1 rounded-lg border border-border/50">
                    <button 
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-6 h-6 flex items-center justify-center hover:bg-muted rounded transition-all"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-xs font-black min-w-[1.5rem] text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-6 h-6 flex items-center justify-center hover:bg-muted rounded transition-all"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Disc:</span>
                    <input 
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.discount}
                      onChange={(e) => updateItemDiscount(item.product.id, parseFloat(e.target.value) || 0)}
                      className="w-16 bg-bg border border-border/50 rounded px-1 py-0.5 text-[10px] font-bold focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black tracking-tight">{formatCurrency((item.product.price * item.quantity) - item.discount)}</p>
                </div>
              </motion.div>
            ))}
            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                <ShoppingCart size={48} />
                <p className="text-xs font-black uppercase tracking-widest">Cart is Empty</p>
              </div>
            )}
          </div>

          <div className="p-6 bg-muted/10 border-t border-border/50 space-y-4">
            <div className="flex justify-between text-xs font-bold text-muted-fg">
              <span className="uppercase tracking-widest opacity-60">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="pt-4 border-t border-border/50 flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-fg mb-1">Total Payable</p>
                <p className="text-2xl font-black tracking-tighter text-primary">{formatCurrency(total)}</p>
              </div>
              <Link 
                to="/cart"
                className={cn(
                  "btn btn-primary px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center gap-2",
                  cart.length === 0 && "pointer-events-none opacity-50"
                )}
              >
                Checkout
                <ShoppingCart size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

