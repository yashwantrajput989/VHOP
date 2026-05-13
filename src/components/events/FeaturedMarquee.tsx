import React from 'react';
import { motion } from 'framer-motion';
import { EventCard } from './EventCard';

interface FeaturedMarqueeProps {
  events: any[];
}

export const FeaturedMarquee: React.FC<FeaturedMarqueeProps> = ({ events }) => {
  if (!events || events.length === 0) return null;

  // Triple the events to ensure a seamless loop even on very wide screens
  const marqueeEvents = [...events, ...events, ...events];

  return (
    <div className="relative w-full overflow-hidden py-10">
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[var(--bg-primary)] to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[var(--bg-primary)] to-transparent z-10" />
      
      <motion.div 
        className="flex w-max"
        animate={{
          x: [0, "-33.3333%"],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: events.length * 10,
            ease: "linear",
          },
        }}
        whileHover={{ animationPlayState: 'paused' }}
      >
        {marqueeEvents.map((event, index) => (
          <motion.div 
            key={`${event.id}-${index}`} 
            className="w-[400px] md:w-[600px] pr-8"
            whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
          >
            <EventCard event={event} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};
