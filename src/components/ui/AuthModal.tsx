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
  ArrowRight
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { logToBackend } from '../../lib/logger';

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
  const { loginWithGoogle, isLoading, user, setUser } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  
  // Onboarding State
  const [onboardingStep, setOnboardingStep] = useState<'none' | 'policy' | 'interests'>('none');
  const [agreed, setAgreed] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
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
      const profile = await loginWithGoogle();
      if (profile && profile.onboarded) {
        closeModal();
      } else {
        setOnboardingStep('policy');
      }
    } catch (error) {
      console.error(error);
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
      const response = await fetch('https://vhop.in/api/auth/onboard', {
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
    // Simulate login and sync with MySQL for email sending
    const profile = {
      id: `email-${Math.random().toString(36).substring(2, 11)}`,
      full_name: mode === 'signup' ? fullName : (email.split('@')[0] || 'Demo User'),
      username: email.split('@')[0] || 'demouser',
      email: email || 'demo@vhop.in',
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email || 'Demo'}`,
      role: 'user' as const,
      v_coins: 500,
      city: 'Mumbai',
      phone: '+91 99999 88888',
      onboarded: false
    };

    try {
      // Sync with MySQL Backend so booking email worker can find the user!
      const syncRes = await fetch('https://vhop.in/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      const syncData = await syncRes.json();
      if (syncData.onboarded !== undefined) {
        profile.onboarded = syncData.onboarded;
      }
    } catch (syncError) {
      console.error('Failed to sync email user with MySQL:', syncError);
    }

    useAuthStore.getState().setUser(profile);
    const newUser = useAuthStore.getState().user;
    logToBackend(mode === 'signup' ? 'signup_email' : 'login_email', newUser);
    // Don't set onboardingStep here, let the useEffect handle it, or just closeModal
    closeModal();
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

          <AnimatePresence mode="wait">
            {onboardingStep === 'none' ? (
              <motion.div
                key="auth-content"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="text-center space-y-2 mb-8">
                  <h2 className="text-3xl font-display font-bold text-gradient">
                    {mode === 'login' ? 'Welcome Back' : 'Join the Night'}
                  </h2>
                  <p className="text-[var(--text-secondary)] text-sm">
                    {mode === 'login' ? 'Your next adventure starts here.' : 'Create an account to explore more.'}
                  </p>
                </div>

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
