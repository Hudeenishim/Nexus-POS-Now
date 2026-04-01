import * as React from 'react';
import { useState } from 'react';
import { 
  CheckCircle2, 
  Loader2, 
  User as UserIcon, 
  Phone, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useAuth } from './AuthProvider';
import { cn, isValidEmail, isValidGhanaPhone } from '../lib/utils';

export const LoginPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const { signIn, signInWithEmail, signUp, isSigningIn } = useAuth();

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (isSignUp) {
      if (!name) newErrors.name = 'Username is required';
      if (!phone) {
        newErrors.phone = 'Phone number is required';
      } else if (!isValidGhanaPhone(phone)) {
        newErrors.phone = 'Invalid Ghanaian phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getPasswordStrength = () => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSigningIn || isSuccess) return;
    
    if (!validate()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      if (isSignUp) {
        await signUp(email, password, name, phone);
        try {
          await fetch('/api/notify-signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name, phone }),
          });
        } catch (err) {
          console.error('Failed to send notifications:', err);
        }
        setIsSuccess(true);
        toast.success('Account created successfully');
      } else {
        await signInWithEmail(email, password);
        setIsSuccess(true);
        toast.success('Welcome back');
      }
    } catch (error: any) {
      let message = error.message || 'Authentication failed';
      if (error.code === 'auth/operation-not-allowed') {
        message = 'Email/Password login is not enabled in Firebase. Please enable it in the Firebase Console.';
      }
      toast.error(message);
      setErrors({ auth: message });
    }
  };

  const handleGoogleLogin = async () => {
    if (isSigningIn || isSuccess) return;
    try {
      await signIn();
      setIsSuccess(true);
      toast.success('Welcome to Nexus POS');
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        console.error('Google login error:', error);
      }
      let message = 'Login failed';
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.error) message = `Login failed: ${parsed.error}`;
      } catch (e) {
        if (error.code === 'auth/popup-closed-by-user') {
          message = 'Sign in cancelled';
        } else if (error.code === 'auth/popup-blocked') {
          message = 'Sign-in popup was blocked. Please allow popups for this site.';
        } else if (error.code === 'auth/operation-not-allowed') {
          message = 'Google sign-in is not enabled in Firebase Console.';
        } else if (error.code === 'auth/unauthorized-domain') {
          message = 'This domain is not authorized for Google sign-in. Please add it in Firebase Console.';
        } else if (error.code === 'auth/network-request-failed') {
          message = 'Network error. Please check your internet connection.';
        } else if (error.code === 'auth/internal-error') {
          message = 'An internal authentication error occurred. Please try again.';
        } else if (error.code === 'auth/too-many-requests') {
          message = 'Too many failed login attempts. Please try again later.';
        } else if (error.code === 'auth/user-disabled') {
          message = 'This user account has been disabled.';
        } else if (error.code === 'auth/user-not-found') {
          message = 'User not found.';
        } else if (error.code === 'auth/wrong-password') {
          message = 'Incorrect password.';
        } else if (error.code === 'auth/invalid-email') {
          message = 'Invalid email address.';
        } else if (error.code === 'auth/email-already-in-use') {
          message = 'This email is already in use.';
        } else if (error.code === 'auth/weak-password') {
          message = 'Password is too weak.';
        } else if (error.code === 'auth/requires-recent-login') {
          message = 'This action requires a recent login. Please log in again.';
        } else if (error.code === 'auth/account-exists-with-different-credential') {
          message = 'An account already exists with the same email address but different sign-in credentials.';
        } else if (error.code === 'auth/auth-domain-config-required') {
          message = 'Auth domain configuration is required. Please check your Firebase settings.';
        } else if (error.code === 'auth/cancelled-popup-request') {
          message = 'The sign-in popup was closed before completion.';
        } else if (error.code === 'auth/user-token-expired') {
          message = 'Your session has expired. Please log in again.';
        } else if (error.code === 'auth/web-storage-unsupported') {
          message = 'Web storage is not supported or is disabled in your browser.';
        } else {
          message = error.message || 'Login failed';
        }
      }
      toast.error(message);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 max-w-sm w-full"
        >
          <div className="w-20 h-20 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Success!</h2>
            <p className="text-muted-fg">Redirecting you to the dashboard...</p>
          </div>
          <div className="pt-4">
            <Loader2 className="w-6 h-6 text-accent animate-spin mx-auto" />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-bg">
      <div className="hidden md:flex md:w-1/2 bg-primary p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.2)_0%,transparent_50%)]" />
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.2)_0%,transparent_50%)]" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-primary-fg mb-12">
            <div className="w-10 h-10 bg-primary-fg text-primary rounded-xl flex items-center justify-center font-black text-xl">N</div>
            <span className="text-2xl font-black tracking-tighter">NEXUS POS</span>
          </div>
          
          <div className="space-y-6 max-w-lg">
            <h1 className="text-6xl font-black tracking-tighter text-primary-fg leading-[0.9]">
              Business, <span className="text-accent">simplified.</span>
            </h1>
            <p className="text-primary-fg/60 text-lg font-medium">
              The intelligent POS ecosystem.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex gap-8 text-primary-fg/40 text-sm font-bold uppercase tracking-widest">
          <span>Fast</span>
          <span>Secure</span>
          <span>Reliable</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-md w-full space-y-8"
        >
          <div className="md:hidden flex items-center gap-3 mb-12">
            <div className="w-8 h-8 bg-primary text-primary-fg rounded-lg flex items-center justify-center font-black text-lg">N</div>
            <span className="text-xl font-black tracking-tighter">NEXUS</span>
          </div>

          <div className="space-y-2 h-[72px] flex flex-col justify-end">
            <AnimatePresence mode="wait">
              <motion.div
                key={isSignUp ? 'signup-header' : 'signin-header'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-3xl font-black tracking-tight">
                  {isSignUp ? 'Create an account' : 'Welcome back'}
                </h2>
                <p className="text-muted-fg font-medium mt-1">
                  {isSignUp ? 'Join the Nexus ecosystem today.' : 'Enter your credentials to access your account.'}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="relative flex p-1 bg-muted rounded-xl border border-border/50 overflow-hidden">
            <motion.div 
              className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-lg shadow-md bg-sky-400"
              initial={false}
              animate={{ 
                x: isSignUp ? '100%' : '0%',
              }}
              transition={{ 
                type: "spring", 
                stiffness: 500, 
                damping: 30
              }}
            />
            <button 
              type="button"
              onClick={() => { setIsSignUp(false); setErrors({}); }}
              className={cn(
                "relative z-10 flex-1 py-3 text-[11px] font-black uppercase tracking-[0.2em] transition-colors duration-300",
                !isSignUp ? "text-primary-fg" : "text-muted-fg hover:text-fg"
              )}
            >
              Sign In
            </button>
            <button 
              type="button"
              onClick={() => { setIsSignUp(true); setErrors({}); }}
              className={cn(
                "relative z-10 flex-1 py-3 text-[11px] font-black uppercase tracking-[0.2em] transition-colors duration-300",
                isSignUp ? "text-primary-fg" : "text-muted-fg hover:text-fg"
              )}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {isSignUp && (
                <motion.div 
                  key="signup-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-fg ml-1">Username <span className="text-red-500">*</span></label>
                    <div className="relative group">
                      <UserIcon className={cn("absolute left-3 top-1/2 -translate-y-1/2 transition-colors", errors.name ? "text-red-500" : "text-muted-fg group-focus-within:text-primary")} size={18} />
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => { setName(e.target.value); if(errors.name) setErrors({...errors, name: ''}); }}
                        className={cn(
                          "input w-full !pl-10 h-12",
                          errors.name && "border-red-500 bg-red-500/5 animate-shake"
                        )} 
                        placeholder="John Doe"
                        disabled={isSigningIn}
                      />
                    </div>
                    {errors.name && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.name}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-fg ml-1">Phone Number <span className="text-red-500">*</span></label>
                    <div className="relative group">
                      <Phone className={cn("absolute left-3 top-1/2 -translate-y-1/2 transition-colors", errors.phone ? "text-red-500" : "text-muted-fg group-focus-within:text-primary")} size={18} />
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={(e) => { 
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setPhone(val); 
                          if(errors.phone) setErrors({...errors, phone: ''}); 
                        }}
                        className={cn(
                          "input w-full !pl-10 h-12",
                          errors.phone && "border-red-500 bg-red-500/5 animate-shake"
                        )} 
                        placeholder="0244123456"
                        maxLength={10}
                        disabled={isSigningIn}
                      />
                    </div>
                    {errors.phone && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.phone}</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-fg ml-1">Email Address <span className="text-red-500">*</span></label>
              <div className="relative group">
                <Mail className={cn("absolute left-3 top-1/2 -translate-y-1/2 transition-colors", errors.email ? "text-red-500" : "text-muted-fg group-focus-within:text-primary")} size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if(errors.email) setErrors({...errors, email: ''}); }}
                  className={cn(
                    "input w-full !pl-10 h-12",
                    errors.email && "border-red-500 bg-red-500/5 animate-shake"
                  )} 
                  placeholder="name@company.com"
                  disabled={isSigningIn}
                />
              </div>
              {errors.email && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-fg ml-1">Password <span className="text-red-500">*</span></label>
              <div className="relative group">
                <Lock className={cn("absolute left-3 top-1/2 -translate-y-1/2 transition-colors", errors.password ? "text-red-500" : "text-muted-fg group-focus-within:text-primary")} size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if(errors.password) setErrors({...errors, password: ''}); }}
                  className={cn(
                    "input w-full !pl-10 pr-10 h-12",
                    errors.password && "border-red-500 bg-red-500/5 animate-shake"
                  )} 
                  placeholder="••••••••"
                  disabled={isSigningIn}
                />
                <button 
                  type="button"
                  onClick={() => { setShowPassword(!showPassword); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-fg hover:text-fg transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="flex justify-between items-center px-1">
                {errors.password && (
                  <p className="text-[10px] font-bold text-red-500">{errors.password}</p>
                )}
              </div>
              
              {!isSignUp && (
                <div className="flex justify-end px-1">
                  <button type="button" className="text-[10px] font-black text-primary hover:text-accent transition-colors uppercase tracking-widest">
                    Forgot Password?
                  </button>
                </div>
              )}
              
              {isSignUp && password.length > 0 && (
                <div className="flex gap-1 mt-2 px-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div 
                      key={step}
                      className={cn(
                        "flex-1 h-1 rounded-full transition-all",
                        getPasswordStrength() >= step ? "bg-accent" : "bg-muted"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={isSigningIn || isSuccess}
              className="btn btn-primary w-full h-12 font-black uppercase tracking-widest text-xs gap-2"
            >
              {isSigningIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          <div className="mt-10 mb-6 flex flex-col items-center gap-6">
            <div className="w-full border-t border-border/50" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-fg">Or continue with</span>
          </div>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSigningIn || isSuccess}
            className="btn btn-outline w-full h-12 font-black uppercase tracking-widest text-xs gap-3"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google Account
          </button>
        </motion.div>
      </div>
    </div>
  );
};

