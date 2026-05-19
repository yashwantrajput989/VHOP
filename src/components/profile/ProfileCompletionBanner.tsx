import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { GlassCard } from '../ui/GlassCard';
import { GlowButton } from '../ui/GlowButton';
import { AlertCircle, Smartphone, Calendar, MapPin, Award, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../../config';

export const isProfileComplete = (user: any): boolean => {
  return !!(user && user.full_name && user.email && user.phone && user.age);
};

export const ProfileCompletionBanner: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState(user?.phone || '');
  const [age, setAge] = useState(user?.age ? String(user.age) : '');
  const [address, setAddress] = useState(user?.address || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [error, setError] = useState('');

  if (!user || isProfileComplete(user)) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone.trim()) {
      setError('Phone number is required.');
      return;
    }
    if (!age.trim() || isNaN(Number(age)) || Number(age) < 18) {
      setError('Please enter a valid age (must be 18 or older).');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          phone,
          age: Number(age),
          address
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update profile.');
      }

      const data = await response.json();
      setUser(data.user);
      
      // Trigger celebration
      setIsOpen(false);
      setShowCelebration(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Light weight confetti generator
  const renderConfetti = () => {
    const pieces = Array.from({ length: 50 });
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[160]">
        {pieces.map((_, idx) => {
          const left = Math.random() * 100;
          const delay = Math.random() * 3;
          const duration = Math.random() * 2 + 2;
          const size = Math.random() * 8 + 6;
          const colors = ['#8B5CF6', '#EC4899', '#06B6D4', '#F59E0B', '#10B981'];
          const color = colors[Math.floor(Math.random() * colors.length)];
          return (
            <motion.div
              key={idx}
              className="absolute top-[-10px] rounded-full"
              style={{
                left: `${left}%`,
                width: size,
                height: size,
                backgroundColor: color,
              }}
              animate={{
                y: ['0vh', '110vh'],
                x: [`${Math.random() * 20 - 10}px`, `${Math.random() * 60 - 30}px`],
                rotate: [0, 360],
              }}
              transition={{
                duration: duration,
                repeat: Infinity,
                delay: delay,
                ease: 'linear'
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Banner */}
      <motion.div
        initial={{ opacity: 0, y: -25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full"
      >
        <GlassCard className="relative overflow-hidden border border-[var(--violet-bright)]/30 shadow-glow p-5 flex flex-col md:flex-row items-center gap-5 justify-between">
          {/* Animated Background Laser Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--violet-primary)]/10 via-[var(--accent-pink)]/5 to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--violet-primary)]/20 blur-2xl rounded-full" />

          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-[var(--violet-primary)]/15 border border-[var(--violet-bright)]/25 flex items-center justify-center flex-shrink-0 animate-pulse">
              <Award className="w-6 h-6 text-[var(--violet-glow)]" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--accent-pink)]/15 border border-[var(--accent-pink)]/35 text-[var(--accent-pink)]">
                  Profile Status: 50%
                </span>
                <span className="text-[10px] font-bold text-[var(--accent-gold)] flex items-center gap-1">
                  🪙 +100 V-Coins Reward
                </span>
              </div>
              <h4 className="text-sm md:text-base font-bold text-white leading-snug">
                Complete your profile details to unlock your premium V-Card Pass!
              </h4>
              <p className="text-xs text-[var(--text-secondary)]">
                Completing your Profile (Age & Phone) credits 100 V-Coins to your wallet instantly.
              </p>
            </div>
          </div>

          <GlowButton onClick={() => setIsOpen(true)} className="w-full md:w-auto relative z-10 shrink-0 text-xs py-3.5 px-6">
            Complete Profile Now
          </GlowButton>
        </GlassCard>
      </motion.div>

      {/* Completion Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md z-10"
            >
              <GlassCard className="p-6 md:p-8 space-y-6 border border-[var(--violet-bright)]/30 shadow-glow">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-3xl bg-[var(--violet-primary)]/10 border border-[var(--violet-bright)]/30 flex items-center justify-center mx-auto shadow-glow">
                    <Award className="w-8 h-8 text-[var(--violet-bright)] animate-bounce" />
                  </div>
                  <h3 className="text-2xl font-display font-bold">Claim Your Reward 🪙</h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Finish updating your details to unlock 100 V-Coins and your custom Entry QR V-Card.
                  </p>
                </div>

                {error && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-xs text-red-200/90 font-medium">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-[var(--violet-bright)]" /> Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-[var(--violet-bright)] focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[var(--violet-bright)]" /> Age *
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="Enter age (must be 18+)"
                      min="18"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-[var(--violet-bright)] focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[var(--violet-bright)]" /> Address (Optional)
                    </label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter your residence details for VIP entry verification..."
                      rows={3}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-[var(--violet-bright)] focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <GlowButton
                      type="button"
                      variant="secondary"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 py-3"
                    >
                      Cancel
                    </GlowButton>
                    <GlowButton
                      type="submit"
                      isLoading={isSubmitting}
                      className="flex-1 py-3"
                    >
                      Save & Claim
                    </GlowButton>
                  </div>
                </form>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confetti & Success Celebration Modal */}
      <AnimatePresence>
        {showCelebration && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            {renderConfetti()}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="relative w-full max-w-sm z-10"
            >
              <GlassCard className="p-8 text-center space-y-6 border border-[var(--accent-green)]/40 shadow-glow relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent-green)]/5 to-transparent pointer-events-none" />

                <div className="space-y-2 relative z-10">
                  <div className="w-20 h-20 rounded-full bg-[var(--accent-green)]/15 border border-[var(--accent-green)]/30 flex items-center justify-center mx-auto shadow-glow">
                    <CheckCircle className="w-10 h-10 text-[var(--accent-green)] animate-pulse" />
                  </div>
                  <h3 className="text-3xl font-display font-bold text-white">Profile Unlocked!</h3>
                  <p className="text-xs text-[var(--text-secondary)] uppercase tracking-widest font-semibold text-[var(--accent-green)] mt-1">
                    V-Coins Credited!
                  </p>
                </div>

                {/* Rotating 3D style Golden Coin Widget */}
                <div className="relative w-28 h-28 mx-auto flex items-center justify-center mt-2">
                  <motion.div
                    animate={{ rotateY: 360 }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
                    className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-300 border-4 border-yellow-500 shadow-[0_0_35px_rgba(245,158,11,0.5)] flex items-center justify-center"
                  >
                    <span className="font-display font-extrabold text-3xl text-amber-950 shadow-sm">V</span>
                  </motion.div>
                  <div className="absolute inset-0 bg-yellow-500/10 blur-xl rounded-full scale-125 pointer-events-none animate-pulse" />
                </div>

                <div className="space-y-1 relative z-10">
                  <p className="text-[var(--text-secondary)] text-sm px-4">
                    Your account has been credited with <span className="font-bold text-white">100 V-Coins</span>!
                  </p>
                  <p className="text-xs text-[var(--violet-glow)] font-bold mt-2">
                    🎟️ Your premium interactive V-Card Pass is now activated.
                  </p>
                </div>

                <GlowButton
                  onClick={() => {
                    setShowCelebration(false);
                    // Smooth scroll down to profile detail / card section
                    const el = document.getElementById('v-card-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full py-4 text-sm relative z-10 mt-2"
                >
                  Awesome, Show My V-Card!
                </GlowButton>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
