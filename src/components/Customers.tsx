import * as React from 'react';
import { useState, useEffect } from 'react';
import { 
  query, 
  collection, 
  orderBy, 
  onSnapshot, 
  addDoc 
} from 'firebase/firestore';
import { 
  Plus, 
  Smartphone, 
  Settings 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { auth, db } from '../firebase';
import { Customer } from '../types';
import { handleFirestoreError, isValidGhanaPhone, isValidEmail, OperationType } from '../lib/utils';

export const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '' });

  useEffect(() => {
    const q = query(collection(db, 'customers'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'customers', auth));
    return unsubscribe;
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidGhanaPhone(newCustomer.phone)) {
      toast.error('Please enter a valid Ghanaian phone number');
      return;
    }
    if (newCustomer.email && !isValidEmail(newCustomer.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    try {
      await addDoc(collection(db, 'customers'), { 
        ...newCustomer, 
        loyaltyPoints: 0,
        createdAt: new Date().toISOString()
      }).catch(e => handleFirestoreError(e, OperationType.CREATE, 'customers', auth));
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
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-muted-fg">Name <span className="text-red-500">*</span></label>
                  <input required placeholder="Full Name" className="input" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-muted-fg">Phone <span className="text-red-500">*</span></label>
                  <input 
                    required 
                    placeholder="0244123456" 
                    className="input" 
                    value={newCustomer.phone} 
                    onChange={e => setNewCustomer({...newCustomer, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
                    maxLength={10}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-muted-fg">Email (Optional)</label>
                  <input type="email" placeholder="customer@example.com" className="input" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-muted-fg">Address</label>
                  <textarea placeholder="Physical Address" className="input" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} />
                </div>
                <button type="submit" className="btn btn-primary w-full">Save Customer</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

