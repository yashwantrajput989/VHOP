import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from './GlassCard';
import { GlowButton } from './GlowButton';
import { Sparkles, Timer, Bell } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ title, description, icon }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <GlassCard className="p-8 md:p-12 space-y-6 md:space-y-8 border-[var(--violet-primary)]/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--violet-bright)] to-transparent opacity-50" />
          
          <div className="flex justify-center">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[var(--violet-primary)]/10 flex items-center justify-center border border-[var(--violet-bright)]/20 shadow-glow">
              {icon || <Timer className="w-8 h-8 md:w-10 md:h-10 text-[var(--violet-bright)]" />}
            </div>
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-pink)]/10 border border-[var(--accent-pink)]/20 text-[var(--accent-pink)] text-[10px] md:text-xs font-bold uppercase tracking-widest">
              <Sparkles className="w-3 h-3" /> Under Construction
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white leading-tight">
              {title}
            </h2>
            <p className="text-[var(--text-secondary)] text-sm md:text-lg max-w-md mx-auto">
              {description}
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <GlowButton className="w-full sm:w-auto px-8 py-4">
              <Bell className="w-4 h-4 mr-2" /> Notify Me
            </GlowButton>
            <button className="text-[var(--text-muted)] hover:text-white transition-colors text-sm font-bold flex items-center gap-2">
              Learn More <span className="text-xl">→</span>
            </button>
          </div>

          {/* Background decoration */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[var(--violet-primary)] opacity-10 blur-[80px]" />
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-[var(--accent-pink)] opacity-10 blur-[80px]" />
        </GlassCard>
      </motion.div>
    </div>
  );
};
