import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Copy, Share2, QrCode } from 'lucide-react';

interface ReferralCardProps {
  code: string;
}

export const ReferralCard: React.FC<ReferralCardProps> = ({ code }) => {
  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-display font-bold">Invite Friends</h3>
        <QrCode className="w-6 h-6 text-[var(--violet-bright)]" />
      </div>
      
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Share your unique referral code and earn <span className="text-[var(--accent-gold)] font-bold">50 V Coins</span> for every friend who joins!
      </p>
      
      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 group">
        <code className="flex-1 text-sm font-mono text-[var(--violet-glow)] font-bold tracking-wider uppercase">
          {code}
        </code>
        <button 
          onClick={() => navigator.clipboard.writeText(code)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors text-[var(--text-muted)] hover:text-white"
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>
      
      <button className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--violet-primary)] hover:bg-[var(--violet-bright)] transition-colors font-bold">
        <Share2 className="w-4 h-4" /> Share Referral Link
      </button>
    </GlassCard>
  );
};
