import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Users, Map, User, Bell, LogIn, LogOut, MapPin, ChevronDown, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useTicketStore } from '../../store/ticketStore';
import { useLocationStore } from '../../store/locationStore';
import { Avatar } from '../ui/Avatar';
import { useState } from 'react';
import { getImageUrl } from '../../config';

export const Navbar: React.FC = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const { city, setCity } = useLocationStore();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { tickets } = useTicketStore();
  const { openModal } = useUIStore();

  const activeCity = city || 'Visakhapatnam';

  const handleGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
            const data = await res.json();
            const foundCity = data.address?.city || data.address?.town || data.address?.village || data.address?.state_district;
            if (foundCity) {
              setCity(foundCity);
              setShowCityDropdown(false);
            } else {
              alert("Could not determine your city.");
            }
          } catch (error) {
            console.error("Geocoding error", error);
            alert("Error fetching city from location.");
          }
        },
        (error) => {
          console.error("Geolocation error", error);
          alert("Location access denied or unavailable.");
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };


  const navItems = [
    { label: 'Events', path: '/events', icon: Home },
    { label: 'Social', path: '/social', icon: Users },
    { label: 'Community', path: '/community', icon: Map },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <>
      {/* Global Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4">
        {/* Left: Brand Logo & Title */}
        <NavLink to="/events" className="flex items-center gap-2">
          <span className="font-display font-black text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[var(--violet-bright)] to-[var(--accent-pink)]">
            VHOP
          </span>
        </NavLink>

        {/* Center: Location dropdown */}
        <div className="relative shrink min-w-0">
          <button 
            onClick={() => setShowCityDropdown(!showCityDropdown)}
            className="flex items-center gap-1 transition-all active:scale-95 text-left py-1 px-2 rounded-xl hover:bg-white/5 min-w-0"
          >
            <MapPin className="w-3.5 h-3.5 text-[var(--violet-bright)] shrink-0 animate-pulse" />
            <span className="text-white font-display font-extrabold text-[11px] xs:text-xs leading-none flex items-center gap-0.5 truncate max-w-[85px] xs:max-w-[120px] sm:max-w-none">
              {activeCity}
              <ChevronDown className={`w-3 h-3 xs:w-3.5 xs:h-3.5 text-[var(--text-muted)] shrink-0 transition-transform duration-300 ${showCityDropdown ? 'rotate-180' : ''}`} />
            </span>
          </button>

          {/* Mobile City Dropdown List */}
          <AnimatePresence>
            {showCityDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-44 z-50 rounded-2xl overflow-hidden bg-[#110F20] backdrop-blur-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
              >
                <button
                  onClick={handleGeolocation}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold transition-colors text-[var(--accent-cyan)] hover:bg-white/10 border-b border-white/5 flex items-center gap-2"
                >
                  <MapPin className="w-3.5 h-3.5" /> Use Current Location
                </button>
                {['Visakhapatnam', 'Hyderabad', 'Bangalore', 'Mumbai', 'Delhi'].map(c => (
                  <button
                    key={c}
                    onClick={() => {
                      setCity(c);
                      setShowCityDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${
                      activeCity === c 
                        ? 'bg-[var(--violet-primary)] text-white' 
                        : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Notifications & Profile Avatar */}
        <div className="flex items-center gap-2">
          {/* Notifications Trigger */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-8.5 h-8.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all hover:bg-white/10"
            >
              <Bell className="w-4 h-4" />
              {(tickets.length > 0 || (user && !user.onboarded)) && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--accent-pink)] border border-[var(--bg-primary)] animate-pulse" />
              )}
            </button>

            {/* Mobile Notification Popdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute top-full right-0 mt-2 w-72 z-50 notification-popover"
                >
                  <h4 className="font-display font-bold text-xs mb-3 text-white flex items-center justify-between border-b border-white/5 pb-2">
                    <span>Notifications</span>
                    <span className="text-[9px] bg-[var(--violet-primary)] px-2 py-0.5 rounded-full font-medium">New</span>
                  </h4>
                  <div className="space-y-2.5 max-h-72 overflow-y-auto scrollbar-none">
                    {user && !user.onboarded && (
                      <div 
                        className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-2.5 cursor-pointer hover:bg-amber-500/20 transition-colors"
                        onClick={() => {
                          setShowNotifications(false);
                          openModal('auth');
                        }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-amber-500 leading-tight">Complete Profile</p>
                          <p className="text-[8px] text-amber-200/80 leading-normal mt-0.5">Claim 100 V-Coins reward & unlock V-Card.</p>
                        </div>
                      </div>
                    )}
                    {tickets.length === 0 && (!user || user.onboarded) ? (
                      <p className="text-xs text-[var(--text-muted)] text-center py-4">No new notifications</p>
                    ) : (
                      tickets.map(ticket => (
                        <div key={ticket.id} className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[var(--violet-primary)]/20 flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4 text-[var(--violet-bright)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-white leading-tight">Booking Confirmed!</p>
                            <p className="text-[8px] text-[var(--text-secondary)] leading-normal mt-0.5">Tickets for {ticket.eventTitle} are ready.</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Avatar / Auth trigger */}
          {user ? (
            <button
              onClick={() => navigate('/profile')}
              className="w-8.5 h-8.5 rounded-xl overflow-hidden border border-[var(--violet-bright)]/30 active:scale-95 transition-all focus:outline-none ring-2 ring-[var(--violet-bright)]/10 shadow-[0_0_10px_rgba(124,58,237,0.2)] shrink-0"
            >
              {user.avatar_url ? (
                <img src={getImageUrl(user.avatar_url)} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[var(--violet-primary)]/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-[var(--violet-bright)]" />
                </div>
              )}
            </button>
          ) : (
            <button
              onClick={() => openModal('auth')}
              className="px-2 py-1 xs:px-3.5 xs:py-1.5 rounded-xl bg-[var(--violet-primary)] hover:bg-[var(--violet-bright)] text-white text-[9px] xs:text-[10px] font-extrabold active:scale-95 transition-all shadow-[0_0_15px_rgba(124,58,237,0.3)] flex items-center gap-1 border border-white/10 shrink-0 uppercase tracking-wider min-w-0"
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Sign In</span>
            </button>
          )}
        </div>
      </header>

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
          {/* Desktop City Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowCityDropdown(!showCityDropdown)}
              className="flex items-center gap-2 transition-all active:scale-95 text-left py-2 px-3 rounded-xl hover:bg-white/10"
            >
              <MapPin className="w-4 h-4 text-[var(--violet-bright)]" />
              <span className="text-white font-display font-bold text-sm flex items-center gap-1">
                {activeCity}
                <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-300 ${showCityDropdown ? 'rotate-180' : ''}`} />
              </span>
            </button>

            <AnimatePresence>
              {showCityDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute top-full left-0 mt-2 w-48 z-50 rounded-2xl overflow-hidden bg-[#110F20] backdrop-blur-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                >
                  <button
                    onClick={handleGeolocation}
                    className="w-full text-left px-4 py-3 text-sm font-bold transition-colors text-[var(--accent-cyan)] hover:bg-white/10 border-b border-white/5 flex items-center gap-2"
                  >
                    <MapPin className="w-4 h-4" /> Use Current Location
                  </button>
                  {['Visakhapatnam', 'Hyderabad', 'Bangalore', 'Mumbai', 'Delhi'].map(c => (
                    <button
                      key={c}
                      onClick={() => {
                        setCity(c);
                        setShowCityDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm font-bold transition-colors ${
                        activeCity === c 
                          ? 'bg-[var(--violet-primary)] text-white' 
                          : 'text-[var(--text-secondary)] hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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
                  className="absolute top-full right-0 mt-4 w-80 z-[60] notification-popover"
                >
                  <h4 className="font-display font-bold mb-4 text-white border-b border-white/5 pb-2">Notifications</h4>
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
              <Avatar src={getImageUrl(user.avatar_url)} size="sm" ring />
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
