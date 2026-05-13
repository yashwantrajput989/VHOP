import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Coins, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface VCoinsWidgetProps {
  balance: number;
}

export const VCoinsWidget: React.FC<VCoinsWidgetProps> = ({ balance }) => {
  return (
    <GlassCard className="p-6 bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-secondary)] border-[var(--accent-gold)]/20 overflow-hidden relative group">
      <motion.div 
        className="absolute -right-8 -top-8 text-[var(--accent-gold)] opacity-5 group-hover:opacity-10 transition-opacity"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <Coins size={160} />
      </motion.div>

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-[var(--text-muted)]">V Coins Balance</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-display font-bold text-[var(--accent-gold)]">{balance}</span>
              <span className="text-xs text-[var(--accent-green)] flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +150 this month
              </span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-2">
          <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold hover:bg-white/10 transition-colors">
            Redeem
          </button>
          <button className="px-4 py-2 rounded-xl bg-[var(--accent-gold)] text-black text-xs font-bold hover:bg-yellow-400 transition-colors">
            Earn More
          </button>
        </div>
      </div>
    </GlassCard>
  );
};
