import React from 'react';
import { motion } from 'framer-motion';

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
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex-1">
        {children}
      </div>
    </motion.div>
  );
};
