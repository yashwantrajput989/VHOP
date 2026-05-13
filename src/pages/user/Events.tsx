import React from 'react';
import { Search, MapPin } from 'lucide-react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { FloatingOrb } from '../../components/ui/FloatingOrb';
import { FeaturedEventBanner } from '../../components/events/FeaturedEventBanner';
import { FeaturedMarquee } from '../../components/events/FeaturedMarquee';
import { EventCard } from '../../components/events/EventCard';
import { MOCK_EVENTS } from '../../lib/mockData';
import { mockDb as dbClient } from '../../lib/mockDb';
import { useState, useEffect } from 'react';

import { useLocationStore } from '../../store/locationStore';
import { LocationPrompt } from '../../components/events/LocationPrompt';
import { ComingSoon } from '../../components/ui/ComingSoon';

export const Events: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [, setIsLoading] = useState(true);
  const { city: detectedCity, detectLocation } = useLocationStore();
  const [activeCity, setActiveCity] = useState<string>('Visakhapatnam');
  const [availableCities, setAvailableCities] = useState<string[]>(['Visakhapatnam', 'Bangalore', 'Hyderabad']);

  useEffect(() => {
    const initLocation = async () => {
      // Small delay to ensure smooth entry
      await new Promise(resolve => setTimeout(resolve, 1000));
      await detectLocation();
    };
    initLocation();
  }, []);

  useEffect(() => {
    if (detectedCity && !availableCities.includes(detectedCity)) {
      setAvailableCities(prev => [detectedCity, ...prev]);
      setActiveCity(detectedCity);
    } else if (detectedCity) {
      setActiveCity(detectedCity);
    }
  }, [detectedCity]);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);

      // We only show events for Visakhapatnam for now as per requirements
      if (activeCity !== 'Visakhapatnam') {
        setEvents([]);
        setIsLoading(false);
        return;
      }

      const isDbConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

      let query = dbClient.from('events').select('*');
      query = query.ilike('city', `%${activeCity}%`);

      if (isDbConfigured) {
        const { data, error } = await query.order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setEvents(data);
          setIsLoading(false);
          return;
        }
      }

      // Fallback to mock data with filtering
      const filteredMock = MOCK_EVENTS.filter(e => e.city.toLowerCase().includes(activeCity.toLowerCase()));
      setEvents(filteredMock);
      setIsLoading(false);
    };

    fetchEvents();
  }, [activeCity]);

  const featuredEvent = events[0] || MOCK_EVENTS.find(e => e.city === 'Visakhapatnam') || MOCK_EVENTS[0];
  const isComingSoon = activeCity !== 'Visakhapatnam';

  return (
    <PageWrapper>
      <LocationPrompt />
      <FloatingOrb className="-top-40 -left-40" color="violet" size={600} />
      <FloatingOrb className="top-20 -right-40" color="cyan" size={400} delay={2} />

      <div className="relative z-10 space-y-6">
        {/* Sticky Header with Search */}
        <div className="sticky top-0 z-30 pt-4 pb-2 bg-[var(--bg-primary)]/80 backdrop-blur-xl -mx-4 px-4 border-b border-white/5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-display font-bold tracking-tight">
                Discover <span className="text-gradient">Nightlife</span>
              </h1>
              <div className="flex gap-2">
                <button className="p-2 rounded-full bg-white/5 border border-white/10">
                  <MapPin className="w-4 h-4 text-[var(--violet-bright)]" />
                </button>
              </div>
            </div>
            
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search events, clubs, DJs..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 focus:border-[var(--violet-bright)] outline-none transition-all placeholder:text-[var(--text-muted)] text-sm"
              />
            </div>
          </div>
        </div>

        {/* Categories / Cities */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x">
          {availableCities.map((city) => (
            <button
              key={city}
              onClick={() => setActiveCity(city)}
              className={`px-5 py-2 rounded-xl border transition-all whitespace-nowrap text-xs font-bold snap-start ${activeCity === city
                ? 'border-[var(--violet-bright)] bg-[var(--violet-primary)] text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]'
                : 'border-white/5 bg-white/5 text-[var(--text-secondary)] hover:bg-white/10'
                }`}
            >
              {city}
            </button>
          ))}
        </div>

        {isComingSoon ? (
          <div className="py-20">
            <ComingSoon
              title={`Coming Soon to ${activeCity}`}
              description={`We're expanding rapidly! VHOP will be live in ${activeCity} with the city's best nightlife experiences very soon.`}
            />
          </div>
        ) : (
          <>
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-[var(--violet-bright)] rounded-full" />
                <h2 className="text-2xl font-display font-bold tracking-tight">ONGOING</h2>
              </div>
              <FeaturedMarquee events={events.length > 0 ? events : MOCK_EVENTS.filter(e => e.city === 'Visakhapatnam')} />
            </section>

            <section>
              <FeaturedEventBanner event={featuredEvent} />
            </section>

            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)]">Ongoing</h2>
                <button className="text-[10px] font-bold text-[var(--violet-bright)] uppercase tracking-wider">See All</button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x">
                {events.slice(0, 4).map((event) => (
                  <div key={event.id} className="w-[170px] flex-shrink-0 snap-start">
                    <EventCard event={event} />
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)]">Nearby Gigs</h2>
                <button className="text-[10px] font-bold text-[var(--violet-bright)] uppercase tracking-wider">Explore</button>
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-8 items-start">
                {events.map((event) => (
                  <div key={event.id} className="w-full">
                    <EventCard event={event} />
                  </div>
                ))}
              </div>
            </section>


          </>
        )}
      </div>
    </PageWrapper>
  );
};
