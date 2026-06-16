import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Map, User, Zap, Settings, LayoutDashboard, LogOut, Calendar, Building, MessageSquare, ShieldAlert } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { Capacitor } from '@capacitor/core';

interface SidebarProps {
  isAdmin?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isAdmin = false }) => {
  const { logout, user } = useAuthStore();
  const isNative = Capacitor.isNativePlatform();
  const isTargetAdmin = import.meta.env.VITE_APP_TARGET === 'admin';
  const isSuperAdmin = (isTargetAdmin || !isNative) && user?.role === 'superadmin';
  const isSubAdmin = (isTargetAdmin || !isNative) && user?.role === 'subadmin';

  const userNavItems = [
    { label: 'Events', path: '/events', icon: Home },
    { label: 'Squad', path: '/squads', icon: Users },
    { label: 'Community', path: '/community', icon: Map },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  const adminNavItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Create Event', path: '/admin/create-event', icon: Zap },
    { label: 'Guest List', path: '/admin/guests', icon: Users },
    { label: 'Teams', path: '/admin/teams', icon: ShieldAlert },
    { label: 'Support', path: '/admin/support', icon: MessageSquare },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const superAdminNavItems = [
    { label: 'Dashboard', path: '/superadmin', icon: LayoutDashboard },
    { label: 'Events', path: '/superadmin/events', icon: Calendar },
    { label: 'Partners', path: '/superadmin/partners', icon: Building },
    { label: 'View Website', path: '/events', icon: Home },
  ];

  const filteredAdminNavItems = isSubAdmin
    ? adminNavItems.filter(item => item.path !== '/admin/settings' && item.path !== '/admin/teams')
    : adminNavItems;

  const navItems = isSuperAdmin 
    ? superAdminNavItems 
    : ((isAdmin || isSubAdmin) ? filteredAdminNavItems : userNavItems);

  return (
    <aside className="hidden md:flex flex-col fixed top-0 left-0 bottom-0 w-64 glass-card rounded-none border-y-0 border-l-0 border-r border-[var(--border-subtle)] bg-[var(--bg-card)] z-50">
      <div className="p-8">
        <h1 className="font-display font-bold text-3xl tracking-wider text-transparent bg-clip-text bg-[image:var(--gradient-hero)] flex items-center gap-2">
          VHOP
          {isSuperAdmin ? (
            <span className="text-[10px] bg-[var(--violet-bright)]/20 text-[var(--violet-bright)] px-2 py-1 rounded-md font-sans font-bold">SUPER</span>
          ) : isSubAdmin ? (
            <span className="text-xs bg-[var(--violet-bright)]/20 text-[var(--violet-bright)] px-2 py-1 rounded-md font-sans">TEAM</span>
          ) : (
            isAdmin && <span className="text-xs bg-[var(--accent-pink)]/20 text-[var(--accent-pink)] px-2 py-1 rounded-md font-sans">ADMIN</span>
          )}
        </h1>
      </div>

      <div className="flex-1 px-4 py-6 flex flex-col gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin' || item.path === '/superadmin'}
            className={({ isActive }) =>
              cn(
                "relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group",
                isActive 
                  ? "text-white bg-[var(--violet-primary)]/10" 
                  : "text-[var(--text-muted)] hover:text-white hover:bg-white/5"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn(
                  "w-5 h-5 transition-colors duration-300",
                  isActive ? "text-[var(--violet-bright)]" : "text-[var(--text-muted)] group-hover:text-[var(--violet-glow)]"
                )} />
                <span className="font-medium text-sm tracking-wide">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[var(--violet-bright)] shadow-[0_0_10px_var(--violet-bright)]"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {user && (
        <div className="p-4 border-t border-white/5">
          <button 
            onClick={() => logout()}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300 font-medium text-sm group cursor-pointer"
          >
            <LogOut className="w-5 h-5 text-red-400 group-hover:text-red-300 transition-colors" />
            <span>Logout</span>
          </button>
        </div>
      )}

      {/* Policies Footer for Payment Whitelisting */}
      <div className="px-6 py-4 border-t border-white/5 text-[10px] text-[var(--text-muted)] flex flex-wrap gap-x-2 gap-y-1 justify-center shrink-0">
        <NavLink to="/contact-us" className={({ isActive }) => cn("hover:text-white hover:underline transition-colors", isActive && "text-[var(--violet-bright)] font-bold")}>Contact Us</NavLink>
        <span>•</span>
        <NavLink to="/terms-conditions" className={({ isActive }) => cn("hover:text-white hover:underline transition-colors", isActive && "text-[var(--violet-bright)] font-bold")}>Terms & Conditions</NavLink>
        <span>•</span>
        <NavLink to="/refunds-cancellations" className={({ isActive }) => cn("hover:text-white hover:underline transition-colors", isActive && "text-[var(--violet-bright)] font-bold")}>Refunds & Cancellations</NavLink>
      </div>
    </aside>
  );
};

