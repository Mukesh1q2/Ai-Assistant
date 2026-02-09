import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff,
  Chrome,
  Github,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store';
import { toast } from 'sonner';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultView?: 'login' | 'signup';
}

type AuthView = 'login' | 'signup' | 'forgot' | 'otp' | 'verify';

export default function AuthModal({ isOpen, onClose, defaultView = 'login' }: AuthModalProps) {
  const [view, setView] = useState<AuthView>(defaultView);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const { login, signup, error: authError } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast.success('Welcome back!');
        onClose();
      } else {
        toast.error('Invalid credentials');
      }
    } catch (_error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await signup(name, email, password);
      if (success) {
        toast.success('Account created successfully!');
        onClose();
      } else {
        toast.error(authError || 'Signup failed');
      }
    } catch (_error) {
      toast.error('Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // OAuth not implemented - show demo account info
    toast.info('OAuth not available. Use demo account: demo@clawd.ai / demo123');
  };

  const handleGithubLogin = async () => {
    // OAuth not implemented - show demo account info
    toast.info('OAuth not available. Use demo account: demo@clawd.ai / demo123');
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate sending OTP
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast.success(`OTP sent to ${phone}`);
    setIsLoading(false);
    setView('otp');
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // OTP verification not implemented - show info
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast.info('OTP login not implemented. Use demo account: demo@clawd.ai / demo123');
    setIsLoading(false);
    setView('login');
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      const success = await login('demo@clawd.ai', 'demo123');
      if (success) {
        toast.success('Welcome! Logged in as Demo User');
        onClose();
      } else {
        toast.error('Demo login failed. Make sure the server is running.');
      }
    } catch (_error) {
      toast.error('Demo login failed. Start the backend server first.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderLogin = () => (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <button
            type="button"
            onClick={() => setView('forgot')}
            className="text-xs text-primary hover:underline"
          >
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-[#4F8CFF] to-[#7C5CFF] text-white"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            Sign In
            <ArrowRight className="ml-2 w-4 h-4" />
          </>
        )}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full"
        >
          <Chrome className="mr-2 w-4 h-4" />
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleGithubLogin}
          disabled={isLoading}
          className="w-full"
        >
          <Github className="mr-2 w-4 h-4" />
          GitHub
        </Button>
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={() => setView('verify')}
        className="w-full"
      >
        <Phone className="mr-2 w-4 h-4" />
        Sign in with Phone
      </Button>

      <Button
        type="button"
        variant="ghost"
        onClick={handleDemoLogin}
        className="w-full text-primary"
      >
        <CheckCircle className="mr-2 w-4 h-4" />
        Try Demo Mode
      </Button>
    </form>
  );

  const renderSignup = () => (
    <form onSubmit={handleSignup} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="signup-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="signup-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-[#4F8CFF] to-[#7C5CFF] text-white"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            Create Account
            <ArrowRight className="ml-2 w-4 h-4" />
          </>
        )}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or sign up with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full"
        >
          <Chrome className="mr-2 w-4 h-4" />
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleGithubLogin}
          disabled={isLoading}
          className="w-full"
        >
          <Github className="mr-2 w-4 h-4" />
          GitHub
        </Button>
      </div>
    </form>
  );

  const renderForgot = () => (
    <form onSubmit={(e) => {
      e.preventDefault();
      toast.success('Password reset link sent to your email!');
      setView('login');
    }} className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Mail className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Reset Password</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reset-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="reset-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-[#4F8CFF] to-[#7C5CFF] text-white"
      >
        Send Reset Link
      </Button>

      <Button
        type="button"
        variant="ghost"
        onClick={() => setView('login')}
        className="w-full"
      >
        Back to Sign In
      </Button>
    </form>
  );

  const renderPhoneVerify = () => (
    <form onSubmit={handleSendOTP} className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Phone className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Phone Sign In</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your phone number to receive an OTP
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-[#4F8CFF] to-[#7C5CFF] text-white"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            Send OTP
            <ArrowRight className="ml-2 w-4 h-4" />
          </>
        )}
      </Button>

      <Button
        type="button"
        variant="ghost"
        onClick={() => setView('login')}
        className="w-full"
      >
        Back to Email Sign In
      </Button>
    </form>
  );

  const renderOTP = () => (
    <form onSubmit={handleVerifyOTP} className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Enter OTP</h3>
        <p className="text-sm text-muted-foreground mt-1">
          We've sent a 6-digit code to {phone}
        </p>
      </div>

      <div className="flex justify-center gap-2">
        {otpCode.map((digit, index) => (
          <Input
            key={index}
            id={`otp-${index}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(index, e.target.value)}
            onKeyDown={(e) => handleOtpKeyDown(index, e)}
            className="w-12 h-12 text-center text-lg font-mono"
          />
        ))}
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-[#4F8CFF] to-[#7C5CFF] text-white"
        disabled={isLoading || otpCode.some(d => !d)}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            Verify & Sign In
            <ArrowRight className="ml-2 w-4 h-4" />
          </>
        )}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setView('verify')}
          className="text-sm text-primary hover:underline"
        >
          Didn't receive code? Resend
        </button>
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={() => setView('login')}
        className="w-full"
      >
        Back to Email Sign In
      </Button>
    </form>
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4F8CFF] to-[#7C5CFF] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/25">
              {view === 'login' && <Lock className="w-6 h-6 text-white" />}
              {view === 'signup' && <User className="w-6 h-6 text-white" />}
              {view === 'forgot' && <Mail className="w-6 h-6 text-white" />}
              {view === 'verify' && <Phone className="w-6 h-6 text-white" />}
              {view === 'otp' && <CheckCircle className="w-6 h-6 text-white" />}
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground">
              {view === 'login' && 'Welcome Back'}
              {view === 'signup' && 'Create Account'}
              {view === 'forgot' && 'Reset Password'}
              {view === 'verify' && 'Phone Sign In'}
              {view === 'otp' && 'Verify OTP'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {view === 'login' && 'Sign in to access your AI assistants'}
              {view === 'signup' && 'Start your AI automation journey'}
              {view === 'forgot' && "We'll send you a reset link"}
              {view === 'verify' && 'Enter your phone number'}
              {view === 'otp' && 'Enter the 6-digit code'}
            </p>
          </div>

          {/* Form Content */}
          {view === 'login' && renderLogin()}
          {view === 'signup' && renderSignup()}
          {view === 'forgot' && renderForgot()}
          {view === 'verify' && renderPhoneVerify()}
          {view === 'otp' && renderOTP()}

          {/* Footer */}
          {(view === 'login' || view === 'signup') && (
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                {view === 'login' ? "Don't have an account? " : 'Already have an account? '}
              </span>
              <button
                onClick={() => setView(view === 'login' ? 'signup' : 'login')}
                className="text-primary hover:underline font-medium"
              >
                {view === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
