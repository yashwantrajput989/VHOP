import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { VCoinsWidget } from '../../components/profile/VCoinsWidget';
import { ReferralCard } from '../../components/profile/ReferralCard';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { GlowButton } from '../../components/ui/GlowButton';
import { GlassCard } from '../../components/ui/GlassCard';
import { useAuthStore } from '../../store/authStore';
import { useTicketStore } from '../../store/ticketStore';
import type { Ticket } from '../../store/ticketStore';
import { Settings, MapPin, Mail, Phone, ShieldCheck, QrCode, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { mockDb as dbClient } from '../../lib/mockDb';

export const Profile: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { tickets, addTicket } = useTicketStore();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!user) return;
      const isDbConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (isDbConfigured) {
        const { data, error } = await dbClient
          .from('tickets')
          .select('*, events(title, venue_name, city, start_date, cover_image)')
          .eq('user_id', user.id);
        
        if (!error && data) {
          // Sync database tickets with local store if not already present
          data.forEach((dbTicket: any) => {
            if (!tickets.find(t => t.id === dbTicket.id)) {
              addTicket({
                id: dbTicket.id,
                eventId: dbTicket.event_id,
                eventTitle: dbTicket.events?.title || 'Event',
                venueName: dbTicket.events?.venue_name || 'Venue',
                city: dbTicket.events?.city || 'City',
                startDate: dbTicket.events?.start_date || new Date().toISOString(),
                coverImage: dbTicket.events?.cover_image || '',
                ticketName: dbTicket.ticket_name,
                price: dbTicket.price_paid,
                quantity: dbTicket.quantity,
                bookingId: dbTicket.booking_id,
                qrCode: dbTicket.qr_code,
                bookedAt: dbTicket.booked_at
              });
            }
          });
        }
      }
    };

    fetchTickets();
  }, [user]);

  if (!user) {
    return (
      <PageWrapper className="flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Please login to view your profile</h1>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header Section */}
        <section className="flex flex-col md:flex-row items-center gap-6 md:gap-8 bg-[var(--bg-card)]/30 p-6 md:p-8 rounded-[2.5rem] border border-[var(--border-subtle)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--violet-primary)]/5 to-transparent opacity-50" />
          <Avatar src={user.avatar_url} size="xl" ring className="relative z-10" />
          <div className="flex-1 text-center md:text-left space-y-3 relative z-10">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <h1 className="text-3xl md:text-4xl font-display font-bold leading-tight">{user.full_name}</h1>
              <Badge variant="green" className="w-fit mx-auto md:mx-0">
                <ShieldCheck className="w-3 h-3 mr-1" /> Verified
              </Badge>
            </div>
            <p className="text-[var(--violet-bright)] font-bold text-sm">@{user.username}</p>
            <p className="text-[var(--text-secondary)] text-sm md:text-base max-w-md mx-auto md:mx-0">
              Nightlife enthusiast | Techno lover | VHOP explorer | {user.city || 'Global'}
            </p>
          </div>
          <button className="absolute top-6 right-6 md:relative md:top-0 md:right-0 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <Settings className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
          
          {(user.role === 'admin' || user.role === 'superadmin') && (
            <button 
              onClick={() => navigate('/admin')}
              className="absolute bottom-6 right-6 md:relative md:bottom-0 md:right-0 px-4 py-2 rounded-xl bg-[var(--violet-primary)]/20 border border-[var(--violet-primary)] text-[var(--violet-bright)] font-bold text-xs hover:bg-[var(--violet-primary)] hover:text-white transition-all"
            >
              Admin Dashboard
            </button>
          )}
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-8">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <p className="text-xl font-bold font-display">{tickets.length}</p>
                <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider">Tickets</p>
              </div>
              <div className="space-y-1">
                <p className="text-xl font-bold font-display">420</p>
                <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider">Followers</p>
              </div>
              <div className="space-y-1">
                <p className="text-xl font-bold font-display">156</p>
                <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider">Following</p>
              </div>
            </div>

            <div className="space-y-4 p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                <MapPin className="w-4 h-4 text-[var(--violet-bright)]" />
                <span>{user.city || 'Mumbai'}, India</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                <Mail className="w-4 h-4 text-[var(--violet-bright)]" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                <Phone className="w-4 h-4 text-[var(--violet-bright)]" />
                <span>{user.phone || '+91 9XXXX XXXXX'}</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <VCoinsWidget balance={user.v_coins} />
              <ReferralCard code={`VHOP-${user.username.toUpperCase()}-2026`} />
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-display font-bold">🎟️ My Tickets</h2>
              
              {tickets.length === 0 ? (
                <div className="p-8 rounded-3xl bg-white/5 border border-dashed border-white/10 flex flex-col items-center text-center space-y-4">
                  <p className="text-[var(--text-muted)]">No upcoming tickets. Ready to find your next night out?</p>
                  <button className="px-6 py-2 rounded-xl bg-[var(--violet-primary)] hover:bg-[var(--violet-bright)] transition-colors font-bold text-sm">
                    Explore Events
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <GlassCard 
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className="p-4 flex gap-4 cursor-pointer hover:bg-white/[0.07]"
                    >
                      <img src={ticket.coverImage} className="w-20 h-20 rounded-xl object-cover" alt="" />
                      <div className="flex-1 flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-white">{ticket.eventTitle}</h4>
                          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mt-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(ticket.startDate).toLocaleDateString()}
                          </div>
                          <div className="mt-2">
                            <Badge variant="violet" className="text-[10px] py-0 px-2">{ticket.ticketName}</Badge>
                          </div>
                        </div>
                        <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                          <QrCode className="w-8 h-8 text-[var(--violet-glow)]" />
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTicket(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm z-10"
            >
              <GlassCard className="p-8 text-center space-y-6 border-[var(--violet-bright)]/30 shadow-glow">
                <div className="space-y-2">
                  <h3 className="text-2xl font-display font-bold">{selectedTicket.eventTitle}</h3>
                  <p className="text-[var(--text-secondary)] text-sm">{selectedTicket.venueName}</p>
                </div>

                <div className="bg-white p-4 rounded-3xl mx-auto w-fit shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                  <img src={selectedTicket.qrCode} alt="QR Code" className="w-48 h-48" />
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Booking ID</p>
                  <p className="font-mono font-bold text-xl text-white">{selectedTicket.bookingId}</p>
                </div>

                <div className="pt-6 border-t border-white/5 flex justify-between text-left">
                  <div>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase">Name</p>
                    <p className="text-sm font-bold">{user.full_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase">Quantity</p>
                    <p className="text-sm font-bold">{selectedTicket.quantity} Pax</p>
                  </div>
                </div>

                <GlowButton onClick={() => setSelectedTicket(null)} className="w-full py-4" variant="secondary">
                  Close Ticket
                </GlowButton>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
};
