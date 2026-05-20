import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Copy, Share2, QrCode, Check } from 'lucide-react';

interface ReferralCardProps {
  code: string;
}

export const ReferralCard: React.FC<ReferralCardProps> = ({ code }) => {
  const [copied, setCopied] = useState(false);
  const referralLink = `${window.location.origin}/?ref=${code}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Join me on VHOP!',
      text: `Use my referral link to sign up on VHOP and we both get 25 V-Coins! 🪙✨`,
      url: referralLink,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      handleCopy();
      alert('Referral link copied to clipboard!');
    }
  };

  return (
    <GlassCard className="p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--violet-primary)]/5 blur-2xl rounded-full pointer-events-none" />
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-display font-bold">Invite Friends</h3>
        <QrCode className="w-6 h-6 text-[var(--violet-bright)]" />
      </div>
      
      <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
        Share your unique referral link. You and your friend will both get <span className="text-[var(--accent-gold)] font-bold">25 V-Coins</span> instantly!
      </p>
      
      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 group transition-all duration-300 hover:border-white/20">
        <code className="flex-1 text-[11px] font-mono text-[var(--violet-glow)] font-bold tracking-wider truncate">
          {referralLink}
        </code>
        <button 
          onClick={handleCopy}
          className="p-2 rounded-lg hover:bg-white/10 transition-all text-[var(--text-muted)] hover:text-white shrink-0 relative active:scale-95"
          title="Copy Referral Link"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      
      <button 
        onClick={handleShare}
        className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--violet-primary)] hover:bg-[var(--violet-bright)] active:scale-[0.98] transition-all font-bold shadow-glow hover:shadow-[0_0_20px_rgba(139,92,246,0.4)]"
      >
        <Share2 className="w-4 h-4" /> Share Referral Link
      </button>
    </GlassCard>
  );
};
