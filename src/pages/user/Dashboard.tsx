import React from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useTicketStore } from '../../store/ticketStore';
import { motion } from 'framer-motion';
import { GlassCard } from '../../components/ui/GlassCard';
import { Avatar } from '../../components/ui/Avatar';
import { 
  Zap, 
  Calendar, 
  Users, 
  TrendingUp, 
  ArrowRight,
  Ticket as TicketIcon,
  Crown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { VCoinsWidget } from '../../components/profile/VCoinsWidget';

export const Dashboard: React.FC = () => {
  const { user, isInitializing } = useAuthStore();
  const { tickets } = useTicketStore();
  const { openModal } = useUIStore();

  if (isInitializing) {
    return (
      <PageWrapper>
        <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
          <div className="flex justify-between items-center py-6">
            <div className="space-y-2">
              <div className="h-10 w-48 bg-white/5 rounded-lg" />
              <div className="h-4 w-32 bg-white/5 rounded-lg" />
            </div>
            <div className="w-16 h-16 rounded-full bg-white/5" />
          </div>
          <div className="h-32 bg-white/5 rounded-3xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 bg-white/5 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-64 bg-white/5 rounded-3xl" />
            <div className="h-64 bg-white/5 rounded-3xl" />
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (!user) {
    return (
      <PageWrapper className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center space-y-8 max-w-sm px-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-24 h-24 bg-[var(--violet-primary)]/10 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-12"
          >
            <Crown className="w-12 h-12 text-[var(--violet-bright)]" />
          </motion.div>
          <div className="space-y-3">
            <h1 className="text-4xl font-display font-bold leading-tight">Join the <span className="text-gradient">VHOP</span> Family</h1>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
              Unlock exclusive access to Visakhapatnam's hottest events and earn V-Coins with every booking.
            </p>
          </div>
          <button 
            onClick={() => openModal('auth')}
            className="w-full py-4 rounded-2xl bg-[var(--violet-primary)] hover:bg-[var(--violet-bright)] transition-all font-bold text-white shadow-[0_10px_30px_rgba(124,58,237,0.3)] active:scale-95"
          >
            Get Started Now
          </button>
        </div>
      </PageWrapper>
    );
  }

  const firstName = (user.full_name || 'Guest').split(' ')[0].toLowerCase();

  const quickActions = [
    { label: 'Events', icon: Calendar, path: '/events', color: 'text-blue-400' },
    { label: 'Social', icon: Users, path: '/social', color: 'text-purple-400' },
    { label: 'Tickets', icon: TicketIcon, path: '/profile', color: 'text-pink-400' },
    { label: 'VIP', icon: Crown, path: '/community', color: 'text-amber-400' },
  ];

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-8 px-0">
        {/* Welcome Header */}
        <section className="relative py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div className="space-y-1">
              <h1 className="text-3xl md:text-5xl font-display font-bold">
                hii <span className="text-gradient capitalize">{firstName}</span>!
              </h1>
              <p className="text-[var(--text-secondary)] text-sm md:text-base font-medium">
                Ready for tonight's adventure?
              </p>
            </div>
            <Link to="/profile">
              <Avatar src={user.avatar_url} size="lg" ring />
            </Link>
          </motion.div>
        </section>

        {/* V-Coins Widget - Mobile Focus */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <VCoinsWidget balance={user.v_coins} />
        </motion.div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Link to={action.path}>
                <GlassCard className="p-4 flex flex-col items-center gap-3 hover:bg-white/10 transition-all group active:scale-95">
                  <div className={`p-3 rounded-2xl bg-white/5 ${action.color} group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold text-[var(--text-secondary)]">{action.label}</span>
                </GlassCard>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Activity Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Upcoming Events */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold flex items-center gap-2">
                <Zap className="w-5 h-5 text-[var(--violet-bright)]" />
                Upcoming Bookings
              </h2>
              <Link to="/profile" className="text-xs text-[var(--violet-bright)] font-bold flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {tickets.length > 0 ? (
              <div className="space-y-3">
                {tickets.slice(0, 2).map((ticket) => (
                  <GlassCard key={ticket.id} className="p-3 flex items-center gap-4">
                    <img src={ticket.coverImage} className="w-12 h-12 rounded-lg object-cover" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm truncate">{ticket.eventTitle}</p>
                      <p className="text-[10px] text-[var(--text-muted)] truncate">{ticket.venueName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-[var(--violet-bright)]">
                        {new Date(ticket.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </GlassCard>
                ))}
              </div>
            ) : (
              <GlassCard className="p-8 border-dashed flex flex-col items-center justify-center text-center space-y-3">
                <p className="text-sm text-[var(--text-muted)]">No active bookings found.</p>
                <Link to="/events" className="text-xs font-bold text-[var(--violet-bright)] bg-[var(--violet-primary)]/10 px-4 py-2 rounded-lg">
                  Explore Events
                </Link>
              </GlassCard>
            )}
          </motion.div>

          {/* Trending/Social */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-display font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[var(--accent-pink)]" />
              What's Buzzing
            </h2>
            <GlassCard className="p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users className="w-20 h-20" />
              </div>
              <div className="space-y-4 relative z-10">
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Join the <span className="text-white font-bold">Mumbai Techno Community</span> to get early access to after-parties!
                </p>
                <Link to="/community">
                  <button className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm font-bold">
                    Join Community
                  </button>
                </Link>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Mobile Spacer */}
        <div className="h-20 md:hidden" />
      </div>
    </PageWrapper>
  );
};
