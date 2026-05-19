import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { QrCode, Shield, Sparkles, RefreshCw } from 'lucide-react';

export const VCardPass: React.FC = () => {
  const { user } = useAuthStore();
  const [isFlipped, setIsFlipped] = useState(false);

  if (!user || !user.age || !user.phone) return null;

  // Encode visitor profile details into QR Code payload
  const qrPayload = JSON.stringify({
    id: user.id,
    name: user.full_name,
    age: user.age,
    phone: user.phone,
    email: user.email,
    address: user.address || ''
  });

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrPayload)}`;

  return (
    <div id="v-card-section" className="space-y-6 flex flex-col items-center">
      <div className="text-center space-y-1">
        <h3 className="text-2xl font-display font-bold text-white flex items-center justify-center gap-2">
          🎟️ Your V-Card Pass <Sparkles className="w-5 h-5 text-[var(--accent-gold)] animate-pulse" />
        </h3>
        <p className="text-xs text-[var(--text-secondary)]">
          Tap the card to flip and reveal your entry QR code.
        </p>
      </div>

      {/* 3D Flipping Card Container */}
      <div 
        className="w-full max-w-[340px] h-[480px] cursor-pointer"
        style={{ perspective: 1200 }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <motion.div
          className="relative w-full h-full duration-700"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          {/* FRONT SIDE */}
          <div 
            className="absolute inset-0 w-full h-full rounded-[2.5rem] p-6 flex flex-col justify-between overflow-hidden shadow-glow border border-violet-500/30"
            style={{ 
              backfaceVisibility: 'hidden',
              background: 'linear-gradient(135deg, #0A071B 0%, #150E36 50%, #290835 100%)' 
            }}
          >
            {/* Ambient Background Glows */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-[var(--violet-primary)]/20 blur-3xl rounded-full" />
            <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-[var(--accent-pink)]/20 blur-3xl rounded-full" />
            
            {/* Top Bar */}
            <div className="flex justify-between items-start relative z-10">
              <div className="space-y-1">
                <span className="font-display font-extrabold text-2xl tracking-widest bg-gradient-to-r from-violet-400 via-pink-400 to-yellow-300 -webkit-background-clip-text -webkit-text-fill-color:transparent">
                  VHOP
                </span>
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--text-muted)]">
                  NIGHTLIFE VIP PASS
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[var(--violet-primary)] to-[var(--accent-pink)] text-[8px] font-extrabold uppercase tracking-widest text-white border border-white/10 shadow-glow">
                PRO ACTIVE
              </span>
            </div>

            {/* Middle Section: Hologram & User Avatar */}
            <div className="flex flex-col items-center gap-4 relative z-10 my-auto">
              <div className="relative">
                {/* Holographic Chip Visual */}
                <div className="absolute -top-4 -left-12 w-8 h-8 rounded-lg bg-gradient-to-tr from-yellow-600 via-yellow-400 to-amber-200 border border-yellow-500 opacity-80 flex items-center justify-center overflow-hidden">
                  <div className="w-full h-0.5 bg-yellow-950/20 absolute top-1/4" />
                  <div className="w-full h-0.5 bg-yellow-950/20 absolute top-2/4" />
                  <div className="w-full h-0.5 bg-yellow-950/20 absolute top-3/4" />
                  <div className="w-0.5 h-full bg-yellow-950/20 absolute left-1/3" />
                  <div className="w-0.5 h-full bg-yellow-950/20 absolute left-2/3" />
                </div>
                
                <img 
                  src={user.avatar_url} 
                  alt={user.full_name} 
                  className="w-24 h-24 rounded-full border-2 border-[var(--violet-bright)] p-1 bg-black/40 shadow-glow"
                />
              </div>

              <div className="text-center space-y-1">
                <h4 className="text-2xl font-display font-bold text-white tracking-wide">{user.full_name}</h4>
                <p className="text-xs text-[var(--violet-bright)] font-bold">@{user.username}</p>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="border-t border-white/5 pt-4 flex justify-between items-end relative z-10">
              <div className="space-y-1 text-left">
                <p className="text-[8px] text-[var(--text-secondary)] uppercase tracking-wider">Access Category</p>
                <p className="text-xs font-bold text-white flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-[var(--accent-gold)]" /> Platinum VIP
                </p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[8px] text-[var(--text-secondary)] uppercase tracking-wider">Pass ID</p>
                <p className="text-xs font-mono font-bold text-white uppercase">{user.id.substring(0, 12)}</p>
              </div>
            </div>

            {/* Decorative Card Stripe */}
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/20 to-transparent pointer-events-none" />
            
            {/* Tap to Flip indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 opacity-60 text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest">
              <RefreshCw className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '6s' }} /> Tap to flip
            </div>
          </div>

          {/* BACK SIDE */}
          <div 
            className="absolute inset-0 w-full h-full rounded-[2.5rem] p-6 flex flex-col justify-between overflow-hidden shadow-glow border border-pink-500/30"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: 'linear-gradient(135deg, #0A071B 0%, #150E36 50%, #300C25 100%)' 
            }}
          >
            {/* Ambient Background Glows */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[var(--accent-pink)]/20 blur-3xl rounded-full" />
            <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-[var(--violet-primary)]/20 blur-3xl rounded-full" />

            {/* Top Bar */}
            <div className="flex justify-between items-center relative z-10 border-b border-white/5 pb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--violet-glow)] flex items-center gap-1">
                <QrCode className="w-4 h-4" /> SECURE ENTRY QR
              </span>
              <span className="text-[8px] font-extrabold text-[var(--text-muted)] tracking-wider">
                VALID DATE: 2026
              </span>
            </div>

            {/* Middle Section: Glowing QR Code */}
            <div className="my-auto flex flex-col items-center gap-4 relative z-10">
              <div className="p-3 bg-white rounded-3xl shadow-[0_0_35px_rgba(139,92,246,0.25)] relative group">
                <img 
                  src={qrUrl} 
                  alt="Entry QR Code" 
                  className="w-44 h-44 rounded-2xl block"
                />
              </div>
              <p className="text-[9px] text-[var(--text-secondary)] text-center max-w-[200px] leading-relaxed uppercase tracking-wider font-semibold">
                Scan at any VHOP entrance gate for instant visitor logs check-in.
              </p>
            </div>

            {/* Bottom Section: Scannable Fields Preview */}
            <div className="border-t border-white/5 pt-4 space-y-2 relative z-10 text-left">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px]">
                <div>
                  <span className="text-[var(--text-muted)] block uppercase tracking-wider text-[8px]">Name</span>
                  <span className="font-bold text-white truncate block">{user.full_name}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block uppercase tracking-wider text-[8px]">Age</span>
                  <span className="font-bold text-white block">{user.age} Years</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block uppercase tracking-wider text-[8px]">Contact Number</span>
                  <span className="font-bold text-white block">{user.phone}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block uppercase tracking-wider text-[8px]">Linked Email</span>
                  <span className="font-bold text-white truncate block">{user.email}</span>
                </div>
              </div>
            </div>

            {/* Tap to Flip indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 opacity-60 text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest">
              <RefreshCw className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '6s' }} /> Tap to flip
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
