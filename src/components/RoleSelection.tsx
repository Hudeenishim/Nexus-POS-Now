import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, User as UserIcon, Briefcase, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { cn } from '../lib/utils';

export const RoleSelection = () => {
  const { user, updateUserRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'admin' | 'manager' | 'cashier' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roles = [
    {
      id: 'admin',
      title: 'Administrator',
      description: 'Full system access, inventory management, and reports.',
      icon: ShieldCheck,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
    },
    {
      id: 'manager',
      title: 'Manager',
      description: 'Manage inventory, suppliers, and view basic reports.',
      icon: Briefcase,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      id: 'cashier',
      title: 'Cashier',
      description: 'Access to POS terminal and customer management.',
      icon: UserIcon,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
  ];

  const handleConfirm = async () => {
    if (!selectedRole) return;
    setIsSubmitting(true);
    try {
      await updateUserRole(selectedRole as any);
    } catch (error) {
      console.error('Failed to set role:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full space-y-12"
      >
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-fg to-muted-fg uppercase">
            WELCOME, {user?.name || 'USER'}
          </h1>
          <p className="text-muted-fg font-bold uppercase tracking-widest text-xs">
            Select your primary responsibility to initialize your workspace
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role) => (
            <motion.button
              key={role.id}
              whileHover={{ y: -8 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedRole(role.id as any)}
              className={cn(
                "relative flex flex-col items-center p-8 rounded-3xl border-2 transition-all text-center space-y-6",
                selectedRole === role.id 
                  ? "border-primary bg-primary/5 shadow-2xl shadow-primary/10" 
                  : "border-border/50 hover:border-primary/40 bg-muted/20"
              )}
            >
              <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner", role.bg, role.color)}>
                <role.icon size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="font-black text-lg tracking-tight uppercase">{role.title}</h3>
                <p className="text-xs text-muted-fg font-medium leading-relaxed">
                  {role.description}
                </p>
              </div>
              {selectedRole === role.id && (
                <motion.div 
                  layoutId="role-check"
                  className="absolute -top-3 -right-3 w-8 h-8 bg-primary text-primary-fg rounded-full flex items-center justify-center shadow-lg"
                >
                  <ShieldCheck size={16} />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>

        <div className="flex justify-center pt-8">
          <button
            disabled={!selectedRole || isSubmitting}
            onClick={handleConfirm}
            className="group relative px-12 py-4 bg-primary text-primary-fg rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 disabled:opacity-50 disabled:grayscale transition-all flex items-center gap-3"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <span>Initialize Workspace</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
