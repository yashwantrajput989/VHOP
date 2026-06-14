import React, { useState } from 'react';
import { Calendar, MapPin, Users, Heart, Share2 } from 'lucide-react';
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
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Format date to: DD-MM-YYYY hh:mm am/pm
  const formatEventDate = (dateStr: string) => {
    try {
      const date = new Date(typeof dateStr === 'string' ? dateStr.replace(' ', 'T') : dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 should be 12
      const strHours = String(hours).padStart(2, '0');
      
      return `${day}-${month}-${year} ${strHours}:${minutes} ${ampm}`;
    } catch (e) {
      return dateStr;
    }
  };

  const formattedDate = formatEventDate(event.start_date);

  // Dynamic Day Badge (Today, Tomorrow, Soon)
  const getDayBadge = () => {
    try {
      const today = new Date();
      const eventDate = new Date(typeof event.start_date === 'string' ? event.start_date.replace(' ', 'T') : event.start_date);
      
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const targetDate = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      
      const diffTime = targetDate.getTime() - todayDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return (
          <span className="absolute top-3 right-3 z-20 bg-emerald-500 text-white text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-[0_4px_12px_rgba(16,185,129,0.35)]">
            Today!
          </span>
        );
      } else if (diffDays === 1) {
        return (
          <span className="absolute top-3 right-3 z-20 bg-rose-500 text-white text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-[0_4px_12px_rgba(239,68,68,0.35)]">
            Tomorrow!
          </span>
        );
      } else if (diffDays > 1 && diffDays <= 3) {
        return (
          <span className="absolute top-3 right-3 z-20 bg-[var(--violet-primary)] text-white text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-[0_4px_12px_rgba(124,58,237,0.35)]">
            Soon
          </span>
        );
      }
    } catch (e) {
      // Ignore errors
    }
    return null;
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/events/${event.id}`;
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: `Check out this event: ${event.title}`,
        url: shareUrl
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div 
      onClick={() => navigate(`/events/${event.id}`)}
      className="group cursor-pointer bg-slate-900/40 backdrop-blur-md rounded-[1.8rem] border border-white/10 hover:border-[var(--violet-bright)]/30 hover:shadow-glow transition-all duration-500 flex flex-col w-full min-w-0 select-none overflow-hidden"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden w-full bg-black/40 border-b border-white/5">
        <motion.img 
          src={getImageUrl(event.cover_image)} 
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none" />
        
        {/* Floating Quick Action Overlays */}
        <div className="absolute top-3 left-3 z-20 flex gap-2">
          {/* Share Button */}
          <button 
            onClick={handleShare}
            className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-[var(--violet-primary)] hover:border-[var(--violet-bright)] transition-all duration-300 relative"
            title="Share Event"
          >
            {isCopied ? (
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-[8px] font-bold text-white px-2 py-0.5 rounded border border-white/10 whitespace-nowrap">Copied!</span>
            ) : null}
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {/* Heart / Favorite Button */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsFavorite(!isFavorite);
            }}
            className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:border-rose-500 hover:text-rose-500 transition-all duration-300"
            title="Add to Favorites"
          >
            <Heart className={`w-3.5 h-3.5 transition-colors ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>

        {/* Dynamic Day Badge Overlay (Top Right) */}
        {getDayBadge()}

        {/* Ticket Price Badge overlay (Bottom Right) */}
        <div className="absolute bottom-3 right-3 z-20 backdrop-blur-md bg-black/60 border border-white/10 px-2.5 py-1 rounded-xl">
          <span className="text-[10px] font-extrabold text-white">
            {event.price === 0 ? 'FREE' : `₹${event.price}+`}
          </span>
        </div>
      </div>

      {/* Details Container */}
      <div className="p-4 flex flex-col space-y-2.5 flex-1 text-left">
        {/* Title */}
        <h3 className="text-xs md:text-sm font-display font-bold text-white leading-tight line-clamp-1 group-hover:text-[var(--violet-bright)] transition-colors">
          {event.title}
        </h3>

        {/* Date Row */}
        <div className="flex items-center gap-2 text-[var(--text-secondary)] text-[10px] md:text-xs font-medium">
          <Calendar className="w-3.5 h-3.5 text-[var(--accent-cyan)] shrink-0" />
          <span className="truncate">{formattedDate}</span>
        </div>

        {/* Location Row */}
        <div className="flex items-center gap-2 text-[var(--text-secondary)] text-[10px] md:text-xs font-medium">
          <MapPin className="w-3.5 h-3.5 text-[var(--accent-pink)] shrink-0" />
          <span className="truncate">{event.venue_name}</span>
        </div>

        {/* Attending Row */}
        <div className="flex items-center gap-2 text-sky-400 text-[10px] md:text-xs font-semibold mt-1">
          <Users className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span>{event.tickets_sold || 0} attending</span>
        </div>
      </div>
    </div>
  );
};
