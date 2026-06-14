import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from './GlassCard';
import { GlowButton } from './GlowButton';
import { 
  Mail, 
  Lock, 
  X, 
  Globe, 
  Loader2, 
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Zap,
  Music,
  Wine,
  Utensils,
  PartyPopper,
  ArrowRight,
  Smartphone
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';

const INTERESTS = [
  { id: 'night_clubs', label: 'Night Clubs', icon: PartyPopper },
  { id: 'techno', label: 'Techno Music', icon: Zap },
  { id: 'djs', label: 'Top DJs', icon: Music },
  { id: 'dinner', label: 'Fine Dining', icon: Utensils },
  { id: 'bars_pubs', label: 'Bars & Pubs', icon: Wine },
  { id: 'dance', label: 'Dance Events', icon: Music },
  { id: 'underground', label: 'Underground Scenes', icon: Zap },
];

export const AuthModal: React.FC = () => {
  const navigate = useNavigate();
  const { activeModal, closeModal } = useUIStore();
  const { 
    loginWithGoogle, 
    loginWithEmail, 
    registerWithEmail, 
    sendOtp, 
    verifyOtp, 
    sendEmailOtp,
    verifyEmailOtp,
    isLoading, 
    user, 
    setUser 
  } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>('login');
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  
  // Onboarding State
  const [onboardingStep, setOnboardingStep] = useState<'none' | 'policy' | 'interests'>('none');
  const [agreed, setAgreed] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [otp, setOtp] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  // Phone OTP States
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devOtpHelp, setDevOtpHelp] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string; duplicate?: { channel: 'email' | 'phone'; value: string } } | null>(null);

  // Clear status alert when modal active status, mode, or method switches
  useEffect(() => {
    setStatus(null);
    setIsOtpSent(false);
    setOtpCode('');
    setDevOtpHelp('');
  }, [mode, loginMethod, activeModal]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Prefill referral code if present in localStorage
  useEffect(() => {
    if (mode === 'signup') {
      const savedCode = localStorage.getItem('referred_by_code');
      if (savedCode) {
        setReferralCode(savedCode);
      }
    }
  }, [mode]);
  
  // Detect if onboarding is needed
  useEffect(() => {
    if (user && activeModal === 'auth') {
      if (!user.onboarded) {
        // We can show the onboarding step, but they can close it
        setOnboardingStep('policy');
      } else {
        closeModal();
      }
    }
  }, [user, activeModal, closeModal, navigate]);

  if (activeModal !== 'auth') return null;

  const handleGoogleLogin = async () => {
    try {
      const profile = await loginWithGoogle(email || undefined);
      if (profile && profile.onboarded) {
        closeModal();
      } else {
        setOnboardingStep('policy');
      }
    } catch (error: any) {
      console.error(error);
      setStatus({ type: 'error', message: error.message || 'Google Login failed' });
    }
  };

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCompleteOnboarding = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          interests: selectedInterests
        })
      });

      if (response.ok) {
        setUser({ ...user, onboarded: true, interests: selectedInterests });
        closeModal();
      }
    } catch (error) {
      console.error('Onboarding failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'signup') {
        if (!fullName.trim()) {
          setStatus({ type: 'error', message: 'Please enter your full name to sign up.' });
          return;
        }

        if (!isOtpSent) {
          setLocalLoading(true);
          setStatus(null);
          const res = await sendEmailOtp(email, true);
          setIsOtpSent(true);
          setCountdown(60);
          setDevOtpHelp(res.devOtp || '');
          setStatus({ type: 'success', message: 'Verification OTP code sent to your email address!' });
          setLocalLoading(false);
        } else {
          setLocalLoading(true);
          setStatus(null);
          await verifyEmailOtp(email, otpCode);
          const profile = await registerWithEmail(email, password, fullName, referralCode.trim() || undefined);
          if (profile && profile.onboarded) {
            closeModal();
          } else {
            setOnboardingStep('policy');
          }
          setLocalLoading(false);
        }
      } else {
        setLocalLoading(true);
        setStatus(null);
        const profile = await loginWithEmail(email, password);
        if (profile && profile.onboarded) {
          closeModal();
        } else {
          setOnboardingStep('policy');
        }
        setLocalLoading(false);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setLocalLoading(false);
      const isDuplicate = error.message.includes('already exists') || error.message.includes('already registered');
      if (isDuplicate) {
        setStatus({
          type: 'error',
          message: `An account with this email already exists. Would you like to sign in?`,
          duplicate: { channel: 'email', value: email }
        });
      } else {
        setStatus({ type: 'error', message: error.message || 'Authentication failed. Please check your credentials.' });
      }
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    
    if (mode === 'signup' && !fullName.trim()) {
      setStatus({ type: 'error', message: 'Please enter your full name to sign up.' });
      return;
    }

    setLocalLoading(true);
    setStatus(null);
    try {
      const res = await sendOtp(phone, mode === 'signup');
      setIsOtpSent(true);
      setCountdown(60);
      setDevOtpHelp(res.devOtp || '');
      setStatus({ type: 'success', message: 'Verification code sent successfully to your phone!' });
    } catch (error: any) {
      console.error(error);
      const isDuplicate = error.message.includes('already exists') || error.message.includes('already registered');
      if (isDuplicate) {
        setStatus({
          type: 'error',
          message: `An account with this phone number already exists. Would you like to sign in?`,
          duplicate: { channel: 'phone', value: phone }
        });
      } else {
        setStatus({ type: 'error', message: error.message || 'Failed to send OTP. Please check your phone number.' });
      }
    } finally {
      setLocalLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !otpCode) return;
    
    setLocalLoading(true);
    setStatus(null);
    try {
      const profile = await verifyOtp(phone, otpCode, referralCode || undefined, false, mode === 'signup' ? fullName : undefined);
      if (profile && profile.onboarded) {
        closeModal();
      } else {
        setOnboardingStep('policy');
      }
    } catch (error: any) {
      console.error(error);
      setStatus({ type: 'error', message: error.message || 'OTP verification failed. Please try again.' });
    } finally {
      setLocalLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLocalLoading(true);
    setStatus(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }
      setStatus({ type: 'success', message: 'Verification code sent successfully! Please check your email inbox.' });
      setMode('reset');
    } catch (error: any) {
      console.error('Forgot password error:', error);
      setStatus({ type: 'error', message: error.message || 'Error requesting reset code' });
    } finally {
      setLocalLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp || !password) {
      setStatus({ type: 'error', message: 'Please fill out all fields.' });
      return;
    }
    setLocalLoading(true);
    setStatus(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otp.trim(), newPassword: password })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }
      setStatus({ type: 'success', message: 'Password has been reset successfully! You can now sign in with your new password.' });
      setOtp('');
      setPassword('');
      setMode('login');
    } catch (error: any) {
      console.error('Reset password error:', error);
      setStatus({ type: 'error', message: error.message || 'Failed to reset password' });
    } finally {
      setLocalLoading(false);
    }
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

          {/* Premium Animated In-App Status Alerts */}
          <AnimatePresence>
            {status && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 rounded-2xl mb-6 flex gap-3 items-start border transition-all ${
                  status.type === 'success' 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                }`}
              >
                {status.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-xs font-bold leading-normal">{status.message}</p>
                  {status.duplicate && (
                    <button
                      type="button"
                      onClick={() => {
                        const { channel, value } = status.duplicate!;
                        setMode('login');
                        setLoginMethod(channel);
                        if (channel === 'email') {
                          setEmail(value);
                        } else {
                          setPhone(value);
                        }
                        setStatus(null);
                      }}
                      className="mt-2 text-xs bg-white/10 hover:bg-white/20 text-white font-bold py-1.5 px-3 rounded-lg border border-white/10 transition-colors cursor-pointer"
                    >
                      Yes, Sign In
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {onboardingStep === 'none' ? (
              <motion.div
                key="auth-content"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {(mode === 'login' || mode === 'signup') && (
                  <>
                    <div className="text-center space-y-2 mb-8">
                      <h2 className="text-3xl font-display font-bold text-gradient">
                        {mode === 'login' ? 'Welcome Back' : 'Join the Night'}
                      </h2>
                      <p className="text-[var(--text-secondary)] text-sm">
                        {mode === 'login' ? 'Your next adventure starts here.' : 'Create an account to explore more.'}
                      </p>
                    </div>

                    {(mode === 'login' || mode === 'signup') && (
                      <div className="flex bg-white/5 p-1 rounded-xl gap-1 mb-6 border border-white/5">
                        <button
                          type="button"
                          onClick={() => {
                            setLoginMethod('email');
                            setIsOtpSent(false);
                          }}
                          className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                            loginMethod === 'email'
                              ? 'bg-[var(--violet-primary)] text-white shadow-md'
                              : 'text-[var(--text-secondary)] hover:text-white'
                          }`}
                        >
                          <Mail className="w-3.5 h-3.5" /> {mode === 'login' ? 'Email' : 'Email SignUp'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLoginMethod('phone');
                            setIsOtpSent(false);
                          }}
                          className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                            loginMethod === 'phone'
                              ? 'bg-[var(--violet-primary)] text-white shadow-md'
                              : 'text-[var(--text-secondary)] hover:text-white'
                          }`}
                        >
                          <Smartphone className="w-3.5 h-3.5" /> {mode === 'login' ? 'Phone OTP' : 'Phone SignUp'}
                        </button>
                      </div>
                    )}

                    {loginMethod === 'email' ? (
                      <form onSubmit={handleEmailSubmit} className="space-y-4">
                        {!isOtpSent ? (
                          <>
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
                                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:border-[var(--violet-bright)] focus:ring-1 focus:ring-[var(--violet-bright)] outline-none transition-all text-white"
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
                                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:border-[var(--violet-bright)] focus:ring-1 focus:ring-[var(--violet-bright)] outline-none transition-all text-white"
                                  placeholder="name@example.com"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Password</label>
                                {mode === 'login' && (
                                  <button 
                                    type="button" 
                                    onClick={() => {
                                      setMode('forgot');
                                      setPassword('');
                                    }}
                                    className="text-xs text-[var(--violet-bright)] font-semibold hover:underline bg-transparent border-none"
                                  >
                                    Forgot password?
                                  </button>
                                )}
                              </div>
                              <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                                <input 
                                  type="password" 
                                  required
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:border-[var(--violet-bright)] focus:ring-1 focus:ring-[var(--violet-bright)] outline-none transition-all text-white"
                                  placeholder="••••••••"
                                />
                              </div>
                            </div>

                            <AnimatePresence mode="wait">
                              {mode === 'signup' && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="space-y-2 overflow-hidden"
                                >
                                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Referral Code (Optional)</label>
                                  <div className="relative">
                                    <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                                    <input 
                                      type="text" 
                                      value={referralCode}
                                      onChange={(e) => setReferralCode(e.target.value)}
                                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:border-[var(--violet-bright)] focus:ring-1 focus:ring-[var(--violet-bright)] outline-none transition-all text-white"
                                      placeholder="e.g. VHOP-USER-2026"
                                    />
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            <GlowButton type="submit" isLoading={localLoading} className="w-full py-4 text-base mt-2">
                              {mode === 'login' ? 'Sign In' : 'Send Verification OTP'}
                            </GlowButton>
                          </>
                        ) : (
                          <>
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Enter 6-Digit Email OTP</label>
                              <div className="relative">
                                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                                <input 
                                  type="text" 
                                  required
                                  maxLength={6}
                                  value={otpCode}
                                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 tracking-[0.5em] text-center text-lg font-extrabold focus:border-[var(--violet-bright)] focus:ring-1 focus:ring-[var(--violet-bright)] outline-none transition-all text-white font-mono"
                                  placeholder="123456"
                                />
                              </div>
                              
                              {devOtpHelp && (
                                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-bold text-center mt-2.5 animate-pulse">
                                  [SANDBOX OTP]: {devOtpHelp}
                                </div>
                              )}
                            </div>

                            <div className="flex justify-between items-center text-xs mt-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsOtpSent(false);
                                  setOtpCode('');
                                }}
                                className="text-[var(--text-secondary)] hover:text-white hover:underline transition-colors bg-transparent border-none"
                              >
                                Change Email
                              </button>
                              
                              {countdown > 0 ? (
                                <span className="text-[var(--text-muted)] font-mono">Resend in {countdown}s</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={handleEmailSubmit}
                                  className="text-[var(--violet-bright)] font-bold hover:underline bg-transparent border-none"
                                >
                                  Resend OTP
                                </button>
                              )}
                            </div>

                            <GlowButton type="submit" isLoading={localLoading} className="w-full py-4 text-base mt-4">
                              Verify & Create Account
                            </GlowButton>
                          </>
                        )}
                      </form>
                    ) : (
                      <div className="space-y-4">
                        {!isOtpSent ? (
                          <form onSubmit={handlePhoneSubmit} className="space-y-4">
                            {mode === 'signup' && (
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Full Name</label>
                                <div className="relative">
                                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                                  <input 
                                    type="text" 
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:border-[var(--violet-bright)] focus:ring-1 focus:ring-[var(--violet-bright)] outline-none transition-all text-white"
                                    placeholder="Alex Rivera"
                                  />
                                </div>
                              </div>
                            )}

                            <div className="space-y-2">
                              <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Phone Number</label>
                              <div className="relative">
                                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                                <div className="absolute left-12 top-1/2 -translate-y-1/2 text-sm text-slate-300 font-bold border-r border-white/10 pr-3">
                                  +91
                                </div>
                                <input 
                                  type="tel" 
                                  required
                                  maxLength={10}
                                  value={phone}
                                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-24 pr-4 py-3.5 focus:border-[var(--violet-bright)] focus:ring-1 focus:ring-[var(--violet-bright)] outline-none transition-all font-mono font-bold text-white text-base"
                                  placeholder="9999999999"
                                />
                              </div>
                            </div>

                            {mode === 'signup' && (
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Referral Code (Optional)</label>
                                <div className="relative">
                                  <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                                  <input 
                                    type="text" 
                                    value={referralCode}
                                    onChange={(e) => setReferralCode(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:border-[var(--violet-bright)] focus:ring-1 focus:ring-[var(--violet-bright)] outline-none transition-all text-white"
                                    placeholder="e.g. VHOP-USER-2026"
                                  />
                                </div>
                              </div>
                            )}

                            <GlowButton type="submit" isLoading={localLoading} className="w-full py-4 text-base mt-2">
                              Send OTP
                            </GlowButton>
                          </form>
                        ) : (
                          <form onSubmit={handleOtpVerify} className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Enter 6-Digit OTP</label>
                              <div className="relative">
                                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                                <input 
                                  type="text" 
                                  required
                                  maxLength={6}
                                  value={otpCode}
                                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 tracking-[0.5em] text-center text-lg font-extrabold focus:border-[var(--violet-bright)] focus:ring-1 focus:ring-[var(--violet-bright)] outline-none transition-all text-white font-mono"
                                  placeholder="123456"
                                />
                              </div>
                              
                              {devOtpHelp && (
                                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-bold text-center mt-2.5 animate-pulse">
                                  [SANDBOX OTP]: {devOtpHelp}
                                </div>
                              )}
                            </div>

                            <div className="flex justify-between items-center text-xs mt-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsOtpSent(false);
                                  setOtpCode('');
                                }}
                                className="text-[var(--text-secondary)] hover:text-white hover:underline transition-colors bg-transparent border-none"
                              >
                                Change Phone Number
                              </button>
                              
                              {countdown > 0 ? (
                                <span className="text-[var(--text-muted)] font-mono">Resend in {countdown}s</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={handlePhoneSubmit}
                                  className="text-[var(--violet-bright)] font-bold hover:underline bg-transparent border-none"
                                >
                                  Resend OTP
                                </button>
                              )}
                            </div>

                            <GlowButton type="submit" isLoading={localLoading} className="w-full py-4 text-base mt-4">
                              {mode === 'login' ? 'Verify & Sign In' : 'Verify & Sign Up'}
                            </GlowButton>
                          </form>
                        )}
                      </div>
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
                  </>
                )}

                {mode === 'forgot' && (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="text-center space-y-2 mb-8">
                      <h2 className="text-3xl font-display font-bold text-gradient">Forgot Password</h2>
                      <p className="text-[var(--text-secondary)] text-sm">
                        Enter your email to receive a 6-digit verification code.
                      </p>
                    </div>

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

                    <GlowButton type="submit" isLoading={localLoading} className="w-full py-4 text-base mt-2">
                      Send Code
                    </GlowButton>

                    <p className="mt-8 text-center text-sm text-[var(--text-secondary)]">
                      <button 
                        type="button"
                        onClick={() => setMode('login')}
                        className="text-[var(--violet-bright)] font-bold hover:underline"
                      >
                        Back to Sign In
                      </button>
                    </p>
                  </form>
                )}

                {mode === 'reset' && (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="text-center space-y-2 mb-8">
                      <h2 className="text-3xl font-display font-bold text-gradient">Reset Password</h2>
                      <p className="text-[var(--text-secondary)] text-sm">
                        Enter the 6-digit verification code sent to your email.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Verification Code (OTP)</label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                        <input 
                          type="text" 
                          required
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 tracking-[0.5em] text-center text-lg font-bold focus:border-[var(--violet-bright)] focus:ring-1 focus:ring-[var(--violet-bright)] outline-none transition-all"
                          placeholder="123456"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">New Password</label>
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

                    <GlowButton type="submit" isLoading={localLoading} className="w-full py-4 text-base mt-2">
                      Save New Password
                    </GlowButton>

                    <p className="mt-8 text-center text-sm text-[var(--text-secondary)]">
                      <button 
                        type="button"
                        onClick={() => setMode('login')}
                        className="text-[var(--violet-bright)] font-bold hover:underline"
                      >
                        Back to Sign In
                      </button>
                    </p>
                  </form>
                )}
              </motion.div>
            ) : onboardingStep === 'policy' ? (
              <motion.div
                key="onboarding-policy"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-[var(--violet-primary)]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-8 h-8 text-[var(--violet-bright)]" />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-gradient">Safe Nights Start Here</h2>
                  <p className="text-[var(--text-secondary)] text-xs">Review our platform guidelines to continue.</p>
                </div>

                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  {[
                    { title: 'Privacy & Protection', desc: "I agree to VHOP's privacy policies and terms." },
                    { title: 'Independent Entity', desc: "I understand VHOP is NOT a part of any club or pub." },
                    { title: 'Age Consent', desc: "I confirm that I am 18 years of age or older." }
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[var(--violet-bright)] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-white">{item.title}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">{item.desc}</p>
                      </div>
                    </div>
                  ))}

                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <p className="text-[10px] text-amber-200/80 leading-tight">
                      <span className="font-bold">HEALTH WARNING:</span> Alcohol and smoking are injurious to health. Enjoy responsibly.
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer p-2 group bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="peer hidden" 
                    />
                    <div className="w-5 h-5 border-2 border-white/10 rounded-lg peer-checked:bg-[var(--violet-bright)] peer-checked:border-[var(--violet-bright)] transition-all flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" />
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-[var(--text-secondary)] group-hover:text-white transition-colors">
                    I accept all policies and guidelines
                  </span>
                </label>

                <GlowButton 
                  onClick={() => setOnboardingStep('interests')} 
                  disabled={!agreed} 
                  className="w-full py-3 text-sm"
                >
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </GlowButton>
              </motion.div>
            ) : (
              <motion.div
                key="onboarding-interests"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-display font-bold text-gradient">What are your Interests?</h2>
                  <p className="text-[var(--text-secondary)] text-xs">Tell us what you love to personalize your experience.</p>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  {INTERESTS.map((interest) => (
                    <button
                      key={interest.id}
                      onClick={() => toggleInterest(interest.id)}
                      className={`p-3 rounded-xl border transition-all flex items-center gap-3 text-left ${
                        selectedInterests.includes(interest.id)
                          ? 'bg-[var(--violet-primary)]/20 border-[var(--violet-bright)] shadow-glow'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <interest.icon className={`w-4 h-4 ${
                        selectedInterests.includes(interest.id) ? 'text-[var(--violet-bright)]' : 'text-[var(--text-muted)]'
                      }`} />
                      <span className="text-[10px] font-bold text-white">{interest.label}</span>
                    </button>
                  ))}
                </div>

                <GlowButton 
                  onClick={handleCompleteOnboarding} 
                  isLoading={isSubmitting}
                  className="w-full py-3 text-sm"
                >
                  Save Interests
                </GlowButton>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </motion.div>
    </div>
  );
};
