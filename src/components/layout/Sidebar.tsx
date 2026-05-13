import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Map, User, Zap, Settings, LayoutDashboard } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

interface SidebarProps {
  isAdmin?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isAdmin = false }) => {
  const userNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Events', path: '/events', icon: Home },
    { label: 'Social', path: '/social', icon: Users },
    { label: 'Community', path: '/community', icon: Map },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  const adminNavItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Create Event', path: '/admin/create-event', icon: Zap },
    { label: 'Guest List', path: '/admin/guests', icon: Users },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <aside className="hidden md:flex flex-col fixed top-0 left-0 bottom-0 w-64 glass-card rounded-none border-y-0 border-l-0 border-r border-[var(--border-subtle)] bg-[var(--bg-card)] z-50">
      <div className="p-8">
        <h1 className="font-display font-bold text-3xl tracking-wider text-transparent bg-clip-text bg-[image:var(--gradient-hero)] flex items-center gap-2">
          VHOP
          {isAdmin && <span className="text-xs bg-[var(--accent-pink)]/20 text-[var(--accent-pink)] px-2 py-1 rounded-md font-sans">ADMIN</span>}
        </h1>
      </div>

      <div className="flex-1 px-4 py-6 flex flex-col gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
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
    </aside>
  );
};
