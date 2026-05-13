import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from './GlassCard';
import { GlowButton } from './GlowButton';
import { Mail, Lock, Phone as PhoneIcon, X, Globe, Loader2, User, MessageSquare } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { logToBackend } from '../../lib/logger';

export const AuthModal: React.FC = () => {
  const navigate = useNavigate();
  const { activeModal, closeModal } = useUIStore();
  const { loginWithGoogle, loginWithPhone, verifyOTP, isLoading } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  if (activeModal !== 'auth') return null;

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      closeModal();
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'input') {
      try {
        const formattedPhone = `+91${phone}`;
        await loginWithPhone(formattedPhone);
        setStep('otp');
      } catch (error) {
        console.error(error);
      }
    } else {
      try {
        const formattedPhone = `+91${phone}`;
        console.log('Verifying OTP for:', formattedPhone);
        await verifyOTP(formattedPhone, otp, mode === 'signup' ? fullName : undefined);
        console.log('OTP verified successfully, closing modal...');
        closeModal();
        
        // Use a small timeout to allow state to settle before navigation
        setTimeout(() => {
          console.log('Redirecting to dashboard...');
          navigate('/dashboard', { replace: true });
        }, 100);
      } catch (error: any) {
        console.error('OTP Verification Error:', error);
        // Alert the user if there is an error
      }
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login for demo
    useAuthStore.getState().setUser({
      id: 'mock-user-123',
      full_name: mode === 'signup' ? fullName : (email.split('@')[0] || 'Demo User'),
      username: email.split('@')[0] || 'demouser',
      email: email || 'demo@vhop.in',
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email || 'Demo'}`,
      role: 'user',
      v_coins: 500,
      city: 'Mumbai',
      phone: phone || '+91 99999 88888'
    });
    const newUser = useAuthStore.getState().user;
    logToBackend(mode === 'signup' ? 'signup_email' : 'login_email', newUser);
    closeModal();
    navigate('/dashboard');
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeModal}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-md z-10"
      >
        <GlassCard className="p-8 border-[var(--violet-primary)]/30 overflow-hidden relative">
          <button 
            onClick={closeModal}
            className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-white transition-colors z-20"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center space-y-2 mb-8">
            <h2 className="text-3xl font-display font-bold text-gradient">
              {mode === 'login' ? 'Welcome Back' : 'Join the Night'}
            </h2>
            <p className="text-[var(--text-secondary)] text-sm">
              {authMethod === 'phone' && step === 'otp' 
                ? 'Enter the code sent to your phone' 
                : mode === 'login' ? 'Your next adventure starts here.' : 'Create an account to explore more.'}
            </p>
          </div>

          {/* Auth Method Toggle */}
          {step === 'input' && (
            <div className="flex p-1 bg-white/5 rounded-xl mb-6">
              <button
                onClick={() => setAuthMethod('email')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                  authMethod === 'email' ? 'bg-[var(--violet-primary)] text-white shadow-glow' : 'text-[var(--text-muted)] hover:text-white'
                }`}
              >
                <Mail className="w-3.5 h-3.5" /> Email
              </button>
              <button
                onClick={() => setAuthMethod('phone')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                  authMethod === 'phone' ? 'bg-[var(--violet-primary)] text-white shadow-glow' : 'text-[var(--text-muted)] hover:text-white'
                }`}
              >
                <PhoneIcon className="w-3.5 h-3.5" /> Phone
              </button>
            </div>
          )}

          {authMethod === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {mode === 'signup' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                      <input 
                        type="text" 
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:border-[var(--violet-bright)] focus:ring-1 focus:ring-[var(--violet-bright)] outline-none transition-all"
                        placeholder="Alex Rivera"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:border-[var(--violet-bright)] focus:ring-1 focus:ring-[var(--violet-bright)] outline-none transition-all"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:border-[var(--violet-bright)] focus:ring-1 focus:ring-[var(--violet-bright)] outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <GlowButton type="submit" className="w-full py-4 text-base mt-2">
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </GlowButton>
            </form>
          ) : (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              {step === 'input' ? (
                <div className="space-y-4">
                  {mode === 'signup' && (
                    <div className="space-y-2 mb-4">
                      <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                        <input 
                          type="text" 
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:border-[var(--violet-bright)] focus:ring-1 focus:ring-[var(--violet-bright)] outline-none transition-all"
                          placeholder="Your Name"
                        />
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Phone Number</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-4 flex items-center gap-2 text-[var(--text-secondary)] font-bold border-r border-white/10 pr-3 h-6">
                      <PhoneIcon className="w-4 h-4" />
                      <span className="text-sm">+91</span>
                    </div>
                    <input 
                      type="tel" 
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-24 pr-4 py-3 focus:border-[var(--violet-bright)] focus:ring-1 focus:ring-[var(--violet-bright)] outline-none transition-all font-bold tracking-widest"
                      placeholder="XXXXXXXXXX"
                      maxLength={10}
                    />
                  </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Verification Code</label>
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                    <input 
                      type="text" 
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:border-[var(--violet-bright)] focus:ring-1 focus:ring-[var(--violet-bright)] outline-none transition-all tracking-[1em] text-center font-bold"
                      placeholder="••••••"
                      maxLength={6}
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => setStep('input')}
                    className="text-xs text-[var(--violet-bright)] hover:underline mt-2"
                  >
                    Change phone number
                  </button>
                </div>
              )}

              <GlowButton type="submit" isLoading={isLoading} className="w-full py-4 text-base mt-2">
                {step === 'input' ? 'Send OTP' : 'Verify & Sign In'}
              </GlowButton>
              <div id="recaptcha-container"></div>
            </form>
          )}

          <div className="space-y-4">
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#13111F] px-2 text-[var(--text-muted)]">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button 
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />} Google
              </button>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-[var(--text-secondary)]">
            {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
            <button 
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-[var(--violet-bright)] font-bold hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
};
