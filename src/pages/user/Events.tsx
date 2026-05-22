import React, { useState, useEffect } from 'react';
import { Search, MapPin, Music, Mic2, HeartPulse, GlassWater, Trophy, Palette, Settings2, ChevronDown, Sparkles } from 'lucide-react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { FloatingOrb } from '../../components/ui/FloatingOrb';
import { EventCard } from '../../components/events/EventCard';
import { useLocationStore } from '../../store/locationStore';
import { LocationPrompt } from '../../components/events/LocationPrompt';
import { ComingSoon } from '../../components/ui/ComingSoon';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, getImageUrl } from '../../config';
import { motion, AnimatePresence } from 'framer-motion';

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
  const { city, setCity, detectLocation } = useLocationStore();
  const activeCity = city || 'Visakhapatnam';
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

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

        {/* Mobile Search Bar Wrapper */}
        <div className="md:hidden mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              placeholder="Search experiences, venues, artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-xs text-white outline-none focus:border-[var(--violet-bright)]/40 focus:bg-white/10 transition-all placeholder:text-[var(--text-muted)]"
            />
          </div>
        </div>

        {/* ━━━ DESKTOP NAVIGATION/HEADER ━━━ */}
        <div className="hidden md:flex items-center justify-between gap-6 py-6 mb-8">
          <div className="relative">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Selected Location</p>
            <button 
              onClick={() => setShowCityDropdown(!showCityDropdown)}
              className="flex items-center gap-2.5 text-white font-display font-extrabold text-2xl group focus:outline-none hover:text-[var(--violet-bright)] transition-colors"
            >
              <MapPin className="w-6 h-6 text-[var(--violet-bright)] group-hover:scale-110 transition-transform" />
              {activeCity}
              <ChevronDown className={`w-5 h-5 text-[var(--text-muted)] transition-transform duration-300 ${showCityDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Desktop City Dropdown */}
            <AnimatePresence>
              {showCityDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute top-full left-0 mt-3 w-56 z-50 rounded-2xl overflow-hidden glass-card border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.5)] bg-[var(--bg-card)]/95"
                >
                  {['Visakhapatnam', 'Hyderabad', 'Bangalore', 'Mumbai', 'Delhi'].map(city => (
                    <button
                      key={city}
                      onClick={() => {
                        setCity(city);
                        setShowCityDropdown(false);
                      }}
                      className={`w-full text-left px-5 py-3.5 text-xs font-bold transition-colors ${
                        activeCity === city 
                          ? 'bg-[var(--violet-primary)] text-white' 
                          : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search events, artists, clubs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-xs text-white outline-none focus:bg-white/10 focus:border-[var(--violet-bright)]/40 transition-all placeholder:text-[var(--text-muted)]"
              />
            </div>
          </div>
        </div>

        {/* ━━━ CATEGORY STRIP Redesigned ━━━ */}
        <div className="overflow-x-auto scrollbar-none -mx-4 px-4 mb-8 md:mb-10 unique-snap-scroller">
          <div className="flex gap-3.5 md:gap-5 min-w-max pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="flex flex-col items-center gap-2 flex-shrink-0 group focus:outline-none active:scale-95 transition-all"
              >
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all duration-300 relative overflow-hidden ${
                  activeCategory === cat.id
                    ? 'bg-[var(--violet-primary)] border border-[var(--violet-bright)]/40 shadow-[0_0_20px_rgba(124,58,237,0.4)] scale-102'
                    : 'bg-white/5 border border-white/10 group-hover:bg-white/10 group-hover:border-white/20'
                }`}>
                  <cat.icon className={`w-5 h-5 md:w-6 h-6 transition-colors ${
                    activeCategory === cat.id ? 'text-white' : 'text-[var(--text-muted)] group-hover:text-white'
                  }`} />
                  
                  {activeCategory === cat.id && (
                    <span className="absolute bottom-0 inset-x-0 h-0.5 bg-white/40 shadow-[0_-2px_10px_white]" />
                  )}
                </div>
                <span className={`text-[8px] md:text-[9px] font-bold tracking-widest uppercase transition-colors ${
                  activeCategory === cat.id ? 'text-white font-extrabold' : 'text-[var(--text-muted)] group-hover:text-white'
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
            <div className="h-48 sm:h-64 md:h-[300px] rounded-3xl bg-white/5" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[4/3] rounded-2xl bg-white/5" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8 md:space-y-12 pb-24">

            {/* ── Featured Hero Redesigned ── */}
            {events.length > 0 && (
              <section 
                onClick={() => navigate(`/events/${events[0].id}`)}
                className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/40 group shadow-[0_20px_50px_rgba(0,0,0,0.5)] cursor-pointer transition-all duration-300 hover:border-[var(--violet-bright)]/30"
              >
                {/* Background blurred visual bleed underlay */}
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                  <img
                    src={getImageUrl(events[0].cover_image)}
                    alt=""
                    className="w-full h-full object-cover blur-3xl opacity-45 scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/40 to-transparent" />
                </div>

                {/* Card Layout Engine */}
                <div className="relative z-10 flex flex-col md:flex-row items-stretch gap-0 md:gap-8 p-0 md:p-6">
                  {/* Visual Image Container */}
                  <div className="w-full md:w-5/12 aspect-video md:aspect-auto md:h-auto rounded-t-[2rem] md:rounded-2xl rounded-b-none overflow-hidden md:border border-white/5 shrink-0 relative bg-black/20 group-hover:shadow-[0_0_30px_rgba(124,58,237,0.15)] transition-all duration-500">
                    {/* The real image - crisp and perfectly scaled */}
                    <img
                      src={getImageUrl(events[0].cover_image)}
                      alt={events[0].title}
                      className="w-full h-full object-cover relative z-10 transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* Glowing underlay */}
                    <img
                      src={getImageUrl(events[0].cover_image)}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover blur-xl opacity-60 scale-110 pointer-events-none"
                    />
                    {/* Mobile Only: bottom vignette gradient to cover the image text overlay */}
                    <div className="md:hidden absolute inset-0 z-20 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                    
                    {/* Mobile Only: Text overlay directly inside the image container on mobile */}
                    <div className="md:hidden absolute bottom-0 inset-x-0 z-30 p-5 space-y-3">
                      <span className="inline-flex items-center gap-1 bg-[var(--violet-primary)] text-white text-[8px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-[0_0_10px_rgba(124,58,237,0.4)]">
                        <Sparkles className="w-2.5 h-2.5 text-amber-300 animate-pulse" /> Trending
                      </span>
                      <h3 className="text-base font-display font-extrabold text-white leading-snug line-clamp-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        {events[0].title}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1 text-white/95 text-[10px] bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/5">
                          <MapPin className="w-3 h-3 text-[var(--violet-bright)] shrink-0" />
                          <span className="font-bold truncate max-w-[120px]">{events[0].venue_name}</span>
                        </div>
                        <span className="text-[10px] font-extrabold bg-[var(--accent-green)]/20 text-[var(--accent-green)] border border-[var(--accent-green)]/30 px-2 py-0.5 rounded-lg backdrop-blur-md">
                          ₹{events[0].price === 0 ? 'FREE' : `${events[0].price}+`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Only Details: Hidden on mobile, beautiful on desktop */}
                  <div className="hidden md:flex flex-1 flex-col justify-between items-start py-4 pr-4 space-y-6">
                    <div className="space-y-3">
                      <span className="inline-flex items-center gap-1 bg-[var(--violet-primary)] text-white text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-[0_0_15px_rgba(124,58,237,0.4)]">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Trending Experiences
                      </span>
                      <h3 className="text-2xl md:text-3xl font-display font-extrabold text-white leading-snug group-hover:text-[var(--violet-bright)] transition-colors line-clamp-2">
                        {events[0].title}
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                        Join the most anticipated experience in the city. Book tickets now before slots run out!
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-white/80 text-xs flex-wrap bg-white/5 border border-white/5 px-4 py-2.5 rounded-2xl backdrop-blur-md">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[var(--violet-bright)] shrink-0 animate-pulse" />
                        <span className="font-semibold">{events[0].venue_name}</span>
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" />
                      <span className="font-extrabold text-[var(--accent-green)]">₹{events[0].price === 0 ? 'FREE' : `${events[0].price}+`}</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ── Recommended ── */}
            {events.length > 1 && (
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
                {/* Horizontal Scrollable Carousel with custom snap layout */}
                <div className="overflow-x-auto scrollbar-none -mx-4 px-4 unique-snap-scroller">
                  <div className="flex gap-4 pb-4">
                    {events.slice(1, 10).map((event) => (
                      <div key={event.id} className="w-[170px] sm:w-[220px] md:w-[240px] shrink-0">
                        <EventCard event={event} />
                      </div>
                    ))}
                  </div>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 [&>*]:min-w-0">
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