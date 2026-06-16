import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowButton } from '../../components/ui/GlowButton';
import { FloatingOrb } from '../../components/ui/FloatingOrb';
import { 
  Crown, 
  Check, 
  Clock, 
  Share2, 
  CreditCard, 
  Calendar, 
  MapPin, 
  Sparkles, 
  Info,
  ChevronLeft,
  Search,
  CheckCircle,
  MessageSquare,
  Smartphone,
  Shield,
  GlassWater,
  Settings,
  PlusCircle,
  QrCode,
  Camera
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';

interface SquadDetails {
  id: string;
  event_id: string;
  name: string;
  organiser_id: string;
  size: number;
  tier: string;
  created_at: string;
  anyone_can_join: boolean;
  require_approval: boolean;
  entry_price: number;
  status: string;
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

export const SquadView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  
  // Dev State Switcher (Overrides backend state for visual validation)
  const [devStateOverride, setDevStateOverride] = useState<'none' | 'creator_flow' | 'host_dashboard' | 'invitee_checkout'>('none');

  // Core Data States
  const [squad, setSquad] = useState<SquadDetails | null>(null);
  const [members, setMembers] = useState<SquadMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [notification, setNotification] = useState('');

  // Creation Wizard States (isNew)
  const [creationStep, setCreationStep] = useState<1 | 2 | 3>(1);
  const [squadName, setSquadName] = useState('');
  const [squadSize, setSquadSize] = useState<5 | 10 | 20>(10);
  const [anyoneCanJoin, setAnyoneCanJoin] = useState(true);
  const [requireApproval, setRequireApproval] = useState(false);
  const [entryPrice, setEntryPrice] = useState<number>(1200);

  // Search linked events states
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [eventSearch, setEventSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEventDropdown, setShowEventDropdown] = useState(false);

  // Success Screen Newly Created ID
  const [createdSquadId, setCreatedSquadId] = useState('');

  // Roster Invitation features (Host dashboard)
  const [usernameInput, setUsernameInput] = useState('');
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannerUsersList, setScannerUsersList] = useState<any[]>([]);
  const [selectedScannerUserId, setSelectedScannerUserId] = useState('');

  // Payment UI simulation state
  const [isPaying, setIsPaying] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [nudgeCooldown, setNudgeCooldown] = useState<Record<string, boolean>>({});

  const isNew = id === 'new';

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4500);
  };

  // Load Event Context or Squad Details
  const fetchData = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      // Load events list for the creation dropdown search
      const eventsRes = await fetch(`${API_BASE_URL}/api/events`);
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setAllEvents(eventsData);
      }

      if (isNew) {
        const eventId = searchParams.get('event_id');
        if (eventId && eventsRes.ok) {
          const eventsData = await eventsRes.json().catch(() => null);
          const activeEv = (eventsData || allEvents).find((e: any) => e.id === eventId);
          if (activeEv) {
            setSelectedEvent(activeEv);
            setEventSearch(activeEv.title);
            setSquadName(`VIP Table — ${activeEv.title}`);
          }
        } else {
          setSquadName('e.g. VIP Table — Friday Night');
        }
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

  // Load registered users for scanner target selection
  const fetchScannerUsers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users`);
      if (res.ok) {
        const data = await res.json();
        setScannerUsersList(data.filter((u: any) => u.id !== user?.id));
      }
    } catch (err) {
      console.error('Error fetching scanner users:', err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchScannerUsers();
  }, [id, searchParams, user?.id]);

  // handle event selection in Step 1
  const selectEventFromSearch = (ev: any) => {
    setSelectedEvent(ev);
    setEventSearch(ev.title);
    setSquadName(`VIP Booth — ${ev.title}`);
    setShowEventDropdown(false);
  };

  // State 1: Creation Submit
  const handleCreateSquad = async () => {
    if (!user) {
      showToast('Please sign in to book your squad.');
      return;
    }
    if (!selectedEvent) {
      showToast('Please search and select a linked event/venue first.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/squads/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          name: squadName,
          organiserId: user.id,
          size: squadSize,
          tier: squadSize === 5 ? 'intimate' : squadSize === 20 ? 'big_squad' : 'standard',
          anyoneCanJoin,
          requireApproval,
          entryPrice
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to create squad.');
      }

      const data = await response.json();
      setCreatedSquadId(data.squadId);
      setCreationStep(3); // Go to Success Screen
      showToast('Squad is live! Share with your friends.');
    } catch (err: any) {
      showToast(err.message || 'Error creating squad.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add Member by Username input
  const handleAddByUsername = async () => {
    if (!usernameInput.trim() || !squad) return;
    try {
      // Find the user by username in scanner list
      const targetUser = scannerUsersList.find(
        (u: any) => u.username?.toLowerCase() === usernameInput.trim().toLowerCase()
      );
      if (!targetUser) {
        showToast('Username not found. Try kabir, riya, or aarav.');
        return;
      }
      
      // Call join squad slot
      const joinRes = await fetch(`${API_BASE_URL}/api/squads/${squad.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUser.id })
      });
      
      if (!joinRes.ok) {
        const joinErr = await joinRes.json();
        throw new Error(joinErr.error || 'Could not join slot.');
      }

      // Mark payment complete immediately (simulate direct cash split or split authorization)
      await fetch(`${API_BASE_URL}/api/squads/${squad.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUser.id })
      });

      showToast(`Added ${targetUser.full_name} to your squad!`);
      setUsernameInput('');
      fetchData(); // reload members list
    } catch (err: any) {
      showToast(err.message || 'Failed to invite user.');
    }
  };

  // QR Code Scanner simulate scan trigger
  const handleScanQRUser = async (userId: string) => {
    if (!userId || !squad) return;
    const targetUser = scannerUsersList.find((u: any) => u.id === userId);
    if (!targetUser) return;
    
    try {
      // Call join squad slot
      const joinRes = await fetch(`${API_BASE_URL}/api/squads/${squad.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUser.id })
      });

      if (!joinRes.ok) {
        const joinErr = await joinRes.json();
        throw new Error(joinErr.error || 'Could not join slot.');
      }

      // Mark paid
      await fetch(`${API_BASE_URL}/api/squads/${squad.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUser.id })
      });

      showToast(`Scanned & added ${targetUser.full_name} instantly!`);
      setShowScannerModal(false);
      setSelectedScannerUserId('');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Scanner transaction failed.');
    }
  };

  // WhatsApp Nudge
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
        showToast('Nudge reminder sent successfully! 💬');
      }
    } catch (err) {
      showToast('Failed to send nudge.');
    }
  };

  const handleCancelSquad = async () => {
    if (!user || !squad) return;
    const confirmCancel = window.confirm('Are you sure you want to cancel this squad booking? All paid members get a full refund.');
    if (!confirmCancel) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/squads/${squad.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organiserId: user.id })
      });
      if (response.ok) {
        showToast('Squad successfully cancelled. Refunding...');
        setTimeout(() => navigate('/squads'), 1500);
      } else {
        const err = await response.json();
        showToast(err.error || 'Failed to cancel.');
      }
    } catch (err) {
      showToast('Cancellation error.');
    }
  };

  // Join Spot & Pay (Invitee flow)
  const handleJoinSquadSlot = async () => {
    if (!user) {
      showToast('Please sign in or register to join the squad!');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/squads/${squad?.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to join.');
      }
      
      showToast('Spot reserved! Processing checkout payment.');
      await handlePaySplit();
    } catch (err: any) {
      showToast(err.message || 'Error joining slot.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaySplit = async () => {
    if (!user || !squad) return;
    setIsPaying(true);
    
    // Simulate transaction delay
    setTimeout(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/squads/${squad.id}/pay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });
        
        if (response.ok) {
          setPaymentComplete(true);
          showToast('Payment successful! Spot locked. 🎉');
          await fetchData();
        } else {
          showToast('Payment verification failed.');
        }
      } catch (err) {
        showToast('Network error.');
      } finally {
        setIsPaying(false);
      }
    }, 2000);
  };

  // Copy Link utility
  const copySquadLink = (sqId: string) => {
    const link = `${window.location.origin}/squad/${sqId}`;
    navigator.clipboard.writeText(link);
    showToast('Squad link copied to clipboard!');
  };

  // Mathematics pricing calculations
  const totalCollected = squadSize * entryPrice;
  const commission = Math.round(totalCollected * 0.15);
  const payoutToReceive = totalCollected - commission;

  // Search event dropdown filter
  const filteredEvents = allEvents.filter(e => 
    e.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
    e.venue_name.toLowerCase().includes(eventSearch.toLowerCase())
  );

  const getHostInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const activeView = devStateOverride !== 'none' 
    ? devStateOverride 
    : (isNew ? 'creator_flow' : (user && squad && squad.organiser_id === user.id ? 'host_dashboard' : 'invitee_checkout'));

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
          <h2 className="text-lg font-bold mb-2">Error Loading Squad</h2>
          <p className="text-xs text-[var(--text-secondary)] mb-6">{errorMessage}</p>
          <GlowButton onClick={() => navigate('/squads')}>Back to Discovery</GlowButton>
        </GlassCard>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="relative px-4 pb-24 overflow-x-hidden">
      {/* Dynamic Ambient Glassmorphic Orbs */}
      <FloatingOrb className="top-1/4 -left-20 pointer-events-none" color="pink" size={300} />
      <FloatingOrb className="bottom-1/4 -right-20 pointer-events-none" color="violet" size={400} delay={1} />
      
      {/* Dev Switcher Toolbar */}
      <div className="max-w-xl mx-auto mb-6 bg-slate-900/90 border border-white/10 rounded-2xl p-2.5 flex flex-col items-center gap-2 relative z-[110] backdrop-blur-xl">
        <div className="flex items-center gap-1.5 text-[9px] uppercase font-black text-amber-500">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>Dev Toggle (Review Specific Figma Screens)</span>
        </div>
        <div className="flex flex-wrap justify-center gap-1.5 w-full">
          <button
            onClick={() => {
              setDevStateOverride('creator_flow');
              setCreationStep(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-colors ${
              activeView === 'creator_flow' && creationStep === 1 ? 'bg-[var(--violet-bright)] text-white' : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            Figma 2: Create Details
          </button>
          <button
            onClick={() => {
              setDevStateOverride('creator_flow');
              setCreationStep(2);
            }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-colors ${
              activeView === 'creator_flow' && creationStep === 2 ? 'bg-[var(--violet-bright)] text-white' : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            Figma 3: Create Pricing
          </button>
          <button
            onClick={() => {
              setDevStateOverride('creator_flow');
              setCreationStep(3);
              setCreatedSquadId('sq_trilogy');
            }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-colors ${
              activeView === 'creator_flow' && creationStep === 3 ? 'bg-[var(--violet-bright)] text-white' : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            Figma 5: Success Share
          </button>
          <button
            onClick={() => setDevStateOverride('invitee_checkout')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-colors ${
              activeView === 'invitee_checkout' ? 'bg-[var(--violet-bright)] text-white' : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            Figma 4: Member Checkout
          </button>
          <button
            onClick={() => setDevStateOverride('host_dashboard')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-colors ${
              activeView === 'host_dashboard' ? 'bg-[var(--violet-bright)] text-white' : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            Figma 6: Host Dashboard
          </button>
          <button
            onClick={() => setDevStateOverride('none')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-colors ${
              devStateOverride === 'none' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            Reset Dynamic
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto relative z-10 space-y-6">
        
        {/* Real-time notification toast */}
        {notification && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm p-4 bg-[var(--violet-primary)]/95 border border-[var(--violet-bright)]/40 rounded-2xl text-xs text-white flex items-center gap-3 backdrop-blur-xl shadow-glow">
            <Sparkles className="w-5 h-5 text-[var(--accent-gold)] shrink-0 animate-bounce" />
            <span className="font-semibold text-left">{notification}</span>
          </div>
        )}

        {/* ---------------- FIGMA SCREEN 2 & 3 & 5: CREATOR FLOW ---------------- */}
        {activeView === 'creator_flow' && (
          <div className="space-y-6">
            
            {/* Header with Back */}
            <header className="flex justify-between items-center py-2">
              <button 
                onClick={() => creationStep > 1 ? setCreationStep((creationStep - 1) as any) : navigate('/squads')}
                className="flex items-center gap-1.5 text-sm font-bold text-[var(--text-secondary)] hover:text-white transition-colors bg-transparent border-none cursor-pointer p-0"
              >
                <ChevronLeft className="w-5 h-5" /> Back
              </button>
              <h2 className="text-lg font-display font-bold text-white">
                {creationStep === 1 ? 'Create Squad' : creationStep === 2 ? 'Pricing' : 'Share Squad'}
              </h2>
              <div className="w-12" /> {/* alignment spacer */}
            </header>

            {/* Steps Progress Bar Indicator (Screenshot 2) */}
            <div className="flex items-center gap-1.5 px-2">
              <div className="flex-1 flex flex-col items-center">
                <div className="h-1 w-full bg-[var(--violet-bright)] rounded-full" />
                <span className="text-[9px] font-black uppercase tracking-wider text-[var(--violet-bright)] mt-1.5">Event</span>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <div className={`h-1 w-full rounded-full ${creationStep >= 1 ? 'bg-[var(--violet-bright)]' : 'bg-slate-800'}`} />
                <span className={`text-[9px] font-black uppercase tracking-wider mt-1.5 ${creationStep >= 1 ? 'text-[var(--violet-bright)]' : 'text-slate-500'}`}>Details</span>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <div className={`h-1 w-full rounded-full ${creationStep >= 2 ? 'bg-[var(--violet-bright)]' : 'bg-slate-800'}`} />
                <span className={`text-[9px] font-black uppercase tracking-wider mt-1.5 ${creationStep >= 2 ? 'text-[var(--violet-bright)]' : 'text-slate-500'}`}>Size</span>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <div className={`h-1 w-full rounded-full ${creationStep >= 3 ? 'bg-[var(--violet-bright)]' : 'bg-slate-800'}`} />
                <span className={`text-[9px] font-black uppercase tracking-wider mt-1.5 ${creationStep >= 3 ? 'text-[var(--violet-bright)]' : 'text-slate-500'}`}>Pricing</span>
              </div>
            </div>

            {/* STEP 1: DETAILS STEP */}
            {creationStep === 1 && (
              <GlassCard className="p-6 border-white/5 space-y-6 text-left">
                {/* Squad Name */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Squad Name</label>
                  <input 
                    type="text"
                    value={squadName}
                    onChange={(e) => setSquadName(e.target.value)}
                    placeholder="e.g. VIP Table - Friday Night"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-[var(--violet-bright)] outline-none transition-colors"
                  />
                </div>

                {/* Linked Event / Search Venue */}
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Linked Event / Venue</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text"
                      value={eventSearch}
                      onChange={(e) => {
                        setEventSearch(e.target.value);
                        setShowEventDropdown(true);
                      }}
                      onFocus={() => setShowEventDropdown(true)}
                      placeholder="Search venues or events..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white focus:border-[var(--violet-bright)] outline-none transition-colors"
                    />
                  </div>

                  {/* Dropdown Suggestions */}
                  {showEventDropdown && eventSearch.trim() !== '' && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#13111F] border border-white/10 rounded-xl max-h-56 overflow-y-auto divide-y divide-white/5 shadow-2xl">
                      {filteredEvents.length === 0 ? (
                        <p className="p-4 text-xs text-[var(--text-muted)] text-center">No events found matching search.</p>
                      ) : (
                        filteredEvents.map(ev => (
                          <div 
                            key={ev.id} 
                            onClick={() => selectEventFromSearch(ev)}
                            className="p-3.5 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors"
                          >
                            <img src={ev.cover_image} className="w-10 h-10 rounded-lg object-cover bg-slate-900 shrink-0" alt="" />
                            <div className="min-w-0 text-left">
                              <h4 className="text-xs font-bold text-white truncate">{ev.title}</h4>
                              <p className="text-[9px] text-[var(--text-muted)] mt-1 truncate">{ev.venue_name} • {ev.city}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Squad Size Buttons selector */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Squad Size</label>
                  <div className="grid grid-cols-3 gap-3">
                    {([5, 10, 20] as const).map(sz => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSquadSize(sz)}
                        className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 ${
                          squadSize === sz 
                            ? 'bg-[var(--violet-primary)]/10 border-[var(--violet-bright)] ring-1 ring-[var(--violet-bright)]/30' 
                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-base font-extrabold text-white">{sz}</span>
                        <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                          {sz === 5 ? 'Intimate' : sz === 10 ? 'Standard' : 'Big Squad'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Switch Toggles */}
                <div className="space-y-4 pt-2">
                  {/* Anyone can join */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white leading-none">Anyone can join</h4>
                      <p className="text-[10px] text-[var(--text-muted)] mt-1.5">Public link, open to all</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setAnyoneCanJoin(!anyoneCanJoin)}
                      className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 relative focus:outline-none cursor-pointer ${
                        anyoneCanJoin ? 'bg-[var(--violet-bright)]' : 'bg-slate-800'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${anyoneCanJoin ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Require approval */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white leading-none">Require approval</h4>
                      <p className="text-[10px] text-[var(--text-muted)] mt-1.5">You approve each member</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setRequireApproval(!requireApproval)}
                      className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 relative focus:outline-none cursor-pointer ${
                        requireApproval ? 'bg-[var(--violet-bright)]' : 'bg-slate-800'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${requireApproval ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                {/* Continue button */}
                <GlowButton 
                  onClick={() => {
                    if (!selectedEvent) {
                      showToast('Please select a linked event/venue.');
                      return;
                    }
                    setCreationStep(2);
                  }}
                  className="w-full py-4 text-xs font-black uppercase tracking-wider mt-4"
                >
                  Continue to Pricing
                </GlowButton>
              </GlassCard>
            )}

            {/* STEP 2: PRICING STEP */}
            {creationStep === 2 && (
              <div className="space-y-4">
                <GlassCard className="p-6 border-white/5 space-y-6 text-left">
                  
                  {/* Price input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Entry Price Per Person</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-white">₹</span>
                      <input 
                        type="number"
                        value={entryPrice}
                        onChange={(e) => setEntryPrice(parseInt(e.target.value) || 0)}
                        placeholder="1,200"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3.5 text-lg font-black text-white focus:border-[var(--violet-bright)] outline-none"
                      />
                    </div>
                  </div>

                  {/* Payout breakdown panel */}
                  <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Payout Breakdown</span>
                    <div className="space-y-1 text-left">
                      <h3 className="text-3xl font-display font-black text-white">
                        ₹{payoutToReceive.toLocaleString('en-IN')}
                      </h3>
                      <p className="text-[10px] text-[var(--text-muted)]">you earn if all {squadSize} spots fill</p>
                    </div>

                    <div className="h-px bg-white/5" />

                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between text-[var(--text-secondary)]">
                        <span>Total collected ({squadSize} × ₹{entryPrice.toLocaleString('en-IN')})</span>
                        <span className="text-white font-bold">₹{totalCollected.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-[var(--text-secondary)]">
                        <span>vhop commission (15%)</span>
                        <span className="text-red-400 font-bold">- ₹{commission.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="h-px bg-white/5 my-1" />
                      <div className="flex justify-between text-sm font-extrabold">
                        <span>You receive</span>
                        <span className="text-[var(--accent-green)] font-black">₹{payoutToReceive.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Information card */}
                  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex gap-3 text-left">
                    <Info className="w-5 h-5 text-[var(--violet-bright)] shrink-0 mt-0.5 animate-pulse" />
                    <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                      Payout is released to your bank account once the event starts. Members get a full refund if the squad is cancelled.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="space-y-3 pt-2">
                    <GlowButton 
                      onClick={handleCreateSquad}
                      className="w-full py-4 text-xs font-black uppercase tracking-wider"
                    >
                      Create & Get Link
                    </GlowButton>
                    <button 
                      type="button"
                      onClick={() => {
                        showToast('Squad saved as draft successfully!');
                        navigate('/squads');
                      }}
                      className="w-full py-3 bg-transparent hover:bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-wider text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      Save as Draft
                    </button>
                  </div>

                </GlassCard>
              </div>
            )}

            {/* STEP 3: SUCCESS / SHARE STEP */}
            {creationStep === 3 && (
              <GlassCard className="p-6 border-white/5 space-y-6 text-center">
                {/* Visual Checkmark */}
                <div className="w-16 h-16 bg-[var(--violet-primary)]/10 border border-[var(--violet-bright)]/20 rounded-2xl flex items-center justify-center mx-auto shadow-glow">
                  <CheckCircle className="w-8 h-8 text-[var(--violet-bright)]" />
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl font-display font-black text-white">Squad is live!</h1>
                  <p className="text-xs text-[var(--text-secondary)]">Share the link to fill your spots</p>
                </div>

                {/* Share URL Box */}
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1.5 pl-4">
                  <span className="text-[10px] font-mono text-[var(--accent-cyan)] truncate flex-1 text-left">
                    vhop.app/squad/{createdSquadId || 'sq_trilogy'}
                  </span>
                  <button 
                    onClick={() => copySquadLink(createdSquadId || 'sq_trilogy')}
                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-wider text-white border border-white/10 transition-colors cursor-pointer"
                  >
                    Copy
                  </button>
                </div>

                {/* Share list grid */}
                <div className="space-y-2.5 text-left">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Share to</span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {/* Instagram Story */}
                    <div 
                      onClick={() => showToast('Redirecting to Instagram Stories split share...')}
                      className="p-3 bg-white/5 border border-white/5 hover:border-white/15 rounded-xl flex items-center gap-2.5 cursor-pointer transition-all active:scale-95"
                    >
                      <Smartphone className="w-5 h-5 text-[var(--accent-pink)] shrink-0" />
                      <div className="min-w-0 text-left">
                        <h4 className="text-[11px] font-bold text-white">Story</h4>
                        <p className="text-[8px] text-[var(--text-muted)] mt-0.5 truncate">Instagram</p>
                      </div>
                    </div>

                    {/* WhatsApp */}
                    <div 
                      onClick={() => {
                        const messageText = `Hey! Join my squad for tonight's VIP booth split: ${window.location.origin}/squad/${createdSquadId || 'sq_trilogy'}`;
                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`, '_blank');
                      }}
                      className="p-3 bg-white/5 border border-white/5 hover:border-white/15 rounded-xl flex items-center gap-2.5 cursor-pointer transition-all active:scale-95"
                    >
                      <MessageSquare className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div className="min-w-0 text-left">
                        <h4 className="text-[11px] font-bold text-white">WhatsApp</h4>
                        <p className="text-[8px] text-[var(--text-muted)] mt-0.5 truncate">Groups or DM</p>
                      </div>
                    </div>

                    {/* Snapchat */}
                    <div 
                      onClick={() => showToast('Redirecting to Snapchat Share...')}
                      className="p-3 bg-white/5 border border-white/5 hover:border-white/15 rounded-xl flex items-center gap-2.5 cursor-pointer transition-all active:scale-95"
                    >
                      <Smartphone className="w-5 h-5 text-yellow-400 shrink-0" />
                      <div className="min-w-0 text-left">
                        <h4 className="text-[11px] font-bold text-white">Snapchat</h4>
                        <p className="text-[8px] text-[var(--text-muted)] mt-0.5 truncate">Story or chat</p>
                      </div>
                    </div>

                    {/* More */}
                    <div 
                      onClick={() => showToast('Opening system share dialog...')}
                      className="p-3 bg-white/5 border border-white/5 hover:border-white/15 rounded-xl flex items-center gap-2.5 cursor-pointer transition-all active:scale-95"
                    >
                      <Share2 className="w-5 h-5 text-white shrink-0" />
                      <div className="min-w-0 text-left">
                        <h4 className="text-[11px] font-bold text-white">More</h4>
                        <p className="text-[8px] text-[var(--text-muted)] mt-0.5 truncate">All apps</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Potential Earnings badge */}
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/20 rounded-xl flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                    Earn ₹{payoutToReceive.toLocaleString('en-IN')} when all {squadSize} spots fill
                  </span>
                </div>

                {/* View My Squad button */}
                <GlowButton 
                  onClick={() => navigate(`/squad/${createdSquadId || 'sq_trilogy'}`)}
                  className="w-full py-4 text-xs font-black uppercase tracking-wider mt-4"
                >
                  View My Squad
                </GlowButton>
              </GlassCard>
            )}

          </div>
        )}

        {/* ---------------- FIGMA SCREEN 6: HOST DASHBOARD ---------------- */}
        {activeView === 'host_dashboard' && (
          <div className="space-y-6">
            
            {/* Header with gear settings and squads list back */}
            <header className="flex justify-between items-center py-2">
              <button 
                onClick={() => navigate('/squads')}
                className="flex items-center gap-1 text-sm font-bold text-[var(--text-secondary)] hover:text-white transition-colors bg-transparent border-none cursor-pointer p-0"
              >
                <ChevronLeft className="w-5 h-5" /> Squads
              </button>
              <h2 className="text-base font-display font-black text-white">My Squad</h2>
              <button 
                onClick={() => handleCancelSquad()}
                className="w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer text-white"
                title="Cancel Squad Settings"
              >
                <Settings className="w-4.5 h-4.5" />
              </button>
            </header>

            {/* Title Block */}
            <div className="text-left space-y-1">
              <h1 className="text-2xl font-display font-black text-white">{squad?.name || 'VIP Booth — Trilogy'}</h1>
              <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[var(--accent-pink)]" />
                {squad?.venue_name || 'Trilogy Club'} • {squad?.start_date ? new Date(squad.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Sat 25 Jan'}
              </p>
            </div>

            {/* Stats row: Members & Earned so far cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* Members card */}
              <GlassCard className="p-4 flex flex-col items-start gap-1 border-white/5 text-left bg-gradient-to-br from-[var(--violet-primary)]/5 to-transparent">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Members</span>
                <span className="text-3xl font-display font-black text-white">
                  {members.filter(m => m.payment_status === 'paid').length} / {squad?.size || 10}
                </span>
              </GlassCard>

              {/* Earned so far card */}
              <GlassCard className="p-4 flex flex-col items-start gap-1 border-white/5 text-left bg-gradient-to-br from-emerald-500/5 to-transparent">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Earned so far</span>
                <span className="text-3xl font-display font-black text-[var(--violet-glow)]">
                  ₹{((members.filter(m => m.payment_status === 'paid').length * (squad?.entry_price || 1200)) * 0.85 / 1000).toFixed(1)}k
                </span>
              </GlassCard>
            </div>

            {/* Progress bar: Squad capacity */}
            <GlassCard className="p-4 border-white/5 space-y-2 text-left">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-300">
                <span>Squad capacity</span>
                <span>{members.filter(m => m.payment_status === 'paid').length} of {squad?.size || 10}</span>
              </div>
              <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="bg-gradient-to-r from-[var(--violet-bright)] to-[var(--accent-pink)] h-full transition-all duration-700" 
                  style={{ width: `${(members.filter(m => m.payment_status === 'paid').length / (squad?.size || 10)) * 100}%` }}
                />
              </div>
            </GlassCard>

            {/* Add Member manually via search or scanner */}
            <GlassCard className="p-4 border-white/5 space-y-3.5 text-left">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-[var(--violet-bright)] animate-pulse" />
                Add Members to Squad
              </span>

              <div className="flex gap-2">
                <input 
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Enter username (e.g. kabir, riya, aarav)"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[var(--violet-bright)] outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddByUsername}
                  className="px-4 py-2.5 bg-[var(--violet-primary)] hover:bg-[var(--violet-bright)] transition-colors text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Add
                </button>
              </div>

              {/* QR Code Scan simulation button */}
              <button
                type="button"
                onClick={() => setShowScannerModal(true)}
                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
                Scan Friend's QR Code
              </button>
            </GlassCard>

            {/* MEMBERS ROSTER LIST */}
            <div className="space-y-3.5 text-left">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Members</span>
              
              <div className="space-y-2.5">
                {members.map((m) => {
                  const isHost = m.id === squad?.organiser_id;
                  const mbInit = getHostInitials(m.full_name);
                  const isUserHost = user?.id === squad?.organiser_id;

                  return (
                    <GlassCard key={m.id} className="p-3.5 border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Circle Avatar badge */}
                        <div className="w-9 h-9 rounded-xl bg-[var(--violet-primary)]/10 border border-[var(--violet-bright)]/20 flex items-center justify-center font-display font-black text-xs text-white shrink-0">
                          {mbInit}
                        </div>
                        <div className="text-left leading-none">
                          <h4 className="text-xs font-black text-white">{m.full_name}</h4>
                          <span className="text-[8px] text-[var(--text-muted)] font-bold uppercase tracking-wider block mt-1.5">
                            {isHost ? 'Host' : 'Member'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {m.payment_status === 'paid' ? (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-lg">
                            Paid
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2.5 py-1 rounded-lg">
                              Pending
                            </span>
                            {isUserHost && (
                              <button 
                                onClick={() => handleNudgeMember(m.id)}
                                className="px-2 py-1 bg-green-600 hover:bg-green-500 border border-green-500 text-white rounded text-[8px] font-black uppercase tracking-widest cursor-pointer"
                              >
                                Nudge
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </GlassCard>
                  );
                })}

                {/* Empty spots invitation container */}
                {squad && members.length < squad.size && (
                  <div className="p-4 border border-dashed border-white/10 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl border border-dashed border-white/10 flex items-center justify-center text-slate-400 shrink-0">
                        +
                      </div>
                      <span className="text-xs font-extrabold text-slate-400">
                        {squad.size - members.length} spots available
                      </span>
                    </div>

                    <button 
                      onClick={() => copySquadLink(squad.id)}
                      className="px-3.5 py-2 bg-[var(--violet-primary)]/10 hover:bg-[var(--violet-primary)]/20 border border-[var(--violet-bright)]/20 text-[10px] font-black uppercase tracking-wider rounded-lg text-white transition-colors cursor-pointer"
                    >
                      Share
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ---------------- FIGMA SCREEN 4: INVITEE CHECKOUT ---------------- */}
        {activeView === 'invitee_checkout' && (
          <div className="space-y-6">
            
            {/* Header back */}
            <header className="flex justify-between items-center py-2">
              <button 
                onClick={() => navigate('/squads')}
                className="flex items-center gap-1 text-sm font-bold text-[var(--text-secondary)] hover:text-white transition-colors bg-transparent border-none cursor-pointer p-0"
              >
                <ChevronLeft className="w-5 h-5" /> Squads
              </button>
              <button className="relative w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all">
                <Share2 className="w-4 h-4" />
              </button>
            </header>

            {/* Status pill badge */}
            <div className="text-left">
              <span className="px-3 py-1 bg-[var(--violet-primary)]/10 border border-[var(--violet-bright)]/20 text-[10px] font-black uppercase tracking-wider text-[var(--violet-bright)] rounded-full">
                Squad • {squad ? squad.size - members.filter(m => m.payment_status === 'paid').length : 3} spots left
              </span>
            </div>

            {/* Roster Title Block */}
            <div className="text-left space-y-1">
              <h1 className="text-3xl font-display font-black text-white">{squad?.name || 'VIP Booth — Trilogy'}</h1>
              <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[var(--accent-pink)] shrink-0" />
                {squad?.venue_name || 'Trilogy Club'} • Bandra, Mumbai
              </p>
              
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-2 text-[10px] text-slate-300">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[var(--violet-bright)]" />
                  {squad?.start_date ? new Date(squad.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Sat 25 Jan'}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                  {squad?.start_date ? new Date(squad.start_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '11:00 PM'}
                </div>
                <div className="flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
                  {squad?.organiser_name || 'Rahul K'}
                </div>
              </div>
            </div>

            {/* Member avatar group stack */}
            <div className="flex items-center gap-3 text-left">
              <div className="flex -space-x-2.5">
                {members.slice(0, 4).map((m) => {
                  const mbInit = getHostInitials(m.full_name);
                  const isHost = m.id === squad?.organiser_id;
                  const bg = isHost ? 'bg-indigo-600/30 text-indigo-400' : 'bg-purple-600/30 text-purple-400';
                  return (
                    <div 
                      key={m.id} 
                      className={`w-7.5 h-7.5 rounded-xl border-2 border-[#13111F] flex items-center justify-center font-display font-black text-[9px] text-white shrink-0 ${bg}`}
                    >
                      {mbInit}
                    </div>
                  );
                })}
                {members.length > 4 && (
                  <div className="w-7.5 h-7.5 rounded-xl border-2 border-[#13111F] bg-slate-800 flex items-center justify-center font-display font-black text-[9px] text-slate-400 shrink-0">
                    +{members.length - 4}
                  </div>
                )}
              </div>
              <span className="text-[10px] font-bold text-[var(--text-secondary)]">
                {members.filter(m => m.payment_status === 'paid').length} / {squad?.size || 10} joined
              </span>
            </div>

            {/* Roster detail rows */}
            <div className="space-y-4 text-left">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block border-b border-white/5 pb-2">Details</span>
              
              {/* Row 1: Entry fee */}
              <div className="flex justify-between items-center py-1">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4.5 h-4.5 text-[var(--violet-bright)]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">Entry fee</h4>
                  </div>
                </div>
                <span className="text-sm font-extrabold text-white">
                  ₹{squad?.entry_price ? squad.entry_price.toLocaleString('en-IN') : '1,200'}
                </span>
              </div>

              {/* Row 2: Includes info */}
              <div className="flex justify-between items-center py-1">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                    <GlassWater className="w-4.5 h-4.5 text-[var(--accent-pink)]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">Includes</h4>
                    <p className="text-[9px] text-[var(--text-muted)] mt-1">Welcome drinks + table access</p>
                  </div>
                </div>
              </div>

              {/* Row 3: Secure Payment */}
              <div className="flex justify-between items-center py-1">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                    <Shield className="w-4.5 h-4.5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">Secure payment</h4>
                    <p className="text-[9px] text-[var(--text-muted)] mt-1">Held by vhop until event day</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bill checkout card */}
            {paymentComplete || (user && members.find(m => m.id === user.id)?.payment_status === 'paid') ? (
              <GlassCard className="p-8 text-center space-y-4 border border-emerald-500/40">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                  <Check className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">Payment Verified</h3>
                  <p className="text-[10px] text-[var(--text-muted)]">Spot locked! Your pass will generate when all spots are filled.</p>
                </div>
                <GlowButton onClick={() => navigate('/squads')} className="w-full py-3 text-xs">
                  Discover More Squads
                </GlowButton>
              </GlassCard>
            ) : (
              <GlassCard className="p-5 border-white/5 space-y-4 text-left">
                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Entry fee</span>
                    <span className="text-white font-bold">₹{squad?.entry_price ? squad.entry_price.toLocaleString('en-IN') : '1,200'}</span>
                  </div>
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>vhop convenience fee</span>
                    <span className="text-emerald-400 font-bold">₹0</span>
                  </div>
                  
                  <div className="h-px bg-white/5 my-1" />

                  <div className="flex justify-between text-sm font-black">
                    <span>Total</span>
                    <span className="text-[var(--accent-green)] font-display text-base">₹{squad?.entry_price ? squad.entry_price.toLocaleString('en-IN') : '1,200'}</span>
                  </div>
                </div>

                {/* Checkout CTA */}
                <GlowButton 
                  onClick={handleJoinSquadSlot}
                  disabled={isPaying}
                  className="w-full py-4 text-xs font-black uppercase tracking-wider text-center flex items-center justify-center gap-1.5"
                >
                  {isPaying ? (
                    <>Processing UPI Split...</>
                  ) : (
                    <>Pay & Join Squad</>
                  )}
                </GlowButton>
              </GlassCard>
            )}

          </div>
        )}

      </div>

      {/* ---------------- SCANNER MODAL (SIMULATOR OVERLAY) ---------------- */}
      {showScannerModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div 
            onClick={() => setShowScannerModal(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
          />
          <div className="relative w-full max-w-sm z-10">
            <GlassCard className="p-6 text-center space-y-5 border border-emerald-500/35 shadow-glow relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-3xl -z-10" />

              <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-full">
                QR Simulator Scanner
              </span>

              {/* simulated view finder */}
              <div className="relative w-40 h-40 border-2 border-emerald-500/35 rounded-2xl flex flex-col items-center justify-center bg-black/60 overflow-hidden mx-auto">
                <div className="absolute left-0 right-0 h-0.5 bg-emerald-400 opacity-60 shadow-[0_0_8px_#10b981] animate-bounce" style={{ top: '15%' }} />
                <Camera className="w-8 h-8 text-emerald-500/40 animate-pulse" />
                <span className="text-[8px] text-emerald-400/60 uppercase tracking-widest font-black mt-2">Simulated Camera Feed</span>
              </div>

              {/* simulator dropdown target list */}
              <div className="space-y-2 text-left">
                <label className="text-[9px] font-black text-amber-500 uppercase tracking-wider block text-center">Simulator: Choose friend QR to scan</label>
                <select 
                  value={selectedScannerUserId}
                  onChange={(e) => {
                    setSelectedScannerUserId(e.target.value);
                    if (e.target.value) {
                      handleScanQRUser(e.target.value);
                    }
                  }}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-emerald-500 outline-none cursor-pointer"
                >
                  <option value="">-- Choose User QR --</option>
                  {scannerUsersList.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name} (@{u.username})</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowScannerModal(false);
                  setSelectedScannerUserId('');
                }}
                className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors bg-transparent border-none cursor-pointer"
              >
                Close Camera
              </button>
            </GlassCard>
          </div>
        </div>
      )}

    </PageWrapper>
  );
};
