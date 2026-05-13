import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className, 
  hoverEffect = true,
  ...props 
}) => {
  return (
    <motion.div
      className={cn(
        "glass-card",
        hoverEffect && "hover:scale-[1.02] hover:-translate-y-1",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};
