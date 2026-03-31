import * as React from 'react';
import { useState, useEffect } from 'react';
import { 
  query, 
  collection, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc 
} from 'firebase/firestore';
import { 
  Plus, 
  Package, 
  QrCode, 
  Edit3, 
  Trash2, 
  X, 
  AlertCircle,
  Download,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { auth, db } from '../firebase';
import { useAuth } from './AuthProvider';
import { Product, Supplier } from '../types';
import { cn, formatCurrency, handleFirestoreError, OperationType } from '../lib/utils';

export const Inventory = () => {
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
                  <td className="p-5 font-black text-base tracking-tighter">{formatCurrency(product.price)}</td>
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
                        <Edit3 size={18} />
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
              className="card max-w-xl w-full relative z-10 space-y-8"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <Plus size={20} />
                  </div>
                  <h3 className="text-2xl font-black tracking-tight uppercase">Add New Product</h3>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddProduct} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-fg ml-1">Product Name <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required 
                      className="input" 
                      placeholder="e.g. Coca Cola 500ml"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-fg ml-1">Category <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required 
                      className="input" 
                      placeholder="e.g. Beverages"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-fg ml-1">Price (GHC) <span className="text-red-500">*</span></label>
                    <input 
                      type="number" 
                      step="0.01" 
                      required 
                      className="input" 
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-fg ml-1">Initial Quantity <span className="text-red-500">*</span></label>
                    <input 
                      type="number" 
                      required 
                      className="input" 
                      value={newProduct.quantity}
                      onChange={(e) => setNewProduct({ ...newProduct, quantity: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-fg ml-1">Barcode <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required 
                      className="input" 
                      placeholder="Scan or type barcode"
                      value={newProduct.barcode}
                      onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-fg ml-1">Low Stock Threshold <span className="text-red-500">*</span></label>
                    <input 
                      type="number" 
                      required 
                      className="input" 
                      value={newProduct.lowStockThreshold}
                      onChange={(e) => setNewProduct({ ...newProduct, lowStockThreshold: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-fg ml-1">Supplier</label>
                    <select 
                      className="input"
                      value={newProduct.supplierId}
                      onChange={(e) => setNewProduct({ ...newProduct, supplierId: e.target.value })}
                    >
                      <option value="">Select a supplier</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs">
                  Create Product
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              className="card max-w-xl w-full relative z-10 space-y-8"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <Edit3 size={20} />
                  </div>
                  <h3 className="text-2xl font-black tracking-tight uppercase">Edit Product</h3>
                </div>
                <button onClick={() => setEditingProduct(null)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleEditProduct} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-fg ml-1">Product Name <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required 
                      className="input" 
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-fg ml-1">Category <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required 
                      className="input" 
                      value={editingProduct.category}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-fg ml-1">Price (GHC) <span className="text-red-500">*</span></label>
                    <input 
                      type="number" 
                      step="0.01" 
                      required 
                      className="input" 
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-fg ml-1">Quantity <span className="text-red-500">*</span></label>
                    <input 
                      type="number" 
                      required 
                      className="input" 
                      value={editingProduct.quantity}
                      onChange={(e) => setEditingProduct({ ...editingProduct, quantity: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-fg ml-1">Barcode <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required 
                      className="input" 
                      value={editingProduct.barcode}
                      onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-fg ml-1">Low Stock Threshold <span className="text-red-500">*</span></label>
                    <input 
                      type="number" 
                      required 
                      className="input" 
                      value={editingProduct.lowStockThreshold}
                      onChange={(e) => setEditingProduct({ ...editingProduct, lowStockThreshold: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-fg ml-1">Supplier</label>
                    <select 
                      className="input"
                      value={editingProduct.supplierId || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, supplierId: e.target.value })}
                    >
                      <option value="">Select a supplier</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs">
                  Update Product
                </button>
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
              className="card max-w-sm w-full relative z-10 space-y-8 text-center"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black tracking-tight uppercase">Product QR Code</h3>
                <button onClick={() => setSelectedProductForQR(null)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="bg-white p-8 rounded-3xl inline-block mx-auto shadow-inner border border-border/50">
                <QRCodeSVG 
                  value={selectedProductForQR.barcode} 
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="space-y-2">
                <p className="font-black text-lg tracking-tight">{selectedProductForQR.name}</p>
                <p className="text-xs text-muted-fg font-mono uppercase tracking-widest opacity-60">#{selectedProductForQR.barcode}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button className="btn btn-ghost border border-border gap-2 py-3">
                  <Download size={16} /> <span className="text-[10px] uppercase font-black">Download</span>
                </button>
                <button onClick={() => window.print()} className="btn btn-primary gap-2 py-3">
                  <Printer size={16} /> <span className="text-[10px] uppercase font-black">Print</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
