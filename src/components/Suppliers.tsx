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
  Truck, 
  Settings, 
  Trash2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { auth, db } from '../firebase';
import { useAuth } from './AuthProvider';
import { Supplier } from '../types';
import { handleFirestoreError, isValidGhanaPhone, isValidEmail, OperationType } from '../lib/utils';
import { ConfirmModal } from './ConfirmModal';

export const Suppliers = () => {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: '',
  });
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
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSuppliers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'suppliers', auth));
    return unsubscribe;
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidGhanaPhone(newSupplier.phone)) {
      toast.error('Please enter a valid Ghanaian phone number');
      return;
    }
    if (newSupplier.email && !isValidEmail(newSupplier.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
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
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button onClick={() => { setShowAdd(true); setEditingSupplier(null); }} className="btn btn-primary gap-2">
            <Plus size={20} /> Add Supplier
          </button>
        )}
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
                {(user?.role === 'admin' || user?.role === 'manager') && (
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
                )}
                {(user?.role === 'admin' || user?.role === 'manager' || user?.email === 'salahnapari@gmail.com') && (
                  <button onClick={() => setDeleteConfirmation({ isOpen: true, id: supplier.id, name: supplier.name })} className="p-2 hover:bg-red-500/10 rounded-xl text-muted-fg hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                )}
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
                  <label className="text-xs font-bold uppercase text-muted-fg">Supplier Name <span className="text-red-500">*</span></label>
                  <input required className="input" value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-fg">Contact Person <span className="text-red-500">*</span></label>
                    <input required className="input" value={newSupplier.contactPerson} onChange={e => setNewSupplier({...newSupplier, contactPerson: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-fg">Phone <span className="text-red-500">*</span></label>
                    <input 
                      required 
                      className="input" 
                      value={newSupplier.phone} 
                      onChange={e => setNewSupplier({...newSupplier, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
                      maxLength={10}
                    />
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
      <ConfirmModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ ...deleteConfirmation, isOpen: false })}
        title="Delete Supplier"
        message={`Are you sure you want to delete ${deleteConfirmation.name}? This might affect products linked to this supplier.`}
        confirmText="Delete Supplier"
        isDestructive={true}
        onConfirm={async () => {
          try {
            await deleteDoc(doc(db, 'suppliers', deleteConfirmation.id)).catch(e => handleFirestoreError(e, OperationType.DELETE, `suppliers/${deleteConfirmation.id}`, auth));
            toast.success('Supplier deleted');
          } catch (error) {
            console.error(error);
            if (!(error instanceof Error && error.message.startsWith('{'))) {
              toast.error('Failed to delete supplier');
            }
          }
        }}
      />
    </div>
  );
};
