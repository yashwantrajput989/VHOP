import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, X } from 'lucide-react';
import { useLocationStore } from '../../store/locationStore';
import { GlassCard } from '../ui/GlassCard';
import { GlowButton } from '../ui/GlowButton';

export const LocationPrompt: React.FC = () => {
  const { city, detectLocation } = useLocationStore();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show prompt after a short delay if no city is set
    const timer = setTimeout(() => {
      if (!city) {
        setIsVisible(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [city]);

  if (city || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-28 right-4 left-4 md:left-auto md:right-8 z-[60] max-w-sm"
      >
        <GlassCard className="p-6 border-[var(--violet-primary)]/30 shadow-glow relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[var(--violet-bright)]" />
          
          <button 
            onClick={() => setIsVisible(false)}
            className="absolute top-2 right-2 p-1 text-[var(--text-muted)] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[var(--violet-primary)]/20 flex-shrink-0">
              <MapPin className="w-6 h-6 text-[var(--violet-bright)]" />
            </div>
            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-white">Discover nearby events?</h4>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Let us show you the best parties and gigs happening in your city.
                </p>
              </div>
              <GlowButton 
                size="sm" 
                className="w-full"
                onClick={async () => {
                  await detectLocation();
                  setIsVisible(false);
                }}
              >
                <Navigation className="w-3 h-3 mr-2" /> Detect My Location
              </GlowButton>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </AnimatePresence>
  );
};
