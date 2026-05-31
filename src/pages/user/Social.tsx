import React, { useState, useEffect } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { FloatingOrb } from '../../components/ui/FloatingOrb';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowButton } from '../../components/ui/GlowButton';
import { 
  Users, 
  UserPlus, 
  Search, 
  Check, 
  Clock, 
  Plus, 
  Zap, 
  Calendar, 
  Sparkles, 
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { API_BASE_URL } from '../../config';
import { motion, AnimatePresence } from 'framer-motion';

interface SquadMember {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  status: 'online' | 'offline' | 'clubbing';
  location?: string;
}

interface SquadInvite {
  id: string;
  memberName: string;
  eventTitle: string;
  status: 'pending' | 'accepted' | 'declined';
  time: string;
}

interface EventMock {
  id: string;
  title: string;
  city: string;
}

export const Social: React.FC = () => {
  
  // Squad State
  const [squad, setSquad] = useState<SquadMember[]>([
    { id: 'sm_1', name: 'Kabir Sharma', username: 'kabir', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kabir', status: 'online' },
    { id: 'sm_2', name: 'Riya Sen', username: 'riya', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=riya', status: 'clubbing', location: 'Cyberpunk Rave' },
    { id: 'sm_3', name: 'Aarav Rajput', username: 'aarav', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aarav', status: 'offline' }
  ]);

  // Invites State
  const [invites, setInvites] = useState<SquadInvite[]>([
    { id: 'inv_1', memberName: 'Kabir Sharma', eventTitle: 'Cyberpunk Rooftop Rave', status: 'accepted', time: '1 hour ago' },
    { id: 'inv_2', memberName: 'Riya Sen', eventTitle: 'Bollywood Retro Night', status: 'pending', time: 'Just now' }
  ]);

  // Search & Forms
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SquadMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [events, setEvents] = useState<EventMock[]>([]);
  const [notification, setNotification] = useState<string>('');

  // Fetch events on mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/events`);
        if (response.ok) {
          const data = await response.json();
          // Filter only published events
          const published = data.filter((e: any) => e.status === 'published');
          setEvents(published.map((e: any) => ({ id: e.id, title: e.title, city: e.city })));
          if (published.length > 0) setSelectedEvent(published[0].title);
        } else {
          // Fallbacks
          setEvents([
            { id: 'ev1', title: 'Cyberpunk Rooftop Rave', city: 'Mumbai' },
            { id: 'ev2', title: 'Bollywood Retro Night', city: 'Visakhapatnam' },
            { id: 'ev3', title: 'Telugu Rock Symphony', city: 'Hyderabad' }
          ]);
          setSelectedEvent('Cyberpunk Rooftop Rave');
        }
      } catch (err) {
        setEvents([
          { id: 'ev1', title: 'Cyberpunk Rooftop Rave', city: 'Mumbai' },
          { id: 'ev2', title: 'Bollywood Retro Night', city: 'Visakhapatnam' },
          { id: 'ev3', title: 'Telugu Rock Symphony', city: 'Hyderabad' }
        ]);
        setSelectedEvent('Cyberpunk Rooftop Rave');
      }
    };
    fetchEvents();
  }, []);

  // Pre-fill first squad member on mount
  useEffect(() => {
    if (squad.length > 0 && !selectedMember) {
      setSelectedMember(squad[0].id);
    }
  }, [squad, selectedMember]);

  // Search Simulator
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const availableMockUsers: SquadMember[] = [
      { id: 'u_sm4', name: 'Vikram Malhotra', username: 'vikram_m', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vikram', status: 'offline' },
      { id: 'u_sm5', name: 'Ananya Verma', username: 'ananya', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ananya', status: 'online' },
      { id: 'u_sm6', name: 'Rohan Mehta', username: 'rohan', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rohan', status: 'online' }
    ];

    const results = availableMockUsers.filter(u => 
      u.name.toLowerCase().includes(query.toLowerCase()) || 
      u.username.toLowerCase().includes(query.toLowerCase())
    ).filter(u => !squad.find(s => s.id === u.id));

    setSearchResults(results);
  };

  const handleAddFriend = (friend: SquadMember) => {
    setSquad(prev => [...prev, friend]);
    setSearchResults(prev => prev.filter(p => p.id !== friend.id));
    setSearchQuery('');
    showToast(`Added ${friend.name} to your squad! 🤝`);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !selectedEvent) return;

    const member = squad.find(s => s.id === selectedMember);
    if (!member) return;

    const newInviteId = `inv_${Date.now()}`;
    const newInvite: SquadInvite = {
      id: newInviteId,
      memberName: member.name,
      eventTitle: selectedEvent,
      status: 'pending',
      time: 'Just now'
    };

    setInvites(prev => [newInvite, ...prev]);
    showToast(`Invitation sent to ${member.name}! 🚀`);

    // Simulate friend accepting invite after 2.5 seconds
    setTimeout(() => {
      setInvites(prev => prev.map(inv => 
        inv.id === newInviteId ? { ...inv, status: 'accepted' } : inv
      ));
      showToast(`${member.name} accepted your invite for ${selectedEvent}! 🕺🎉`);
    }, 2500);
  };

  const showToast = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 4000);
  };

  return (
    <PageWrapper className="relative px-4 pb-24 overflow-x-hidden">
      {/* Dynamic Ambient Orbs */}
      <FloatingOrb className="top-1/4 -left-20 pointer-events-none" color="pink" size={300} />
      <FloatingOrb className="bottom-1/4 -right-20 pointer-events-none" color="violet" size={400} delay={1} />
      <FloatingOrb className="top-0 right-10 pointer-events-none" color="cyan" size={250} delay={2} />

      <div className="max-w-xl mx-auto space-y-6 relative z-10">
        
        {/* Real-time Toast Notifications */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="p-4 bg-[var(--violet-primary)]/90 border border-[var(--violet-bright)]/40 rounded-2xl text-xs text-white flex items-center gap-3 backdrop-blur-xl shadow-glow"
            >
              <Sparkles className="w-5 h-5 text-[var(--accent-gold)] shrink-0 animate-bounce" />
              <span className="font-semibold leading-normal">{notification}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Squad Title Header */}
        <section className="text-center space-y-2 py-4">
          <div className="w-16 h-16 bg-[var(--violet-primary)]/10 border border-[var(--violet-bright)]/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <Users className="w-8 h-8 text-[var(--violet-bright)]" />
          </div>
          <h1 className="text-3xl font-display font-bold text-gradient">My Squad</h1>
          <p className="text-[var(--text-secondary)] text-sm max-w-sm mx-auto leading-relaxed">
            Form your nightlife alliance. Invite your squad members to join you for upcoming premium gigs!
          </p>
        </section>

        {/* Search & Add Friends Card */}
        <section>
          <GlassCard className="p-5 border-white/5 space-y-4">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[var(--violet-bright)]" />
              <span>Recruit Allies</span>
            </h3>
            
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-muted)]" />
              <input 
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search friends by name or username..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:border-[var(--violet-bright)] focus:ring-1 focus:ring-[var(--violet-bright)] outline-none transition-all text-sm text-white"
              />
            </div>

            {/* Live Search Results */}
            {searchResults.length > 0 && (
              <div className="bg-slate-950/80 border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
                {searchResults.map((friend) => (
                  <div key={friend.id} className="p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img src={friend.avatarUrl} alt="" className="w-9 h-9 rounded-xl border border-white/10 bg-slate-900" />
                      <div>
                        <p className="text-xs font-bold text-white leading-none">{friend.name}</p>
                        <p className="text-[10px] text-[var(--text-muted)] mt-1">@{friend.username}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleAddFriend(friend)}
                      className="px-3 py-1.5 bg-[var(--violet-primary)] hover:bg-[var(--violet-bright)] text-white text-[10px] font-black rounded-lg transition-colors flex items-center gap-1 active:scale-95 cursor-pointer uppercase tracking-wider"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </section>

        {/* Current Squad Members List */}
        <section className="space-y-3">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Squad Members</h3>
          <div className="grid grid-cols-1 gap-2.5">
            {squad.map((member) => (
              <GlassCard key={member.id} className="p-4 border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img src={member.avatarUrl} alt="" className="w-11 h-11 rounded-2xl border border-white/10 bg-slate-900" />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 ${
                      member.status === 'online' 
                        ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' 
                        : member.status === 'clubbing'
                        ? 'bg-pink-500 shadow-[0_0_8px_#ec4899] animate-pulse'
                        : 'bg-slate-500'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-extrabold text-white leading-none">{member.name}</p>
                      <span className="text-[9px] text-[var(--text-muted)]">@{member.username}</span>
                    </div>
                    <p className="text-[10px] font-medium text-[var(--text-muted)] mt-1.5 flex items-center gap-1">
                      {member.status === 'online' && <span className="text-emerald-400 font-bold">Online & Ready</span>}
                      {member.status === 'offline' && <span>Offline</span>}
                      {member.status === 'clubbing' && (
                        <span className="text-pink-400 font-black flex items-center gap-1">
                          <Zap className="w-3 h-3 fill-pink-400/20" /> Clubbing @ {member.location}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg text-slate-400">
                    Squad
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Plan a Night: Invite Form Card */}
        <section>
          <GlassCard className="p-6 border-white/5 space-y-4">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Plan a Night Out</span>
            </h3>

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Select Squad Member</label>
                <select 
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-[var(--violet-bright)] outline-none"
                >
                  {squad.map(member => (
                    <option key={member.id} value={member.id}>{member.name} (@{member.username})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Select Nightlife Event</label>
                <select 
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-[var(--violet-bright)] outline-none"
                >
                  {events.map(ev => (
                    <option key={ev.id} value={ev.title}>{ev.title} ({ev.city})</option>
                  ))}
                </select>
              </div>

              <GlowButton type="submit" className="w-full py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2">
                Send Squad Invitation <ArrowRight className="w-4 h-4" />
              </GlowButton>
            </form>
          </GlassCard>
        </section>

        {/* Sent Invites list */}
        <section className="space-y-3">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Join Invitations</h3>
          
          <div className="bg-slate-900/65 border border-white/5 rounded-[2rem] p-5 backdrop-blur-xl space-y-3.5 shadow-lg">
            {invites.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] text-center py-4">No active join invites sent yet.</p>
            ) : (
              invites.map((inv) => (
                <div key={inv.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--violet-primary)]/10 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-4 h-4 text-[var(--violet-bright)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white leading-snug">
                        {inv.memberName}
                      </p>
                      <p className="text-[9px] text-[var(--text-secondary)] mt-0.5 truncate max-w-[190px]">
                        Event: {inv.eventTitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[8px] text-[var(--text-muted)]">{inv.time}</span>
                    {inv.status === 'pending' ? (
                      <div className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px] font-black rounded-lg flex items-center gap-1 uppercase tracking-wider">
                        <Clock className="w-2.5 h-2.5 animate-spin" /> Pending
                      </div>
                    ) : (
                      <div className="px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[8px] font-black rounded-lg flex items-center gap-1 uppercase tracking-wider shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                        <Check className="w-2.5 h-2.5" /> Joined
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </div>
    </PageWrapper>
  );
};
