import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, ArrowLeft, ShieldCheck, Share2, Info, Globe } from 'lucide-react';
import { MOCK_EVENTS } from '../../lib/mockData';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowButton } from '../../components/ui/GlowButton';
import { Badge } from '../../components/ui/Badge';
import { BookingModal } from '../../components/events/BookingModal';
import { mockDb as dbClient } from '../../lib/mockDb';

export const EventDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      setIsLoading(true);
      const { data, error } = await dbClient
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!error && data) {
        setEvent(data);
      } else {
        setEvent(MOCK_EVENTS.find(e => e.id === id));
      }
      setIsLoading(false);
    };

    fetchEvent();
  }, [id]);

  const handleBooking = () => {
    setIsBookingOpen(true);
  };

  if (isLoading) {
    return (
      <PageWrapper className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--violet-bright)]"></div>
      </PageWrapper>
    );
  }

  if (!event) {
    return (
      <PageWrapper className="flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Event not found</h1>
          <GlowButton onClick={() => navigate('/events')}>Back to Events</GlowButton>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Discovery
      </motion.button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Image & Details */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative h-[300px] md:h-[400px] rounded-[2rem] overflow-hidden border border-white/10"
          >
            <img 
              src={event.cover_image} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <Badge variant="violet" className="mb-3">{event.category}</Badge>
              <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-2 leading-tight">
                {event.title}
              </h1>
              <p className="text-white/80 text-sm md:text-lg max-w-2xl line-clamp-2 font-medium">
                {event.short_description}
              </p>
            </div>
          </motion.div>

          <GlassCard className="p-6 md:p-8">
            <h3 className="text-xl font-display font-bold mb-4">About this Event</h3>
            <p className="text-[var(--text-secondary)] leading-relaxed text-base md:text-lg">
              {event.description}
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-8 pt-8 border-t border-white/5">
              <div className="space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold">Date</span>
                <div className="flex items-center gap-2 text-white">
                  <Calendar className="w-3.5 h-3.5 text-[var(--violet-bright)]" />
                  <span className="text-sm md:text-base font-bold">{new Date(event.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold">Time</span>
                <div className="flex items-center gap-2 text-white">
                  <Calendar className="w-3.5 h-3.5 text-[var(--violet-bright)]" />
                  <span className="text-sm md:text-base font-bold">10 PM+</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold">Venue</span>
                <div className="flex items-center gap-2 text-white">
                  <MapPin className="w-3.5 h-3.5 text-[var(--accent-pink)]" />
                  <span className="text-sm md:text-base font-bold truncate">{event.venue_name}</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold">City</span>
                <div className="flex items-center gap-2 text-white">
                  <Globe className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                  <span className="text-sm md:text-base font-bold">{event.city}</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Booking Widget */}
        <div className="space-y-6">
          <GlassCard className="p-6 sticky top-24 border-[var(--violet-primary)]/20 shadow-glow">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display font-bold">Tickets</h3>
              <div className="flex items-center gap-1 text-[var(--accent-green)] text-xs font-bold">
                <ShieldCheck className="w-4 h-4" /> Secure Booking
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {event.ticket_types?.map((type: any) => (
                <div 
                  key={type.id}
                  onClick={() => setSelectedTicket(type.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                    selectedTicket === type.id 
                    ? 'bg-[var(--violet-primary)]/10 border-[var(--violet-bright)]' 
                    : 'bg-white/5 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-white group-hover:text-[var(--violet-glow)] transition-colors">
                      {type.name}
                    </span>
                    <span className="font-display font-bold text-lg text-white">
                      ₹{type.price}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">{type.description}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Platform Fee</span>
                <span className="text-white font-medium">₹49</span>
              </div>
              <div className="flex items-center justify-between text-lg font-bold pt-4 border-t border-white/5">
                <span>Total</span>
                <span className="text-gradient">
                  ₹{selectedTicket ? (event.ticket_types?.find((t: any) => t.id === selectedTicket)?.price || 0) + 49 : 0}
                </span>
              </div>

              <GlowButton 
                disabled={!selectedTicket}
                onClick={handleBooking}
                className="w-full py-4 text-base mt-2"
              >
                Proceed to Checkout
              </GlowButton>
              
              <p className="text-[10px] text-center text-[var(--text-muted)] mt-4">
                By proceeding, you agree to VHOP's Terms & Conditions and Privacy Policy.
              </p>
            </div>
          </GlassCard>

          <div className="flex gap-4">
            <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-[var(--text-secondary)] hover:text-white transition-colors text-sm">
              <Share2 className="w-4 h-4" /> Share Event
            </button>
            <button className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-[var(--text-secondary)] hover:text-white transition-colors">
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <BookingModal 
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        event={event}
        selectedTicketId={selectedTicket}
      />

      {/* Mobile Sticky Booking Bar */}
      <div className="md:hidden fixed bottom-20 left-0 right-0 z-[60] px-4 pb-4 pointer-events-none">
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="glass-card p-4 flex items-center justify-between gap-4 pointer-events-auto shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-[var(--violet-primary)]/30"
        >
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Starting from</p>
            <p className="text-xl font-display font-bold text-white">₹{event.price || 0}</p>
          </div>
          <GlowButton onClick={handleBooking} className="flex-1 py-3 px-8 text-sm h-fit">
            Book Now
          </GlowButton>
        </motion.div>
      </div>
    </PageWrapper>
  );
};
