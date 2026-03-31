import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, ShoppingCart, Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from './AuthProvider';
import { useCart } from './CartContext';
import { useTheme } from './ThemeProvider';
import { cn } from '../lib/utils';

export const Header = ({ onMenuClick }: { onMenuClick?: () => void }) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { cart } = useCart();
  const location = useLocation();

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="h-20 glass sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between transition-all duration-300 border-b border-border/50">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 hover:bg-muted rounded-xl transition-colors text-muted-fg hover:text-fg"
        >
          <Menu size={24} />
        </button>
        <div className="hidden md:block">
          <h2 className="text-sm font-black text-muted-fg uppercase tracking-[0.2em]">Nexus Terminal</h2>
          <p className="text-[10px] text-muted-fg/40 font-mono tracking-widest">v2.4.0-stable // SYSTEM_READY</p>
        </div>
        <div className="md:hidden">
          <h2 className="text-xs font-black text-muted-fg uppercase tracking-widest">Nexus</h2>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-full bg-muted/30 border border-border/50 shadow-inner">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-fg opacity-80">Online</span>
        </div>

        <div className="hidden sm:block h-8 w-px bg-border/50" />

        <Link 
          to="/cart"
          className={cn(
            "relative p-2.5 rounded-xl transition-all border border-transparent hover:border-border group",
            location.pathname === '/cart' ? "bg-primary text-primary-fg" : "hover:bg-muted text-muted-fg hover:text-fg"
          )}
        >
          <ShoppingCart size={20} className={cn("transition-transform duration-300", location.pathname === '/cart' ? "scale-110" : "group-hover:scale-110")} />
          {cartItemCount > 0 && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg border-2 border-bg"
            >
              {cartItemCount > 99 ? '99+' : cartItemCount}
            </motion.div>
          )}
        </Link>

        <button 
          onClick={toggleTheme}
          className="p-2.5 hover:bg-muted rounded-xl transition-all text-muted-fg hover:text-fg border border-transparent hover:border-border group"
        >
          {theme === 'dark' ? <Sun size={20} className="group-hover:rotate-90 transition-transform duration-500" /> : <Moon size={20} className="group-hover:-rotate-12 transition-transform duration-500" />}
        </button>
      </div>
    </header>
  );
};
