import React, { useEffect, useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { TrendingUp, Users, Ticket, IndianRupee, ArrowUpRight, Plus, Pencil, Trash2, ShieldCheck } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { mockDb as dbClient } from '../../lib/mockDb';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { GlowButton } from '../../components/ui/GlowButton';
import { AdminLogin } from './AdminLogin';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [company, setCompany] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    activeEvents: 0,
    avgAttendance: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      // Fetch company
      const { data: companyData } = await dbClient
        .from('companies')
        .select('*')
        .eq('admin_user_id', user.id)
        .single();
      
      if (companyData) {
        setCompany(companyData);
        
        // Fetch events
        const { data: eventsData } = await dbClient
          .from('events')
          .select('*')
          .eq('company_id', companyData.id)
          .order('created_at', { ascending: false });
        
        if (eventsData) {
          setEvents(eventsData);
          
          // Calculate basic stats (mocked logic for now, could be real aggregation)
          const totalRevenue = eventsData.reduce((acc, ev) => acc + (ev.price * ev.tickets_sold), 0);
          const totalBookings = eventsData.reduce((acc, ev) => acc + ev.tickets_sold, 0);
          const activeEvents = eventsData.filter(ev => ev.status === 'published').length;
          
          setStats({
            totalRevenue,
            totalBookings,
            activeEvents,
            avgAttendance: totalBookings > 0 ? 85 : 0 // Placeholder
          });
        }
      }
      
      setIsLoading(false);
    };

    fetchDashboardData();
  }, [user]);

  const handleDeleteEvent = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      const { error } = await dbClient
        .from('events')
        .delete()
        .eq('id', id);
      
      if (!error) {
        setEvents(events.filter(e => e.id !== id));
      }
    }
  };

  const chartData = [
    { name: 'Mon', revenue: stats.totalRevenue * 0.1 },
    { name: 'Tue', revenue: stats.totalRevenue * 0.15 },
    { name: 'Wed', revenue: stats.totalRevenue * 0.1 },
    { name: 'Thu', revenue: stats.totalRevenue * 0.2 },
    { name: 'Fri', revenue: stats.totalRevenue * 0.25 },
    { name: 'Sat', revenue: stats.totalRevenue * 0.3 },
    { name: 'Sun', revenue: stats.totalRevenue * 0.2 },
  ];

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--violet-bright)]"></div>
        </div>
      </PageWrapper>
    );
  }

  if (!user || user.role !== 'admin') {
    return <AdminLogin forcedRole="admin" />;
  }

  if (!company || !company.verified) {
    return (
      <PageWrapper>
        <div className="max-w-2xl mx-auto py-12 space-y-8">
          <header className="text-center space-y-4">
            <div className="w-20 h-20 bg-[var(--accent-cyan)]/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-[var(--accent-cyan)]/20 shadow-[0_0_30px_rgba(34,211,238,0.1)]">
              <ShieldCheck className="w-10 h-10 text-[var(--accent-cyan)]" />
            </div>
            <h1 className="text-4xl font-display font-bold">Legal Verification</h1>
            <p className="text-[var(--text-secondary)]">Your application has been approved! Please complete the final legal steps to access your dashboard.</p>
          </header>

          <div className="grid gap-6">
            <GlassCard className="p-8 space-y-6">
              <div className="space-y-4">
                <h3 className="text-xl font-bold font-display">1. Upload Business Documents</h3>
                <p className="text-sm text-[var(--text-muted)]">Upload your GST certificate, Trade License, or any valid business registration document.</p>
                <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-[var(--violet-bright)] transition-colors cursor-pointer group">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <ArrowUpRight className="w-6 h-6 rotate-[-90deg] text-[var(--text-muted)] group-hover:text-[var(--violet-bright)]" />
                  </div>
                  <p className="text-sm font-bold text-[var(--text-muted)] group-hover:text-white">Click to upload or drag & drop</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">PDF, JPG, PNG (Max 5MB)</p>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-white/5">
                <h3 className="text-xl font-bold font-display">2. Terms & Conditions</h3>
                <div className="bg-white/5 rounded-xl p-4 h-32 overflow-y-auto text-xs text-[var(--text-muted)] space-y-2 leading-relaxed">
                  <p><strong>Article 1: Platform Usage</strong> - The partner agrees to list only authentic events and maintain the highest standards of safety at their venue.</p>
                  <p><strong>Article 2: Payouts</strong> - VHOP will process payouts on a weekly basis, deducting a 10% platform fee from each ticket sold.</p>
                  <p><strong>Article 3: Cancellations</strong> - In case of event cancellation, the partner is responsible for full refunds to the ticket holders.</p>
                  <p><strong>Article 4: Liability</strong> - VHOP acts only as a discovery and ticketing platform. All operational liability lies with the venue partner.</p>
                </div>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" className="mt-1 w-4 h-4 rounded border-white/10 bg-white/5 text-[var(--violet-bright)] focus:ring-[var(--violet-bright)]" />
                  <span className="text-sm text-[var(--text-secondary)] group-hover:text-white transition-colors">
                    I have read and agree to the VHOP Partner Terms of Service and Privacy Policy.
                  </span>
                </label>
              </div>

              <GlowButton 
                onClick={async () => {
                  setIsLoading(true);
                  // Mock verification update
                  await dbClient.from('companies').update({ verified: true }).eq('id', company?.id);
                  setCompany({...company, verified: true});
                  setIsLoading(false);
                }} 
                className="w-full py-4"
              >
                Complete Onboarding
              </GlowButton>
            </GlassCard>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="space-y-8 pb-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-display font-bold">{company?.name || 'My Dashboard'}</h1>
            <p className="text-[var(--text-secondary)]">Welcome back, Admin. Here's your performance overview.</p>
          </div>
          <GlowButton onClick={() => navigate('/admin/create-event')} className="gap-2">
            <Plus className="w-5 h-5" /> Create New Event
          </GlowButton>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Revenue', value: `₹${(stats.totalRevenue / 1000).toFixed(1)}k`, icon: IndianRupee, color: 'var(--accent-gold)', trend: '+12.5%' },
            { label: 'Total Bookings', value: stats.totalBookings.toLocaleString(), icon: Ticket, color: 'var(--violet-bright)', trend: '+8.2%' },
            { label: 'Active Events', value: stats.activeEvents, icon: TrendingUp, color: 'var(--accent-cyan)', trend: '0%' },
            { label: 'Avg Attendance', value: `${stats.avgAttendance}%`, icon: Users, color: 'var(--accent-pink)', trend: '+4.1%' },
          ].map((stat, i) => (
            <GlassCard key={i} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-white/5 text-[var(--text-muted)]" style={{ color: stat.color }}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-[var(--accent-green)] flex items-center gap-1">
                  {stat.trend} <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
              <p className="text-sm text-[var(--text-muted)] font-medium">{stat.label}</p>
              <h3 className="text-3xl font-display font-bold mt-1">{stat.value}</h3>
            </GlassCard>
          ))}
        </div>

        {/* Main Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <GlassCard className="lg:col-span-2 p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold font-display">Revenue Analytics</h3>
              <div className="flex gap-2">
                {['Day', 'Week', 'Month'].map(t => (
                  <button key={t} className="px-3 py-1 rounded-lg bg-white/5 text-xs hover:bg-white/10 transition-colors">
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--violet-primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--violet-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'var(--text-muted)', fontSize: 12}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'var(--text-muted)', fontSize: 12}}
                  />
                  <Tooltip 
                    contentStyle={{backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)', borderRadius: '12px'}}
                    itemStyle={{color: 'var(--text-primary)'}}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="var(--violet-bright)" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRev)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard className="p-8">
            <h3 className="text-xl font-bold font-display mb-6">Your Events</h3>
            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
              {events.length > 0 ? events.map((event) => (
                <div key={event.id} className="flex items-center gap-4 group">
                  <img src={event.cover_image} className="w-12 h-12 rounded-lg object-cover" alt="" />
                  <div className="flex-1">
                    <p className="text-sm font-bold truncate max-w-[150px]">{event.title}</p>
                    <p className="text-xs text-[var(--text-muted)]">{event.tickets_sold} bookings</p>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => navigate(`/admin/edit-event/${event.id}`)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteEvent(event.id)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <p className="text-[var(--text-muted)] text-sm">No events found.</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </PageWrapper>
  );
};
