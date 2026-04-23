import * as React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart, 
  Trash2, 
  Package, 
  Minus, 
  Plus, 
  Banknote, 
  Smartphone, 
  CheckCircle2, 
  Loader2, 
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useAuth } from './AuthProvider';
import { useCart } from './CartContext';
import { db, auth } from '../firebase';
import {
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  increment, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { Sale, SaleItem } from '../types';
import { cn, formatCurrency, OperationType, handleFirestoreError } from '../lib/utils';
import { Receipt } from './Receipt';

export const CartPage = () => {
  const { user } = useAuth();
  const { cart, removeFromCart, updateQuantity, updateItemDiscount, cartDiscount, setCartDiscount, clearCart, subtotal, tax, total } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mtn_momo' | 'telecel_cash'>('cash');
  const [paymentPhone, setPaymentPhone] = useState(user?.phoneNumber || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSale, setLastSale] = useState<{ sale: Sale; items: SaleItem[] } | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!user) return;

    setIsProcessing(true);
    try {
      if (paymentMethod === 'mtn_momo' || paymentMethod === 'telecel_cash') {
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
              { display_name: "Customer Phone", variable_name: "customer_phone", value: paymentPhone || user.phoneNumber || "" },
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
      const saleData = {
        date: new Date().toISOString(),
        userId: user.uid,
        totalAmount: total,
        paymentMethod,
        paymentReference: paymentRef || null,
        discount: cartDiscount,
        tax,
        createdAt: new Date().toISOString()
      };
      const saleRef = await addDoc(collection(db, 'sales'), saleData).catch(e => handleFirestoreError(e, OperationType.CREATE, 'sales', auth));
      if (!saleRef) return;

      for (const item of cart) {
        await addDoc(collection(db, 'sales_items'), {
          saleId: saleRef.id,
          userId: user.uid,
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          discount: item.discount,
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
      clearCart();
      setShowSuccessAnimation(true);
      
      const itemsSnapshot = await getDocs(query(collection(db, 'sales_items'), where('saleId', '==', saleRef.id))).catch(e => handleFirestoreError(e, OperationType.GET, 'sales_items', auth));
      const items = itemsSnapshot ? itemsSnapshot.docs.map(d => d.data() as SaleItem) : [];
      setLastSale({ sale: { id: saleRef.id, ...saleData } as Sale, items });
    } catch (error) {
      console.error(error);
      toast.error('Transaction failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (showSuccessAnimation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 text-center">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-green-500/20"
        >
          <CheckCircle2 size={64} />
        </motion.div>
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tighter">Sale Successful!</h2>
          <p className="text-muted-fg font-medium">The transaction has been processed and recorded.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowSuccessAnimation(false)}
            className="btn btn-primary px-8"
          >
            New Sale
          </button>
          <Link to="/reports" className="btn btn-ghost border border-border px-8">
            View Reports
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-primary-fg shadow-xl shadow-primary/20">
            <ShoppingCart size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight">Checkout Terminal</h2>
            <p className="text-muted-fg font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {cart.length} {cart.length === 1 ? 'item' : 'items'} ready for processing
            </p>
          </div>
        </div>
        <button 
          onClick={() => clearCart()}
          disabled={cart.length === 0}
          className="btn btn-ghost text-red-500 gap-2 font-bold uppercase tracking-widest text-xs hover:bg-red-500/10 disabled:opacity-30"
        >
          <Trash2 size={18} />
          Clear Terminal
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-0 overflow-hidden border-border/40 shadow-xl bg-muted/5">
            <div className="p-6 border-b border-border/50 bg-muted/10 flex items-center justify-between">
              <h3 className="font-black uppercase tracking-widest text-xs opacity-60">Aggregated Items</h3>
              <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-1 rounded-full uppercase tracking-widest">Live Sync</span>
            </div>
            <div className="divide-y divide-border/50">
              {cart.map((item) => (
                <motion.div 
                  key={item.product.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center group hover:bg-muted/20 transition-colors"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-muted flex items-center justify-center text-muted-fg border border-border/50 group-hover:scale-105 transition-transform">
                    <Package size={28} className="sm:w-8 sm:h-8" />
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <h4 className="text-base sm:text-lg md:text-xl font-black tracking-tight group-hover:text-primary transition-colors break-words">{item.product.name}</h4>
                    <div className="flex items-center gap-2">
                      <p className="text-xs sm:text-sm text-muted-fg font-bold uppercase tracking-widest opacity-60">{item.product.category}</p>
                      <span className="w-1 h-1 rounded-full bg-muted-fg/30" />
                      <p className="text-xs sm:text-sm font-black text-primary">{formatCurrency(item.product.price)}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Item Discount:</label>
                      <input 
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.discount || 0}
                        onChange={(e) => updateItemDiscount(item.product.id, Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-20 bg-muted/50 border-border/50 rounded-lg px-2 py-1 text-xs font-bold focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-bg p-2 rounded-2xl border border-border/50 shadow-sm">
                    <button 
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-10 h-10 flex items-center justify-center hover:bg-muted rounded-xl transition-all"
                    >
                      <Minus size={18} />
                    </button>
                    <span className="text-lg font-black min-w-[2rem] text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-10 h-10 flex items-center justify-center hover:bg-muted rounded-xl transition-all"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="text-right min-w-[100px] sm:min-w-[120px] w-full sm:w-auto">
                    <p className="text-lg sm:text-xl md:text-2xl font-black tracking-tighter">{formatCurrency(item.product.price * item.quantity)}</p>
                    <button 
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-[10px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest mt-2 flex items-center gap-1 ml-auto"
                    >
                      <Trash2 size={12} />
                      Remove
                    </button>
                  </div>
                </motion.div>
              ))}
              {cart.length === 0 && (
                <div className="p-24 text-center space-y-6 opacity-40">
                  <div className="w-28 h-28 bg-muted rounded-full flex items-center justify-center mx-auto border-4 border-dashed border-border">
                    <ShoppingCart size={56} />
                  </div>
                  <div className="space-y-2">
                    <p className="font-black text-xl uppercase tracking-widest">Terminal is Empty</p>
                    <p className="text-sm font-medium">Return to the POS screen to scan or select products</p>
                  </div>
                  <Link to="/pos" className="btn btn-primary mt-4 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 mx-auto w-fit">
                    Go to POS
                    <ArrowRight size={16} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card space-y-8 border-primary/20 shadow-2xl shadow-primary/5 sticky top-28">
            <div className="space-y-2">
              <h3 className="text-2xl font-black tracking-tight">Order Summary</h3>
              <p className="text-[10px] font-bold text-muted-fg uppercase tracking-widest opacity-60">Transaction Details</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between text-sm font-bold text-muted-fg">
                <span className="uppercase tracking-widest opacity-60">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold text-muted-fg">
                  <span className="uppercase tracking-widest opacity-60">Cart Discount</span>
                  <span className="text-red-500">-{formatCurrency(cartDiscount)}</span>
                </div>
                <input 
                  type="number"
                  min="0"
                  step="0.01"
                  value={cartDiscount || 0}
                  onChange={(e) => setCartDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="Enter discount amount"
                  className="w-full bg-muted/50 border-border/50 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
              <div className="flex justify-between text-sm font-bold text-muted-fg">
                <span className="uppercase tracking-widest opacity-60">Tax (8%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="pt-6 border-t border-border/50 flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-fg mb-1">Total Payable</p>
                  <p className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter text-primary">{formatCurrency(total)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-border/50">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-fg">Select Payment Method</p>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'cash', name: 'Cash Payment', icon: Banknote, desc: 'Physical currency' },
                  { id: 'mtn_momo', name: 'MTN MoMo', icon: Smartphone, desc: 'Mobile Money' },
                  { id: 'telecel_cash', name: 'Telecel Cash', icon: Smartphone, desc: 'Mobile Money' }
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => {
                      setPaymentMethod(method.id as any);
                      if (!paymentPhone && user?.phoneNumber) setPaymentPhone(user.phoneNumber);
                    }}
                    className={cn(
                      "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left group relative overflow-hidden",
                      paymentMethod === method.id 
                        ? "border-primary bg-primary/10 shadow-xl shadow-primary/10 ring-2 ring-primary/20" 
                        : "border-border/50 hover:border-primary/40 bg-muted/20"
                    )}
                  >
                    <div className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center transition-all shadow-sm",
                      paymentMethod === method.id 
                        ? "bg-primary text-primary-fg scale-110" 
                        : "bg-bg text-muted-fg group-hover:bg-primary/10 group-hover:text-primary"
                    )}>
                      <method.icon size={28} />
                    </div>
                    <div className="flex-1">
                      <p className={cn("font-black text-base sm:text-lg tracking-tight", paymentMethod === method.id ? "text-primary" : "text-fg")}>{method.name}</p>
                      <p className="text-[10px] font-bold text-muted-fg uppercase tracking-widest opacity-60">{method.desc}</p>
                    </div>
                    {paymentMethod === method.id && (
                      <motion.div 
                        layoutId="active-payment-check"
                        className="w-8 h-8 bg-primary text-primary-fg rounded-full flex items-center justify-center shadow-lg"
                      >
                        <CheckCircle2 size={18} />
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>

              {(paymentMethod === 'mtn_momo' || paymentMethod === 'telecel_cash') && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2 pt-2"
                >
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-fg ml-1">Payment Phone Number</label>
                  <div className="relative group">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg group-focus-within:text-primary transition-colors" size={18} />
                    <input 
                      type="tel"
                      value={paymentPhone}
                      onChange={(e) => setPaymentPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="0244123456"
                      maxLength={10}
                      className="input !pl-10 h-12 font-bold tracking-widest"
                    />
                  </div>
                </motion.div>
              )}
            </div>

            <button 
              onClick={handleCheckout}
              disabled={isProcessing || cart.length === 0}
              className="btn btn-primary w-full py-6 sm:py-8 rounded-2xl font-black text-lg sm:text-xl uppercase tracking-widest shadow-2xl shadow-primary/30 relative overflow-hidden group disabled:opacity-50"
            >
              <AnimatePresence mode="wait">
                {isProcessing ? (
                  <motion.div 
                    key="processing"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-3"
                  >
                    <Loader2 className="animate-spin" size={28} />
                    <span>Processing...</span>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="ready"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-center gap-3"
                  >
                    <ShieldCheck size={28} />
                    <span>Complete Transaction</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12" />
            </button>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {showSuccessAnimation && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="card max-w-md w-full relative z-10 text-center space-y-8 p-12 border-primary/50 shadow-[0_0_50px_rgba(var(--primary),0.3)] rounded-[2rem]"
            >
              <div className="w-28 h-28 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary border-4 border-primary/20">
                <CheckCircle2 size={72} className="animate-bounce" />
              </div>
              <div className="space-y-2">
                <h2 className="text-5xl font-black tracking-tighter text-primary">SUCCESS!</h2>
                <p className="text-muted-fg font-black uppercase tracking-[0.2em] text-xs">Transaction completed successfully</p>
              </div>
              <div className="pt-8 flex flex-col gap-4">
                <button 
                  onClick={() => setShowSuccessAnimation(false)}
                  className="btn btn-primary w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20"
                >
                  New Transaction
                </button>
                {lastSale && (
                  <button 
                    onClick={() => {
                      setShowSuccessAnimation(false);
                    }}
                    className="btn bg-muted/50 hover:bg-muted w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm border border-border/50"
                  >
                    Print Receipt
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lastSale && (
          <Receipt 
            sale={lastSale.sale}
            items={lastSale.items}
            onClose={() => setLastSale(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
