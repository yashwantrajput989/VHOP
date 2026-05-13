import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import { MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

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

import { useNavigate } from 'react-router-dom';

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const date = new Date(event.start_date);
  const navigate = useNavigate();

  return (
    <GlassCard 
      onClick={() => navigate(`/events/${event.id}`)}
      className="relative w-full aspect-[4/3] overflow-hidden group cursor-pointer border-white/10 hover:border-[var(--violet-bright)]/50 transition-all duration-500 rounded-2xl h-auto"
    >
      <motion.img 
        src={event.cover_image} 
        alt={event.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      
      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Top Badge */}
      <div className="absolute top-2 left-2 z-10">
        <Badge variant={event.category.toLowerCase() as any} className="backdrop-blur-md bg-white/10 border-white/20 text-[8px] py-0 px-1.5">
          {event.category}
        </Badge>
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-x-0 bottom-0 p-2.5 space-y-1.5 z-10">
        <div className="space-y-0.5">
          <h3 className="text-[11px] font-display font-bold text-white leading-tight line-clamp-1">
            {event.title}
          </h3>
          <div className="flex items-center gap-1 text-[var(--text-secondary)] text-[8px] font-medium">
            <MapPin className="w-2 h-2 text-[var(--violet-bright)]" />
            <span className="truncate">{event.venue_name}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <span className="text-[10px] font-bold text-white">
            {event.price === 0 ? 'FREE' : `₹${event.price}`}
          </span>
          <button className="bg-[var(--violet-primary)] text-white text-[8px] font-bold px-2 py-1 rounded-md shadow-glow active:scale-90 transition-transform" onClick={(e) => {
            e.stopPropagation();
            navigate(`/events/${event.id}`);
          }}>
            BOOK
          </button>
        </div>
      </div>

      {/* Date floating element */}
      <div className="absolute top-2 right-2 z-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-1 text-center min-w-[32px]">
        <p className="text-[8px] font-bold text-white leading-none">{date.getDate()}</p>
        <p className="text-[6px] font-bold text-[var(--violet-bright)] uppercase tracking-tighter mt-0.5">{date.toLocaleDateString('en-IN', { month: 'short' })}</p>
      </div>
    </GlassCard>
  );
};
