import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="card max-w-sm w-full relative z-10 space-y-6 text-center shadow-2xl"
          >
            <div className="flex flex-col items-center gap-4">
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${isDestructive ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'} border ${isDestructive ? 'border-red-500/20' : 'border-primary/20'} shadow-inner`}>
                <AlertCircle size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black tracking-tight uppercase leading-none">{title}</h3>
                <p className="text-sm text-muted-fg leading-relaxed">{message}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={onClose}
                className="btn btn-ghost border border-border py-3 rounded-xl font-black uppercase tracking-widest text-[10px]"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`btn py-3 rounded-xl font-black uppercase tracking-widest text-[10px] ${isDestructive ? 'bg-red-500 text-white hover:bg-red-600 border-none' : 'btn-primary'}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
