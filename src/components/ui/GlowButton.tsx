import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface GlowButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const GlowButton = React.forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ children, className, variant = 'primary', size = 'md', isLoading, ...props }, ref) => {
    
    const baseStyles = "relative inline-flex items-center justify-center font-syne font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--violet-glow)] disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      primary: "bg-[image:var(--gradient-hero)] text-white shadow-[0_4px_20px_rgba(124,58,237,0.4)] hover:shadow-[0_8px_40px_rgba(124,58,237,0.6)] hover:-translate-y-[2px]",
      secondary: "bg-white/10 text-white backdrop-blur-md hover:bg-white/20 border border-white/10 hover:border-white/20",
      outline: "bg-transparent text-[var(--violet-bright)] border border-[var(--violet-primary)] hover:shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:bg-[var(--violet-primary)] hover:text-white"
    };

    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg"
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={props.disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </span>
        ) : children}
      </motion.button>
    );
  }
);
GlowButton.displayName = 'GlowButton';
