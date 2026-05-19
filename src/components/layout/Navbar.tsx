import { NavLink } from 'react-router-dom';
import { Home, Users, Map, User, Bell, LogIn, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useTicketStore } from '../../store/ticketStore';
import { Avatar } from '../ui/Avatar';
import { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';

export const Navbar: React.FC = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout } = useAuthStore();
  const { tickets } = useTicketStore();
  const { openModal } = useUIStore();

  const navItems = [
    { label: 'Events', path: '/events', icon: Home },
    { label: 'Social', path: '/social', icon: Users },
    { label: 'Community', path: '/community', icon: Map },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <>
      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-card rounded-none border-x-0 border-b-0 border-t border-white/5 bg-[var(--bg-card)]/90 backdrop-blur-xl pb-safe">
        <div className="flex items-center justify-around px-2 py-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1.5 px-3 py-1 rounded-2xl transition-all duration-300",
                  isActive ? "text-[var(--violet-bright)]" : "text-[var(--text-muted)] active:scale-90"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <item.icon className={cn("w-6 h-6 transition-transform", isActive && "scale-110")} />
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator-mobile"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-[var(--violet-bright)] shadow-[0_0_10px_var(--violet-bright)]"
                      />
                    )}
                  </div>
                  <span className={cn("text-[9px] font-bold uppercase tracking-wider transition-all", isActive ? "opacity-100" : "opacity-60")}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Desktop Top/Side Nav */}
      <nav className="hidden md:flex fixed top-0 left-64 right-0 z-40 h-20 items-center justify-between px-8 bg-transparent">
        <div className="flex-1" />
        <div className="flex items-center gap-6">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-full hover:bg-white/10 transition-colors text-[var(--text-muted)] hover:text-white"
            >
              <Bell className="w-5 h-5" />
              {(tickets.length > 0 || (user && !user.onboarded)) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--accent-pink)] border border-[var(--bg-primary)]" />
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-4 w-80 z-[60]"
                >
                  <GlassCard className="p-4 shadow-glow border-[var(--violet-primary)]/20">
                    <h4 className="font-display font-bold mb-4">Notifications</h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {user && !user.onboarded && (
                        <div 
                          className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-3 cursor-pointer hover:bg-amber-500/20 transition-colors"
                          onClick={() => {
                            setShowNotifications(false);
                            openModal('auth');
                          }}
                        >
                          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-amber-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-amber-500">Complete Your Profile</p>
                            <p className="text-[10px] text-amber-200/80 mt-1">Add your interests to personalize your experience.</p>
                          </div>
                        </div>
                      )}
                      {tickets.length === 0 && (!user || user.onboarded) ? (
                        <p className="text-sm text-[var(--text-muted)] text-center py-4">No new notifications</p>
                      ) : (
                        tickets.map(ticket => (
                          <div key={ticket.id} className="p-3 rounded-lg bg-white/5 border border-white/5 flex gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[var(--violet-primary)]/20 flex items-center justify-center flex-shrink-0">
                              <LogIn className="w-5 h-5 text-[var(--violet-bright)]" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-white">Booking Confirmed!</p>
                              <p className="text-[10px] text-[var(--text-secondary)] mt-1">Your tickets for {ticket.eventTitle} are ready.</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {user ? (
            <div className="flex items-center gap-4">
              <div className="text-right hidden xl:block">
                <p className="text-sm font-bold text-white">{user.full_name}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{user.v_coins} V-Coins</p>
              </div>
              <Avatar src={user.avatar_url} size="sm" ring />
              <button 
                onClick={() => logout()}
                className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => openModal('auth')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--violet-primary)] hover:bg-[var(--violet-bright)] transition-all font-bold text-sm shadow-[0_0_20px_rgba(124,58,237,0.3)]"
            >
              <LogIn className="w-4 h-4" /> Sign In
            </button>
          )}
        </div>
      </nav>
    </>
  );
};
