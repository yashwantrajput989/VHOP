import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'violet' | 'pink' | 'cyan' | 'green' | 'gold' | 'glass';
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'violet',
  size = 'sm',
  className
}) => {
  const variants = {
    violet: 'bg-[var(--violet-primary)]/20 text-[var(--violet-glow)] border-[var(--violet-primary)]/30',
    pink: 'bg-[var(--accent-pink)]/20 text-pink-300 border-[var(--accent-pink)]/30',
    cyan: 'bg-[var(--accent-cyan)]/20 text-cyan-300 border-[var(--accent-cyan)]/30',
    green: 'bg-[var(--accent-green)]/20 text-green-400 border-[var(--accent-green)]/30',
    gold: 'bg-[var(--accent-gold)]/20 text-yellow-400 border-[var(--accent-gold)]/30',
    glass: 'bg-white/5 text-[var(--text-secondary)] border-white/10 backdrop-blur-md'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm'
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border font-medium",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
};
