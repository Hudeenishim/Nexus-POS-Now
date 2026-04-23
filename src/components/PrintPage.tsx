import * as React from 'react';
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDoc, doc, getDocs, query, collection, where } from 'firebase/firestore';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { db, auth } from '../firebase';
import { Sale, SaleItem } from '../types';
import { handleFirestoreError, OperationType } from '../lib/utils';
import { ReceiptContent } from './Receipt';

export const PrintPage = () => {
  const { saleId } = useParams<{ saleId: string }>();
  const [data, setData] = useState<{ sale: Sale; items: SaleItem[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!saleId) return;
      setLoading(true);
      setError(null);
      try {
        const saleDoc = await getDoc(doc(db, 'sales', saleId)).catch(e => {
          console.error("Firestore getDoc error:", e);
          return null;
        });
        
        if (saleDoc && saleDoc.exists()) {
          const sale = { id: saleDoc.id, ...saleDoc.data() } as Sale;
          const itemsSnapshot = await getDocs(query(collection(db, 'sales_items'), where('saleId', '==', saleId))).catch(e => {
            console.error("Firestore getDocs error:", e);
            return null;
          });
          const items = itemsSnapshot ? itemsSnapshot.docs.map(d => d.data() as SaleItem) : [];
          setData({ sale, items });
        } else {
          setError("Invoice not found in the database. It might have been deleted or the ID is incorrect.");
        }
      } catch (err) {
        console.error('Error loading invoice:', err);
        setError("An unexpected error occurred while loading the invoice.");
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

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <div className="font-bold tracking-tighter text-2xl animate-pulse uppercase">Verifying Invoice...</div>
    </div>
  );
  
  if (error || !data) return (
    <div className="h-screen flex flex-col items-center justify-center p-4 space-y-6 text-center">
      <div className="h-20 w-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
        <AlertCircle size={40} />
      </div>
      <div className="space-y-2 max-w-md">
        <h2 className="text-2xl font-bold">Invoice Not Found</h2>
        <p className="text-sm text-muted-fg leading-relaxed">
          {error || "We couldn't retrieve the details for this invoice. Please check the ID and try again."}
        </p>
      </div>
      <div className="text-xs font-mono bg-muted p-3 rounded-lg border border-border">
        REF: {saleId || 'NULL'}
      </div>
      <div className="flex gap-4">
        <Link to="/" className="btn btn-primary px-8">Dashboard</Link>
        <button onClick={() => window.location.reload()} className="btn btn-ghost border border-border">Retry</button>
      </div>
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
