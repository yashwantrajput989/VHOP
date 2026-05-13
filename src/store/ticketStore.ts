import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logToBackend } from '../lib/logger';
import { useAuthStore } from './authStore';

export interface Ticket {
  id: string;
  eventId: string;
  eventTitle: string;
  venueName: string;
  city: string;
  startDate: string;
  coverImage: string;
  ticketName: string;
  price: number;
  quantity: number;
  bookingId: string;
  qrCode: string;
  bookedAt: string;
}

interface TicketState {
  tickets: Ticket[];
  addTicket: (ticket: Ticket) => void;
  getTicketsByEvent: (eventId: string) => Ticket[];
}

export const useTicketStore = create<TicketState>()(
  persist(
    (set, get) => ({
      tickets: [],
      addTicket: (ticket) => {
        set((state) => ({ 
          tickets: [ticket, ...state.tickets] 
        }));
        const user = useAuthStore.getState().user;
        logToBackend('ticket_booking', user, { ticket });
      },
      getTicketsByEvent: (eventId) => get().tickets.filter(t => t.eventId === eventId),
    }),
    {
      name: 'vhop-tickets',
    }
  )
);
