import React from 'react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({ children, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={`min-h-screen w-full pt-16 md:pt-24 pb-24 md:pb-8 md:pl-64 flex flex-col ${className || ''}`}
    >
      <div className="w-full min-w-0 max-w-7xl mx-auto px-4 md:px-8 flex-1">
        {children}
      </div>
      
      {/* Global Footer for Policy Whitelisting & Brand Compliance */}
      <footer className="w-full border-t border-white/5 bg-black/10 mt-auto py-8 px-4 md:px-8 text-center md:text-left z-10 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="font-display font-black text-lg text-white tracking-wider">VHOP</span>
            <p className="text-[10px] text-[var(--text-muted)] font-medium">Premium Ticketing Platform by zenvybe</p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400 font-semibold">
            <NavLink to="/contact-us" className={({ isActive }) => isActive ? "text-[var(--violet-bright)]" : "hover:text-white transition-colors"}>Contact Us</NavLink>
            <NavLink to="/terms-conditions" className={({ isActive }) => isActive ? "text-[var(--violet-bright)]" : "hover:text-white transition-colors"}>Terms & Conditions</NavLink>
            <NavLink to="/refunds-cancellations" className={({ isActive }) => isActive ? "text-[var(--violet-bright)]" : "hover:text-white transition-colors"}>Refunds & Cancellations</NavLink>
            <NavLink to="/privacy-policy" className={({ isActive }) => isActive ? "text-[var(--violet-bright)]" : "hover:text-white transition-colors"}>Privacy Policy</NavLink>
          </div>
          
          <p className="text-[10px] text-[var(--text-muted)] font-medium">
            © 2026 zenvybe. All rights reserved.
          </p>
        </div>
      </footer>
    </motion.div>
  );
};
