import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Music, Users, MessageSquare, GlassWater, ChevronRight, Zap, PartyPopper } from 'lucide-react';
import { GlowButton } from '../../components/ui/GlowButton';
import { FloatingOrb } from '../../components/ui/FloatingOrb';

interface OnboardingSlide {
  title: string;
  highlightText: string;
  subtitle: string;
  description: string;
  themeColor: 'violet' | 'cyan' | 'pink';
  icon: React.ComponentType<any>;
  graphic: React.ReactNode;
}

export const WelcomeOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: OnboardingSlide[] = [
    {
      title: "Don't Miss the",
      highlightText: "Vibe in the Night",
      subtitle: "Discover Premier Experiences",
      description: "Find the absolute best parties, clubs, festivals, and underground music events in your city. Real-time availability, secure ticketing, and premium passes.",
      themeColor: 'violet',
      icon: GlassWater,
      graphic: (
        <div className="relative w-full h-44 flex items-center justify-center">
          {/* Glowing Aura */}
          <div className="absolute w-36 h-36 rounded-full bg-[var(--violet-primary)]/20 blur-2xl animate-pulse" />
          
          {/* Card Mockup */}
          <motion.div 
            initial={{ rotate: -5, scale: 0.9 }}
            animate={{ rotate: -2, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative w-64 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col gap-3"
          >
            <div className="flex justify-between items-center">
              <span className="text-[9px] bg-[var(--violet-primary)] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Tonight
              </span>
              <Music className="w-4 h-4 text-[var(--violet-bright)]" />
            </div>
            <div className="h-16 rounded-xl bg-gradient-to-r from-violet-600/40 to-pink-600/40 border border-white/5 overflow-hidden flex items-center justify-center relative">
              <PartyPopper className="w-8 h-8 text-white/80 animate-bounce" />
              <div className="absolute inset-0 bg-black/10" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-white">Vibe Club | Neon Night</p>
              <p className="text-[9px] text-[var(--text-muted)]">Visakhapatnam • 09:00 PM</p>
            </div>
          </motion.div>

          {/* Floating ticket badge */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="absolute top-4 right-10 p-2.5 rounded-xl bg-[#151226]/90 border border-[var(--violet-bright)]/40 shadow-lg text-[9px] font-bold text-white flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-400" /> Fast Pass
          </motion.div>
        </div>
      )
    },
    {
      title: "Connect &",
      highlightText: "Meet New People",
      subtitle: "Your Nightlife Social Circle",
      description: "Don't head out alone! See who else is attending, join the discussion, find party buddies, and start making friends before you even hit the venue.",
      themeColor: 'cyan',
      icon: Users,
      graphic: (
        <div className="relative w-full h-44 flex items-center justify-center">
          <div className="absolute w-36 h-36 rounded-full bg-[var(--accent-cyan)]/15 blur-2xl animate-pulse" />
          
          {/* Avatar Connections */}
          <div className="relative w-72 h-32 flex items-center justify-center">
            {/* Connecting lines SVG */}
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <motion.path 
                d="M 60,60 Q 144,30 220,60" 
                fill="none" 
                stroke="rgba(6, 182, 212, 0.3)" 
                strokeWidth="2" 
                strokeDasharray="4 4"
              />
              <motion.path 
                d="M 60,60 Q 144,90 220,60" 
                fill="none" 
                stroke="rgba(6, 182, 212, 0.3)" 
                strokeWidth="2" 
                strokeDasharray="4 4"
              />
            </svg>

            {/* Avatar Left */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="absolute left-8 w-12 h-12 rounded-full border-2 border-[var(--accent-cyan)] bg-slate-900 flex items-center justify-center shadow-lg overflow-hidden"
            >
              <div className="w-full h-full bg-cyan-500/20 flex items-center justify-center font-bold text-white text-xs">AJ</div>
            </motion.div>

            {/* Avatar Right */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="absolute right-8 w-12 h-12 rounded-full border-2 border-[var(--accent-cyan)] bg-slate-900 flex items-center justify-center shadow-lg overflow-hidden"
            >
              <div className="w-full h-full bg-cyan-500/20 flex items-center justify-center font-bold text-white text-xs">SR</div>
            </motion.div>

            {/* Floating Match box */}
            <motion.div 
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute px-3 py-1.5 rounded-xl bg-[var(--bg-card)] border border-white/10 shadow-lg text-[9px] font-bold text-white flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[var(--accent-cyan)]" /> Vibe Match!
            </motion.div>
          </div>
        </div>
      )
    },
    {
      title: "Create Squads,",
      highlightText: "Nights Are Fun",
      subtitle: "Better Together",
      description: "Gather your crew or build a new squad. Stay updated on where your squad is headed, coordinate rides, split entry passes, and create unforgettable memories.",
      themeColor: 'pink',
      icon: Sparkles,
      graphic: (
        <div className="relative w-full h-44 flex items-center justify-center">
          <div className="absolute w-36 h-36 rounded-full bg-[var(--accent-pink)]/15 blur-2xl animate-pulse" />
          
          <motion.div 
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="w-60 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col gap-2 text-left"
          >
            <p className="text-[10px] font-bold text-[var(--accent-pink)] uppercase tracking-wider">Active Squad</p>
            <h4 className="text-xs font-bold text-white">Techno Tribe ⚡</h4>
            
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full border border-[var(--bg-card)] bg-pink-500 flex items-center justify-center text-[8px] font-bold">K</div>
                <div className="w-6 h-6 rounded-full border border-[var(--bg-card)] bg-purple-500 flex items-center justify-center text-[8px] font-bold">M</div>
                <div className="w-6 h-6 rounded-full border border-[var(--bg-card)] bg-cyan-500 flex items-center justify-center text-[8px] font-bold">P</div>
              </div>
              <span className="text-[8px] text-[var(--text-muted)] font-semibold">+6 others heading out</span>
            </div>
          </motion.div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = () => {
    localStorage.setItem('vhop_welcome_completed', 'true');
    navigate('/events', { replace: true });
  };

  const slide = slides[currentSlide];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col justify-between items-center relative overflow-hidden select-none px-4 py-8 md:py-16">
      {/* Floating Glowing Orbs */}
      <FloatingOrb className="-top-40 -left-20 pointer-events-none" color={slide.themeColor === 'violet' ? 'violet' : slide.themeColor === 'cyan' ? 'cyan' : 'pink'} size={400} />
      <FloatingOrb className="bottom-0 right-0 pointer-events-none" color={slide.themeColor === 'violet' ? 'cyan' : slide.themeColor === 'cyan' ? 'pink' : 'violet'} size={300} delay={2} />

      {/* Header Logo */}
      <div className="w-full max-w-md flex justify-between items-center relative z-20">
        <div className="flex items-center gap-2">
          <img src="/logo.png" className="w-8 h-8 object-contain" alt="" />
          <span className="font-display font-black text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[var(--violet-bright)] to-[var(--accent-pink)]">
            VHOP
          </span>
        </div>
        
        {currentSlide < slides.length - 1 && (
          <button 
            onClick={handleSkip}
            className="text-xs text-[var(--text-muted)] hover:text-white font-bold tracking-wider uppercase bg-white/5 border border-white/5 hover:border-white/10 px-3 py-1.5 rounded-xl transition-all"
          >
            Skip
          </button>
        )}
      </div>

      {/* Slide Content */}
      <div className="w-full max-w-md flex-1 flex flex-col justify-center items-center py-6 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="w-full flex flex-col items-center text-center space-y-6"
          >
            {/* Graphic Container */}
            <div className="w-full flex items-center justify-center mb-2">
              {slide.graphic}
            </div>

            {/* Typography */}
            <div className="space-y-3 px-4">
              <h1 className="text-3xl md:text-4xl font-display font-black leading-tight tracking-tight text-white">
                {slide.title} <br />
                <span className={`bg-gradient-to-r ${
                  slide.themeColor === 'violet' ? 'from-[var(--violet-bright)] to-[var(--accent-pink)]' :
                  slide.themeColor === 'cyan' ? 'from-[var(--accent-cyan)] to-[var(--violet-bright)]' :
                  'from-[var(--accent-pink)] to-[var(--accent-gold)]'
                } bg-clip-text text-transparent`}>
                  {slide.highlightText}
                </span>
              </h1>
              <p className="text-xs text-[var(--violet-glow)] font-extrabold uppercase tracking-widest">
                {slide.subtitle}
              </p>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-medium">
                {slide.description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer / Pagination Controls */}
      <div className="w-full max-w-md flex flex-col items-center gap-6 relative z-20">
        {/* Progress dots */}
        <div className="flex gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-2 h-2 rounded-full transition-all duration-300 focus:outline-none ${
                currentSlide === idx 
                  ? `w-6 shadow-[0_0_8px_var(--violet-bright)] ${
                      slide.themeColor === 'violet' ? 'bg-[var(--violet-bright)]' :
                      slide.themeColor === 'cyan' ? 'bg-[var(--accent-cyan)]' :
                      'bg-[var(--accent-pink)]'
                    }` 
                  : 'bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>

        {/* Action Button */}
        <div className="w-full px-4 pb-4">
          {currentSlide === slides.length - 1 ? (
            <GlowButton 
              onClick={handleFinish} 
              className="w-full py-4 text-base font-display font-black tracking-wider uppercase shadow-glow bg-gradient-to-r from-[var(--violet-primary)] to-[var(--accent-pink)] hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Start your new nightlife experience
            </GlowButton>
          ) : (
            <GlowButton 
              onClick={handleNext} 
              className="w-full py-4 text-base font-bold flex items-center justify-center gap-2"
            >
              Continue <ChevronRight className="w-5 h-5" />
            </GlowButton>
          )}
        </div>
      </div>
    </div>
  );
};
