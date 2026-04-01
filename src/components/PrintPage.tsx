import * as React from 'react';
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDoc, doc, getDocs, query, collection, where } from 'firebase/firestore';
import { toast } from 'sonner';
import { db, auth } from '../firebase';
import { Sale, SaleItem } from '../types';
import { handleFirestoreError, OperationType } from '../lib/utils';
import { ReceiptContent } from './Receipt';

export const PrintPage = () => {
  const { saleId } = useParams<{ saleId: string }>();
  const [data, setData] = useState<{ sale: Sale; items: SaleItem[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!saleId) return;
      try {
        const saleDoc = await getDoc(doc(db, 'sales', saleId)).catch(e => handleFirestoreError(e, OperationType.GET, `sales/${saleId}`, auth));
        if (saleDoc && saleDoc.exists()) {
          const sale = { id: saleDoc.id, ...saleDoc.data() } as Sale;
          const itemsSnapshot = await getDocs(query(collection(db, 'sales_items'), where('saleId', '==', saleId))).catch(e => handleFirestoreError(e, OperationType.GET, 'sales_items', auth));
          const items = itemsSnapshot ? itemsSnapshot.docs.map(d => d.data() as SaleItem) : [];
          setData({ sale, items });
        }
      } catch (error) {
        console.error('Error loading invoice:', error);
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
