import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowButton } from '../../components/ui/GlowButton';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL, getImageUrl } from '../../config';
import { 
  ArrowLeft, Ticket, Calendar, MapPin, ChevronDown, ChevronUp, 
  Map, User, Coins, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Guest {
  name: string;
  age: string;
}

interface Booking {
  id: string;
  event_id: string;
  event_title: string;
  venue_name: string;
  city: string;
  start_date: string;
  cover_image: string;
  quantity: number;
  total_amount: string | number;
  ticket_name: string;
  price: string | number;
  booking_id: string;
  qr_code: string;
  booked_at: string;
  booking_status: string;
  google_maps_url?: string;
  guests?: string | Guest[];
  coupon_code?: string;
  discount_amount?: string | number;
}

export const BookedTickets: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      try {
        const response = await fetch(`${API_BASE_URL}/api/bookings/user/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          // Sort by start_date descending (latest first)
          data.sort((a: Booking, b: Booking) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
          setBookings(data);
          
          // Auto-expand the first booking if available
          if (data.length > 0) {
            setExpandedId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch user bookings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [user]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr.replace(' ', 'T'));
      return d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getGuestList = (guestsRaw?: string | Guest[]): Guest[] => {
    if (!guestsRaw) return [];
    if (typeof guestsRaw === 'string') {
      try {
        const parsed = JSON.parse(guestsRaw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return Array.isArray(guestsRaw) ? guestsRaw : [];
  };

  return (
    <PageWrapper className="relative px-4 pb-24 overflow-hidden">
      {/* Background Ambient Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[var(--violet-primary)]/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-[var(--accent-pink)]/5 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-xl mx-auto space-y-6 relative z-10">
        
        {/* Header navigation bar */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/profile')}
            className="p-3 bg-white/[0.04] border border-white/5 rounded-2xl hover:bg-white/10 active:scale-95 transition-all text-slate-300 hover:text-white cursor-pointer"
            title="Go to Profile"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold font-display text-white tracking-wide">My Ticket Passes</h1>
            <p className="text-slate-400 text-xs mt-0.5">View active check-in codes and purchase receipts.</p>
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-10 h-10 border-2 border-[var(--violet-bright)] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-medium">Fetching ticket database...</p>
          </div>
        ) : bookings.length === 0 ? (
          // Empty State Card
          <GlassCard className="p-8 text-center space-y-6 border border-white/5 shadow-glow relative overflow-hidden group">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative">
              <Ticket className="w-8 h-8 text-[var(--violet-bright)]" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white font-display">No Passes Booked Yet</h2>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-[280px] mx-auto">
                Explore premium nightlife happenings, secure your entry spot, and customize your Night DNA.
              </p>
            </div>

            <GlowButton onClick={() => navigate('/events')} className="w-full py-4 text-xs font-bold">
              Find Premium Events
            </GlowButton>
          </GlassCard>
        ) : (
          // Bookings List
          <div className="space-y-4">
            {bookings.map((booking) => {
              const isExpanded = expandedId === booking.id;
              const guestList = getGuestList(booking.guests);

              return (
                <GlassCard 
                  key={booking.id} 
                  className={`overflow-hidden border transition-all duration-300 ${
                    isExpanded 
                      ? 'border-[var(--violet-bright)]/30 shadow-[0_0_24px_rgba(139,92,246,0.1)]' 
                      : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  {/* Card Header Portion */}
                  <div 
                    onClick={() => toggleExpand(booking.id)}
                    className="p-5 flex gap-4 items-start cursor-pointer select-none"
                  >
                    <img 
                      src={getImageUrl(booking.cover_image)} 
                      alt="" 
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white/10"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-extrabold text-white text-base leading-tight truncate">
                        {booking.event_title}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold mt-1.5 flex items-center gap-1 uppercase tracking-wider">
                        <Calendar className="w-3 h-3 text-[var(--violet-bright)]" />
                        <span>{formatDate(booking.start_date)}</span>
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1 truncate">
                        {booking.venue_name} • {booking.city}
                      </p>
                      
                      <div className="mt-2.5 flex items-center gap-2">
                        <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {booking.ticket_name}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          Qty: {booking.quantity}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 self-center shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Dropdown Details */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                      >
                        <div className="px-5 pb-5 pt-3 border-t border-white/5 space-y-5">
                          
                          {/* QR Code and Pass Info */}
                          <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-[var(--violet-primary)]/5 to-transparent pointer-events-none" />
                            
                            <img 
                              src={booking.qr_code} 
                              alt="Entry Pass QR"
                              className="w-40 h-40 object-contain p-2.5 bg-white rounded-2xl shadow-glow"
                            />
                            
                            <div className="mt-3.5 space-y-1">
                              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Gate Check-in Pass</p>
                              <p className="text-base font-mono font-extrabold text-white tracking-wider">
                                {booking.booking_id}
                              </p>
                            </div>

                            <div className="mt-4.5 flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/25 rounded-full text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Valid for entry • Show at gate</span>
                            </div>
                          </div>

                          {/* Guest List Roster */}
                          {guestList.length > 0 && (
                            <div className="space-y-2.5">
                              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <User className="w-4 h-4 text-[var(--violet-bright)]" /> Registered Guests
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {guestList.map((g, index) => (
                                  <div key={index} className="px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex justify-between items-center text-xs">
                                    <span className="text-white font-bold">{g.name}</span>
                                    <span className="text-slate-400 font-medium">Age: {g.age}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Location & Directions */}
                          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-4.5 rounded-2xl bg-white/[0.02] border border-white/5">
                            <div className="space-y-1">
                              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-[var(--violet-bright)]" /> Venue Address
                              </h4>
                              <p className="text-xs text-slate-400 leading-relaxed pl-5">
                                {booking.venue_name}, {booking.city}
                              </p>
                            </div>
                            {booking.google_maps_url && (
                              <a 
                                href={booking.google_maps_url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="px-4 py-2 bg-[var(--violet-primary)]/20 hover:bg-[var(--violet-primary)]/40 border border-[var(--violet-primary)]/35 text-[var(--violet-bright)] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer"
                              >
                                <Map className="w-3.5 h-3.5" />
                                <span>Get Directions</span>
                              </a>
                            )}
                          </div>

                          {/* Price & Receipt Breakdown */}
                          <div className="space-y-2.5">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Coins className="w-4 h-4 text-[var(--violet-bright)]" /> Billing Summary
                            </h4>
                            
                            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2.5 text-xs text-slate-400">
                              <div className="flex justify-between">
                                <span>Base Fare ({booking.quantity} x ₹{booking.price})</span>
                                <span className="text-white">₹{Number(booking.price) * booking.quantity}</span>
                              </div>
                              {booking.discount_amount && Number(booking.discount_amount) > 0 && (
                                <div className="flex justify-between text-green-400">
                                  <span>Coupon Discount {booking.coupon_code ? `(${booking.coupon_code})` : ''}</span>
                                  <span>-₹{booking.discount_amount}</span>
                                </div>
                              )}
                              <div className="flex justify-between pt-2.5 border-t border-white/5 font-extrabold text-white text-sm">
                                <span>Amount Paid (Incl. Fees/GST)</span>
                                <span className="text-[var(--violet-bright)]">₹{booking.total_amount}</span>
                              </div>
                            </div>
                          </div>

                          {/* Guidelines alert warning */}
                          <div className="p-4.5 rounded-2xl bg-amber-500/5 border border-amber-500/25 flex gap-3 text-slate-400 text-[11px] leading-relaxed">
                            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <div className="space-y-1 font-medium">
                              <p className="text-white font-bold">Guidelines & Dress Code</p>
                              <p>Please carry valid physical age proof (21+ for drinking). Proper casual/clubwear mandatory for entry. Gate check-in closes 1 hour before curfew.</p>
                            </div>
                          </div>

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              );
            })}
          </div>
        )}

      </div>
    </PageWrapper>
  );
};
