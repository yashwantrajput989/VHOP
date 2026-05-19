import React, { useEffect, useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { 
  Users, 
  Building, 
  Calendar, 
  IndianRupee, 
  CheckCircle, 
  Plus, 
  AlertCircle, 
  Terminal, 
  Clipboard, 
  UserCheck, 
  Clock
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { AdminLogin } from '../admin/AdminLogin';
import { API_BASE_URL } from '../../config';
import { useLocation, useNavigate } from 'react-router-dom';

type TabType = 'dashboard' | 'events' | 'partners' | 'issues';

export const SuperDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeCompanies: 0,
    totalEvents: 0,
    grossRevenue: 0
  });
  const [events, setEvents] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  // Modal states
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [eventBookings, setEventBookings] = useState<any[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [isAddingPartner, setIsAddingPartner] = useState(false);
  
  // New partner form state
  const [newPartner, setNewPartner] = useState({
    email: '',
    password: '',
    full_name: '',
    company_name: '',
    city: 'Visakhapatnam'
  });
  const [createdPartnerCreds, setCreatedPartnerCreds] = useState<any>(null);

  // Fetch all statistics and datasets
  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/superadmin/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setEvents(data.events || []);
        setPartners(data.partners || []);
      }
    } catch (error) {
      console.error('Error fetching superadmin stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'superadmin') {
      fetchStats();
    }
  }, [user]);

  // Sync active tab with location path
  useEffect(() => {
    if (location.pathname.endsWith('/events')) {
      setActiveTab('events');
    } else if (location.pathname.endsWith('/partners')) {
      setActiveTab('partners');
    } else if (location.pathname.endsWith('/issues')) {
      setActiveTab('issues');
    } else {
      setActiveTab('dashboard');
    }
  }, [location.pathname]);

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    if (tabId === 'dashboard') {
      navigate('/superadmin');
    } else {
      navigate(`/superadmin/${tabId}`);
    }
  };

  // Approve a pending draft event
  const handleApproveEvent = async (eventId: string) => {
    if (window.confirm('Approve and publish this event to the live feed?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/superadmin/events/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId })
        });
        if (response.ok) {
          alert('Event approved and is now live!');
          fetchStats();
        } else {
          throw new Error('Failed to approve');
        }
      } catch (error) {
        console.error('Error approving event:', error);
        alert('Failed to approve event.');
      }
    }
  };

  // View Guest list for a specific event
  const handleViewEventDetails = async (event: any) => {
    setSelectedEvent(event);
    setIsLoadingBookings(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/bookings/event/${event.id}`);
      if (response.ok) {
        const data = await response.json();
        setEventBookings(data || []);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  // Add Partner
  const handleAddPartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/superadmin/partners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPartner)
      });
      if (response.ok) {
        setCreatedPartnerCreds({ ...newPartner });
        setNewPartner({
          email: '',
          password: '',
          full_name: '',
          company_name: '',
          city: 'Visakhapatnam'
        });
        fetchStats();
      } else {
        const err = await response.json();
        throw new Error(err.error || 'Failed to add partner');
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const copyCredsToClipboard = () => {
    if (!createdPartnerCreds) return;
    const text = `VHOP Partner Credentials:\nLogin Portal: https://vhop.in/admin/login\nEmail: ${createdPartnerCreds.email}\nPassword: ${createdPartnerCreds.password}\nCompany: ${createdPartnerCreds.company_name}`;
    navigator.clipboard.writeText(text);
    alert('Credentials copied to clipboard! You can share this directly with the partner.');
  };

  const platformData = [
    { name: 'Music', value: events.filter(e => e.category === 'Music').length || 1, color: 'var(--violet-bright)' },
    { name: 'Comedy', value: events.filter(e => e.category === 'Comedy').length || 1, color: 'var(--accent-pink)' },
    { name: 'Art', value: events.filter(e => e.category === 'Art').length || 1, color: 'var(--accent-cyan)' },
    { name: 'Club', value: events.filter(e => e.category === 'Club').length || 1, color: 'var(--accent-gold)' },
  ];

  if (!user || user.role !== 'superadmin') {
    return <AdminLogin forcedRole="superadmin" />;
  }

  if (isLoading && !events.length) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--violet-bright)]"></div>
        </div>
      </PageWrapper>
    );
  }

  const pendingEvents = events.filter(e => e.status === 'draft' || e.status === 'pending');
  const ongoingEvents = events.filter(e => e.status === 'published');

  return (
    <PageWrapper>
      <div className="space-y-8 pb-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-display font-bold">Super Admin Control</h1>
            <p className="text-[var(--text-secondary)]">Manage VHOP global system, events, partners, and live issues.</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setIsAddingPartner(true)}
              className="px-6 py-2 rounded-xl bg-[image:var(--gradient-hero)] font-bold text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Partner
            </button>
          </div>
        </header>

        {/* Tab Selector */}
        <div className="flex bg-white/5 border border-white/10 p-1.5 rounded-2xl w-fit max-w-full overflow-x-auto scrollbar-none flex-nowrap">
          {[
            { id: 'dashboard', label: 'Overview', icon: Users },
            { id: 'events', label: `Events (${pendingEvents.length} Pending)`, icon: Calendar },
            { id: 'partners', label: 'Partners', icon: Building },
            { id: 'issues', label: 'Issues & Status', icon: AlertCircle },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as TabType)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex-shrink-0 ${
                activeTab === tab.id 
                  ? 'bg-[var(--violet-primary)] text-white shadow-glow' 
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* TABS VIEWPORT */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Total App Users', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'var(--violet-bright)' },
                  { label: 'Verified Venues', value: stats.activeCompanies.toLocaleString(), icon: Building, color: 'var(--accent-pink)' },
                  { label: 'Total Events Added', value: stats.totalEvents.toLocaleString(), icon: Calendar, color: 'var(--accent-cyan)' },
                  { label: 'Gross Revenue', value: `₹${(stats.grossRevenue / 100000).toFixed(2)}L`, icon: IndianRupee, color: 'var(--accent-gold)' },
                ].map((kpi, i) => (
                  <GlassCard key={i} className="p-6">
                    <div className="p-3 w-fit rounded-xl bg-white/5 mb-4" style={{ color: kpi.color }}>
                      <kpi.icon className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-[var(--text-muted)] font-medium">{kpi.label}</p>
                    <h3 className="text-3xl font-display font-bold mt-1">{kpi.value}</h3>
                  </GlassCard>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <GlassCard className="p-8">
                  <h3 className="text-xl font-bold font-display mb-8">Category Events Volume</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={platformData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)'}} />
                        <Tooltip 
                          contentStyle={{backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)', borderRadius: '12px'}}
                        />
                        <Bar dataKey="value" fill="var(--violet-primary)" radius={[4, 4, 0, 0]}>
                          {platformData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>

                <GlassCard className="p-8">
                  <h3 className="text-xl font-bold font-display mb-8">Platform Category Spread</h3>
                  <div className="h-[300px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={platformData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {platformData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)', borderRadius: '12px'}}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="w-1/2 space-y-4">
                      {platformData.map((d, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="text-sm font-medium">{d.name}</span>
                          <span className="text-sm text-[var(--text-muted)] ml-auto">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </div>
            </motion.div>
          )}

          {activeTab === 'events' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Event Requests Pending Approval */}
              <GlassCard className="p-8 border-[var(--violet-primary)]/20">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold font-display text-white">Event Approval Requests</h3>
                  <span className="bg-[var(--violet-primary)] px-3 py-1 rounded-full text-xs font-bold">{pendingEvents.length} Pending</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[var(--text-muted)] text-xs uppercase tracking-wider border-b border-[var(--border-subtle)]">
                        <th className="pb-4 font-bold">Event Title</th>
                        <th className="pb-4 font-bold">Venue & City</th>
                        <th className="pb-4 font-bold">Partner / Brand</th>
                        <th className="pb-4 font-bold">Price</th>
                        <th className="pb-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {pendingEvents.length > 0 ? pendingEvents.map((row) => (
                        <tr key={row.id} className="border-b border-[var(--border-subtle)]/50 group hover:bg-white/5 transition-colors">
                          <td className="py-4 font-bold flex items-center gap-3">
                            <span className="text-white hover:text-[var(--violet-bright)] cursor-pointer" onClick={() => handleViewEventDetails(row)}>
                              {row.title}
                            </span>
                          </td>
                          <td className="py-4 text-[var(--text-secondary)]">{row.venue_name}, {row.city}</td>
                          <td className="py-4 text-[var(--violet-bright)] font-semibold">{row.company_name || 'Venue Partner'}</td>
                          <td className="py-4 font-medium text-white">{row.price === 0 ? 'FREE' : `₹${row.price}`}</td>
                          <td className="py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleViewEventDetails(row)}
                                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-colors"
                              >
                                Review Details
                              </button>
                              <button 
                                onClick={() => handleApproveEvent(row.id)}
                                className="px-4 py-2 rounded-lg bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/25 transition-colors text-xs font-bold"
                              >
                                Approve & Publish
                              </button>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-[var(--text-muted)]">No pending event approvals. All events are current.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </GlassCard>

              {/* Ongoing / Active Events */}
              <GlassCard className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold font-display">Ongoing & Approved Events</h3>
                  <span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-xs font-bold border border-green-500/25">{ongoingEvents.length} Published</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[var(--text-muted)] text-xs uppercase tracking-wider border-b border-[var(--border-subtle)]">
                        <th className="pb-4 font-bold">Event</th>
                        <th className="pb-4 font-bold">Venue</th>
                        <th className="pb-4 font-bold">Tickets Booked</th>
                        <th className="pb-4 font-bold">Revenue Generated</th>
                        <th className="pb-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {ongoingEvents.map((row) => (
                        <tr key={row.id} className="border-b border-[var(--border-subtle)]/50 group hover:bg-white/5 transition-colors">
                          <td className="py-4 font-bold text-white cursor-pointer hover:text-[var(--violet-bright)]" onClick={() => handleViewEventDetails(row)}>
                            {row.title}
                          </td>
                          <td className="py-4 text-[var(--text-secondary)]">{row.venue_name}, {row.city}</td>
                          <td className="py-4 font-medium text-white">{row.tickets_sold} sold</td>
                          <td className="py-4 font-semibold text-[var(--accent-gold)]">₹{((row.tickets_sold || 0) * row.price).toLocaleString()}</td>
                          <td className="py-4 text-right">
                            <button 
                              onClick={() => handleViewEventDetails(row)}
                              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all"
                            >
                              View Guest List
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {activeTab === 'partners' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Partner List */}
              <GlassCard className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold font-display text-white">Registered Venue Partners</h3>
                  <span className="bg-[var(--violet-primary)] px-3 py-1 rounded-full text-xs font-bold">{partners.length} Total</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[var(--text-muted)] text-xs uppercase tracking-wider border-b border-[var(--border-subtle)]">
                        <th className="pb-4 font-bold">Partner Name</th>
                        <th className="pb-4 font-bold">Email</th>
                        <th className="pb-4 font-bold">Company Name</th>
                        <th className="pb-4 font-bold">City</th>
                        <th className="pb-4 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {partners.map((row) => (
                        <tr key={row.id} className="border-b border-[var(--border-subtle)]/50 group hover:bg-white/5 transition-colors">
                          <td className="py-4 font-bold text-white">{row.full_name}</td>
                          <td className="py-4 text-[var(--text-secondary)]">{row.email}</td>
                          <td className="py-4 text-[var(--violet-bright)] font-semibold">{row.company_name}</td>
                          <td className="py-4 text-[var(--text-muted)]">{row.company_city}</td>
                          <td className="py-4">
                            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                              Active Partner
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {activeTab === 'issues' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Technical checks and live server logs mock */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { title: 'MySQL Status', status: 'Healthy', desc: 'Active connections pool ready', color: '#10b981' },
                  { title: 'Hostinger Node Server', status: 'Online', desc: 'Running on port 5000', color: '#10b981' },
                  { title: 'SMTP Notifications', status: 'Configured', desc: 'SMTP secure transport operational', color: '#10b981' },
                ].map((chk, i) => (
                  <GlassCard key={i} className="p-6 flex items-start gap-4">
                    <div className="p-3.5 rounded-2xl bg-white/5" style={{ color: chk.color }}>
                      <Terminal className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{chk.title}</h4>
                      <p className="text-xs font-bold mt-1" style={{ color: chk.color }}>{chk.status}</p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1">{chk.desc}</p>
                    </div>
                  </GlassCard>
                ))}
              </div>

              {/* Reported Issues and logs console */}
              <GlassCard className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold font-display text-white">Live Operations Log</h3>
                  <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-[var(--text-muted)] flex items-center gap-1.5 font-bold">
                    <Clock className="w-3.5 h-3.5 text-[var(--violet-bright)]" /> System Diagnostics
                  </span>
                </div>
                <div className="bg-black/90 border border-white/5 rounded-2xl p-6 font-mono text-xs text-gray-300 space-y-4 max-h-[300px] overflow-y-auto">
                  <p className="text-[var(--violet-bright)]">[SYS] Initializing diagnostic scans...</p>
                  <p className="text-green-400">[DB] Connected successfully to host: localhost</p>
                  <p className="text-yellow-400">[WARN] Razorpay startup credentials missing, bypassed payment gateway safely.</p>
                  <p className="text-green-400">[AUTH] Decoupled Firebase. Local authentication database layer successfully initialized.</p>
                  <p className="text-gray-400">[API] GET /api/events - fetched published events - 200 OK</p>
                  <p className="text-gray-400">[API] POST /api/auth/login - admin authentication successful - 200 OK</p>
                  <p className="text-green-400">[SYS] Platform status is 100% operational.</p>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MODAL: Event Review / Guest List Modal */}
        <AnimatePresence>
          {selectedEvent && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedEvent(null)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-4xl z-10"
              >
                <GlassCard className="p-8 border-[var(--violet-primary)]/30 max-h-[90vh] overflow-y-auto">
                  <header className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          selectedEvent.status === 'published' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                        }`}>
                          {selectedEvent.status}
                        </span>
                        <p className="text-xs text-[var(--text-muted)]">Event Details & Bookings</p>
                      </div>
                      <h2 className="text-3xl font-display font-bold mt-1 text-white">{selectedEvent.title}</h2>
                    </div>
                    <button onClick={() => setSelectedEvent(null)} className="p-2 hover:bg-white/5 rounded-lg text-white font-bold">
                      ✕
                    </button>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="p-4 rounded-xl bg-white/5 space-y-3">
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Logistics</p>
                      <p className="text-sm font-medium text-white"><span className="text-[var(--text-muted)]">Venue:</span> {selectedEvent.venue_name}</p>
                      <p className="text-sm font-medium text-white"><span className="text-[var(--text-muted)]">City:</span> {selectedEvent.city}</p>
                      <p className="text-sm font-medium text-white"><span className="text-[var(--text-muted)]">Date:</span> {new Date(selectedEvent.start_date).toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 space-y-3">
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Financials</p>
                      <p className="text-sm font-medium text-white"><span className="text-[var(--text-muted)]">Base Ticket Price:</span> {selectedEvent.price === 0 ? 'FREE' : `₹${selectedEvent.price}`}</p>
                      <p className="text-sm font-medium text-white"><span className="text-[var(--text-muted)]">Tickets Sold:</span> {selectedEvent.tickets_sold || 0} bookings</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 flex flex-col justify-center items-center text-center">
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Actions</p>
                      {selectedEvent.status !== 'published' ? (
                        <button 
                          onClick={() => {
                            handleApproveEvent(selectedEvent.id);
                            setSelectedEvent(null);
                          }}
                          className="px-6 py-2.5 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/25 transition-all text-xs font-bold"
                        >
                          Approve & Publish Live
                        </button>
                      ) : (
                        <div className="text-green-500 font-bold text-xs flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Live on Platform
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Booking / Guest List Section */}
                  <div className="border-t border-white/10 pt-6">
                    <h3 className="text-lg font-bold font-display mb-4 text-white">Event Guest List</h3>
                    
                    {isLoadingBookings ? (
                      <div className="py-12 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--violet-bright)]"></div>
                      </div>
                    ) : eventBookings.length > 0 ? (
                      <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider border-b border-[var(--border-subtle)]">
                              <th className="pb-3 font-bold">Guest Name</th>
                              <th className="pb-3 font-bold">Email</th>
                              <th className="pb-3 font-bold">Quantity</th>
                              <th className="pb-3 font-bold">Paid Status</th>
                              <th className="pb-3 font-bold">Booking ID</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm">
                            {eventBookings.map((b) => (
                              <tr key={b.id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="py-3 text-white font-semibold">{b.user_name || 'Guest User'}</td>
                                <td className="py-3 text-[var(--text-secondary)]">{b.user_email}</td>
                                <td className="py-3 text-white font-medium">{b.quantity} tickets</td>
                                <td className="py-3">
                                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                                    {b.payment_status || 'Paid'}
                                  </span>
                                </td>
                                <td className="py-3 font-mono text-xs text-[var(--text-muted)]">{b.booking_id}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-12 text-center text-[var(--text-muted)] text-sm">
                        No tickets booked for this event yet.
                      </div>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL: Add New Partner Form */}
        <AnimatePresence>
          {isAddingPartner && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAddingPartner(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-xl z-10"
              >
                <GlassCard className="p-8 border-[var(--violet-primary)]/30">
                  <header className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-display font-bold text-white">Create Venue Partner</h2>
                      <p className="text-xs text-[var(--text-muted)]">Register a partner admin with access to /admin portal</p>
                    </div>
                    <button 
                      onClick={() => {
                        setIsAddingPartner(false);
                        setCreatedPartnerCreds(null);
                      }} 
                      className="p-2 hover:bg-white/5 rounded-lg text-white font-bold"
                    >
                      ✕
                    </button>
                  </header>

                  {createdPartnerCreds ? (
                    <div className="space-y-6 text-center py-6">
                      <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-400">
                        <UserCheck className="w-8 h-8" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-white">Partner Added Successfully!</h3>
                        <p className="text-sm text-[var(--text-muted)]">Below are their login credentials. Share them securely.</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-black/80 border border-white/10 text-left font-mono text-xs space-y-2 select-all">
                        <p className="text-white"><span className="text-[var(--text-muted)]">Portal URL:</span> https://vhop.in/admin/login</p>
                        <p className="text-white"><span className="text-[var(--text-muted)]">Email:</span> {createdPartnerCreds.email}</p>
                        <p className="text-white"><span className="text-[var(--text-muted)]">Password:</span> {createdPartnerCreds.password}</p>
                        <p className="text-white"><span className="text-[var(--text-muted)]">Company:</span> {createdPartnerCreds.company_name}</p>
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={copyCredsToClipboard}
                          className="flex-1 py-3.5 rounded-xl bg-[var(--violet-primary)] font-bold text-sm hover:shadow-glow transition-all flex items-center justify-center gap-2"
                        >
                          <Clipboard className="w-4 h-4" /> Copy Credentials
                        </button>
                        <button
                          onClick={() => {
                            setIsAddingPartner(false);
                            setCreatedPartnerCreds(null);
                          }}
                          className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/10 font-bold text-sm hover:bg-white/10 transition-all text-white"
                        >
                          Close Window
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleAddPartnerSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase">Partner Name</label>
                        <input 
                          type="text" 
                          required
                          value={newPartner.full_name}
                          onChange={(e) => setNewPartner({...newPartner, full_name: e.target.value})}
                          placeholder="e.g. Alex Rivera"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[var(--violet-bright)] outline-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase">Business Email</label>
                        <input 
                          type="email" 
                          required
                          value={newPartner.email}
                          onChange={(e) => setNewPartner({...newPartner, email: e.target.value})}
                          placeholder="e.g. manager@velvetclub.com"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[var(--violet-bright)] outline-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase">Login Password</label>
                        <input 
                          type="password" 
                          required
                          value={newPartner.password}
                          onChange={(e) => setNewPartner({...newPartner, password: e.target.value})}
                          placeholder="••••••••"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[var(--violet-bright)] outline-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase">Company/Brand Name</label>
                        <input 
                          type="text" 
                          required
                          value={newPartner.company_name}
                          onChange={(e) => setNewPartner({...newPartner, company_name: e.target.value})}
                          placeholder="e.g. Velvet Night Lounge"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[var(--violet-bright)] outline-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase">City</label>
                        <select 
                          value={newPartner.city}
                          onChange={(e) => setNewPartner({...newPartner, city: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[var(--violet-bright)] outline-none"
                        >
                          <option value="Visakhapatnam">Visakhapatnam</option>
                          <option value="Mumbai">Mumbai</option>
                          <option value="Bangalore">Bangalore</option>
                          <option value="Hyderabad">Hyderabad</option>
                          <option value="Delhi">Delhi</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-4 rounded-xl bg-[var(--violet-primary)] text-white font-bold text-sm hover:shadow-glow transition-all mt-4"
                      >
                        Create Partner Account
                      </button>
                    </form>
                  )}
                </GlassCard>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
};
