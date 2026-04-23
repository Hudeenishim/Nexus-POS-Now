import * as React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'motion/react';
import { Sale, SaleItem } from '../types';
import { formatDate, formatCurrency } from '../lib/utils';

export const ReceiptContent = ({ sale, items }: { sale: Sale; items: SaleItem[] }) => {
  return (
    <div 
      className="bg-white text-black w-full max-w-sm p-8 rounded-none shadow-2xl relative z-10 font-mono text-sm mx-auto border border-black/10"
      id="receipt-content"
    >
      <div className="text-center space-y-2 border-b-2 border-dashed border-black pb-6 mb-6">
        <h2 className="text-3xl font-black uppercase tracking-tighter text-black">NEXUS POS</h2>
        <p className="text-sm font-bold text-black">OFFICIAL INVOICE</p>
        <p className="text-[10px] text-black">123 Innovation Drive, Tech City</p>
        <p className="text-[10px] text-black">Tel: +1 234 567 890</p>
      </div>

      <div className="space-y-2 mb-6 text-xs text-black border-b border-black/10 pb-4">
        <div className="flex justify-between">
          <span className="font-bold uppercase opacity-60">Date:</span>
          <span className="font-bold">{formatDate(sale.date)}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold uppercase opacity-60">Invoice #:</span>
          <span className="font-bold">{sale.id.toUpperCase().slice(0, 12)}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold uppercase opacity-60">Method:</span>
          <span className="font-bold uppercase">{sale.paymentMethod.replace('_', ' ')}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold uppercase opacity-60">Cashier:</span>
          <span className="font-bold">{sale.userId.slice(-6).toUpperCase()}</span>
        </div>
      </div>

      <div className="border-b-2 border-black pb-2 mb-4">
        <div className="grid grid-cols-6 font-black text-[10px] uppercase tracking-wider text-black">
          <span className="col-span-3">Item</span>
          <span className="text-center">Qty</span>
          <span className="col-span-2 text-right">Total</span>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {items.map((item, i) => (
          <div key={i} className="grid grid-cols-6 text-xs leading-tight text-black items-center">
            <div className="col-span-3">
              <p className="font-black uppercase">{item.productName}</p>
              <p className="text-[10px] font-bold opacity-60">@{formatCurrency(item.price)}</p>
              {item.discount > 0 && (
                <p className="text-[9px] font-bold text-black/60 italic">Discount: -{formatCurrency(item.discount)}</p>
              )}
            </div>
            <span className="text-center font-black">x{item.quantity}</span>
            <span className="col-span-2 text-right font-black">
              {formatCurrency((item.price * item.quantity) - item.discount)}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t-2 border-dashed border-black pt-6 space-y-3 text-black">
        <div className="flex justify-between text-xs font-bold">
          <span className="uppercase opacity-60">Subtotal:</span>
          <span>{formatCurrency(sale.totalAmount - sale.tax + sale.discount)}</span>
        </div>
        {sale.discount > 0 && (
          <div className="flex justify-between text-xs font-bold">
            <span className="uppercase opacity-60">Discount:</span>
            <span>-{formatCurrency(sale.discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-xs font-bold">
          <span className="uppercase opacity-60">Tax (8%):</span>
          <span>{formatCurrency(sale.tax)}</span>
        </div>
        <div className="flex justify-between text-xl font-black pt-4 border-t-2 border-black mt-2">
          <span className="tracking-tighter">TOTAL:</span>
          <span>{formatCurrency(sale.totalAmount)}</span>
        </div>
      </div>

      <div className="mt-12 text-center space-y-8 text-black">
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.2em]">Thank you!</p>
          <p className="text-[9px] font-bold opacity-60 uppercase">Please keep this for your records</p>
        </div>
        
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-white border-2 border-black rounded-xl">
            <QRCodeSVG 
              value={`${window.location.origin.replace('-dev-', '-pre-')}/print/${sale.id}`}
              size={140}
              level="H"
              includeMargin={false}
            />
          </div>
          <p className="text-[8px] font-mono font-bold opacity-40 break-all px-4">{sale.id}</p>
        </div>
      </div>
    </div>
  );
};

export const Receipt = ({ sale, items, onClose }: { sale: Sale; items: SaleItem[]; onClose: () => void }) => {
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
