import * as React from 'react';
import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDocFromServer } from 'firebase/firestore';

// Providers
import { AuthProvider, useAuth } from './components/AuthProvider';
import { ThemeProvider } from './components/ThemeProvider';
import { CartProvider, useCart } from './components/CartContext';

// Components
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { RoleSelection } from './components/RoleSelection';
import { ErrorBoundary } from './components/ErrorBoundary';

// Pages - Lazy Loaded
const LoginPage = lazy(() => import('./components/LoginPage').then(m => ({ default: m.LoginPage })));
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const POS = lazy(() => import('./components/POS').then(m => ({ default: m.POS })));
const CartPage = lazy(() => import('./components/CartPage').then(m => ({ default: m.CartPage })));
const Inventory = lazy(() => import('./components/Inventory').then(m => ({ default: m.Inventory })));
const Suppliers = lazy(() => import('./components/Suppliers').then(m => ({ default: m.Suppliers })));
const Customers = lazy(() => import('./components/Customers').then(m => ({ default: m.Customers })));
const Reports = lazy(() => import('./components/Reports').then(m => ({ default: m.Reports })));
const SettingsPage = lazy(() => import('./components/Settings').then(m => ({ default: m.SettingsPage })));
const PrintPage = lazy(() => import('./components/PrintPage').then(m => ({ default: m.PrintPage })));

// Lib & Firebase
import { db } from './firebase';
import { cn } from './lib/utils';
import { UserRole } from './types';

const LoadingFallback = () => (
  <div className="h-screen w-full flex items-center justify-center bg-bg">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-black tracking-widest uppercase opacity-50 animate-pulse">Initializing Nexus...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: UserRole[] }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center font-bold tracking-tighter text-2xl animate-pulse">NEXUS</div>;
  if (!user) return <Navigate to="/login" />;
  if (!user.role) return <RoleSelection />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;
  return <>{children}</>;
};

const AppContent = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Auto-close sidebar on mobile
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error: any) {
        if (error.message.includes('the client is offline')) {
          toast.error("Firebase connection failed. Please check your configuration.");
        }
      }
    }
    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      {user && <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} mobile={window.innerWidth < 768} />}
      <div className={cn(
        "transition-all duration-500", 
        user ? (sidebarOpen ? "md:ml-64" : "md:ml-20") : ""
      )}>
        {user && <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />}
        <main className={cn("p-2 sm:p-4 md:p-8", !user ? "p-0" : "")}>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
              <Route path="/print/:saleId" element={<PrintPage />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/pos" element={<ProtectedRoute><POS /></ProtectedRoute>} />
              <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
              <Route path="/inventory" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><Inventory /></ProtectedRoute>} />
              <Route path="/suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
              <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'cashier']}><Reports /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><SettingsPage /></ProtectedRoute>} />
            </Routes>
          </Suspense>
        </main>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
