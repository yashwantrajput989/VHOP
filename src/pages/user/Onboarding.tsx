import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowButton } from '../../components/ui/GlowButton';
import { 
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
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

const INTERESTS = [
  { id: 'night_clubs', label: 'Night Clubs', icon: PartyPopper },
  { id: 'techno', label: 'Techno Music', icon: Zap },
  { id: 'djs', label: 'Top DJs', icon: Music },
  { id: 'dinner', label: 'Fine Dining', icon: Utensils },
  { id: 'bars_pubs', label: 'Bars & Pubs', icon: Wine },
  { id: 'dance', label: 'Dance Events', icon: Music },
  { id: 'underground', label: 'Underground Scenes', icon: Zap },
];

export const Onboarding: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState<'policy' | 'interests'>('policy');
  const [agreed, setAgreed] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) {
    navigate('/events');
    return null;
  }

  const handlePolicyNext = () => {
    if (agreed) setStep('interests');
  };

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
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
        console.log('Onboarding success, updating state...');
        const updatedUser = { ...user, onboarded: true, interests: selectedInterests };
        setUser(updatedUser);
        
        setTimeout(() => {
          navigate('/events', { replace: true });
        }, 100);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Server error' }));
        console.error('Onboarding API failed:', errorData);
        alert(`Failed to complete profile: ${errorData.error || 'Check server console for details'}`);
      }
    } catch (error: any) {
      console.error('Onboarding failed:', error);
      alert('A network error occurred. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageWrapper className="flex items-center justify-center py-12">
      <div className="max-w-xl w-full px-4">
        <AnimatePresence mode="wait">
          {step === 'policy' ? (
            <motion.div
              key="policy"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-[var(--violet-primary)]/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-glow">
                  <ShieldCheck className="w-10 h-10 text-[var(--violet-bright)]" />
                </div>
                <h1 className="text-4xl font-display font-bold">Safe Nights Start <span className="text-gradient">Here</span></h1>
                <p className="text-[var(--text-secondary)]">Please review and accept our platform guidelines.</p>
              </div>

              <GlassCard className="p-8 space-y-6 border-[var(--violet-primary)]/20">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <CheckCircle2 className="w-5 h-5 text-[var(--violet-bright)] flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-bold text-white">Privacy & Protection</p>
                      <p className="text-sm text-[var(--text-muted)]">I agree to VHOP's privacy policies and terms of service.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <CheckCircle2 className="w-5 h-5 text-[var(--violet-bright)] flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-bold text-white">Independent Entity</p>
                      <p className="text-sm text-[var(--text-muted)]">I understand that VHOP is a ticketing platform and is NOT a part of any club, pub, or venue.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <CheckCircle2 className="w-5 h-5 text-[var(--violet-bright)] flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-bold text-white">Age Consent</p>
                      <p className="text-sm text-[var(--text-muted)]">I confirm that I am 18 years of age or older.</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-4">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-200/80 leading-relaxed">
                    <span className="font-bold text-amber-500">HEALTH WARNING:</span> Alcohol consumption and smoking are injurious to health. Please enjoy responsibly and follow all venue-specific safety regulations.
                  </p>
                </div>

                <label className="flex items-center gap-3 cursor-pointer group p-2">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="peer hidden" 
                    />
                    <div className="w-6 h-6 border-2 border-white/10 rounded-lg peer-checked:bg-[var(--violet-bright)] peer-checked:border-[var(--violet-bright)] transition-all flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-white transition-colors">
                    I accept all policies and guidelines
                  </span>
                </label>

                <GlowButton 
                  onClick={handlePolicyNext} 
                  disabled={!agreed} 
                  className="w-full py-4 text-base"
                >
                  Continue <ArrowRight className="w-5 h-5 ml-2" />
                </GlowButton>
              </GlassCard>
            </motion.div>
          ) : (
            <motion.div
              key="interests"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <h1 className="text-4xl font-display font-bold">What <span className="text-gradient">Excites</span> You?</h1>
                <p className="text-[var(--text-secondary)]">Tell us what you're seeking to personalize your experience.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {INTERESTS.map((interest) => (
                  <button
                    key={interest.id}
                    onClick={() => toggleInterest(interest.id)}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                      selectedInterests.includes(interest.id)
                        ? 'bg-[var(--violet-primary)] border-[var(--violet-bright)] shadow-glow scale-[1.02]'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${
                        selectedInterests.includes(interest.id) ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'
                      }`}>
                        <interest.icon className={`w-6 h-6 ${
                          selectedInterests.includes(interest.id) ? 'text-white' : 'text-[var(--text-muted)]'
                        }`} />
                      </div>
                      <span className="font-bold text-white">{interest.label}</span>
                    </div>
                    {selectedInterests.includes(interest.id) && (
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    )}
                  </button>
                ))}
              </div>

              <GlowButton 
                onClick={handleComplete} 
                isLoading={isSubmitting}
                className="w-full py-4 text-base"
              >
                Complete Profile
              </GlowButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
};
