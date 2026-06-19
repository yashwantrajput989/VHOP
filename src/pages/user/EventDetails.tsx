import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, ArrowLeft, ShieldCheck, Share2, Info, Globe, CheckCircle2 } from 'lucide-react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowButton } from '../../components/ui/GlowButton';
import { Badge } from '../../components/ui/Badge';
import { BookingModal } from '../../components/events/BookingModal';
import { API_BASE_URL, getImageUrl } from '../../config';

export const EventDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/events/${id}`);
        if (response.ok) {
          const data = await response.json();
          // MySQL might return ticket_types as stringified JSON
          if (typeof data.ticket_types === 'string') {
            data.ticket_types = JSON.parse(data.ticket_types);
          }
          if (typeof data.artists === 'string') {
            data.artists = JSON.parse(data.artists);
          }
          setEvent(data);
        } else {
          setEvent(null);
        }
      } catch (error) {
        console.error('Error fetching event from MySQL:', error);
        setEvent(null);
      } finally {
        setIsLoading(false);
      }
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
            className="relative rounded-[2.5rem] overflow-hidden border border-white/10 bg-slate-900/35 p-4 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-stretch shadow-2xl"
          >
            {/* Blurred cover image backdrop bleed */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-[2.5rem]">
              <img
                src={getImageUrl(event.cover_image)}
                alt=""
                className="w-full h-full object-cover blur-3xl opacity-30 scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)]/90 via-[var(--bg-primary)]/40 to-transparent" />
            </div>

            {/* Contained Vertical Flyer */}
            <div className="relative z-10 w-full xs:w-[240px] md:w-[260px] aspect-[4/5] rounded-[1.8rem] overflow-hidden border border-white/10 shrink-0 shadow-[0_12px_32px_rgba(0,0,0,0.55)]">
              <img 
                src={getImageUrl(event.cover_image)} 
                className="w-full h-full object-cover" 
                alt={event.title} 
              />
            </div>

            {/* Right Column: Title, tags, description */}
            <div className="relative z-10 flex-1 flex flex-col justify-between py-2 text-center md:text-left space-y-4">
              <div className="space-y-4">
                <Badge variant="violet" className="px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-widest">{event.category}</Badge>
                <h1 className="text-2xl md:text-4xl font-display font-black text-white leading-tight">
                  {event.title}
                </h1>
                <p className="text-[var(--text-secondary)] text-sm md:text-base leading-relaxed">
                  {event.short_description}
                </p>
              </div>

              {/* Quick details strip */}
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-auto">
                <span className="text-[10px] font-extrabold bg-[var(--violet-primary)]/20 border border-[var(--violet-primary)]/40 text-[var(--violet-bright)] px-3 py-1.5 rounded-xl">
                  📅 {new Date(typeof event.start_date === 'string' ? event.start_date.replace(' ', 'T') : event.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
                <span className="text-[10px] font-extrabold bg-[var(--accent-green)]/20 border border-[var(--accent-green)]/40 text-[var(--accent-green)] px-3 py-1.5 rounded-xl">
                  ₹{event.price === 0 ? 'FREE' : `${event.price}+`}
                </span>
              </div>
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
                  <span className="text-sm md:text-base font-bold">{new Date(typeof event.start_date === 'string' ? event.start_date.replace(' ', 'T') : event.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
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
                <div className="flex flex-col gap-1 text-white">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[var(--accent-pink)]" />
                    <span className="text-sm md:text-base font-bold truncate">{event.venue_name}</span>
                  </div>
                  {event.google_maps_url && (
                    <a 
                      href={event.google_maps_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] text-[var(--accent-cyan)] hover:underline ml-5"
                    >
                      Open in Maps
                    </a>
                  )}
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

          {/* Artists Section */}
          {event.artists && event.artists.length > 0 && (
            <GlassCard className="p-6 md:p-8">
              <h3 className="text-xl font-display font-bold mb-6">Lineup</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {event.artists.map((artist: any, index: number) => (
                  <div 
                    key={index} 
                    className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-[var(--violet-bright)]/30 hover:bg-white/[0.05] transition-all duration-300 flex flex-col xs:flex-row items-center xs:items-start gap-4 text-center xs:text-left relative overflow-hidden group"
                  >
                    {/* Glowing background hint */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-[var(--violet-primary)]/5 blur-2xl rounded-full pointer-events-none group-hover:bg-[var(--violet-primary)]/10 transition-colors" />
                    
                    {/* Artist Photo */}
                    {artist.image ? (
                      <img 
                        src={getImageUrl(artist.image)} 
                        className="w-18 h-18 rounded-2xl object-cover border border-white/10 shadow-md shrink-0 transition-transform duration-500 group-hover:scale-105 animate-fade-in" 
                        alt={artist.name} 
                      />
                    ) : (
                      <div className="w-18 h-18 rounded-2xl bg-[var(--violet-primary)]/10 border border-[var(--violet-bright)]/20 flex items-center justify-center shrink-0 text-[var(--violet-bright)] font-bold text-2xl shadow-md">
                        {artist.name.charAt(0)}
                      </div>
                    )}
                    
                    {/* Artist Details */}
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-col xs:flex-row xs:items-center gap-1.5 xs:gap-2">
                        <h4 className="font-extrabold text-white text-base truncate">{artist.name}</h4>
                        {artist.role && (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[var(--violet-bright)]/10 border border-[var(--violet-bright)]/20 text-[var(--violet-bright)] w-fit mx-auto xs:mx-0 shrink-0">
                            {artist.role}
                          </span>
                        )}
                      </div>
                      {artist.description && (
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-1 line-clamp-3">
                          {artist.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
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

            <div className="space-y-4 mb-6">
              {event.ticket_types?.map((type: any) => (
                <div 
                  key={type.id}
                  onClick={() => setSelectedTicket(type.id)}
                  className={`p-5 rounded-[1.5rem] border transition-all cursor-pointer group relative overflow-hidden ${
                    selectedTicket === type.id 
                    ? 'bg-[var(--violet-primary)]/10 border-[var(--violet-bright)] ring-1 ring-[var(--violet-bright)]/30' 
                    : 'bg-white/5 border-white/5 hover:border-white/20'
                  }`}
                >
                  {selectedTicket === type.id && (
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--violet-bright)]/10 blur-3xl -z-10" />
                  )}
                  
                  <div className="flex justify-between items-center mb-3">
                    <span className={`font-bold text-lg ${selectedTicket === type.id ? 'text-[var(--violet-glow)]' : 'text-white'} transition-colors`}>
                      {type.name}
                    </span>
                    <div className="flex flex-col items-end">
                      <span className="font-display font-bold text-xl text-white">
                        ₹{type.price}
                      </span>
                      {type.price > 0 && <span className="text-[8px] text-[var(--text-muted)] uppercase tracking-tighter">+ Taxes & Fees</span>}
                    </div>
                  </div>

                  {type.benefits && type.benefits.length > 0 && (
                    <ul className="space-y-1.5 mt-2">
                      {type.benefits.map((benefit: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-[11px] text-[var(--text-secondary)]">
                          <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${selectedTicket === type.id ? 'text-[var(--violet-bright)]' : 'text-[var(--text-muted)]'}`} />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-2">
                <span className="flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  Taxes & convenience fees apply at checkout
                </span>
              </div>

              <GlowButton 
                disabled={!selectedTicket}
                onClick={handleBooking}
                className="w-full py-4 text-base mt-2"
              >
                Proceed to Checkout
              </GlowButton>

              <GlowButton 
                variant="secondary"
                onClick={() => navigate(`/squad/new?event_id=${event.id}`)}
                className="w-full py-3.5 text-xs font-black uppercase tracking-wider mt-2 border border-[var(--violet-bright)]/40 hover:bg-[var(--violet-bright)]/10"
              >
                Plan a Squad Night (Split Pay) 🤝
              </GlowButton>
              
              <p className="text-[10px] text-center text-[var(--text-muted)] mt-4">
                By proceeding, you agree to VHOP's Terms & Conditions and Privacy Policy.
              </p>
            </div>
          </GlassCard>

          <div className="flex gap-4">
            <button 
              onClick={() => {
                const shareData = {
                  title: event.title,
                  text: 'join me to this event',
                  url: window.location.href
                };
                if (navigator.share) {
                  navigator.share(shareData).catch(console.error);
                } else {
                  navigator.clipboard.writeText(`join me to this event ${window.location.href}`);
                  alert('Link copied to clipboard!');
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-[var(--text-secondary)] hover:text-white transition-colors text-sm"
            >
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
