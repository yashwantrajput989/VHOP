import React, { useState, useEffect } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { Search, Download, Mail } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { AdminLogin } from './AdminLogin';

export const GuestList: React.FC = () => {
  const { user } = useAuthStore();
  const [guests, setGuests] = useState<any[]>([]);

  useEffect(() => {
    const fetchGuests = async () => {
      // In a real app, we'd join bookings with events and profiles
      // For now, let's show a mock but professional-looking list
      setGuests([
        { id: '1', name: 'Sarah Chen', email: 'sarah@example.com', event: 'Neon Night', ticket: 'VIP', status: 'checked-in' },
        { id: '2', name: 'Alex Rivera', email: 'alex@example.com', event: 'Neon Night', ticket: 'General', status: 'pending' },
        { id: '3', name: 'Riya Sharma', email: 'riya@example.com', event: 'Future Bass', ticket: 'Early Bird', status: 'checked-in' },
      ]);
    };
    fetchGuests();
  }, [user]);

  if (!user || (user.role !== 'admin' && user.role !== 'subadmin')) {
    return <AdminLogin forcedRole="admin" />;
  }

  return (

    <PageWrapper>
      <div className="space-y-8 pb-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-display font-bold">Guest List</h1>
            <p className="text-[var(--text-secondary)]">Manage attendees and check-ins for your events.</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-sm font-bold border border-white/10">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </header>

        <GlassCard className="p-0 overflow-hidden">
          <div className="p-6 border-b border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input 
                type="text" 
                placeholder="Search by name, email or event..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-2 focus:border-[var(--violet-bright)] outline-none"
              />
            </div>
            <div className="flex gap-2">
              {['All', 'Checked-in', 'Pending'].map(f => (
                <button key={f} className="px-4 py-1.5 rounded-lg bg-white/5 text-xs hover:bg-white/10 transition-colors">
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase">Guest</th>
                  <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase">Event</th>
                  <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase">Ticket</th>
                  <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {guests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-white">{guest.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{guest.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{guest.event}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-md bg-[var(--violet-primary)]/10 text-[var(--violet-bright)] text-[10px] font-bold uppercase">
                        {guest.ticket}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                        guest.status === 'checked-in' ? 'bg-[var(--accent-green)]/10 text-[var(--accent-green)]' : 'bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${guest.status === 'checked-in' ? 'bg-[var(--accent-green)]' : 'bg-[var(--accent-gold)]'}`} />
                        {guest.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-white transition-colors">
                        <Mail className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </PageWrapper>
  );
};
