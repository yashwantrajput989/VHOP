import { create } from 'zustand';

interface Event {
  id: string;
  title: string;
  description: string;
  short_description: string;
  category: string;
  city: string;
  venue_name: string;
  start_date: string;
  price: number;
  cover_image: string;
  tickets_sold: number;
  total_tickets: number;
}

interface EventsState {
  events: Event[];
  featuredEvents: Event[];
  isLoading: boolean;
  setEvents: (events: Event[]) => void;
  setFeaturedEvents: (events: Event[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useEventsStore = create<EventsState>((set) => ({
  events: [],
  featuredEvents: [],
  isLoading: false,
  setEvents: (events) => set({ events }),
  setFeaturedEvents: (featuredEvents) => set({ featuredEvents }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
