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
import { Avatar } from '../../components/ui/Avatar';
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
      <FloatingOrb className="-top-40 -left-20" color="violet" size={400} />
      <FloatingOrb className="bottom-0 right-0" color="cyan" size={300} delay={2} />

      <div className="relative z-10">

        {/* ━━━ MOBILE HEADER (hidden on md+) ━━━ */}
        <div className="md:hidden mb-6 space-y-4">

          {/* Row 1: Location (left) + Bell + Avatar (right) */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)] mb-1">Location</p>
              <button className="flex items-center gap-1.5 group">
                <MapPin className="w-4 h-4 text-[var(--violet-bright)]" />
                <span className="text-white font-display font-bold text-lg leading-none">{activeCity}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] mt-0.5" />
              </button>
            </div>

            {/* Right: Bell + Avatar */}
            <div className="flex items-center gap-2">
              <button className="relative p-2.5 rounded-2xl bg-white/5 border border-white/10 text-white active:scale-95 transition-transform">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--accent-pink)] rounded-full border border-[var(--bg-primary)]" />
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-[var(--violet-bright)]/30 active:scale-95 transition-transform"
              >
                {user?.avatar_url
                  ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-[var(--violet-primary)]/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-[var(--violet-bright)]" />
                    </div>
                }
              </button>
            </div>
          </div>

          {/* Row 2: Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white outline-none focus:border-[var(--violet-bright)]/50 focus:bg-white/10 transition-all placeholder:text-[var(--text-muted)]"
            />
          </div>
        </div>

        {/* ━━━ DESKTOP HEADER (hidden below md) ━━━ */}
        <div className="hidden md:flex items-center justify-between gap-6 mb-10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">Location</p>
            <button className="flex items-center gap-2 text-white font-display font-bold text-2xl group">
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
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm outline-none focus:bg-white/10 focus:border-[var(--violet-bright)]/50 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-3 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[var(--accent-pink)] rounded-full border border-[var(--bg-primary)]" />
            </button>
            {user && <Avatar src={user.avatar_url} size="sm" ring />}
          </div>
        </div>

        {/* ━━━ CATEGORY STRIP ━━━ */}
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 mb-8 md:mb-12">
          <div className="flex gap-4 md:gap-6 min-w-max pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="flex flex-col items-center gap-2 flex-shrink-0 group"
              >
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  activeCategory === cat.id
                    ? 'bg-[var(--violet-primary)] shadow-glow scale-105'
                    : 'bg-white/5 border border-white/10 group-hover:bg-white/10'
                }`}>
                  <cat.icon className={`w-5 h-5 md:w-6 md:h-6 transition-colors ${
                    activeCategory === cat.id ? 'text-white' : 'text-[var(--text-muted)] group-hover:text-white'
                  }`} />
                </div>
                <span className={`text-[9px] md:text-[10px] font-bold tracking-widest transition-colors ${
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
          /* Loading skeleton */
          <div className="space-y-8 pb-24 animate-pulse">
            <div className="h-52 md:h-[360px] rounded-[1.5rem] bg-white/5" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-[1.5rem] bg-white/5" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-10 md:space-y-14 pb-24">

            {/* ── Featured Hero ── */}
            {filteredEvents.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h2 className="text-lg md:text-3xl font-display font-bold">
                    Featured <span className="text-gradient">Experiences</span>
                  </h2>
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[var(--violet-bright)]" />
                    <div className="w-2 h-2 rounded-full bg-white/20" />
                    <div className="w-2 h-2 rounded-full bg-white/20" />
                  </div>
                </div>

                <div
                  onClick={() => navigate(`/events/${filteredEvents[0].id}`)}
                  className="relative cursor-pointer overflow-hidden rounded-[1.5rem] md:rounded-[2.5rem] border border-white/10 group aspect-[4/3] md:aspect-[21/9]"
                >
                  <img
                    src={getImageUrl(filteredEvents[0].cover_image)}
                    alt={filteredEvents[0].title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-5 md:p-10 w-full">
                    <span className="bg-[var(--violet-bright)] text-white text-[9px] md:text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest mb-2 md:mb-3 inline-block">
                      Trending
                    </span>
                    <h3 className="text-lg md:text-4xl font-display font-bold text-white mb-1.5 leading-tight line-clamp-2">
                      {filteredEvents[0].title}
                    </h3>
                    <div className="flex items-center gap-2 md:gap-4 text-white/70 text-xs md:text-sm flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[var(--violet-bright)]" />
                        <span>{filteredEvents[0].venue_name}</span>
                      </div>
                      <span className="w-1 h-1 rounded-full bg-white/30" />
                      <span>₹{filteredEvents[0].price}+</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ── Recommended ── */}
            {filteredEvents.length > 1 && (
              <section>
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <div>
                    <h2 className="text-lg md:text-3xl font-display font-bold">Recommended</h2>
                    <p className="text-[10px] md:text-xs text-[var(--text-muted)] mt-0.5">Curated for you</p>
                  </div>
                  <button className="text-xs font-bold text-[var(--violet-bright)] flex items-center gap-1 hover:gap-2 transition-all">
                    See All
                    <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-5">
                  {filteredEvents.slice(1, 7).map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}

            {/* ── All Events ── */}
            <section className="pt-6 border-t border-white/5">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-lg md:text-3xl font-display font-bold">
                  {activeCity} <span className="text-gradient">Events</span>
                </h2>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-[var(--text-muted)] hover:bg-white/10 transition-colors">
                  <Settings2 className="w-3.5 h-3.5" />
                  Filters
                </button>
              </div>

              {filteredEvents.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <p className="text-lg font-bold text-white">No events found</p>
                  <p className="text-sm text-[var(--text-muted)]">Try a different category or search term.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
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
