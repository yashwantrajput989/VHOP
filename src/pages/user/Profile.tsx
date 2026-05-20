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
import { Settings, MapPin, Mail, Phone, ShieldCheck, QrCode, Calendar, Lock, LogIn, Coins, Sparkles, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../../config';
import { ProfileCompletionBanner, isProfileComplete } from '../../components/profile/ProfileCompletionBanner';
import { VCardPass } from '../../components/profile/VCardPass';
import { useUIStore } from '../../store/uiStore';
import { FloatingOrb } from '../../components/ui/FloatingOrb';


export const Profile: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const { tickets, addTicket } = useTicketStore();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const { openModal } = useUIStore();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    username: '',
    city: 'Mumbai',
    phone: '',
    age: '',
    gender: '',
    address: ''
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  const openEditModal = () => {
    setEditForm({
      fullName: user?.full_name || '',
      username: user?.username || '',
      city: user?.city || 'Mumbai',
      phone: user?.phone || '',
      age: user?.age ? String(user.age) : '',
      gender: user?.gender || '',
      address: user?.address || ''
    });
    setEditError('');
    setEditSuccess('');
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    setEditSuccess('');
    setIsSubmittingEdit(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          fullName: editForm.fullName,
          username: editForm.username,
          city: editForm.city,
          phone: editForm.phone,
          age: editForm.age ? Number(editForm.age) : null,
          gender: editForm.gender,
          address: editForm.address
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update profile.');
      }

      const data = await response.json();
      setUser(data.user);
      setEditSuccess('Profile updated successfully!');
      setTimeout(() => setIsEditModalOpen(false), 1200);
    } catch (err: any) {
      setEditError(err.message || 'An error occurred.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const parsedInterests = React.useMemo(() => {
    if (!user?.interests) return [];
    if (Array.isArray(user.interests)) return user.interests;
    if (typeof user.interests === 'string') {
      try {
        const parsed = JSON.parse(user.interests);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        return (user.interests as string).split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    return [];
  }, [user?.interests]);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!user) return;
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/bookings/user/${user.id}`);
        const data = await response.json();
        
        data.forEach((dbTicket: any) => {
          if (!tickets.find(t => t.id === dbTicket.id)) {
            addTicket({
              id: dbTicket.id,
              eventId: dbTicket.event_id,
              eventTitle: dbTicket.event_title || 'Event',
              venueName: dbTicket.venue_name || 'Venue',
              city: dbTicket.city || 'City',
              startDate: dbTicket.start_date || new Date().toISOString(),
              coverImage: dbTicket.cover_image || '',
              ticketName: dbTicket.ticket_name,
              price: dbTicket.price,
              quantity: dbTicket.quantity,
              bookingId: dbTicket.booking_id || dbTicket.id,
              qrCode: dbTicket.qr_code || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${dbTicket.id}`,
              bookedAt: dbTicket.booked_at || new Date().toISOString(),
              guests: typeof dbTicket.guests === 'string' ? JSON.parse(dbTicket.guests) : (dbTicket.guests || [])
            });
          }
        });
      } catch (error) {
        console.error('Error fetching tickets from MySQL:', error);
      }
    };

    fetchTickets();
  }, [user]);

  if (!user) {
    return (
      <PageWrapper className="relative flex items-center justify-center min-h-[80vh] overflow-hidden px-4">
        {/* Floating background glowing orbs */}
        <FloatingOrb className="-top-20 -left-20 pointer-events-none" color="violet" size={350} />
        <FloatingOrb className="bottom-10 right-0 pointer-events-none" color="pink" size={300} delay={2} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full max-w-md"
        >
          <GlassCard className="p-8 text-center border border-white/10 shadow-[0_0_30px_rgba(139,92,246,0.15)] space-y-6 relative overflow-hidden group">
            {/* Ambient inner card glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-[var(--violet-primary)]/10 blur-3xl rounded-full pointer-events-none" />

            <div className="mx-auto w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative group-hover:scale-105 transition-transform duration-300">
              <Lock className="w-8 h-8 text-[var(--violet-bright)] animate-pulse" />
              <div className="absolute inset-0 rounded-2xl bg-[var(--violet-bright)]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold font-display text-white tracking-wide">
                Unlock Your VHOP Profile
              </h2>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-[280px] mx-auto">
                Sign in to customize your nightlife experience, view active tickets, and claim your exclusive V-Card rewards.
              </p>
            </div>

            {/* List of Benefits */}
            <div className="py-4 border-y border-white/5 space-y-3.5 text-left max-w-[290px] mx-auto">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-[var(--violet-primary)]/10 flex items-center justify-center shrink-0">
                  <Coins className="w-3.5 h-3.5 text-[var(--violet-bright)]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-none">Claim 100 V-Coins</p>
                  <p className="text-[9px] text-[var(--text-muted)] mt-0.5">Finish your profile to get initial rewards.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-none">Attractive QR V-Card</p>
                  <p className="text-[9px] text-[var(--text-muted)] mt-0.5">Sleek visual check-in passes for partner venues.</p>
                </div>
              </div>
            </div>

            <GlowButton
              onClick={() => openModal('auth')}
              className="w-full py-4 text-xs font-bold flex items-center justify-center gap-2 relative group overflow-hidden shadow-glow"
            >
              <LogIn className="w-4 h-4" /> Sign In or Register
            </GlowButton>
          </GlassCard>
        </motion.div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Profile Completion Alert */}
        <ProfileCompletionBanner />

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
              {parsedInterests.length > 0 
                ? `Interests: ${parsedInterests.join(', ').replace(/_/g, ' ')}`
                : `Nightlife enthusiast | Techno lover | VHOP explorer | ${user.city || 'Global'}`}
            </p>
            {parsedInterests.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-4">
                {parsedInterests.map(interest => (
                  <span key={interest} className="px-3 py-1 rounded-full bg-[var(--violet-primary)]/10 border border-[var(--violet-primary)]/20 text-[var(--violet-bright)] text-[10px] font-bold uppercase tracking-wider">
                    {interest.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button 
            onClick={openEditModal}
            className="absolute top-6 right-6 md:relative md:top-0 md:right-0 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group focus:outline-none"
            title="Edit Profile"
          >
            <Settings className="w-5 h-5 text-[var(--text-muted)] group-hover:text-white transition-colors" />
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

            {isProfileComplete(user) && (
              <div className="pt-2">
                <VCardPass />
              </div>
            )}

            <div className="space-y-4 p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                <MapPin className="w-4 h-4 text-[var(--violet-bright)] shrink-0" />
                <span>{user.city || 'Mumbai'}, India</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                <Mail className="w-4 h-4 text-[var(--violet-bright)] shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                <Phone className="w-4 h-4 text-[var(--violet-bright)] shrink-0" />
                <span>{user.phone || '+91 9XXXX XXXXX'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                <User className="w-4 h-4 text-[var(--violet-bright)] shrink-0" />
                <span className="capitalize">
                  {user.gender ? user.gender.replace(/_/g, ' ') : 'Gender: Not specified'}
                </span>
              </div>
              {user.age && (
                <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                  <Calendar className="w-4 h-4 text-[var(--violet-bright)] shrink-0" />
                  <span>{user.age} Years Old</span>
                </div>
              )}
              {user.address && (
                <div className="flex items-start gap-3 text-sm text-[var(--text-secondary)] border-t border-white/5 pt-3 mt-2">
                  <MapPin className="w-4 h-4 text-[var(--violet-bright)] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{user.address}</span>
                </div>
              )}
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
                      <img src={ticket.coverImage?.startsWith('/uploads') ? `${API_BASE_URL}${ticket.coverImage}` : ticket.coverImage} className="w-20 h-20 rounded-xl object-cover" alt="" />
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

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg my-8 z-10"
            >
              <GlassCard className="p-6 md:p-8 space-y-6 border border-[var(--violet-bright)]/30 shadow-glow">
                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                  <h3 className="text-xl font-display font-bold flex items-center gap-2">
                    <Settings className="w-5 h-5 text-[var(--violet-bright)]" />
                    Edit Profile Details
                  </h3>
                  <button 
                    onClick={() => setIsEditModalOpen(false)}
                    className="text-[var(--text-muted)] hover:text-white transition-colors font-bold text-lg focus:outline-none cursor-pointer"
                  >
                    &times;
                  </button>
                </div>

                {editError && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-200/90 font-medium">
                    {editError}
                  </div>
                )}
                
                {editSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-200/90 font-medium">
                    {editSuccess}
                  </div>
                )}

                <form onSubmit={handleEditSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={editForm.fullName}
                        onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                        placeholder="John Doe"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-[var(--violet-bright)] focus:outline-none transition-colors"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                        Username
                      </label>
                      <input
                        type="text"
                        value={editForm.username}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                        placeholder="johndoe"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-[var(--violet-bright)] focus:outline-none transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                        City
                      </label>
                      <input
                        type="text"
                        value={editForm.city}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                        placeholder="Visakhapatnam"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-[var(--violet-bright)] focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        placeholder="+91 XXXXX XXXXX"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-[var(--violet-bright)] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                        Age
                      </label>
                      <input
                        type="number"
                        value={editForm.age}
                        onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                        placeholder="21"
                        min="18"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-[var(--violet-bright)] focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                        Gender
                      </label>
                      <select
                        value={editForm.gender}
                        onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-[var(--violet-bright)] focus:outline-none transition-colors bg-[var(--bg-card)] cursor-pointer"
                      >
                        <option value="" disabled className="bg-[var(--bg-primary)]">Select Gender</option>
                        <option value="male" className="bg-[var(--bg-primary)] text-white">Male</option>
                        <option value="female" className="bg-[var(--bg-primary)] text-white">Female</option>
                        <option value="other" className="bg-[var(--bg-primary)] text-white">Other</option>
                        <option value="prefer_not_to_say" className="bg-[var(--bg-primary)] text-white">Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                      Address
                    </label>
                    <textarea
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      placeholder="Enter your residence details for VIP entry verification..."
                      rows={3}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-[var(--violet-bright)] focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <GlowButton
                      type="button"
                      variant="secondary"
                      onClick={() => setIsEditModalOpen(false)}
                      className="flex-1 py-3.5"
                    >
                      Cancel
                    </GlowButton>
                    <GlowButton
                      type="submit"
                      isLoading={isSubmittingEdit}
                      className="flex-1 py-3.5"
                    >
                      Save Changes
                    </GlowButton>
                  </div>
                </form>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
};
