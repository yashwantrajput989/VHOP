import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Minus, Plus, CreditCard, CheckCircle2, Loader2, Mail, Users, ArrowRight, User } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { GlowButton } from '../ui/GlowButton';
import { useAuthStore } from '../../store/authStore';
import { useTicketStore } from '../../store/ticketStore';
import { useUIStore } from '../../store/uiStore';
import { API_BASE_URL } from '../../config';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  selectedTicketId: string | null;
}

interface GuestDetail {
  name: string;
  age: string;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, event, selectedTicketId }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'details' | 'guests' | 'processing' | 'success'>('details');
  const [quantity, setQuantity] = useState(1);
  const [guests, setGuests] = useState<GuestDetail[]>([{ name: '', age: '' }]);
  const { user } = useAuthStore();
  const { addTicket } = useTicketStore();
  const { openModal } = useUIStore();
  
  const ticket = event.ticket_types?.find((t: any) => t.id === selectedTicketId) || event.ticket_types?.[0];
  
  const subtotal = (ticket?.price || 0) * quantity;
  const platformFee = 49;
  const totalAmount = subtotal + platformFee;

  useEffect(() => {
    if (!isOpen) {
      setStep('details');
      setQuantity(1);
      setGuests([{ name: '', age: '' }]);
    }
  }, [isOpen]);

  const updateGuestDetail = (index: number, field: keyof GuestDetail, value: string) => {
    const newGuests = [...guests];
    newGuests[index] = { ...newGuests[index], [field]: value };
    setGuests(newGuests);
  };

  const handleNextStep = () => {
    if (step === 'details') {
      // Initialize guests array based on quantity
      const newGuests = Array.from({ length: quantity }, (_, i) => guests[i] || { name: '', age: '' });
      setGuests(newGuests);
      setStep('guests');
    } else if (step === 'guests') {
      // Validate guests
      const isValid = guests.every(g => g.name.trim() !== '' && g.age.trim() !== '');
      if (!isValid) {
        alert('Please fill in all guest details');
        return;
      }
      handlePayment();
    }
  };

  const handlePayment = async () => {
    if (!user) {
      openModal('auth');
      return;
    }

    setStep('processing');
    
    try {
      const bookingId = `VH-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
      const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${bookingId}`;
      
      const bookingData = {
        event_id: event.id,
        event_title: event.title,
        venue_name: event.venue_name,
        city: event.city,
        start_date: event.start_date,
        cover_image: event.cover_image,
        user_id: user.id,
        quantity: quantity,
        total_amount: totalAmount,
        ticket_name: ticket.name,
        price: ticket.price,
        payment_id: `pay_simulated_${Math.random().toString(36).substring(7)}`,
        payment_status: 'paid',
        booking_status: 'confirmed',
        booking_id: bookingId,
        qr_code: qrCode,
        booked_at: new Date().toISOString(),
        guests: guests
      };

      // Save to MySQL Backend
      const response = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });

      if (!response.ok) throw new Error('Failed to save booking');
      const result = await response.json();
      
      addTicket({
        id: result.id,
        eventId: event.id,
        eventTitle: event.title,
        venueName: event.venue_name,
        city: event.city,
        startDate: event.start_date,
        coverImage: event.cover_image,
        ticketName: ticket.name,
        price: ticket.price,
        quantity: quantity,
        bookingId: bookingId,
        qrCode: qrCode,
        bookedAt: bookingData.booked_at,
        guests: guests
      });

      setStep('success');
    } catch (error) {
      console.error('Error during booking payment:', error);
      alert('Failed to complete booking. Please try again.');
      setStep('details');
    }
  };

  if (!isOpen || !ticket) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg z-10"
      >
        <GlassCard className="overflow-hidden border-[var(--violet-primary)]/30 max-h-[90vh] flex flex-col">
          <div className="p-6 border-b border-white/5 flex items-center justify-between flex-shrink-0">
            <h3 className="text-xl font-display font-bold">
              {step === 'details' ? 'Ticket Selection' : step === 'guests' ? 'Guest Details' : 'Checkout'}
            </h3>
            <button onClick={onClose} className="p-2 text-[var(--text-muted)] hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="wait">
              {step === 'details' && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                    <img src={event.cover_image} className="w-20 h-20 rounded-lg object-cover" alt="" />
                    <div>
                      <h4 className="font-bold text-white">{event.title}</h4>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">{event.venue_name}, {event.city}</p>
                      <div className="mt-2 text-[var(--violet-glow)] font-bold text-sm">{ticket.name}</div>
                      {ticket.benefits && (
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                          {ticket.benefits.map((benefit: string, idx: number) => (
                            <span key={idx} className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                              • {benefit}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-white font-bold">Number of People</span>
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Select up to 10 guests</p>
                      </div>
                      <div className="flex items-center gap-4 bg-white/5 rounded-lg p-1 border border-white/10">
                        <button 
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-4 text-center font-bold text-lg">{quantity}</span>
                        <button 
                          onClick={() => setQuantity(Math.min(10, quantity + 1))}
                          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-white/5">
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--text-secondary)]">Subtotal ({quantity} x ₹{ticket.price})</span>
                        <span className="text-white">₹{subtotal}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--text-secondary)]">Platform Fee</span>
                        <span className="text-white">₹{platformFee}</span>
                      </div>
                      <div className="flex justify-between text-xl font-bold pt-4 text-white">
                        <span>Total Payable</span>
                        <span className="text-gradient">₹{totalAmount}</span>
                      </div>
                    </div>
                  </div>

                  <GlowButton onClick={handleNextStep} className="w-full py-4 text-lg">
                    Next: Guest Details <ArrowRight className="w-5 h-5 ml-2 inline" />
                  </GlowButton>
                </motion.div>
              )}

              {step === 'guests' && (
                <motion.div
                  key="guests"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    {guests.map((guest, index) => (
                      <div key={index} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-[var(--violet-bright)]" />
                          <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Guest {index + 1}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="col-span-2 space-y-1.5">
                            <label className="text-[10px] text-[var(--text-muted)] uppercase">Full Name</label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                              <input
                                type="text"
                                placeholder="Enter name"
                                value={guest.name}
                                onChange={(e) => updateGuestDetail(index, 'name', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-[var(--violet-bright)] outline-none transition-all"
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-[var(--text-muted)] uppercase">Age</label>
                            <input
                              type="number"
                              placeholder="Age"
                              value={guest.age}
                              onChange={(e) => updateGuestDetail(index, 'age', e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-[var(--violet-bright)] outline-none transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => setStep('details')}
                      className="flex-1 py-4 rounded-xl border border-white/10 text-[var(--text-secondary)] font-bold hover:bg-white/5 transition-all"
                    >
                      Back
                    </button>
                    <GlowButton onClick={handleNextStep} className="flex-[2] py-4">
                      Proceed to Pay ₹{totalAmount}
                    </GlowButton>
                  </div>
                </motion.div>
              )}

              {step === 'processing' && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-12 flex flex-col items-center justify-center text-center space-y-6"
                >
                  <div className="relative">
                    <Loader2 className="w-16 h-16 text-[var(--violet-bright)] animate-spin" />
                    <CreditCard className="absolute inset-0 m-auto w-6 h-6 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-display font-bold">Securing your spot...</h3>
                    <p className="text-[var(--text-secondary)]">Please do not refresh or close this window. We are confirming your booking at {event.venue_name}.</p>
                  </div>
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-12 flex flex-col items-center justify-center text-center space-y-6"
                >
                  <div className="w-20 h-20 rounded-full bg-[var(--accent-green)]/20 border border-[var(--accent-green)]/40 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-[var(--accent-green)]" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-display font-bold text-white">See you at the event!</h3>
                    <p className="text-[var(--text-secondary)] text-lg">Your tickets have been confirmed.</p>
                  </div>
                  
                  <div className="w-full p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                    <Mail className="w-5 h-5 text-[var(--violet-bright)]" />
                    <span>A confirmation ticket has been sent to <strong>{user?.email}</strong></span>
                  </div>

                  <div className="w-full pt-6 space-y-3">
                    <GlowButton 
                      onClick={() => {
                        onClose();
                        navigate('/profile');
                      }} 
                      variant="secondary" 
                      className="w-full py-4"
                    >
                      View My Tickets
                    </GlowButton>
                    <button 
                      onClick={onClose}
                      className="text-sm font-bold text-[var(--text-muted)] hover:text-white transition-colors"
                    >
                      Back to Events
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};
