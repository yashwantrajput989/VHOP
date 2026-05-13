import React from 'react';
import { motion } from 'framer-motion';

export const LoadingScreen: React.FC = () => {
  const letters = ['V', 'H', 'O', 'P'];

  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    },
    exit: { 
      opacity: 0,
      scale: 1.1,
      filter: 'blur(20px)',
      transition: { duration: 0.8, ease: "easeInOut" as const }
    }
  };

  const letterVariants = {
    initial: { y: 20, opacity: 0, scale: 0.5 },
    animate: { 
      y: 0, 
      opacity: 1, 
      scale: 1,
      transition: { 
        type: "spring" as const,
        stiffness: 200,
        damping: 10
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="fixed inset-0 z-[200] bg-[var(--bg-primary)] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Dynamic Background Elements */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          rotate: [0, 90, 0]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,var(--violet-primary)_0%,transparent_70%)] opacity-30 blur-[120px]"
      />
      <motion.div 
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
          rotate: [0, -90, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,var(--accent-pink)_0%,transparent_70%)] opacity-20 blur-[100px]"
      />

      <div className="relative flex flex-col items-center">
        {/* Animated Logo Container */}
        <div className="flex gap-4 mb-12">
          {letters.map((letter, i) => (
            <motion.span
              key={i}
              variants={letterVariants}
              className="text-7xl md:text-9xl font-display font-black tracking-tighter text-transparent bg-clip-text bg-[image:var(--gradient-hero)] drop-shadow-[0_0_30px_rgba(124,58,237,0.5)]"
            >
              {letter}
            </motion.span>
          ))}
        </div>

        {/* High-end Progress Bar */}
        <div className="w-64 h-1 bg-white/5 rounded-full overflow-hidden relative">
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--violet-bright)] to-transparent"
          />
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-[var(--text-muted)] font-syne font-medium tracking-[0.3em] uppercase text-xs"
        >
          Curating Your Experience
        </motion.p>
      </div>

      {/* Decorative Orbitals */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 10 + i * 5, repeat: Infinity, ease: "linear" },
              scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute inset-0 m-auto border border-white/5 rounded-full"
            style={{ 
              width: `${300 + i * 150}px`, 
              height: `${300 + i * 150}px` 
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};
