import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowButton } from '../../components/ui/GlowButton';
import { FloatingOrb } from '../../components/ui/FloatingOrb';
import { 
  Users, 
  MapPin, 
  Plus, 
  Bell, 
  ArrowRight
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useLocationStore } from '../../store/locationStore';
import { API_BASE_URL } from '../../config';

interface SquadMember {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  payment_status: string;
}

interface Squad {
  id: string;
  event_id: string;
  name: string;
  organiser_id: string;
  size: number;
  tier: string;
  entry_price: number;
  anyone_can_join: boolean;
  require_approval: boolean;
  status: string;
  created_at: string;
  event_title: string;
  venue_name: string;
  start_date: string;
  cover_image: string;
  organiser_name: string;
  members: SquadMember[];
}

export const SquadsFeed: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { city } = useLocationStore();
  
  const [activeTab, setActiveTab] = useState<'open' | 'joined' | 'hosting'>('open');
  const [squads, setSquads] = useState<Squad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const activeCity = city || 'Mumbai';

  const fetchSquads = async () => {
    setIsLoading(true);
    setError('');
    try {
      let url = `${API_BASE_URL}/api/squads?city=${encodeURIComponent(activeCity)}&tab=${activeTab}`;
      if (user) {
        url += `&userId=${encodeURIComponent(user.id)}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to retrieve squads.');
      const data = await res.json();
      setSquads(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error loading squads.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSquads();
  }, [activeTab, activeCity, user?.id]);

  const getHostInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Helper to color the initials badge
  const getInitialsBg = (initials: string) => {
    const code = initials.charCodeAt(0) + (initials.charCodeAt(1) || 0);
    const colors = [
      'bg-indigo-600/30 text-indigo-400 border-indigo-500/30',
      'bg-purple-600/30 text-purple-400 border-purple-500/30',
      'bg-pink-600/30 text-pink-400 border-pink-500/30',
      'bg-emerald-600/30 text-emerald-400 border-emerald-500/30',
      'bg-cyan-600/30 text-cyan-400 border-cyan-500/30',
      'bg-amber-600/30 text-amber-400 border-amber-500/30'
    ];
    return colors[code % colors.length];
  };

  return (
    <PageWrapper className="relative px-4 pb-24 overflow-x-hidden">
      {/* Floating Cyber Ambient Orbs */}
      <FloatingOrb className="top-1/4 -left-20 pointer-events-none" color="violet" size={300} />
      <FloatingOrb className="bottom-1/4 -right-20 pointer-events-none" color="pink" size={400} delay={1.5} />

      <div className="max-w-xl mx-auto space-y-6 relative z-10">
        
        {/* Top Header Block */}
        <header className="flex justify-between items-start pt-4">
          <div className="space-y-0.5 text-left">
            <span className="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)]">
              Tonight in {activeCity}
            </span>
            <h1 className="text-3xl font-display font-black text-white flex items-center gap-2">
              Squads <span className="text-gradient">🔥</span>
            </h1>
          </div>
          
          <div className="flex gap-2">
            {/* Friends list & scanner shortcut */}
            <button 
              onClick={() => navigate('/social')}
              className="relative w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--violet-bright)] active:scale-95 transition-all hover:bg-white/10"
              title="Friends & Scanner"
            >
              <Users className="w-5 h-5" />
            </button>
            
            {/* Notification bell */}
            <button className="relative w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all hover:bg-white/10">
              <Bell className="w-4 h-4" />
              <span className="absolute top-3.5 right-3.5 w-1.5 h-1.5 rounded-full bg-[var(--violet-bright)]" />
            </button>
          </div>
        </header>

        {/* Tab Controls */}
        <div className="grid grid-cols-3 bg-slate-900/60 p-1 border border-white/5 rounded-2xl">
          {(['open', 'joined', 'hosting'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                activeTab === tab
                  ? 'bg-[var(--violet-primary)] text-white shadow-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Create Squad CTA Box */}
        <GlassCard className="p-4 border-white/5 flex items-center justify-between bg-gradient-to-r from-[var(--violet-primary)]/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--violet-primary)]/20 flex items-center justify-center shrink-0 border border-[var(--violet-bright)]/30">
              <Plus className="w-5 h-5 text-[var(--violet-bright)]" />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-bold text-white">Create a New Squad</h4>
              <p className="text-[10px] text-[var(--text-muted)]">Split ticket pricing with friends</p>
            </div>
          </div>
          <GlowButton 
            onClick={() => navigate('/squad/new')} 
            className="px-3.5 py-2 text-[10px] font-black uppercase tracking-wider shrink-0"
          >
            Create
          </GlowButton>
        </GlassCard>

        {/* List of Squad Cards */}
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--violet-bright)]"></div>
          </div>
        ) : error ? (
          <GlassCard className="p-8 text-center text-red-400 text-xs border-red-500/10">
            {error}
          </GlassCard>
        ) : squads.length === 0 ? (
          <GlassCard className="p-10 text-center space-y-4 border-dashed border-white/10">
            <Users className="w-10 h-10 text-[var(--text-muted)] mx-auto animate-pulse" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">No Squads Found</h4>
              <p className="text-xs text-[var(--text-muted)]">
                {activeTab === 'open' 
                  ? 'Be the first one to start a squad for tonight!'
                  : activeTab === 'joined'
                    ? "You haven't joined any booking squads yet."
                    : "You aren't hosting any active squads."}
              </p>
            </div>
            {activeTab === 'open' && (
              <GlowButton onClick={() => navigate('/events')} className="mx-auto text-xs py-2.5 px-6">
                Browse Events to Book
              </GlowButton>
            )}
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {squads.map((squad) => {
              const paidMembers = squad.members.filter(m => m.payment_status === 'paid');
              const spotsLeft = squad.size - paidMembers.length;
              const initials = getHostInitials(squad.organiser_name);
              const initialsBg = getInitialsBg(initials);
              const formattedDate = new Date(squad.start_date).toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short'
              });
              const formattedTime = new Date(squad.start_date).toLocaleTimeString('en-IN', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }).toUpperCase();

              return (
                <GlassCard 
                  key={squad.id} 
                  className="p-5 border-white/5 space-y-4 text-left relative overflow-hidden group hover:border-[var(--violet-bright)]/30 hover:shadow-[0_0_20px_rgba(139,92,246,0.1)] transition-all duration-300"
                >
                  {/* Row 1: Header (Host initials, Title, spots left) */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex gap-3 items-center min-w-0">
                      {/* Initials Badge */}
                      <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center font-display font-black text-sm shrink-0 shadow-sm ${initialsBg}`}>
                        {initials}
                      </div>
                      
                      <div className="min-w-0 text-left">
                        <h3 className="text-base font-extrabold text-white group-hover:text-[var(--violet-glow)] transition-colors truncate">
                          {squad.name}
                        </h3>
                        <p className="text-[10px] text-[var(--text-muted)] mt-1 flex items-center gap-1.5 truncate">
                          <MapPin className="w-3 h-3 text-[var(--accent-pink)] shrink-0" /> 
                          {squad.venue_name} • {formattedDate} • {formattedTime}
                        </p>
                      </div>
                    </div>

                    {/* Spots left Badge */}
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 ${
                      spotsLeft <= 3 
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {spotsLeft} left
                    </span>
                  </div>

                  {/* Row 2: Member avatar pile and joined text */}
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2.5">
                      {paidMembers.slice(0, 3).map((m) => {
                        const memberInitials = getHostInitials(m.full_name);
                        const mbColor = getInitialsBg(memberInitials);
                        return (
                          <div 
                            key={m.id} 
                            className={`w-7 h-7 rounded-xl border-2 border-[#13111F] flex items-center justify-center font-display font-black text-[9px] ${mbColor} shrink-0`}
                          >
                            {memberInitials}
                          </div>
                        );
                      })}
                      {paidMembers.length > 3 && (
                        <div className="w-7 h-7 rounded-xl border-2 border-[#13111F] bg-slate-800 flex items-center justify-center font-display font-black text-[9px] text-slate-400 shrink-0">
                          +{paidMembers.length - 3}
                        </div>
                      )}
                    </div>
                    
                    <span className="text-[10px] font-bold text-[var(--text-secondary)]">
                      {squad.organiser_name} {paidMembers.length > 1 ? `+ ${paidMembers.length - 1} joined` : 'joined'}
                    </span>
                  </div>

                  {/* Divider line */}
                  <div className="h-px bg-white/5" />

                  {/* Row 3: Price & Join Button */}
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-display font-black text-lg text-white">
                        ₹{squad.entry_price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mt-0.5">
                        per person
                      </span>
                    </div>

                    <GlowButton 
                      onClick={() => navigate(`/squad/${squad.id}`)}
                      className="px-5 py-2.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                    >
                      {user && squad.organiser_id === user.id ? 'Manage' : 'Join Squad'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </GlowButton>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}

      </div>
    </PageWrapper>
  );
};
