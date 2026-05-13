import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { GlassCard } from '../ui/GlassCard';
import { MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export const GatheringsMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedGathering, setSelectedGathering] = useState<any>(null);

  const mockGatherings = [
    { id: 1, title: 'Techno Meetup', lat: 19.0760, lng: 72.8777, community: 'Mumbai Techno', attendees: 12 },
    { id: 2, title: 'Comedy Jam', lat: 12.9716, lng: 77.5946, community: 'BLR Laughs', attendees: 8 },
  ];

  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [78.9629, 20.5937], // India center
      zoom: 4,
    });

    map.current.on('load', () => {
      mockGatherings.forEach((g) => {
        const el = document.createElement('div');
        el.className = 'w-8 h-8 rounded-full bg-[var(--violet-primary)] border-2 border-white shadow-[0_0_15px_var(--violet-bright)] cursor-pointer hover:scale-110 transition-transform flex items-center justify-center';
        el.innerHTML = '<div class="w-3 h-3 bg-white rounded-full animate-pulse"></div>';

        new mapboxgl.Marker(el)
          .setLngLat([g.lng, g.lat])
          .addTo(map.current!);

        el.addEventListener('click', () => {
          setSelectedGathering(g);
        });
      });
    });

    return () => map.current?.remove();
  }, []);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-[600px] rounded-3xl bg-[var(--bg-card)] flex flex-col items-center justify-center border border-[var(--border-subtle)] space-y-4">
        <MapPin className="w-12 h-12 text-[var(--violet-primary)] opacity-50" />
        <div className="text-center">
          <h3 className="text-xl font-bold">Map Preview</h3>
          <p className="text-[var(--text-muted)] max-w-xs">Please add your VITE_MAPBOX_TOKEN to .env to see the interactive gatherings map.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px] rounded-3xl overflow-hidden border border-[var(--border-subtle)]">
      <div ref={mapContainer} className="w-full h-full" />
      
      <AnimatePresence>
        {selectedGathering && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-8 left-8 right-8 md:left-auto md:right-8 md:w-80"
          >
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-[var(--violet-bright)] uppercase tracking-wider">
                  {selectedGathering.community}
                </span>
                <button 
                  onClick={() => setSelectedGathering(null)}
                  className="text-[var(--text-muted)] hover:text-white"
                >
                  ✕
                </button>
              </div>
              <h4 className="text-xl font-bold mb-2">{selectedGathering.title}</h4>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Join the local community for a spontaneous meetup!
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full border border-[var(--bg-card)] bg-[var(--bg-secondary)]" />
                    ))}
                  </div>
                  <span className="ml-2">+{selectedGathering.attendees} going</span>
                </div>
                <button className="px-4 py-2 rounded-lg bg-[var(--violet-primary)] text-sm font-bold hover:bg-[var(--violet-bright)] transition-colors">
                  Join
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
