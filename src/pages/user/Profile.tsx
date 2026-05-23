import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Capacitor } from '@capacitor/core';
import { GlowButton } from '../../components/ui/GlowButton';
import { GlassCard } from '../../components/ui/GlassCard';
import { useAuthStore } from '../../store/authStore';
import { useTicketStore } from '../../store/ticketStore';
import type { Ticket } from '../../store/ticketStore';
import { 
  Settings, ShieldCheck, Lock, LogIn, Coins, Sparkles, User, Share2, 
  Flame, CheckCircle, Copy, ChevronRight, Award, Zap, Check, AlertCircle, Camera, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL, getImageUrl } from '../../config';
import { ProfileCompletionBanner } from '../../components/profile/ProfileCompletionBanner';
import { VCardPass } from '../../components/profile/VCardPass';
import { useUIStore } from '../../store/uiStore';
import { FloatingOrb } from '../../components/ui/FloatingOrb';
import { ImageCropper } from '../../components/profile/ImageCropper';

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
    address: '',
    avatarUrl: ''
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Cropper and file upload states
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is a JPEG/JPG image
    if (!['image/jpeg', 'image/jpg'].includes(file.type)) {
      setEditError('Only JPEG/JPG files are accepted.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedImageSrc(reader.result);
        setIsCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (blob: Blob) => {
    setIsCropperOpen(false);
    setIsSubmittingEdit(true);
    setEditError('');

    try {
      const formData = new FormData();
      formData.append('image', blob, 'avatar.jpg');

      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload cropped image.');
      }

      const data = await response.json();
      setEditForm(prev => ({ ...prev, avatarUrl: data.url }));
      setEditSuccess('Avatar cropped & prepared successfully!');
      setTimeout(() => setEditSuccess(''), 2500);
    } catch (err: any) {
      setEditError(err.message || 'Error uploading cropped image.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Notification Toast States (e.g. for Aadhaar verification success/error alerts)
  const [simulationMessage, setSimulationMessage] = useState('');
  const [simulationError, setSimulationError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isVerifyingAadhaar, setIsVerifyingAadhaar] = useState(false);
  const [aadhaarModalOpen, setAadhaarModalOpen] = useState(false);

  // Share / Copy Referral Code
  const copyReferral = (code: string) => {
    if (navigator.share) {
      navigator.share({
        title: 'VHOP Nightlife',
        text: 'join me in the app',
        url: code
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`join me in the app ${code}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const openEditModal = () => {
    setEditForm({
      fullName: user?.full_name || '',
      username: user?.username || '',
      city: user?.city || 'Mumbai',
      phone: user?.phone || '',
      age: user?.age ? String(user.age) : '',
      gender: user?.gender || '',
      address: user?.address || '',
      avatarUrl: user?.avatar_url || ''
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
          address: editForm.address,
          avatarUrl: editForm.avatarUrl
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

  // Verify Aadhaar Action
  const handleVerifyAadhaar = async () => {
    if (!user) return;
    setIsVerifyingAadhaar(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/profile/verify-aadhaar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      if (!response.ok) {
        throw new Error('Aadhaar verification failed.');
      }

      const data = await response.json();
      setUser(data.user);
      setSimulationMessage(data.message);
      setAadhaarModalOpen(false);
      setTimeout(() => setSimulationMessage(''), 4000);
    } catch (err: any) {
      setSimulationError(err.message || 'Verification error.');
      setTimeout(() => setSimulationError(''), 4000);
    } finally {
      setIsVerifyingAadhaar(false);
    }
  };


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
              guests: typeof dbTicket.guests === 'string' ? JSON.parse(dbTicket.guests) : (dbTicket.guests || []),
              googleMapsUrl: dbTicket.google_maps_url || undefined
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
        <FloatingOrb className="-top-20 -left-20 pointer-events-none" color="violet" size={350} />
        <FloatingOrb className="bottom-10 right-0 pointer-events-none" color="pink" size={300} delay={2} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full max-w-md"
        >
          <GlassCard className="p-8 text-center border border-white/10 shadow-[0_0_30px_rgba(139,92,246,0.15)] space-y-6 relative overflow-hidden group">
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

  // Get user initials for the avatar box
  const getInitials = (name: string) => {
    if (!name) return 'VH';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const referralCode = `VHOP-${(user.username || 'user').toUpperCase()}-2026`;

  return (
    <PageWrapper className="relative px-4 pb-24 overflow-x-hidden">
      {/* Visual Ambient Orbs */}
      <FloatingOrb className="-top-40 -right-40 pointer-events-none" color="violet" size={400} />
      <FloatingOrb className="top-1/2 -left-60 pointer-events-none" color="cyan" size={350} delay={1} />
      <FloatingOrb className="bottom-0 right-10 pointer-events-none" color="pink" size={300} delay={3} />

      <div className="max-w-xl mx-auto space-y-6 relative z-10">
        
        {/* Notification Toasts for Dev simulation */}
        <AnimatePresence>
          {simulationMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="p-4 bg-emerald-950/80 border border-emerald-500/35 rounded-2xl text-xs text-emerald-300 flex items-center gap-3 backdrop-blur-xl shadow-lg"
            >
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="font-semibold leading-normal">{simulationMessage}</span>
            </motion.div>
          )}

          {simulationError && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="p-4 bg-red-950/80 border border-red-500/35 rounded-2xl text-xs text-red-300 flex items-center gap-3 backdrop-blur-xl shadow-lg"
            >
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span className="font-semibold leading-normal">{simulationError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Completion Alert */}
        <ProfileCompletionBanner />

        {/* ================= HEADER CARD (Image 1 Reference) ================= */}
        <section className="bg-slate-900/65 border border-white/5 rounded-[2.5rem] p-6 backdrop-blur-2xl relative overflow-hidden flex flex-col items-center shadow-xl">
          {/* Top Actions: settings and share */}
          <div className="absolute top-6 right-6 flex items-center gap-2">
            <button 
              onClick={() => copyReferral(`Hey! Join me on VHOP, the premium nightlife pass. Use my referral link: https://vhop.in/r/${referralCode}`)}
              className="p-3 bg-white/[0.04] border border-white/5 rounded-full hover:bg-white/10 active:scale-95 transition-all text-slate-300 hover:text-white cursor-pointer"
              title="Share Profile"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button 
              onClick={openEditModal}
              className="p-3 bg-white/[0.04] border border-white/5 rounded-full hover:bg-white/10 active:scale-95 transition-all text-slate-300 hover:text-white cursor-pointer"
              title="Profile Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Initials Green Rounded Box with verification shield overlap */}
          <div className="relative mt-4 mb-4">
            {user.avatar_url ? (
              <img 
                src={getImageUrl(user.avatar_url)} 
                alt={user.full_name} 
                onClick={openEditModal}
                className="w-24 h-24 rounded-[2rem] object-cover border-2 border-[var(--violet-bright)] p-1 bg-black/40 shadow-[0_8px_32px_rgba(139,92,246,0.25)] hover:scale-105 transition-transform duration-300 cursor-pointer"
              />
            ) : (
              <div 
                onClick={openEditModal}
                className="w-24 h-24 rounded-[2rem] bg-emerald-500/90 flex items-center justify-center text-white text-3xl font-display font-bold shadow-[0_8px_32px_rgba(16,185,129,0.3)] hover:scale-105 transition-transform duration-300 cursor-pointer"
              >
                {getInitials(user.full_name)}
              </div>
            )}
            {user.aadhaar_verified && (
              <div className="absolute -bottom-1 -right-1 p-1.5 bg-slate-900 border-2 border-slate-950 rounded-full text-emerald-400 shadow-md z-10">
                <ShieldCheck className="w-5 h-5 fill-emerald-500/20" />
              </div>
            )}
          </div>

          {/* User Details */}
          <h1 className="text-2xl font-bold text-white font-display text-center leading-snug">{user.full_name}</h1>
          <p className="text-slate-400 text-sm mt-0.5 text-center">
            @{user.username} • <span className="text-[var(--violet-bright)] font-semibold">{user.city || 'Vizag'}</span>
          </p>

          {/* Pill Status */}
          <div className="mt-3.5 flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/25 rounded-full text-xs font-bold text-emerald-400 shadow-sm uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{user.vip_tier || 'Regular'} • Aadhaar {user.aadhaar_verified ? 'verified' : 'unverified'}</span>
          </div>

          {(import.meta.env.VITE_APP_TARGET === 'admin' || !Capacitor.isNativePlatform()) && (user.role === 'admin' || user.role === 'superadmin' || user.role === 'subadmin') && (
            <button 
              onClick={() => navigate('/admin')}
              className="mt-4 px-4 py-1.5 rounded-xl bg-[var(--violet-primary)]/20 border border-[var(--violet-primary)] text-[var(--violet-bright)] font-bold text-xs hover:bg-[var(--violet-primary)] hover:text-white transition-all active:scale-95"
            >
              Access Admin Panel
            </button>
          )}
        </section>

        {/* ================= V-CARD PASS ================= */}
        <section className="mb-6">
          <VCardPass />
        </section>

        {/* ================= THREE STATS COUNTERS (Image 1 Reference) ================= */}
        <section className="grid grid-cols-3 gap-3">
          <div className="bg-slate-900/65 border border-white/5 rounded-3xl p-4.5 text-center backdrop-blur-xl">
            <p className="text-2xl font-extrabold text-emerald-400 font-display leading-none">{user.nights_out || 0}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wide">Nights out</p>
          </div>
          <div className="bg-slate-900/65 border border-white/5 rounded-3xl p-4.5 text-center backdrop-blur-xl">
            <p className="text-2xl font-extrabold text-orange-400 font-display leading-none">{user.v_coins?.toLocaleString() || 100}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wide">V coins</p>
          </div>
          <div className="bg-slate-900/65 border border-white/5 rounded-3xl p-4.5 text-center backdrop-blur-xl">
            <p className="text-2xl font-extrabold text-sky-400 font-display leading-none">{user.referred_count || 0}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wide">Referred</p>
          </div>
        </section>

        {/* ================= NIGHT DNA BLOCK (Image 1 Reference) ================= */}
        <section className="bg-slate-900/65 border border-white/5 rounded-[2rem] p-5 backdrop-blur-xl space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-300 tracking-wider uppercase">NIGHT DNA</h3>
            <button 
              onClick={() => alert("DNA history shows details of all your checked-in bookings.")}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              See history
            </button>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4.5 space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
              <span>Your music vibe</span>
            </div>

            <div className="space-y-3.5">
              {/* EDM / House */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>EDM / House</span>
                  <span>{user.music_dna_edm || 72}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden relative">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_12px_rgba(59,130,246,0.5)] transition-all duration-700" 
                    style={{ width: `${user.music_dna_edm || 72}%` }}
                  />
                </div>
              </div>

              {/* Bollywood */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>Bollywood</span>
                  <span>{user.music_dna_bollywood || 18}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden relative">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-500 shadow-[0_0_12px_rgba(244,63,94,0.5)] transition-all duration-700" 
                    style={{ width: `${user.music_dna_bollywood || 18}%` }}
                  />
                </div>
              </div>

              {/* Live Music */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>Live music</span>
                  <span>{user.music_dna_live || 10}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden relative">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 shadow-[0_0_12px_rgba(45,212,191,0.5)] transition-all duration-700" 
                    style={{ width: `${user.music_dna_live || 10}%` }}
                  />
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 mt-2 italic">
              Based on your last {user.nights_out || 0} nights out
            </p>
          </div>
        </section>

        {/* ================= TONIGHT'S PASS CARD (Image 3 Reference) ================= */}
        {tickets.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-300 tracking-wider uppercase">TONIGHT'S PASS</h3>
              <button 
                onClick={() => setSelectedTicket(tickets[0])}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                View all
              </button>
            </div>

            <GlassCard 
              onClick={() => setSelectedTicket(tickets[0])}
              className="border-emerald-500/35 hover:bg-white/[0.05] p-4.5 cursor-pointer relative overflow-hidden transition-all duration-300 shadow-[0_0_24px_rgba(16,185,129,0.1)] group border"
            >
              <div className="flex gap-4 items-center">
                {/* Visual Square Icon Grid Mock */}
                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center shrink-0 relative">
                  <div className="grid grid-cols-4 gap-1.5 p-2">
                    {[...Array(16)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-1.5 h-1.5 rounded-sm ${
                          [2, 5, 8, 10, 11, 14, 15].includes(i) ? 'bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]' : 'bg-white/10'
                        }`} 
                      />
                    ))}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-white text-base leading-tight truncate">{tickets[0].eventTitle}</h4>
                  <p className="text-slate-400 text-xs mt-1 truncate">
                    Regular pass • <span className="font-mono text-emerald-400 font-bold">{tickets[0].bookingId}</span> reserved
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold mt-2">
                    <CheckCircle className="w-4 h-4 fill-emerald-500/10 shrink-0" />
                    <span>Valid tonight • Tap to open</span>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors shrink-0" />
              </div>
            </GlassCard>
          </section>
        )}

        {/* ================= NIGHT STREAK CARD (Image 3 Reference) ================= */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-300 tracking-wider uppercase">NIGHT STREAK</h3>
            <span className="text-[10px] bg-[var(--violet-primary)]/20 text-[var(--violet-bright)] border border-[var(--violet-primary)] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
              Weekly Activity
            </span>
          </div>

          <div className="bg-slate-900/65 border border-white/5 rounded-[2rem] p-5 backdrop-blur-xl space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              {/* Flame + Current streak */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 shadow-inner">
                  <Flame className="w-5 h-5 fill-orange-500/20" />
                </div>
                <div>
                  <h4 className="text-white font-extrabold text-base leading-none">
                    {user.streak_count || 0}-week streak
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">Keep doing actions to build it</p>
                </div>
              </div>

              {/* Award amount */}
              <div className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/25 rounded-2xl text-xs font-bold text-orange-400 flex items-center gap-1 shadow-sm">
                <span>+250 V coins</span>
              </div>
            </div>

            {/* Grid of 8 weeks bubbles */}
            <div className="grid grid-cols-8 gap-2.5 py-2.5">
              {[...Array(8)].map((_, i) => {
                const weekNum = i + 1;
                const isCompleted = weekNum <= (user.streak_count || 0);
                const isTarget = weekNum === 5;

                return (
                  <div key={weekNum} className="relative flex flex-col items-center">
                    <div 
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-extrabold transition-all duration-500 border ${
                        isCompleted 
                          ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                          : isTarget
                          ? 'bg-white/5 border-orange-400/40 text-orange-400'
                          : 'bg-white/[0.03] border-white/5 text-slate-500'
                      }`}
                    >
                      W{weekNum}
                    </div>
                    {isTarget && (
                      <div className="absolute -top-1.5 -right-1 bg-orange-500 text-[8px] text-slate-950 font-black px-1.5 py-0.5 rounded-full uppercase leading-none scale-90 select-none shadow">
                        Goal
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Next milestone text */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-orange-400 shrink-0" />
              <p className="text-xs text-slate-300 font-bold leading-normal">
                {user.streak_count && user.streak_count >= 5 ? (
                  <span className="text-emerald-400">🎉 5-Week Streak Completed! 250 V-Coins awarded & Silver VIP status unlocked!</span>
                ) : (
                  <span>Next milestone: 5 weeks = Silver VIP status & 250 V coins bonus!</span>
                )}
              </p>
            </div>
          </div>
        </section>

        {/* ================= V COINS CARD (Image 3 Reference) ================= */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-300 tracking-wider uppercase">V COINS</h3>
            <button 
              onClick={() => alert("Complete profile, refer friends or scan tickets to earn more V-Coins!")}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Earn more
            </button>
          </div>

          <div className="bg-slate-900/65 border border-orange-500/25 rounded-[2rem] p-5 backdrop-blur-xl space-y-4 shadow-[0_0_24px_rgba(249,115,22,0.06)] relative overflow-hidden">
            {/* Ambient card background glow */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-orange-500/5 blur-3xl rounded-full pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Balance</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white font-display leading-none">
                    {user.v_coins?.toLocaleString() || 100} V
                  </span>
                </div>
                <p className="text-xs font-bold text-orange-400">
                  = ₹{(user.v_coins || 100) / 2} off your next booking
                </p>
              </div>

              {/* Gold coin icon */}
              <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shadow-inner relative group shrink-0">
                <Coins className="w-7 h-7 text-orange-400 fill-orange-400/20" />
              </div>
            </div>

            {/* Progress bar to Gold tier */}
            <div className="space-y-1.5 relative z-10 pt-2 border-t border-white/5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400">To Gold tier: {user.v_coins || 100} / 2,000 V</span>
                <span className="text-orange-400">
                  {Math.min(Math.round(((user.v_coins || 100) / 2000) * 100), 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-700 shadow-[0_0_8px_rgba(249,115,22,0.4)]" 
                  style={{ width: `${Math.min(((user.v_coins || 100) / 2000) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                onClick={() => alert("Redemption code is active at checkout when purchasing passes.")}
                className="py-3 bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] active:scale-95 transition-all text-white font-bold text-xs rounded-2xl cursor-pointer"
              >
                Redeem
              </button>
              <button 
                onClick={() => alert("Coin history shows initial reward: 100V, referrals: 25V, streak milestones: 250V.")}
                className="py-3 bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] active:scale-95 transition-all text-white font-bold text-xs rounded-2xl cursor-pointer"
              >
                History
              </button>
            </div>
          </div>
        </section>

        {/* ================= REFERRALS CARD (Image 2 Reference) ================= */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-300 tracking-wider uppercase">REFERRALS</h3>
            <button 
              onClick={() => copyReferral(`https://vhop.in/r/${referralCode}`)}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Share link
            </button>
          </div>

          <div className="bg-slate-900/65 border border-white/5 rounded-[2.5rem] p-5 backdrop-blur-xl space-y-4 shadow-lg">
            {/* Link Copy Box */}
            <div className="bg-slate-950 border border-white/5 rounded-2xl p-3 flex items-center justify-between gap-3">
              <span className="font-mono text-slate-300 text-xs select-all truncate">
                vhop.in/r/{(user.username || 'user').toUpperCase()}
              </span>
              <button 
                onClick={() => copyReferral(`https://vhop.in/r/${referralCode}`)}
                className={`py-2 px-3 flex items-center justify-center gap-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  copiedLink 
                    ? 'bg-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                    : 'bg-white/5 hover:bg-white/10 text-slate-200'
                }`}
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* mini stats */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 text-center">
                <p className="text-white font-extrabold text-base leading-none">{user.referred_count || 0}</p>
                <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-wide">Joined</p>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 text-center">
                <p className="text-white font-extrabold text-base leading-none">{(user.referred_count || 0) * 100} V</p>
                <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-wide">Earned</p>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 text-center">
                <p className="text-white font-extrabold text-base leading-none">₹{(user.referred_count || 0) * 50}</p>
                <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-wide">Saved</p>
              </div>
            </div>

            {/* Aadhaar verified gating check */}
            {!user.aadhaar_verified ? (
              <GlassCard 
                onClick={() => setAadhaarModalOpen(true)}
                className="bg-sky-500/5 hover:bg-sky-500/10 border-sky-400/25 p-4.5 cursor-pointer rounded-2xl relative overflow-hidden transition-all group flex gap-4 items-center border"
              >
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center shrink-0">
                  <User className="w-6 h-6 text-sky-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-extrabold text-sm leading-tight group-hover:text-sky-300 transition-colors">
                    Verify Aadhaar to unlock VIP access
                  </h4>
                  <p className="text-[10px] text-sky-300/80 font-semibold mt-1">
                    Priority entry • V coin payouts • Premium events
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-sky-400 group-hover:translate-x-0.5 transition-transform" />
              </GlassCard>
            ) : (
              <div className="bg-emerald-500/5 border border-emerald-500/25 rounded-2xl p-4.5 flex gap-4 items-center">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-white font-extrabold text-sm leading-none">
                    Aadhaar verified VIP profile active
                  </h4>
                  <p className="text-[10px] text-emerald-400 font-semibold mt-1">
                    Unlocked: VIP Priority Entry & Silver Tier pass status
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>


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
                  <div className="flex flex-col items-center justify-center gap-1">
                    <p className="text-[var(--text-secondary)] text-sm">{selectedTicket.venueName}</p>
                    {selectedTicket.googleMapsUrl && (
                      <a 
                        href={selectedTicket.googleMapsUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] text-[var(--accent-cyan)] hover:underline flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3" /> Open in Maps
                      </a>
                    )}
                  </div>
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

                <div className="flex gap-4">
                  <GlowButton onClick={() => setSelectedTicket(null)} className="flex-1 py-4" variant="secondary">
                    Close Ticket
                  </GlowButton>
                  <GlowButton 
                    onClick={() => {
                      const shareData = {
                        title: selectedTicket.eventTitle,
                        text: 'join me to this event',
                        url: `https://vhop.in/events/${selectedTicket.eventId}`
                      };
                      if (navigator.share) {
                        navigator.share(shareData).catch(console.error);
                      } else {
                        navigator.clipboard.writeText(`join me to this event https://vhop.in/events/${selectedTicket.eventId}`);
                        alert('Link copied to clipboard!');
                      }
                    }}
                    className="flex-1 py-4 flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-4 h-4" /> Share
                  </GlowButton>
                </div>
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
                   
                   {/* Profile Picture Uploader */}
                   <div className="flex flex-col items-center gap-3 pb-4 border-b border-white/5">
                     <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider self-start">
                       Profile Picture
                     </div>
                     
                     <div className="relative group">
                       {/* Interactive Circular Preview */}
                       <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[var(--violet-bright)] p-1 bg-black/40 relative">
                         {editForm.avatarUrl ? (
                           <img 
                             src={getImageUrl(editForm.avatarUrl)} 
                             alt="Avatar Preview" 
                             className="w-full h-full rounded-full object-cover"
                           />
                         ) : (
                           <div className="w-full h-full bg-[var(--violet-primary)]/20 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                             {getInitials(editForm.fullName)}
                           </div>
                         )}
                         
                         {/* Hover Overlay */}
                         <div 
                           onClick={() => fileInputRef.current?.click()}
                           className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white text-[9px] font-bold cursor-pointer gap-1"
                         >
                           <Camera className="w-4 h-4 text-[var(--violet-bright)]" />
                           <span>UPLOAD</span>
                         </div>
                       </div>

                       {/* Small floating edit icon */}
                       <button
                         type="button"
                         onClick={() => fileInputRef.current?.click()}
                         className="absolute -bottom-1 -right-1 p-2 bg-[var(--violet-primary)] hover:bg-[var(--violet-bright)] border border-white/10 rounded-full text-white shadow-glow transition-all active:scale-90 cursor-pointer"
                         title="Upload Photo"
                       >
                         <Camera className="w-3.5 h-3.5" />
                       </button>
                     </div>

                     <input 
                       type="file"
                       ref={fileInputRef}
                       onChange={handleFileChange}
                       accept="image/jpeg, image/jpg"
                       className="hidden"
                     />
                     
                     <p className="text-[9px] text-[var(--text-muted)] italic leading-tight">
                       Supported format: JPEG/JPG (Max 5MB)
                     </p>
                   </div>

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

      {/* Aadhaar Verification Confirmation Dialog */}
      <AnimatePresence>
        {aadhaarModalOpen && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAadhaarModalOpen(false)}
              className="fixed inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm z-10"
            >
              <GlassCard className="p-6 text-center space-y-6 border-sky-500/30 shadow-glow">
                <div className="w-16 h-16 rounded-full bg-sky-500/10 flex items-center justify-center mx-auto text-sky-400 shadow-inner">
                  <User className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-display font-bold text-white">Aadhaar Instant Verification</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Verify your Aadhaar credentials securely via digilocker interface. Instantly unlocks VIP status, Priority entry lists, and a reward of <strong>100 V-Coins</strong>.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 border border-white/5 rounded-2xl space-y-2 text-left">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide leading-none">Selected Identity Profile</p>
                  <p className="text-xs font-bold text-white">{user.full_name}</p>
                  <p className="text-[10px] text-slate-500">Security Note: Data is encrypted and authenticated through UIDAI gateways directly.</p>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setAadhaarModalOpen(false)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={isVerifyingAadhaar}
                    onClick={handleVerifyAadhaar}
                    className="flex-1 py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-1"
                  >
                    {isVerifyingAadhaar ? 'Verifying...' : 'Verify Now'}
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive Crop Modal */}
      <AnimatePresence>
        {isCropperOpen && selectedImageSrc && (
          <ImageCropper 
            imageSrc={selectedImageSrc} 
            onCropComplete={handleCropComplete} 
            onCancel={() => setIsCropperOpen(false)} 
          />
        )}
      </AnimatePresence>

    </PageWrapper>
  );
};
