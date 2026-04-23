import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  Users,
  BarChart3,
  Settings,
  ShieldCheck,
  X,
  Menu,
  LogOut
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from './AuthProvider';
import { useCart } from './CartContext';
import { cn } from '../lib/utils';

export const Sidebar = ({ isOpen, setIsOpen, mobile }: { isOpen: boolean, setIsOpen: (open: boolean) => void, mobile?: boolean }) => {
  const { user, signOut } = useAuth();
  const { cart } = useCart();
  const location = useLocation();

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'cashier'] },
    { name: 'POS', path: '/pos', icon: ShoppingCart, roles: ['admin', 'manager', 'cashier'] },
    { name: 'Cart', path: '/cart', icon: ShoppingCart, roles: ['admin', 'manager', 'cashier'], badge: cartCount },
    { name: 'Inventory', path: '/inventory', icon: Package, roles: ['admin', 'manager', 'cashier'] },
    { name: 'Suppliers', path: '/suppliers', icon: Truck, roles: ['admin', 'manager', 'cashier'] },
    { name: 'Customers', path: '/customers', icon: Users, roles: ['admin', 'manager', 'cashier'] },
    { name: 'Reports', path: '/reports', icon: BarChart3, roles: ['admin', 'manager'] },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['admin', 'manager'] },
  ];

  const filteredItems = navItems.filter(item => user && user.role && item.roles.includes(user.role));

  return (
    <>
      {mobile && isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden"
        />
      )}

      <aside className={cn(
        "fixed left-0 top-0 h-full glass z-[70] transition-all duration-500 flex flex-col border-r border-border/50",
        isOpen ? "w-64 translate-x-0" : "w-20 -translate-x-full md:translate-x-0",
        mobile && !isOpen && "hidden"
      )}>
        <div className="p-6 flex items-center justify-between mb-4">
          {(isOpen || mobile) && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-fg shadow-lg shadow-primary/20">
                <ShieldCheck size={24} />
              </div>
              <h1 className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-fg to-muted-fg">
                NEXUS
              </h1>
            </motion.div>
          )}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-fg hover:text-fg"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => mobile && setIsOpen(false)}
                className={cn(
                  "group relative flex items-center p-3.5 rounded-2xl transition-all duration-300",
                  isActive 
                    ? "bg-primary text-primary-fg shadow-xl shadow-primary/10"
                    : "hover:bg-muted text-muted-fg hover:text-fg"
                )}
              >
                <item.icon size={22} className={cn("transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} />
                {item.badge !== undefined && item.badge > 0 && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 left-8 w-5 h-5 bg-accent text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-bg shadow-lg shadow-accent/20 z-10"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </motion.div>
                )}
                {isOpen && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="ml-4 font-bold text-sm tracking-tight"
                  >
                    {item.name}
                  </motion.span>
                )}
                {isActive && (
                  <motion.div 
                    layoutId="active-pill"
                    className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <div className={cn(
            "p-4 rounded-2xl bg-muted/30 border border-border/50 transition-all duration-300",
            !isOpen && "p-2 items-center justify-center flex"
          )}>
            {isOpen ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black border border-primary/20">
                    {user?.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black tracking-tight break-words">{user?.name || 'User'}</p>
                    <p className="text-[10px] text-muted-fg uppercase tracking-widest font-bold opacity-60">{user?.role}</p>
                  </div>
                </div>
                <button 
                  onClick={() => signOut()}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all font-bold text-xs border border-transparent hover:border-red-500/20"
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={() => signOut()}
                className="p-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                title="Sign Out"
              >
                <LogOut size={22} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
