import React from 'react';
import { MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../../config';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    category: string;
    venue_name: string;
    city: string;
    start_date: string;
    price: number;
    cover_image: string;
    tickets_sold: number;
  };
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const date = new Date(event.start_date);
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(`/events/${event.id}`)}
      className="group cursor-pointer space-y-2 md:space-y-4 w-full min-w-0"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] md:rounded-[2rem] border border-white/5 bg-black/40 transition-all duration-500 group-hover:border-[var(--violet-bright)]/30 group-hover:shadow-glow flex items-center justify-center">
        {/* Background Blurred Underlay for depth */}
        <img 
          src={getImageUrl(event.cover_image)} 
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-xl opacity-30 scale-110 pointer-events-none"
        />

        {/* Foreground High-Fidelity flyer in portrait vertical aspect ratio */}
        <motion.img 
          src={getImageUrl(event.cover_image)} 
          alt={event.title}
          className="relative z-10 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        
        {/* Date Overlay - Simplified */}
        <div className="absolute top-3 left-3 z-20 backdrop-blur-xl bg-black/40 border border-white/10 px-2 py-1 rounded-xl text-center min-w-[40px]">
          <p className="text-xs font-bold text-white leading-none">{date.getDate()}</p>
          <p className="text-[8px] font-bold text-[var(--violet-bright)] uppercase tracking-widest mt-0.5">
            {date.toLocaleDateString('en-IN', { month: 'short' })}
          </p>
        </div>

        {/* Price Tag Overlay - Bottom Right */}
        <div className="absolute bottom-3 right-3 z-20 backdrop-blur-xl bg-white/10 border border-white/10 px-3 py-1 rounded-xl">
          <span className="text-[10px] font-bold text-white">
            {event.price === 0 ? 'FREE' : `₹${event.price}+`}
          </span>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-40 group-hover:opacity-70 transition-opacity duration-500 z-15 pointer-events-none" />
      </div>

      <div className="space-y-1 px-1">
        <h3 className="text-xs md:text-sm font-display font-bold text-white leading-tight line-clamp-1 group-hover:text-[var(--violet-bright)] transition-colors">
          {event.title}
        </h3>
        <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-[10px] font-medium">
          <MapPin className="w-3 h-3 text-[var(--violet-bright)]" />
          <span className="truncate">{event.venue_name}</span>
        </div>
      </div>
    </div>
  );
};
