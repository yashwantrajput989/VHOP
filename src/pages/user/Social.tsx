import React, { useState, useEffect } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { FloatingOrb } from '../../components/ui/FloatingOrb';
import { GlassCard } from '../../components/ui/GlassCard';
import { 
  Users, 
  UserPlus, 
  Search, 
  Check, 
  Plus, 
  Sparkles, 
  QrCode,
  Camera,
  UserCheck,
  Send
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import { motion, AnimatePresence } from 'framer-motion';

interface FriendProfile {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  phone?: string;
  city?: string;
}

interface RegisterUser {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
}

interface OrganiserSquad {
  id: string;
  name: string;
  event_title: string;
  size: number;
}

export const Social: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'friends' | 'qr_scan'>('friends');
  
  // Data States
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [allUsers, setAllUsers] = useState<RegisterUser[]>([]);
  const [activeSquads, setActiveSquads] = useState<OrganiserSquad[]>([]);
  
  // Search & Modals
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RegisterUser[]>([]);
  const [scannedUser, setScannedUser] = useState<RegisterUser | null>(null);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [notification, setNotification] = useState('');

  // Fetch all initial data
  const fetchFriends = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/social/friends/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setFriends(data);
      }
    } catch (err) {
      console.error('Error fetching friends:', err);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users`);
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data.filter((u: any) => u.id !== user?.id));
      }
    } catch (err) {
      console.error('Error fetching registered users:', err);
    }
  };

  const fetchOrganiserSquads = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/squads/organiser/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveSquads(data);
      }
    } catch (err) {
      console.error('Error fetching organiser squads:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchAllUsers();
      fetchOrganiserSquads();
    }
  }, [user]);

  const showToast = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 4000);
  };

  // Search filter
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    // Filter users not already friends
    const filtered = allUsers.filter(u => {
      const match = u.full_name?.toLowerCase().includes(query.toLowerCase()) || 
                    u.username?.toLowerCase().includes(query.toLowerCase());
      const isAlreadyFriend = friends.some(f => f.id === u.id);
      return match && !isAlreadyFriend;
    });
    setSearchResults(filtered);
  };

  // Add Friend API
  const handleAddFriend = async (friendId: string, name: string) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/social/friends/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, friendId })
      });

      if (res.ok) {
        showToast(`Added ${name} to your friends list! 🤝`);
        await fetchFriends();
        setSearchQuery('');
        setSearchResults([]);
        if (scannedUser?.id === friendId) {
          setScannedUser(null);
          setShowScannerModal(false);
        }
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to add friend.');
      }
    } catch (err) {
      showToast('Error adding friend.');
    }
  };

  // Add Scanned User to active Squad
  const handleAddUserToSquad = async (squadId: string, squadName: string) => {
    if (!scannedUser) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/squads/${squadId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: scannedUser.id })
      });

      if (res.ok) {
        showToast(`Successfully added ${scannedUser.full_name} to "${squadName}"! 🕺🔥`);
        setScannedUser(null);
        setShowScannerModal(false);
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to add to squad.');
      }
    } catch (err) {
      showToast('Error adding to squad.');
    }
  };

  // Simulate scanning a user
  const handleSimulateScan = (userId: string) => {
    const selected = allUsers.find(u => u.id === userId);
    if (selected) {
      setScannedUser(selected);
      // Fetch squads again to make sure they are fresh
      fetchOrganiserSquads();
    }
  };

  return (
    <PageWrapper className="relative px-4 pb-24 overflow-x-hidden">
      {/* Dynamic Ambient Orbs */}
      <FloatingOrb className="top-1/4 -left-20 pointer-events-none" color="pink" size={300} />
      <FloatingOrb className="bottom-1/4 -right-20 pointer-events-none" color="violet" size={400} delay={1} />

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
          <h1 className="text-3xl font-display font-bold text-gradient">Social Alliance</h1>
          <p className="text-[var(--text-secondary)] text-sm max-w-sm mx-auto leading-relaxed">
            Form your nightlife alliance. Add friends, scan codes, and invite members directly to your booking squad!
          </p>
        </section>

        {/* Tab Controls */}
        <div className="grid grid-cols-2 bg-slate-900/60 p-1 border border-white/5 rounded-2xl">
          <button
            onClick={() => setActiveTab('friends')}
            className={`py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
              activeTab === 'friends'
                ? 'bg-[var(--violet-bright)] text-white shadow-glow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            My Friends
          </button>
          <button
            onClick={() => setActiveTab('qr_scan')}
            className={`py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
              activeTab === 'qr_scan'
                ? 'bg-[var(--violet-bright)] text-white shadow-glow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            My QR & Scanner
          </button>
        </div>

        {activeTab === 'friends' ? (
          <div className="space-y-6">
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
                    placeholder="Search users by name or username..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:border-[var(--violet-bright)] focus:ring-1 focus:ring-[var(--violet-bright)] outline-none transition-all text-sm text-white"
                  />
                </div>

                {/* Live Search Results */}
                {searchResults.length > 0 && (
                  <div className="bg-slate-950/80 border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
                    {searchResults.map((user) => (
                      <div key={user.id} className="p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} alt="" className="w-9 h-9 rounded-xl border border-white/10 bg-slate-900" />
                          <div>
                            <p className="text-xs font-bold text-white leading-none">{user.full_name}</p>
                            <p className="text-[10px] text-[var(--text-muted)] mt-1">@{user.username || 'user'}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleAddFriend(user.id, user.full_name)}
                          className="px-3 py-1.5 bg-[var(--violet-primary)] hover:bg-[var(--violet-bright)] text-white text-[10px] font-black rounded-lg transition-colors flex items-center gap-1 active:scale-95 cursor-pointer uppercase tracking-wider"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Friend
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </section>

            {/* Current Friends List */}
            <section className="space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Friends ({friends.length})</h3>
              {friends.length === 0 ? (
                <GlassCard className="p-6 text-center text-xs text-[var(--text-muted)] border-white/5">
                  No friends added yet. Share your username code to start recruiting your night-out alliance!
                </GlassCard>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {friends.map((friend) => (
                    <GlassCard key={friend.id} className="p-4 border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`} alt="" className="w-11 h-11 rounded-2xl border border-white/10 bg-slate-900" />
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-extrabold text-white leading-none">{friend.full_name}</p>
                            <span className="text-[9px] text-[var(--text-muted)]">@{friend.username}</span>
                          </div>
                          <p className="text-[10px] font-medium text-[var(--text-muted)] mt-1.5 flex items-center gap-1">
                            <span className="text-emerald-400 font-bold">{friend.city || 'Mumbai'} Resident</span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black uppercase bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-emerald-400">
                          Friend
                        </span>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tab 2: My QR Code & Scanner */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* My QR Code Card */}
              <GlassCard className="p-6 border-white/5 flex flex-col items-center text-center space-y-4">
                <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-[var(--violet-bright)]" />
                  <span>My QR Pass</span>
                </h3>
                
                {user && (
                  <>
                    <div className="p-3 bg-white rounded-2xl shadow-lg border border-slate-200">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(user.username || user.id)}`} 
                        alt="My Username QR Code" 
                        className="w-40 h-40"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-extrabold text-white">@{user.username || 'user'}</p>
                      <p className="text-[10px] text-[var(--text-secondary)]">Let others scan this QR to add you as a friend or add you to squads instantly.</p>
                    </div>
                  </>
                )}
              </GlassCard>

              {/* In-App Scanner Card */}
              <GlassCard className="p-6 border-white/5 flex flex-col items-center justify-between text-center space-y-4 relative overflow-hidden">
                <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>Scan Friend QR</span>
                </h3>

                {/* Simulated Scanner View Finder */}
                <div className="relative w-40 h-40 border-2 border-emerald-500/35 rounded-2xl flex flex-col items-center justify-center bg-black/60 overflow-hidden group">
                  {/* Neon scan animation laser */}
                  <div className="absolute left-0 right-0 h-0.5 bg-emerald-400 opacity-60 shadow-[0_0_8px_#10b981] animate-bounce" style={{ top: '10%' }} />
                  
                  <Camera className="w-8 h-8 text-emerald-500/40 animate-pulse" />
                  <span className="text-[8px] text-emerald-400/60 uppercase tracking-widest font-black mt-2">Active Camera feed</span>
                </div>

                {/* Simulated scan control drop-down */}
                <div className="w-full space-y-2">
                  <label className="text-[9px] font-black text-amber-500 uppercase tracking-wider block">Simulator: Choose profile to scan</label>
                  <select 
                    onChange={(e) => {
                      if (e.target.value) {
                        handleSimulateScan(e.target.value);
                        e.target.value = '';
                        setShowScannerModal(true);
                      }
                    }}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none cursor-pointer"
                  >
                    <option value="">-- Select Scanner Target --</option>
                    {allUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.full_name} (@{u.username})</option>
                    ))}
                  </select>
                </div>
              </GlassCard>
            </section>
          </div>
        )}

      </div>

      {/* Scanned Profile Actions Modal */}
      <AnimatePresence>
        {showScannerModal && scannedUser && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowScannerModal(false);
                setScannedUser(null);
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm z-10"
            >
              <GlassCard className="p-6 text-center space-y-6 border border-emerald-500/35 shadow-glow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-3xl -z-10" />

                <div className="space-y-2">
                  <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-full">
                    QR Scan Detected
                  </span>
                  
                  {/* Scanned user avatar and title */}
                  <div className="pt-4 flex flex-col items-center">
                    <img 
                      src={scannedUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${scannedUser.id}`} 
                      alt="" 
                      className="w-16 h-16 rounded-2xl border-2 border-emerald-500/20 bg-slate-900" 
                    />
                    <h3 className="text-xl font-display font-bold mt-3 text-white">{scannedUser.full_name}</h3>
                    <p className="text-xs text-[var(--text-muted)]">@{scannedUser.username}</p>
                  </div>
                </div>

                {/* Scanner Options */}
                <div className="space-y-3 pt-2">
                  {/* Add Friend CTA */}
                  {!friends.some(f => f.id === scannedUser.id) ? (
                    <button
                      onClick={() => handleAddFriend(scannedUser.id, scannedUser.full_name)}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                    >
                      <UserCheck className="w-4 h-4" /> Add as Friend
                    </button>
                  ) : (
                    <div className="w-full py-3.5 bg-slate-800/40 border border-slate-700/30 text-emerald-400 font-extrabold rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider">
                      <Check className="w-4 h-4" /> Already Friends
                    </div>
                  )}

                  {/* Add to Active Squad CTA */}
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Invite directly to active squad</label>
                    {activeSquads.length === 0 ? (
                      <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-[10px] text-[var(--text-muted)] text-center">
                        No active squads organized by you. Start a split payment booking on an event page first!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-1.5 max-h-[140px] overflow-y-auto">
                        {activeSquads.map((sq) => (
                          <div 
                            key={sq.id} 
                            onClick={() => handleAddUserToSquad(sq.id, sq.name)}
                            className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-emerald-500/20 cursor-pointer flex justify-between items-center transition-all group"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors truncate">{sq.name}</p>
                              <p className="text-[9px] text-[var(--text-muted)] mt-0.5 truncate">{sq.event_title}</p>
                            </div>
                            <Send className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 shrink-0 ml-2" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Close button */}
                  <button
                    onClick={() => {
                      setShowScannerModal(false);
                      setScannedUser(null);
                    }}
                    className="text-xs text-[var(--text-muted)] hover:text-white hover:underline transition-colors bg-transparent border-none cursor-pointer mt-2"
                  >
                    Close & Ignore Scan
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </PageWrapper>
  );
};
