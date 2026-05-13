import React from 'react';
import { motion } from 'framer-motion';
import { GlowButton } from '../ui/GlowButton';
import { Calendar, MapPin } from 'lucide-react';

interface FeaturedEventProps {
  event: {
    title: string;
    description: string;
    cover_image: string;
    venue_name: string;
    start_date: string;
    price: number;
  };
}

export const FeaturedEventBanner: React.FC<FeaturedEventProps> = ({ event }) => {
  return (
    <div className="relative w-full h-[350px] md:h-[500px] rounded-[2.5rem] overflow-hidden group border border-white/5">
      <img 
        src={event.cover_image} 
        alt={event.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/40 to-transparent" />
      
      <div className="relative h-full flex flex-col justify-end p-6 md:p-16 max-w-2xl space-y-4">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-[var(--accent-pink)] font-syne font-bold tracking-widest text-[10px] md:text-sm uppercase">Featured Event</span>
          <h2 className="text-3xl md:text-6xl font-display font-bold mt-1 leading-tight">
            {event.title}
          </h2>
          <p className="text-[var(--text-secondary)] text-sm md:text-lg mt-2 line-clamp-1 md:line-clamp-2">
            {event.description}
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap gap-4 md:gap-6 text-white"
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 md:w-5 md:h-5 text-[var(--violet-bright)]" />
            <span className="text-xs md:text-base font-medium">{event.venue_name}</span>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <GlowButton size="sm" className="w-full md:w-fit py-3">
            Book Tickets • ₹{event.price}
          </GlowButton>
        </motion.div>
      </div>
    </div>
  );
};
