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
  ShoppingCart 
} from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../firebase';
import { useCart } from './CartContext';
import { Product } from '../types';
import { cn, formatCurrency } from '../lib/utils';

export const POS = () => {
  const { addToCart } = useCart();
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
    <div className="h-full flex flex-col space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex flex-col md:flex-row gap-4">
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
        
        <div className="flex gap-3">
          <div className="flex bg-muted/30 p-1 rounded-2xl border border-border/50">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-3 rounded-xl transition-all",
                viewMode === 'grid' ? "bg-primary text-primary-fg shadow-lg" : "text-muted-fg hover:bg-muted"
              )}
              title="Grid View"
            >
              <LayoutGrid size={20} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "p-3 rounded-xl transition-all",
                viewMode === 'list' ? "bg-primary text-primary-fg shadow-lg" : "text-muted-fg hover:bg-muted"
              )}
              title="List View"
            >
              <List size={20} />
            </button>
          </div>

          <button 
            onClick={() => setIsScanning(!isScanning)}
            className={cn(
              "p-4 rounded-2xl border transition-all flex items-center gap-2 font-bold uppercase tracking-widest text-xs flex-1 md:flex-none justify-center",
              isScanning ? "bg-primary text-primary-fg border-primary shadow-lg shadow-primary/20" : "bg-muted/30 border-border/50 text-muted-fg hover:bg-muted"
            )}
          >
            <QrCode size={20} />
            <span className="hidden lg:inline">{isScanning ? "Stop Scanner" : "Scan Barcode"}</span>
          </button>
        </div>
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

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => addToCart(product)}
                className={cn(
                  "group card p-0 overflow-hidden cursor-pointer border-border/40 hover:border-primary/50 transition-all hover:shadow-2xl relative",
                  product.quantity <= 0 && "opacity-50 grayscale pointer-events-none"
                )}
              >
                <div className="aspect-square bg-muted/30 flex items-center justify-center relative overflow-hidden">
                  <Package size={64} className="text-muted-fg/20 group-hover:scale-110 group-hover:text-primary/20 transition-all duration-500" />
                  {product.quantity <= product.lowStockThreshold && product.quantity > 0 && (
                    <div className="absolute top-3 right-3 px-2 py-1 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-md shadow-lg animate-pulse">
                      Low Stock
                    </div>
                  )}
                  {product.quantity <= 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="px-3 py-1 bg-red-500 text-white text-xs font-black uppercase tracking-widest rounded-full">Out of Stock</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <button className="w-full py-3 bg-primary text-primary-fg rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                      Add to Cart
                    </button>
                  </div>
                </div>
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-black text-sm sm:text-base md:text-lg tracking-tight leading-tight group-hover:text-primary transition-colors break-words flex-1">{product.name}</h3>
                    <p className="text-xs sm:text-sm md:text-base font-black text-primary whitespace-nowrap">{formatCurrency(product.price)}</p>
                  </div>
                  <div className="pt-3 border-t border-border/50 space-y-1">
                    <p className="text-[10px] text-muted-fg font-mono opacity-60 uppercase tracking-widest">#{product.barcode}</p>
                    <p className={cn("text-[10px] font-black uppercase tracking-widest", product.quantity <= product.lowStockThreshold ? "text-red-500" : "text-green-500")}>
                      {product.quantity} units
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => addToCart(product)}
                className={cn(
                  "group card p-4 cursor-pointer border-border/40 hover:border-primary/50 transition-all hover:shadow-lg flex items-center gap-6 relative overflow-hidden",
                  product.quantity <= 0 && "opacity-50 grayscale pointer-events-none"
                )}
              >
                <div className="h-16 w-16 bg-muted/30 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                  <Package size={32} className="text-muted-fg/20 group-hover:text-primary/20 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-black text-base sm:text-lg md:text-xl tracking-tight leading-tight group-hover:text-primary transition-colors break-words">{product.name}</h3>
                      <div className="flex items-center gap-3 mt-1.5">
                        <p className="text-[10px] text-muted-fg font-mono opacity-60 uppercase tracking-widest">#{product.barcode}</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-accent/10 text-accent rounded uppercase tracking-widest border border-accent/20">
                          {product.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-8">
                      <div className="text-left sm:text-right">
                        <p className="text-lg sm:text-xl md:text-2xl font-black text-primary tracking-tighter">{formatCurrency(product.price)}</p>
                        <p className={cn("text-[10px] font-black uppercase tracking-widest mt-1", product.quantity <= product.lowStockThreshold ? "text-red-500" : "text-green-500")}>
                          {product.quantity} units in stock
                        </p>
                      </div>
                      <div className="hidden md:block">
                        <button className="btn btn-primary btn-sm px-8 font-black text-[10px] uppercase tracking-widest shadow-lg group-hover:scale-105 transition-transform">
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                {product.quantity <= product.lowStockThreshold && product.quantity > 0 && (
                  <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-black uppercase tracking-widest py-1 w-[100px] text-center transform rotate-45 translate-x-[30px] translate-y-[10px] shadow-sm">
                      Low Stock
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
