import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowButton } from '../../components/ui/GlowButton';
import { FloatingOrb } from '../../components/ui/FloatingOrb';
import { 
  Users, 
  Crown, 
  Check, 
  Clock, 
  Share2, 
  AlertTriangle, 
  CreditCard, 
  Calendar, 
  MapPin, 
  Plus, 
  Minus,
  Sparkles,
  Info
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL, getImageUrl } from '../../config';

interface SquadDetails {
  id: string;
  event_id: string;
  name: string;
  organiser_id: string;
  size: number;
  tier: string;
  created_at: string;
  event_title?: string;
  venue_name?: string;
  start_date?: string;
  cover_image?: string;
  organiser_name?: string;
}

interface SquadMember {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  payment_status: 'pending' | 'paid';
  reserved_until: string | null;
  aadhaar_verified: boolean;
}

const TIER_PRICES: Record<string, number> = {
  regular: 0,
  vip_silver: 299,
  vip_gold: 799
};

const TIER_LABELS: Record<string, string> = {
  regular: 'Regular (Free Entry, Queue)',
  vip_silver: 'VIP Silver (₹299 total base)',
  vip_gold: 'VIP Gold (₹799 total base)'
};

export const SquadView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  
  // Dev State Switcher (Overrides backend state for quick visual demonstration)
  const [devStateOverride, setDevStateOverride] = useState<'none' | 'state1' | 'state2' | 'state3'>('none');

  // Core Data States
  const [eventContext, setEventContext] = useState<any>(null);
  const [squad, setSquad] = useState<SquadDetails | null>(null);
  const [members, setMembers] = useState<SquadMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [notification, setNotification] = useState('');

  // Setup Form States (State 1)
  const [squadName, setSquadName] = useState('');
  const [squadSize, setSquadSize] = useState(4);
  const [selectedTier, setSelectedTier] = useState<'regular' | 'vip_silver' | 'vip_gold'>('vip_silver');

  // Reservation Hold Timer (State 3)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const timerRef = useRef<any>(null);

  // Payment UI simulation state
  const [isPaying, setIsPaying] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [nudgeCooldown, setNudgeCooldown] = useState<Record<string, boolean>>({});

  const isNew = id === 'new';

  // Load Event or Squad Details
  const fetchData = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      if (isNew) {
        const eventId = searchParams.get('event_id');
        if (!eventId) {
          throw new Error('Missing event_id in query parameters.');
        }
        const res = await fetch(`${API_BASE_URL}/api/events/${eventId}`);
        if (!res.ok) throw new Error('Event details could not be retrieved.');
        const data = await res.json();
        setEventContext(data);
        // Default Squad Name
        const organiserName = user?.full_name || 'My';
        setSquadName(`${organiserName}'s Squad — ${data.title}`);
      } else {
        const res = await fetch(`${API_BASE_URL}/api/squads/${id}`);
        if (!res.ok) throw new Error('Squad not found or expired.');
        const data = await res.json();
        setSquad(data.squad);
        setMembers(data.members);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'An error occurred loading squad context.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, searchParams, user?.id]);

  // Invitee countdown timer setup (State 3)
  useEffect(() => {
    // Determine target reservation
    if (isNew || !squad || !user) return;
    
    const myMemberSlot = members.find(m => m.id === user.id);
    if (myMemberSlot && myMemberSlot.payment_status === 'pending' && myMemberSlot.reserved_until) {
      const startTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        
        const updateTimer = () => {
          const reservedTime = new Date(myMemberSlot.reserved_until!).getTime();
          const diffSeconds = Math.max(0, Math.floor((reservedTime - Date.now()) / 1000));
          setSecondsLeft(diffSeconds);
          
          if (diffSeconds <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
          }
        };
        
        updateTimer();
        timerRef.current = setInterval(updateTimer, 1000);
      };
      
      startTimer();
    } else {
      setSecondsLeft(null);
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [members, squad, user, isNew]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4500);
  };

  // State 1: Creation Submit
  const handleCreateSquad = async () => {
    if (!user) {
      showToast('Please sign in to book your squad.');
      return;
    }
    setIsLoading(true);
    try {
      const eventId = eventContext?.id || searchParams.get('event_id');
      const response = await fetch(`${API_BASE_URL}/api/squads/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          name: squadName,
          organiserId: user.id,
          size: squadSize,
          tier: selectedTier
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to create squad.');
      }

      const data = await response.json();
      
      // Open WhatsApp Share immediately
      const deepLink = `${window.location.origin}/squad/${data.squadId}`;
      const messageText = `Hey! Join my squad "${squadName}" for tonight's pass! Pay your share independently here: ${deepLink}`;
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;
      window.open(whatsappUrl, '_blank');

      showToast('Squad created! Redirecting to dashboard...');
      setTimeout(() => {
        navigate(`/squad/${data.squadId}`);
      }, 1500);
    } catch (err: any) {
      showToast(err.message || 'Error creating squad.');
    } finally {
      setIsLoading(false);
    }
  };

  // State 2: Organizer live tracking operations
  const handleNudgeMember = async (memberId: string) => {
    if (nudgeCooldown[memberId]) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/squads/${id}/nudge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: memberId })
      });
      if (response.ok) {
        setNudgeCooldown(prev => ({ ...prev, [memberId]: true }));
        showToast('WhatsApp nudge reminder sent successfully! 💬');
        
        // Mock open whatsapp to simulate nudge link
        const targetMember = members.find(m => m.id === memberId);
        const deepLink = `${window.location.origin}/squad/${id}`;
        const nudgeText = `Hey ${targetMember?.full_name || 'friend'}! Don't lose your spot in our squad booking. Pay your share before the 10-minute lock expires: ${deepLink}`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(nudgeText)}`, '_blank');
      }
    } catch (err) {
      showToast('Failed to send nudge.');
    }
  };

  const handleCancelSquad = async () => {
    if (!user || !squad) return;
    
    const confirmCancel = window.confirm('Are you sure you want to cancel this squad booking? You will receive a full refund.');
    if (!confirmCancel) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/squads/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organiserId: user.id })
      });
      if (response.ok) {
        showToast('Squad successfully cancelled. Refunding...');
        setTimeout(() => {
          navigate('/events');
        }, 1500);
      } else {
        const err = await response.json();
        showToast(err.error || 'Failed to cancel squad.');
      }
    } catch (err) {
      showToast('Cancellation error.');
    }
  };

  // State 3: Invitee Join and payment simulation
  const handleJoinSquadSlot = async () => {
    if (!user) {
      showToast('Please sign in or register to join the squad!');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/squads/${id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to join squad slot.');
      }
      
      showToast('Spot locked for 10 minutes! Proceed to payment.');
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Error joining slot.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaySplit = async () => {
    if (!user || !squad) return;
    setIsPaying(true);
    
    // Simulate Razorpay transaction overlay
    setTimeout(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/squads/${id}/pay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });
        
        if (response.ok) {
          setPaymentComplete(true);
          showToast('Payment successful! Your spot is fully verified. 🎉');
          await fetchData();
        } else {
          showToast('Payment verification failed.');
        }
      } catch (err) {
        showToast('Network error verifying payment.');
      } finally {
        setIsPaying(false);
      }
    }, 2000);
  };

  // Mathematical pricing breakdowns
  const getPricingMath = () => {
    const size = squad ? squad.size : squadSize;
    const tier = squad ? squad.tier : selectedTier;
    const basePrice = TIER_PRICES[tier] || 0;
    
    const perHeadShare = Math.round(basePrice / size);
    const serviceFee = 10;
    const totalToPay = perHeadShare + serviceFee;

    return {
      basePrice,
      perHeadShare,
      serviceFee,
      totalToPay
    };
  };

  const pricing = getPricingMath();

  // Determine current active view based on parameters & data
  const renderCurrentState = () => {
    const activeState = devStateOverride !== 'none' ? devStateOverride : (isNew ? 'state1' : (user && squad && squad.organiser_id === user.id ? 'state2' : 'state3'));

    if (activeState === 'state1') {
      const ev = eventContext || { title: 'Luminescence Club Night', venue_name: 'The Playground', start_date: '2026-06-19 22:00:00', price: 999 };
      return (
        <div className="space-y-6">
          {/* STATE 1: ORGANISER SETUP VIEW */}
          <section className="text-center py-2">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[var(--violet-bright)] px-3 py-1 rounded-full bg-[var(--violet-primary)]/10 border border-[var(--violet-bright)]/20">
              Split-Payment Group Booking
            </span>
            <h1 className="text-3xl font-display font-black text-white mt-3 leading-tight">Setup Your Squad</h1>
          </section>

          {/* Event Header Summary */}
          <GlassCard className="p-4 border-white/5 flex gap-4 items-center">
            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-slate-950">
              <img src={getImageUrl(ev.cover_image) || 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=300'} className="w-full h-full object-cover" alt="" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-white truncate">{ev.title}</h3>
              <p className="text-[10px] text-[var(--text-muted)] mt-1 flex items-center gap-1.5 truncate">
                <MapPin className="w-3 h-3 text-[var(--accent-pink)] shrink-0" /> {ev.venue_name} • {ev.city || 'Mumbai'}
              </p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5 truncate">
                <Calendar className="w-3 h-3 text-[var(--accent-cyan)] shrink-0" /> {new Date(ev.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </GlassCard>

          {/* Config Setup */}
          <GlassCard className="p-6 border-white/5 space-y-5">
            {/* Squad Name Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Squad Name</label>
              <input 
                type="text"
                value={squadName}
                onChange={(e) => setSquadName(e.target.value)}
                placeholder="Name your party alliance..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--violet-bright)] focus:ring-1 focus:ring-[var(--violet-bright)] outline-none transition-colors"
              />
            </div>

            {/* Pass Tier Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Select Pass Tier</label>
              <div className="grid grid-cols-1 gap-2.5">
                {(['regular', 'vip_silver', 'vip_gold'] as const).map((t) => (
                  <div
                    key={t}
                    onClick={() => setSelectedTier(t)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                      selectedTier === t
                        ? 'bg-[var(--violet-primary)]/10 border-[var(--violet-bright)] ring-1 ring-[var(--violet-bright)]/30'
                        : 'bg-white/5 border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-white capitalize">{t.replace('_', ' ')} Pass</p>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{TIER_LABELS[t]}</p>
                    </div>
                    <span className="text-sm font-extrabold text-white">₹{TIER_PRICES[t]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Squad Size Counter Stepper */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Squad Size (2 - 10 people)</label>
              <div className="flex items-center gap-4 bg-white/5 border border-white/10 w-fit rounded-xl p-1.5">
                <button
                  type="button"
                  onClick={() => setSquadSize(Math.max(2, squadSize - 1))}
                  className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-white font-bold transition-colors active:scale-95 shrink-0"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-base font-extrabold text-white w-8 text-center">{squadSize}</span>
                <button
                  type="button"
                  onClick={() => setSquadSize(Math.min(10, squadSize + 1))}
                  className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-white font-bold transition-colors active:scale-95 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dynamic Price Breakdown Footnote */}
            <div className="p-3.5 bg-[var(--violet-primary)]/5 border border-[var(--violet-primary)]/10 rounded-xl text-center">
              <p className="text-xs text-[var(--text-secondary)] font-medium">
                Per-Head Breakdown: <span className="font-extrabold text-white">₹{pricing.perHeadShare} share</span> + <span className="text-[var(--violet-glow)] font-extrabold">₹10 VHOP platform fee</span> = <span className="text-[var(--accent-green)] font-extrabold">₹{pricing.totalToPay} per head</span>
              </p>
              <p className="text-[9px] text-[var(--text-muted)] mt-1.5 leading-relaxed">
                (Base Price ₹{pricing.basePrice} ÷ Group Size {squadSize}) + ₹10 Platform service fee. Individual links generated instantly.
              </p>
            </div>

            {/* Create Button */}
            <GlowButton onClick={handleCreateSquad} className="w-full py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2">
              <Share2 className="w-4 h-4" /> Create Squad & Share via WhatsApp
            </GlowButton>
          </GlassCard>
        </div>
      );
    }

    if (activeState === 'state2') {
      // STATE 2: ORGANISER LIVE DASHBOARD
      const sq = squad || { name: "Kabir's Rave Squad", size: 6, tier: 'vip_silver', event_title: 'Cyberpunk Rooftop Rave', venue_name: 'Bandra Rooftop' };
      const paidCount = members.filter(m => m.payment_status === 'paid').length;
      const allPaid = paidCount === sq.size;

      // Fill in remaining slot representations
      const slotList = [...members];
      while (slotList.length < sq.size) {
        slotList.push({
          id: `empty_${slotList.length}`,
          full_name: 'Slot Waiting...',
          username: 'invited',
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=invited_${slotList.length}`,
          payment_status: 'pending',
          reserved_until: null,
          aadhaar_verified: false
        });
      }

      return (
        <div className="space-y-6">
          <section className="text-center py-2 space-y-1">
            <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]">
              Live Squad Tracker
            </span>
            <h1 className="text-3xl font-display font-black text-white truncate mt-2">{sq.name}</h1>
          </section>

          {/* Squad Status Header */}
          <GlassCard className="p-5 border-white/5 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-3xl -z-10" />
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Squad Status</h3>
            <p className="text-3xl font-display font-black text-white mt-1.5">
              {paidCount} / {sq.size} Joined & Paid
            </p>
            <div className="w-full bg-white/5 rounded-full h-2 mt-4 overflow-hidden border border-white/5">
              <div 
                className="bg-gradient-to-r from-[var(--violet-bright)] to-emerald-400 h-full transition-all duration-700" 
                style={{ width: `${(paidCount / sq.size) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-2.5">
              Share link with friends to split payment: <span className="font-mono text-[var(--accent-cyan)]">{window.location.origin}/squad/{id || 'demo_id'}</span>
            </p>
          </GlassCard>

          {/* Real-time Tracking List */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex justify-between">
              <span>Alliance Roster</span>
              <span className="text-[10px] text-[var(--violet-bright)]">Reward Potential: +50 V Coins</span>
            </h3>

            <div className="space-y-2">
              {slotList.map((m, idx) => {
                const isOrganiser = idx === 0; // The first slot represents the organizer/creator
                const isWaiting = m.username === 'invited';
                
                return (
                  <GlassCard key={m.id} className="p-4 border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <img 
                          src={m.avatar_url} 
                          alt="" 
                          className="w-10 h-10 rounded-xl border border-white/10 bg-slate-900" 
                        />
                        {isOrganiser && (
                          <div className="absolute -top-2.5 -right-2.5 bg-[var(--accent-gold)] p-1 rounded-lg shadow-md rotate-12">
                            <Crown className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-extrabold text-white leading-none">
                            {isOrganiser ? `${m.full_name} (You)` : m.full_name}
                          </p>
                          {isOrganiser && (
                            <span className="text-[8px] font-black uppercase bg-[var(--accent-gold)]/15 border border-[var(--accent-gold)]/20 px-1.5 py-0.5 rounded text-[var(--accent-gold)]">
                              Squad Lead
                            </span>
                          )}
                        </div>
                        {isWaiting ? (
                          <span className="text-[9px] text-[var(--text-muted)] mt-1 block">Unclaimed slot invitation</span>
                        ) : (
                          <span className="text-[9px] text-[var(--text-secondary)] mt-1 block">@{m.username}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {isOrganiser ? (
                        <span className="text-[9px] font-bold text-[var(--accent-gold)] bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-lg">
                          +50 V Coins Reward
                        </span>
                      ) : isWaiting ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[var(--text-muted)] font-medium">Waiting for payment...</span>
                        </div>
                      ) : m.payment_status === 'paid' ? (
                        <div className="px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-black rounded-lg flex items-center gap-1 uppercase tracking-wider">
                          <Check className="w-3 h-3" /> Paid
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1 uppercase tracking-wider">
                            <Clock className="w-2.5 h-2.5 animate-spin" /> Pending
                          </span>
                          <button
                            onClick={() => handleNudgeMember(m.id)}
                            disabled={nudgeCooldown[m.id]}
                            className={`p-1.5 rounded-lg border text-white font-bold transition-all active:scale-95 flex items-center justify-center ${
                              nudgeCooldown[m.id]
                                ? 'bg-slate-800 border-slate-700 opacity-50 text-slate-500'
                                : 'bg-green-600 border-green-500 hover:bg-green-500 shadow-glow cursor-pointer'
                            }`}
                            title="Nudge Friend via WhatsApp"
                          >
                            <span className="text-[10px] font-black uppercase tracking-wider px-1">Nudge</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </div>

          {/* Action Control Footer */}
          <footer className="space-y-4 pt-4">
            <GlowButton
              disabled={!allPaid}
              className={`w-full py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 ${
                allPaid ? '' : 'opacity-50 cursor-not-allowed'
              }`}
            >
              Confirm & Issue QR Passes
            </GlowButton>
            
            <div className="text-center space-y-1">
              <button 
                onClick={handleCancelSquad}
                className="text-xs text-red-500 font-bold hover:underline hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer"
              >
                Cancel Squad Booking
              </button>
              <p className="text-[9px] text-[var(--text-muted)]">
                Full refund available up to 4 hours before the event. Refund processed instantly back to checkout account.
              </p>
            </div>
          </footer>
        </div>
      );
    }

    if (activeState === 'state3') {
      // STATE 3: SQUAD MEMBER INVITEE VIEW
      const sq = squad || { organiser_name: 'Kabir Sharma', name: "Kabir's Rave Squad", event_title: 'Cyberpunk Rooftop Rave', size: 6, tier: 'vip_silver' };
      const isAlreadyMember = members.find(m => m.id === user?.id);
      const isPaid = isAlreadyMember && isAlreadyMember.payment_status === 'paid';

      // Format countdown time
      const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
      };

      return (
        <div className="space-y-6">
          {/* Invitation Banner */}
          <section className="text-center py-2 space-y-1.5">
            <div className="w-16 h-16 bg-[var(--violet-primary)]/10 border border-[var(--violet-bright)]/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <Users className="w-8 h-8 text-[var(--violet-bright)] animate-pulse" />
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-black text-white leading-tight">
              Join the Alliance
            </h1>
            <div className="p-4 bg-[var(--violet-primary)]/10 border border-[var(--violet-bright)]/20 rounded-2xl max-w-md mx-auto">
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                <span className="font-black text-white">{sq.organiser_name || 'Your friend'}</span> invited you to join their squad <span className="font-bold text-[var(--violet-glow)]">"{sq.name}"</span> for <span className="font-extrabold text-white">{sq.event_title || 'tonight\'s club pass'}</span>!
              </p>
            </div>
          </section>

          {/* Checkout Steps */}
          {paymentComplete || isPaid ? (
            <GlassCard className="p-8 text-center space-y-6 border border-emerald-500/40 relative overflow-hidden">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-display font-bold text-white">Payment Confirmed</h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  You have successfully paid your share of ₹{pricing.totalToPay}. Your entry ticket will be generated once all squad members pay.
                </p>
              </div>
              <GlowButton onClick={() => navigate('/events')} className="w-full py-3">
                Explore More Events
              </GlowButton>
            </GlassCard>
          ) : !isAlreadyMember ? (
            <GlassCard className="p-6 border-white/5 space-y-5 text-center">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Reserve Your Spot</h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Click join below to lock one of the {sq.size} available slots in this squad. You will have a 10-minute hold to complete payment.
              </p>
              <GlowButton onClick={handleJoinSquadSlot} className="w-full py-4">
                Lock Spot & Join Squad
              </GlowButton>
            </GlassCard>
          ) : (
            <div className="space-y-5">
              {/* Countdown timer hold clock */}
              {secondsLeft !== null && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-4 justify-between animate-pulse">
                  <div className="flex items-center gap-3">
                    <Clock className="w-6 h-6 text-amber-500 animate-spin" />
                    <div className="text-left">
                      <p className="text-xs font-black text-amber-200">Spot Reserved (Hold Timer)</p>
                      <p className="text-[9px] text-amber-200/70 mt-0.5">Pay before it expires!</p>
                    </div>
                  </div>
                  <span className="font-mono text-2xl font-black text-amber-500">
                    {secondsLeft > 0 ? formatTime(secondsLeft) : 'Expired'}
                  </span>
                </div>
              )}

              {/* Transparent Cost Breakdown Card */}
              <GlassCard className="p-6 border-white/5 space-y-4">
                <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[var(--violet-bright)]" />
                  <span>Split Bill Breakdown</span>
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Base Pass Share (1 of {sq.size} slots)</span>
                    <span className="text-white font-bold">₹{pricing.perHeadShare}</span>
                  </div>
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>VHOP Platform Service Fee</span>
                    <span className="text-white font-bold">₹{pricing.serviceFee}</span>
                  </div>
                  <div className="h-px bg-white/5 my-2" />
                  <div className="flex justify-between text-base font-extrabold">
                    <span>Total Amount to Pay</span>
                    <span className="text-[var(--accent-green)] font-display text-lg">₹{pricing.totalToPay}</span>
                  </div>
                </div>

                {/* Checkout Trigger */}
                <GlowButton 
                  onClick={handlePaySplit}
                  disabled={isPaying || (secondsLeft !== null && secondsLeft <= 0)}
                  className="w-full py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  {isPaying ? (
                    <>Processing UPI/Card Checkout...</>
                  ) : (
                    <>Pay ₹{pricing.totalToPay} via UPI / Card</>
                  )}
                </GlowButton>

                {/* KYC compliance disclaimer */}
                <p className="text-[10px] text-[var(--text-muted)] text-center leading-relaxed">
                  *Aadhaar KYC verification is mandatory during onboarding to generate your secure, untransferable QR pass at the door. No Aadhaar numbers are stored.
                </p>
              </GlassCard>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  if (isLoading) {
    return (
      <PageWrapper className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--violet-bright)]"></div>
      </PageWrapper>
    );
  }

  if (errorMessage) {
    return (
      <PageWrapper className="flex items-center justify-center py-24">
        <GlassCard className="p-8 text-center max-w-sm border-red-500/20">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold mb-2">Error Loading Squad</h2>
          <p className="text-xs text-[var(--text-secondary)] mb-6">{errorMessage}</p>
          <GlowButton onClick={() => navigate('/events')}>Back to Discovery</GlowButton>
        </GlassCard>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="relative px-4 pb-24 overflow-x-hidden">
      {/* Dynamic Ambient Orbs */}
      <FloatingOrb className="top-1/4 -left-20 pointer-events-none" color="pink" size={300} />
      <FloatingOrb className="bottom-1/4 -right-20 pointer-events-none" color="violet" size={400} delay={1} />
      
      {/* Dev Switcher Toolbar */}
      <div className="max-w-xl mx-auto mb-6 bg-slate-900/90 border border-white/10 rounded-2xl p-2.5 flex flex-col items-center gap-2 relative z-[110] backdrop-blur-xl">
        <div className="flex items-center gap-1.5 text-[9px] uppercase font-black text-amber-500">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>Demo Toolbar (Force UI states for review)</span>
        </div>
        <div className="flex flex-wrap justify-center gap-1.5 w-full">
          <button
            onClick={() => setDevStateOverride('state1')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-colors ${
              devStateOverride === 'state1' ? 'bg-[var(--violet-bright)] text-white' : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            State 1: Creator Setup
          </button>
          <button
            onClick={() => setDevStateOverride('state2')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-colors ${
              devStateOverride === 'state2' ? 'bg-[var(--violet-bright)] text-white' : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            State 2: Creator Live Dashboard
          </button>
          <button
            onClick={() => setDevStateOverride('state3')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-colors ${
              devStateOverride === 'state3' ? 'bg-[var(--violet-bright)] text-white' : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            State 3: Invitee Landing
          </button>
          <button
            onClick={() => setDevStateOverride('none')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-colors ${
              devStateOverride === 'none' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
            title="Follow current user dynamic status"
          >
            Dynamic: {isNew ? 'Setup' : (user && squad && squad.organiser_id === user.id ? 'Dashboard' : 'Landing')}
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto relative z-10 space-y-6">
        
        {/* Real-time notification toast */}
        {notification && (
          <div className="p-4 bg-[var(--violet-primary)]/95 border border-[var(--violet-bright)]/40 rounded-2xl text-xs text-white flex items-center gap-3 backdrop-blur-xl shadow-glow">
            <Sparkles className="w-5 h-5 text-[var(--accent-gold)] shrink-0 animate-bounce" />
            <span className="font-semibold">{notification}</span>
          </div>
        )}

        {/* State Renderer */}
        {renderCurrentState()}

      </div>
    </PageWrapper>
  );
};
