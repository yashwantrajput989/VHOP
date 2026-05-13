import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowButton } from '../../components/ui/GlowButton';
import { Mail, Lock, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Navigate } from 'react-router-dom';

export const AdminLogin: React.FC<{ forcedRole?: 'admin' | 'superadmin' }> = ({ forcedRole }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [city, setCity] = useState('');
  const [poc, setPoc] = useState('');
  const [mobile, setMobile] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [role, setRole] = useState<'admin' | 'superadmin'>(forcedRole || 'admin');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loginAdmin } = useAuthStore();

  // If already logged in, redirect
  if (user && user.role === role) {
    return <Navigate to={role === 'superadmin' ? '/superadmin' : '/admin'} replace />;
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (mode === 'signup') {
      setTimeout(() => {
        alert('Application submitted! Our team will review your details and get back to you shortly.');
        setMode('login');
        setIsLoading(false);
      }, 1500);
      return;
    }

    try {
      await loginAdmin(role, password);
      navigate(role === 'superadmin' ? '/superadmin' : '/admin');
    } catch (error: any) {
      alert(error.message || 'Login failed. Please check your credentials.');
      setIsLoading(false);
    }
  };

  return (
    <PageWrapper>
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[85%]"
        >
          <GlassCard className="p-16 border-[var(--violet-primary)]/30">
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-[var(--violet-primary)]/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                {role === 'superadmin' ? <ShieldCheck className="w-10 h-10 text-[var(--violet-bright)]" /> : <LayoutDashboard className="w-10 h-10 text-[var(--violet-bright)]" />}
              </div>
              <h1 className="text-5xl font-display font-bold text-gradient">
                {mode === 'login' ? 'Admin Gateway' : 'Partner Application'}
              </h1>
              <p className="text-xl text-[var(--text-secondary)] mt-4">
                {mode === 'login' ? 'Manage the future of nightlife.' : 'Join VHOP as a premium venue partner.'}
              </p>
            </div>

            {!forcedRole && mode === 'login' && (
              <div className="flex p-1 bg-white/5 rounded-xl mb-8">
                <button 
                  onClick={() => setRole('admin')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${role === 'admin' ? 'bg-[var(--violet-primary)] text-white shadow-glow' : 'text-[var(--text-muted)] hover:text-white'}`}
                >
                  Partner
                </button>
                <button 
                  onClick={() => setRole('superadmin')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${role === 'superadmin' ? 'bg-[var(--violet-primary)] text-white shadow-glow' : 'text-[var(--text-muted)] hover:text-white'}`}
                >
                  Super Admin
                </button>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-6">
              <AnimatePresence mode="wait">
                {mode === 'signup' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-6 overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Company Name</label>
                        <input 
                          type="text" 
                          required
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--violet-bright)] outline-none transition-all"
                          placeholder="Velvet Club"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">City</label>
                        <input 
                          type="text" 
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--violet-bright)] outline-none transition-all"
                          placeholder="Visakhapatnam"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Point of Contact (POC)</label>
                        <input 
                          type="text" 
                          required
                          value={poc}
                          onChange={(e) => setPoc(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--violet-bright)] outline-none transition-all"
                          placeholder="Alex Rivera"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Mobile Number</label>
                        <input 
                          type="tel" 
                          required
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--violet-bright)] outline-none transition-all"
                          placeholder="+91 XXXXX XXXXX"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Website URL</label>
                      <input 
                        type="url" 
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--violet-bright)] outline-none transition-all"
                        placeholder="https://example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Business Email</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:border-[var(--violet-bright)] outline-none transition-all"
                          placeholder="admin@vhop.in"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Business Bio</label>
                      <textarea 
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--violet-bright)] outline-none transition-all resize-none"
                        placeholder="Tell us about your venue/brand..."
                        rows={3}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {mode === 'login' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Credentials</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:border-[var(--violet-bright)] outline-none transition-all"
                        placeholder="admin@vhop.in"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                      <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:border-[var(--violet-bright)] outline-none transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>
              )}

              <GlowButton type="submit" isLoading={isLoading} className="w-full py-4 text-base">
                {mode === 'login' ? 'Secure Login' : 'Submit Application'}
              </GlowButton>
            </form>

            <div className="mt-8 text-center">
              {role === 'admin' && (
                <p className="text-sm text-[var(--text-secondary)]">
                  {mode === 'login' ? "Want to partner with us?" : "Already have an account?"}{' '}
                  <button 
                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                    className="text-[var(--violet-bright)] font-bold hover:underline"
                  >
                    {mode === 'login' ? 'Apply Now' : 'Sign in'}
                  </button>
                </p>
              )}
              {role === 'superadmin' && (
                <p className="text-xs text-[var(--text-muted)]">
                  Restricted access. Only authorized personnel should proceed.
                </p>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </PageWrapper>
  );
};
