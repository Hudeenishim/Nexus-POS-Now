// Import React library for building user interfaces
import * as React from 'react';
// Import essential hooks from React for state management, side effects, and lazy loading
import { useState, useEffect, lazy, Suspense } from 'react';
// Import routing components from react-router-dom for navigation and route management
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
// Import notification components from sonner for displaying toast messages
import { Toaster, toast } from 'sonner';
// Import essential icons from lucide-react
import { AlertCircle } from 'lucide-react';
// Import animation components from motion/react for smooth transitions and effects
import { motion, AnimatePresence } from 'motion/react';
// Import Firestore functions for interacting with the database
import { doc, getDocFromServer } from 'firebase/firestore';

// Import AuthProvider and useAuth hook for managing user authentication state
import { AuthProvider, useAuth } from './components/AuthProvider';
// Import ThemeProvider for managing application-wide themes (e.g., light/dark mode)
import { ThemeProvider } from './components/ThemeProvider';
// Import CartProvider and useCart hook for managing the shopping cart state
import { CartProvider, useCart } from './components/CartContext';

// Import Sidebar component for navigation
import { Sidebar } from './components/Sidebar';
// Import Header component for the top navigation bar
import { Header } from './components/Header';
// Import RoleSelection component for users to select their role upon first login
import { RoleSelection } from './components/RoleSelection';
// ErrorBoundary component to catch and handle runtime errors gracefully
class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if ((this as any).state.hasError) {
      let errorMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse((this as any).state.error.message);
        if (parsed.error) errorMessage = parsed.error;
      } catch (e) {}

      return (
        <div className="h-screen flex items-center justify-center p-8 bg-bg">
          <div className="card max-w-md w-full text-center space-y-6">
            <div className="h-20 w-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Application Error</h2>
              <p className="text-muted-fg">{errorMessage}</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="btn btn-primary w-full"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

// Utility function to handle lazy loading with automatic retry on failure
const lazyRetry = (componentImport: () => Promise<any>) => {
  // Return a lazy-loaded component
  return lazy(async () => {
    // Check if the page has already been reloaded in the current session
    const pageHasAlreadyBeenReloaded = JSON.parse(
      window.sessionStorage.getItem('page-has-been-reloaded') || 'false'
    );

    try {
      // Attempt to import the component
      const component = await componentImport();
      // Reset the reload flag on success
      window.sessionStorage.setItem('page-has-been-reloaded', 'false');
      // Return the successfully loaded component
      return component;
    } catch (error) {
      // If loading fails and the page hasn't been reloaded yet, trigger a reload
      if (!pageHasAlreadyBeenReloaded) {
        window.sessionStorage.setItem('page-has-been-reloaded', 'true');
        window.location.reload();
      }
      // Re-throw the error if reload doesn't help or has already been tried
      throw error;
    }
  });
};

// Lazy-load page components using the lazyRetry utility for better reliability
const LoginPage = lazyRetry(() => import('./components/LoginPage').then(m => ({ default: m.LoginPage })));
const Dashboard = lazyRetry(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const POS = lazyRetry(() => import('./components/POS').then(m => ({ default: m.POS })));
const CartPage = lazyRetry(() => import('./components/CartPage').then(m => ({ default: m.CartPage })));
const Inventory = lazyRetry(() => import('./components/Inventory').then(m => ({ default: m.Inventory })));
const Suppliers = lazyRetry(() => import('./components/Suppliers').then(m => ({ default: m.Suppliers })));
const Customers = lazyRetry(() => import('./components/Customers').then(m => ({ default: m.Customers })));
const Reports = lazyRetry(() => import('./components/Reports').then(m => ({ default: m.Reports })));
const SettingsPage = lazyRetry(() => import('./components/Settings').then(m => ({ default: m.SettingsPage })));
const PrintPage = lazyRetry(() => import('./components/PrintPage').then(m => ({ default: m.PrintPage })));

// Import the initialized Firestore database instance
import { db } from './firebase';
// Import utility function for conditional class merging
import { cn } from './lib/utils';
// Import UserRole type definition
import { UserRole } from './types';

// Component to display while lazy-loaded routes are being fetched
const LoadingFallback = () => (
  // Full-screen container centered vertically and horizontally
  <div className="h-screen w-full flex items-center justify-center bg-bg">
    {/* Column layout for spinner and text */}
    <div className="flex flex-col items-center gap-4">
      {/* Animated spinner element */}
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      {/* Loading text with pulse animation */}
      <p className="text-sm font-black tracking-widest uppercase opacity-50 animate-pulse">Initializing Nexus...</p>
    </div>
  </div>
);

// Component to protect routes that require authentication and specific user roles
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: UserRole[] }) => {
  // Access user authentication state and loading status
  const { user, loading } = useAuth();
  // Show a simple loading indicator while auth state is being determined
  if (loading) return <div className="h-screen flex items-center justify-center font-bold tracking-tighter text-2xl animate-pulse">NEXUS</div>;
  // Redirect to login if the user is not authenticated
  if (!user) return <Navigate to="/login" />;
  // Show role selection if the user hasn't chosen a role yet
  if (!user.role) return <RoleSelection />;
  // Redirect to home if the user's role is not permitted for the current route
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;
  // Render the protected content if all checks pass
  return <>{children}</>;
};

// Main content component that handles layout and routing
const AppContent = () => {
  // Access the current user from auth context
  const { user } = useAuth();
  // State to manage the open/closed status of the sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Effect to handle sidebar visibility based on window width
  useEffect(() => {
    // Function to update sidebar state on window resize
    const handleResize = () => {
      // Close sidebar on small screens, open on larger ones
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    // Call handleResize immediately to set initial state
    handleResize();
    // Add event listener for window resize events
    window.addEventListener('resize', handleResize);
    // Clean up the event listener when the component unmounts
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Effect to test the connection to Firestore on initial load
  useEffect(() => {
    // Asynchronous function to attempt a simple read from Firestore
    async function testConnection() {
      try {
        // Try to fetch a test document from the server
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error: any) {
        // If the connection fails due to being offline, show an error toast
        if (error.message.includes('the client is offline')) {
          toast.error("Firebase connection failed. Please check your configuration.");
        }
      }
    }
    // Execute the connection test
    testConnection();
  }, []);

  // Render the main application layout
  return (
    // Full-height container with background color
    <div className="min-h-screen bg-bg">
      {/* Render Sidebar if user is logged in, passing state and mobile status */}
      {user && <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} mobile={window.innerWidth < 768} />}
      {/* Main content area with dynamic margins based on sidebar state */}
      <div className={cn(
        "transition-all duration-500",
        user ? (sidebarOpen ? "md:ml-64" : "md:ml-20") : ""
      )}>
        {/* Render Header if user is logged in, with menu toggle functionality */}
        {user && <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />}
        {/* Main section for rendering route-specific components */}
        <main className={cn("p-2 sm:p-4 md:p-8", !user ? "p-0" : "")}>
          {/* Use Suspense to handle loading states for lazy-loaded routes */}
          <Suspense fallback={<LoadingFallback />}>
            {/* Define application routes */}
            <Routes>
              {/* Login route: redirect to home if already logged in */}
              <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
              {/* Public print route for sales receipts */}
              <Route path="/print/:saleId" element={<PrintPage />} />
              {/* Protected home/dashboard route */}
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              {/* Protected POS (Point of Sale) route */}
              <Route path="/pos" element={<ProtectedRoute><POS /></ProtectedRoute>} />
              {/* Protected shopping cart route */}
              <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
              {/* Protected inventory route, restricted to admin, manager, and cashier roles */}
              <Route path="/inventory" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'cashier']}><Inventory /></ProtectedRoute>} />
              {/* Protected suppliers management route */}
              <Route path="/suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
              {/* Protected customers management route */}
              <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
              {/* Protected reports route, restricted to admin and manager roles */}
              <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><Reports /></ProtectedRoute>} />
              {/* Protected settings route, restricted to admin and manager roles */}
              <Route path="/settings" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><SettingsPage /></ProtectedRoute>} />
            </Routes>
          </Suspense>
        </main>
      </div>
      {/* Global toaster component for displaying notifications */}
      <Toaster position="top-right" richColors />
    </div>
  );
};

// Root application component that wraps everything in necessary providers
export default function App() {
  // Wrap the entire application in nested providers for error handling, theming, auth, cart, and routing
  return (
    // Catch-all error boundary for the entire application
    <ErrorBoundary>
      {/* Theme management provider */}
      <ThemeProvider>
        {/* User authentication state provider */}
        <AuthProvider>
          {/* Shopping cart state provider */}
          <CartProvider>
            {/* Browser routing provider */}
            <BrowserRouter>
              {/* Main application content */}
              <AppContent />
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

