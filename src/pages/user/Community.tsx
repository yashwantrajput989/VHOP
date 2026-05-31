import React, { useState, useEffect, useRef } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { FloatingOrb } from '../../components/ui/FloatingOrb';
import { GlassCard } from '../../components/ui/GlassCard';
import { 
  MessageSquare, 
  Search, 
  Send, 
  Users
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface ChatMessage {
  id: string;
  senderName: string;
  senderAvatar: string;
  message: string;
  timestamp: string;
  isMe: boolean;
}

interface CommunityChannel {
  id: string;
  name: string;
  description: string;
  category: 'edm' | 'bollywood' | 'jazz' | 'telugu' | 'live' | 'hiphop';
  icon: string;
  memberCount: number;
  initialMessages: ChatMessage[];
  botReplies: string[];
}

export const Community: React.FC = () => {
  const { user } = useAuthStore();
  
  // Channels Config
  const channels: CommunityChannel[] = [
    {
      id: 'ch_bollywood',
      name: 'Bollywood Beats 💃',
      description: 'The ultimate hub for retro remixes, commercial hits, and high-energy desi nights.',
      category: 'bollywood',
      icon: '🔥',
      memberCount: 1420,
      initialMessages: [
        { id: 'm1_1', senderName: 'Rahul Joshi', senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rahul', message: 'Guys, who is going to the Retro Bollywood bash next Saturday?', timestamp: '8:15 PM', isMe: false },
        { id: 'm1_2', senderName: 'Priya Patel', senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya', message: 'Me! I already booked my early bird pass. The cover charge is fully redeemable! 😍', timestamp: '8:16 PM', isMe: false },
        { id: 'm1_3', senderName: 'Amit Sharma', senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=amit', message: 'Desi beats hit different when the bass drops. Absolutely ready!', timestamp: '8:18 PM', isMe: false }
      ],
      botReplies: [
        "OMG yes! Can't wait to dance on the table tonight! 💃🔥",
        "The DJ announced they are spinning retro 90s remixes tonight! Let's go!",
        "Bollywood tracks at VHOP events are pure vibe. Who wants to pool a ride?",
        "Don't forget to get your V-Coins cashback on passes! 🪙✨"
      ]
    },
    {
      id: 'ch_edm',
      name: 'EDM & Techno Rave 🎧',
      description: 'Progressive house, underground techno, and neon rooftops.',
      category: 'edm',
      icon: '⚡',
      memberCount: 2850,
      initialMessages: [
        { id: 'm2_1', senderName: 'Vikram Malhotra', senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vikram', message: 'That rooftop techno rave last week was insane! The lasers were out of this world.', timestamp: '7:30 PM', isMe: false },
        { id: 'm2_2', senderName: 'Rohan Mehta', senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rohan', message: 'True! Anjunadeep style progressive is exactly what the city needed.', timestamp: '7:32 PM', isMe: false },
        { id: 'm2_3', senderName: 'Nisha Sen', senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nisha', message: 'Heard there is a secret warehouse set announced soon. Keep eyes on VHOP!', timestamp: '7:35 PM', isMe: false }
      ],
      botReplies: [
        "Yes! The sub-bass is gonna be absolutely heavy tonight! Rooftop rave is calling! 🔊🎧",
        "Vibe is looking incredible. I'm arriving around 9:30 PM. Meet near the main deck!",
        "Warehouse techno vibes are unmatched. VHOP tickets booked! ⚡",
        "If you see me on the dancefloor, come say hi! 🕺🏽✨"
      ]
    },
    {
      id: 'ch_telugu',
      name: 'Telugu Melodies 🎶',
      description: 'Tollywood rock, live band unplugged, and chart-topping regional melodies.',
      category: 'telugu',
      icon: '🎶',
      memberCount: 1980,
      initialMessages: [
        { id: 'm3_1', senderName: 'Karthik Rao', senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=karthik', message: 'Capricio band playing this Friday? Immediate booking!', timestamp: '6:02 PM', isMe: false },
        { id: 'm3_2', senderName: 'Harika Reddy', senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=harika', message: 'Their acoustic medley is absolute magic. Telugu rock bands hit differently.', timestamp: '6:05 PM', isMe: false },
        { id: 'm3_3', senderName: 'Suresh Varma', senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=suresh', message: 'Already 80% sold out! Grab passes on the events page asap.', timestamp: '6:08 PM', isMe: false }
      ],
      botReplies: [
        "Sid Sriram's melodies unplugged hit directly in the feels! 🎶❤️",
        "Tollywood rock bands at VHOP venues are consistently top-tier.",
        "Just booked my VIP pass! The Capitall is going to be packed this Friday!",
        "Acoustic sets, cold brew, and local tracks... Friday night sorted!"
      ]
    },
    {
      id: 'ch_jazz',
      name: 'Jazz & Wine 🎷',
      description: 'Intimate lounge bars, vintage brass bands, and sophisticated lounge nights.',
      category: 'jazz',
      icon: '🍷',
      memberCount: 850,
      initialMessages: [
        { id: 'm4_1', senderName: 'Nikhil Menon', senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nikhil', message: 'Looking for a chill lounge vibe tonight. Any recommendations?', timestamp: '4:10 PM', isMe: false },
        { id: 'm4_2', senderName: 'Aishwarya Roy', senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aishwarya', message: 'The jazz quartet at The Sommelier lounge is outstanding. Very classy.', timestamp: '4:12 PM', isMe: false }
      ],
      botReplies: [
        "A perfect glass of Merlot with smooth saxophone riffs... ultimate bliss. 🎷🍷",
        "It's the perfect mid-week detox. The brass quartet starts at 8:00 PM.",
        "Vintage blues and ambient lights are unmatched.",
        "Highly recommend reserving a table early!"
      ]
    },
    {
      id: 'ch_live',
      name: 'Live Bands & Rock 🎸',
      description: 'Indie rock bands, retro pop covers, and electric guitar sets.',
      category: 'live',
      icon: '🎸',
      memberCount: 1640,
      initialMessages: [
        { id: 'm5_1', senderName: 'Kabir Sharma', senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kabir', message: 'Local indie bands are absolutely crushing it recently.', timestamp: '3:05 PM', isMe: false },
        { id: 'm5_2', senderName: 'Aarav Rajput', senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aarav', message: 'Yes! Rock cover nights have the best crowd. Everyone just sings along.', timestamp: '3:10 PM', isMe: false }
      ],
      botReplies: [
        "Nothing beats the raw energy of electric guitars and live drums! 🎸⚡",
        "Everyone singing the chorus of Yellow by Coldplay together... goosebumps!",
        "Indie rock shows on VHOP are always packed. Going with my squad!",
        "Make sure to add your crew to squad for fast check-in!"
      ]
    }
  ];

  // Active Chat State
  const [activeChannelId, setActiveChannelId] = useState<string>('ch_bollywood');
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({
    ch_bollywood: channels[0].initialMessages,
    ch_edm: channels[1].initialMessages,
    ch_telugu: channels[2].initialMessages,
    ch_jazz: channels[3].initialMessages,
    ch_live: channels[4].initialMessages
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [inputValue, setInputValue] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto Scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannelId]);

  const activeChannel = channels.find(c => c.id === activeChannelId) || channels[0];

  // Keyword Categories
  const categories = [
    { id: 'all', label: 'All Vibe' },
    { id: 'edm', label: '#EDM / Techno' },
    { id: 'bollywood', label: '#Bollywood' },
    { id: 'telugu', label: '#Telugu' },
    { id: 'jazz', label: '#Jazz' },
    { id: 'live', label: '#LiveRock' }
  ];

  // Filter Channels
  const filteredChannels = channels.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || c.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Handle Send Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userProfilePic = user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'me'}`;
    const myMsg: ChatMessage = {
      id: `my_${Date.now()}`,
      senderName: user?.full_name || 'Me',
      senderAvatar: userProfilePic,
      message: inputValue,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    };

    // Update active channel's message list
    setMessages(prev => ({
      ...prev,
      [activeChannelId]: [...(prev[activeChannelId] || []), myMsg]
    }));
    
    setInputValue('');

    // Trigger mock bot reply after 1.2 seconds
    setTimeout(() => {
      const botNames = ['Kabir', 'Riya', 'Aarav', 'Rahul', 'Nisha', 'Karthik', 'Aishwarya'];
      const randomName = botNames[Math.floor(Math.random() * botNames.length)];
      const randomAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomName}`;
      
      const availableReplies = activeChannel.botReplies;
      const botText = availableReplies[Math.floor(Math.random() * availableReplies.length)];

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        senderName: randomName,
        senderAvatar: randomAvatar,
        message: botText,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        isMe: false
      };

      setMessages(prev => ({
        ...prev,
        [activeChannelId]: [...(prev[activeChannelId] || []), botMsg]
      }));
    }, 1200);
  };

  return (
    <PageWrapper className="relative px-4 pb-24 overflow-x-hidden">
      {/* Ambient Visual Orbs */}
      <FloatingOrb className="top-1/10 -right-20 pointer-events-none" color="cyan" size={400} />
      <FloatingOrb className="bottom-1/10 -left-20 pointer-events-none" color="violet" size={450} delay={1.5} />

      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        
        {/* Header Block */}
        <section className="text-center space-y-2 py-2">
          <div className="w-14 h-14 bg-[var(--violet-primary)]/10 border border-[var(--violet-bright)]/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <MessageSquare className="w-7 h-7 text-[var(--violet-bright)]" />
          </div>
          <h1 className="text-3xl font-display font-bold text-gradient">Nightlife Tribe</h1>
          <p className="text-[var(--text-secondary)] text-sm max-w-md mx-auto leading-relaxed">
            Connect with other nightlife enthusiasts. Select a category chatroom below to start vibing!
          </p>
        </section>

        {/* Filters and search at top */}
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tribes or genre keywords..."
                className="w-full bg-slate-900/65 border border-white/10 rounded-2xl pl-12 pr-4 py-3 focus:border-[var(--violet-bright)] outline-none text-sm text-white transition-all placeholder:text-[var(--text-muted)]"
              />
            </div>
            
            {/* Category Tags scrollable list */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all shrink-0 snap-start active:scale-95 border cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-[var(--violet-primary)] border-[var(--violet-bright)] text-white shadow-glow'
                      : 'bg-slate-900/65 border-white/5 text-[var(--text-muted)] hover:border-white/10 hover:text-slate-300'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Two Pane Chatroom Workspace */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-5 min-h-[60vh] items-stretch">
          
          {/* Left Pane: Communities Channels List (4 Cols) */}
          <div className="md:col-span-5 space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Active Tribes ({filteredChannels.length})</h3>
            <div className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none">
              {filteredChannels.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] p-4 w-full text-center bg-slate-900/40 border border-white/5 rounded-2rem">No active tribes found.</p>
              ) : (
                filteredChannels.map((ch) => {
                  const isActive = ch.id === activeChannelId;
                  const recentMsg = messages[ch.id]?.[messages[ch.id].length - 1];

                  return (
                    <GlassCard 
                      key={ch.id}
                      onClick={() => setActiveChannelId(ch.id)}
                      className={`p-4 cursor-pointer hover:bg-white/[0.04] transition-all border shrink-0 w-72 md:w-full select-none ${
                        isActive 
                          ? 'border-[var(--violet-bright)]/45 bg-[var(--violet-primary)]/10 shadow-[0_0_20px_rgba(139,92,246,0.1)]' 
                          : 'border-white/5 bg-slate-900/50'
                      }`}
                    >
                      <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center text-lg shrink-0">
                          {ch.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center gap-1">
                            <h4 className="font-extrabold text-sm text-white truncate leading-none">{ch.name}</h4>
                            <span className="text-[8px] bg-white/5 text-[var(--text-muted)] px-1.5 py-0.5 rounded font-black shrink-0 uppercase tracking-wider flex items-center gap-0.5">
                              <Users className="w-2 h-2 text-[var(--violet-bright)]" /> {ch.memberCount}
                            </span>
                          </div>
                          <p className="text-[10px] text-[var(--text-muted)] truncate mt-1.5">
                            {recentMsg ? `Recent: ${recentMsg.message}` : ch.description}
                          </p>
                        </div>
                      </div>
                    </GlassCard>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Pane: Live Chat Interface (7 Cols) */}
          <div className="md:col-span-7 flex flex-col">
            <GlassCard className="flex-1 border-white/5 overflow-hidden flex flex-col bg-slate-900/35 relative h-[50vh] md:h-[65vh]">
              
              {/* Chatroom Header */}
              <div className="p-4.5 bg-slate-950/80 border-b border-white/5 backdrop-blur-xl flex justify-between items-center z-10 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[var(--violet-primary)]/10 border border-[var(--violet-bright)]/20 flex items-center justify-center text-base shrink-0">
                    {activeChannel.icon}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-sm text-white truncate leading-none">{activeChannel.name}</h4>
                    <p className="text-[9px] text-[var(--text-muted)] truncate mt-1.5 font-medium">{activeChannel.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[9px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-xl shrink-0 uppercase tracking-wider shadow-sm select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>Live Vibe</span>
                </div>
              </div>

              {/* Chat Messages Feed Container */}
              <div className="flex-1 overflow-y-auto p-4.5 space-y-4 custom-scrollbar bg-black/10">
                {(messages[activeChannelId] || []).map((msg) => {
                  return (
                    <div 
                      key={msg.id}
                      className={`flex gap-3 max-w-[85%] ${msg.isMe ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                      {/* Avatar */}
                      <img 
                        src={msg.senderAvatar} 
                        alt="" 
                        className="w-8.5 h-8.5 rounded-xl border border-white/10 shrink-0 bg-slate-950 object-cover" 
                      />
                      
                      {/* Message Bubble */}
                      <div className="space-y-1">
                        {/* Sender details */}
                        <div className={`flex items-center gap-1.5 text-[9px] font-bold ${msg.isMe ? 'justify-end text-[var(--violet-bright)]' : 'text-slate-300'}`}>
                          <span>{msg.senderName}</span>
                          <span className="text-[8px] text-[var(--text-muted)] font-normal">• {msg.timestamp}</span>
                        </div>
                        
                        {/* Text card */}
                        <div className={`px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                          msg.isMe 
                            ? 'bg-[var(--violet-primary)] text-white rounded-tr-none border border-[var(--violet-bright)]/30 shadow-glow' 
                            : 'bg-white/5 text-slate-200 rounded-tl-none border border-white/5'
                        }`}>
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Box */}
              <form 
                onSubmit={handleSendMessage}
                className="p-3 bg-slate-950/80 border-t border-white/5 flex gap-2.5 items-center shrink-0"
              >
                <input 
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={`Write in ${activeChannel.name}...`}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-[var(--violet-bright)] focus:ring-1 focus:ring-[var(--violet-bright)] outline-none transition-all placeholder:text-[var(--text-muted)]"
                />
                <button 
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="p-3 bg-[var(--violet-primary)] hover:bg-[var(--violet-bright)] disabled:opacity-50 text-white rounded-xl transition-all cursor-pointer hover:shadow-glow flex items-center justify-center shrink-0 active:scale-95"
                >
                  <Send className="w-4.5 h-4.5" />
                </button>
              </form>

            </GlassCard>
          </div>
        </section>

      </div>
    </PageWrapper>
  );
};
