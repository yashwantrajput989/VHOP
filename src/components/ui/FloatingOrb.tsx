import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface FloatingOrbProps {
  className?: string;
  color?: 'violet' | 'pink' | 'cyan';
  size?: number;
  delay?: number;
}

export const FloatingOrb: React.FC<FloatingOrbProps> = ({ 
  className, 
  color = 'violet', 
  size = 400,
  delay = 0 
}) => {
  const colorMap = {
    violet: 'bg-[var(--violet-glow)]',
    pink: 'bg-[var(--accent-pink)]',
    cyan: 'bg-[var(--accent-cyan)]'
  };

  return (
    <motion.div
      animate={{
        y: [0, -30, 0],
        scale: [1, 1.05, 1],
        rotate: [0, 5, 0]
      }}
      transition={{
        duration: 15,
        repeat: Infinity,
        repeatType: "reverse" as const,
        ease: "easeInOut" as const,
        delay: delay
      }}
      className={cn(
        "absolute rounded-full opacity-20 pointer-events-none blur-[80px]",
        colorMap[color],
        className
      )}
      style={{
        width: size,
        height: size,
      }}
    />
  );
};
