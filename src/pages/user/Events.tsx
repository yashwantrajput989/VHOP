import React, { useState, useEffect } from 'react';
import { Search, MapPin, Music, Mic2, HeartPulse, GlassWater, Trophy, Palette, Settings2, ChevronDown, Bell, User } from 'lucide-react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { FloatingOrb } from '../../components/ui/FloatingOrb';
import { EventCard } from '../../components/events/EventCard';
import { useLocationStore } from '../../store/locationStore';
import { LocationPrompt } from '../../components/events/LocationPrompt';
import { ComingSoon } from '../../components/ui/ComingSoon';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL, getImageUrl } from '../../config';

const CATEGORIES = [
  { id: 'all', name: 'ALL', icon: Settings2 },
  { id: 'music', name: 'MUSIC', icon: Music },
  { id: 'nightlife', name: 'NIGHTLIFE', icon: GlassWater },
  { id: 'comedy', name: 'COMEDY', icon: Mic2 },
  { id: 'wellness', name: 'WELLNESS', icon: HeartPulse },
  { id: 'sports', name: 'SPORTS', icon: Trophy },
  { id: 'art', name: 'ART', icon: Palette },
  { id: 'workshop', name: 'WORKSHOP', icon: Settings2 },
];

export const Events: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { city: detectedCity, detectLocation } = useLocationStore();
  const [activeCity, setActiveCity] = useState<string>('Visakhapatnam');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => { detectLocation(); }, []);
  useEffect(() => { if (detectedCity) setActiveCity(detectedCity); }, [detectedCity]);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/events?city=${activeCity}`);
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Error fetching events:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, [activeCity]);

  const filteredEvents = events.filter(e =>
    (activeCategory === 'all' || e.category === activeCategory) &&
    (!searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const isComingSoon = activeCity !== 'Visakhapatnam' && events.length === 0;

  return (
    <PageWrapper>
      <LocationPrompt />
      <FloatingOrb className="-top-40 -left-20 pointer-events-none" color="violet" size={400} />
      <FloatingOrb className="bottom-0 right-0 pointer-events-none" color="cyan" size={300} delay={2} />

      {/* Added max-width control and responsive X padding directly to the main layout engine */}
      <div className="relative z-10 w-full block">

        {/* ━━━ MOBILE HEADER ━━━ */}
        <div className="md:hidden pt-4 mb-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)] mb-1">Location</p>
              <button className="flex items-center gap-1.5 transition-opacity active:opacity-70 max-w-full">
                <MapPin className="w-4 h-4 text-[var(--violet-bright)] flex-shrink-0" />
                <span className="text-white font-display font-bold text-lg leading-none truncate">{activeCity}</span>
                <ChevronDown className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0 mt-0.5" />
              </button>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <button className="relative p-2.5 rounded-xl bg-white/5 border border-white/10 text-white active:scale-95 transition-all">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--accent-pink)] rounded-full border border-[var(--bg-primary)]" />
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 active:scale-95 transition-all focus:outline-none"
              >
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[var(--violet-primary)]/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-[var(--violet-bright)]" />
                  </div>
                )}
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white outline-none focus:border-[var(--violet-bright)]/40 focus:bg-white/10 transition-all placeholder:text-[var(--text-muted)]"
            />
          </div>
        </div>

        {/* ━━━ DESKTOP HEADER ━━━ */}
        <div className="hidden md:flex items-center justify-between gap-6 py-6 mb-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">Location</p>
            <button className="flex items-center gap-2 text-white font-display font-bold text-2xl group focus:outline-none">
              <MapPin className="w-5 h-5 text-[var(--violet-bright)] group-hover:scale-110 transition-transform" />
              {activeCity}
              <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
            </button>
          </div>

          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search events, artists, venues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white outline-none focus:bg-white/10 focus:border-[var(--violet-bright)]/40 transition-all placeholder:text-[var(--text-muted)]"
              />
            </div>
          </div>
        </div>

        {/* ━━━ CATEGORY STRIP ━━━ */}
        {/* Adjusted margins and horizontal scrolling behavior for smoother mobile performance */}
        <div className="overflow-x-auto scrollbar-none -mx-4 px-4 mb-8 md:mb-10 unique-snap-scroller">
          <div className="flex gap-3 md:gap-4 min-w-max pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 group focus:outline-none"
              >
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  activeCategory === cat.id
                    ? 'bg-[var(--violet-primary)] shadow-lg scale-100'
                    : 'bg-white/5 border border-white/10 group-hover:bg-white/10'
                }`}>
                  <cat.icon className={`w-5 h-5 md:w-6 h-6 transition-colors ${
                    activeCategory === cat.id ? 'text-white' : 'text-[var(--text-muted)] group-hover:text-white'
                  }`} />
                </div>
                <span className={`text-[9px] md:text-[10px] font-bold tracking-widest uppercase transition-colors ${
                  activeCategory === cat.id ? 'text-white' : 'text-[var(--text-muted)] group-hover:text-white'
                }`}>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ━━━ PAGE CONTENT ━━━ */}
        {isComingSoon ? (
          <ComingSoon
            title={`Coming Soon to ${activeCity}`}
            description={`We're expanding! VHOP will be live in ${activeCity} very soon.`}
          />
        ) : isLoading ? (
          <div className="space-y-8 pb-24 animate-pulse">
            <div className="h-48 sm:h-64 md:h-[320px] rounded-2xl bg-white/5" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-xl bg-white/5" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8 md:space-y-12 pb-24">

            {/* ── Featured Hero ── */}
            {filteredEvents.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <h2 className="text-base md:text-2xl font-display font-bold text-white">
                    Featured <span className="text-gradient">Experiences</span>
                  </h2>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--violet-bright)]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  </div>
                </div>

                <div
                  onClick={() => navigate(`/events/${filteredEvents[0].id}`)}
                  className="relative cursor-pointer overflow-hidden rounded-2xl md:rounded-3xl border border-white/10 group min-h-[160px] sm:min-h-[220px] md:aspect-[21/9]"
                >
                  <img
                    src={getImageUrl(filteredEvents[0].cover_image)}
                    alt={filteredEvents[0].title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
                  
                  {/* Fixed flex content layouts to protect typography layers from overlapping */}
                  <div className="absolute inset-x-0 bottom-0 p-4 md:p-8 flex flex-col justify-end items-start w-full">
                    <span className="bg-[var(--violet-bright)] text-white text-[8px] md:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest mb-1.5">
                      Trending
                    </span>
                    <h3 className="text-sm sm:text-lg md:text-3xl font-display font-bold text-white mb-1 leading-tight line-clamp-2 max-w-3xl">
                      {filteredEvents[0].title}
                    </h3>
                    <div className="flex items-center gap-2 text-white/70 text-[10px] sm:text-xs md:text-sm flex-wrap">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[var(--violet-bright)] flex-shrink-0" />
                        <span className="truncate max-w-[140px] sm:max-w-none">{filteredEvents[0].venue_name}</span>
                      </div>
                      <span className="w-1 h-1 rounded-full bg-white/30 flex-shrink-0" />
                      <span className="font-semibold text-white">₹{filteredEvents[0].price}+</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ── Recommended ── */}
            {filteredEvents.length > 1 && (
              <section>
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div>
                    <h2 className="text-base md:text-2xl font-display font-bold text-white">Recommended</h2>
                    <p className="text-[9px] md:text-xs text-[var(--text-muted)] mt-0.5">Curated for you</p>
                  </div>
                  <button className="text-xs font-bold text-[var(--violet-bright)] flex items-center gap-0.5 hover:gap-1.5 transition-all">
                    See All
                    <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                  </button>
                </div>
                {/* Changed column mapping and appended min-w-0 blocks to ensure grid containers handle small widths cleanly */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-5 (*:min-w-0)">
                  {filteredEvents.slice(1, 7).map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}

            {/* ── All Events ── */}
            <section className="pt-5 border-t border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base md:text-2xl font-display font-bold text-white">
                  {activeCity} <span className="text-gradient">Events</span>
                </h2>
                <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-bold text-[var(--text-muted)] hover:bg-white/10 transition-colors">
                  <Settings2 className="w-3 h-3" />
                  Filters
                </button>
              </div>

              {filteredEvents.length === 0 ? (
                <div className="py-12 text-center space-y-1">
                  <p className="text-base font-bold text-white">No events found</p>
                  <p className="text-xs text-[var(--text-muted)]">Try a different category or search term.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 (*:min-w-0)">
                  {filteredEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </section>

          </div>
        )}
      </div>
    </PageWrapper>
  );
};