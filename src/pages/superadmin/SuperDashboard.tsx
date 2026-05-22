import React, { useEffect, useState, useRef } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowButton } from '../../components/ui/GlowButton';
import { 
  Users, 
  Building, 
  Calendar, 
  IndianRupee, 
  CheckCircle, 
  Plus, 
  AlertCircle, 
  Clipboard, 
  UserCheck, 
  Clock,
  Trash2,
  Send,
  RefreshCw,
  MessageSquare
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

  // Support chat state variables for Super Admin
  const [supportChats, setSupportChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newReply, setNewReply] = useState('');
  const [isChatsLoading, setIsChatsLoading] = useState(false);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const fetchSupportChats = async (silent = false) => {
    if (!silent) setIsChatsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/superadmin/support/chats`);
      if (response.ok) {
        const data = await response.json();
        setSupportChats(data);
      }
    } catch (err) {
      console.error('Error fetching support chats:', err);
    } finally {
      if (!silent) setIsChatsLoading(false);
    }
  };

  const fetchChatMessages = async (chatId: string, silent = false) => {
    if (!chatId) return;
    if (!silent) setIsMessagesLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/support/messages/${chatId}`);
      if (response.ok) {
        const data = await response.json();
        setChatMessages(data);
      }
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    } finally {
      if (!silent) setIsMessagesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'issues' && user && user.role === 'superadmin') {
      fetchSupportChats();
      const interval = setInterval(() => {
        fetchSupportChats(true);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (selectedChatId) {
      fetchChatMessages(selectedChatId);
      const interval = setInterval(() => {
        fetchChatMessages(selectedChatId, true);
      }, 4000);
      return () => clearInterval(interval);
    } else {
      setChatMessages([]);
    }
  }, [selectedChatId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChatId || !newReply.trim()) return;

    setIsReplying(true);
    const replyText = newReply;
    setNewReply('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/support/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: selectedChatId,
          senderId: user?.id || 'super-admin-root',
          message: replyText,
        }),
      });

      if (response.ok) {
        const addedMsg = await response.json();
        setChatMessages((prev) => [...prev, addedMsg]);
        fetchSupportChats(true);
      } else {
        alert('Failed to send reply.');
        setNewReply(replyText);
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      alert('Failed to connect to backend.');
      setNewReply(replyText);
    } finally {
      setIsReplying(false);
    }
  };

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

  // Delete an event
  const handleDeleteEvent = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this event? This will also delete all associated bookings.')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/events/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          alert('Event deleted successfully');
          fetchStats();
          setSelectedEvent(null);
        } else {
          throw new Error('Failed to delete event');
        }
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event');
      }
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
                              <button 
                                onClick={() => handleDeleteEvent(row.id)}
                                className="p-2 rounded-lg bg-white/5 border border-white/10 text-red-500 hover:bg-red-500/20 hover:border-red-500/30 transition-all text-xs font-bold flex items-center justify-center"
                                title="Delete Event"
                              >
                                <Trash2 className="w-4 h-4" />
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
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleViewEventDetails(row)}
                                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all"
                              >
                                View Guest List
                              </button>
                              <button 
                                onClick={() => handleDeleteEvent(row.id)}
                                className="p-2 rounded-lg bg-white/5 border border-white/10 text-red-500 hover:bg-red-500/20 hover:border-red-500/30 transition-all text-xs font-bold flex items-center justify-center"
                                title="Delete Event"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
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
              className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-16rem)] min-h-[550px]"
            >
              {/* Left Column: Support Chats List */}
              <GlassCard className="p-0 overflow-hidden flex flex-col border border-white/5 shadow-xl h-full lg:col-span-1">
                <div className="p-6 border-b border-white/5 bg-white/[0.01] flex items-center justify-between flex-shrink-0">
                  <h3 className="font-bold font-display text-white text-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-[var(--accent-pink)]" /> Admin Channels
                  </h3>
                  <button
                    onClick={() => fetchSupportChats()}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
                    title="Refresh chats"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-white/5 bg-black/10">
                  {isChatsLoading && supportChats.length === 0 ? (
                    <div className="p-12 text-center text-xs text-[var(--text-muted)]">
                      <div className="animate-spin w-6 h-6 border-2 border-[var(--violet-bright)] border-t-transparent rounded-full mx-auto mb-3" />
                      Loading active support threads...
                    </div>
                  ) : supportChats.length === 0 ? (
                    <div className="p-12 text-center text-xs text-[var(--text-muted)] space-y-2 opacity-50">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-[var(--text-muted)]" />
                      <p className="font-semibold text-white">No Support Requests</p>
                      <p>Support messages sent by admins will appear here instantly.</p>
                    </div>
                  ) : (
                    supportChats.map((chat) => (
                      <button
                        key={chat.admin_id}
                        onClick={() => setSelectedChatId(chat.admin_id)}
                        className={`w-full p-5 text-left transition-all duration-300 flex flex-col gap-1.5 border-l-2 hover:bg-white/[0.02] cursor-pointer ${
                          selectedChatId === chat.admin_id
                            ? 'bg-white/[0.03] border-[var(--violet-bright)]'
                            : 'border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-white text-sm truncate max-w-[150px]">
                            {chat.company_name || 'Global Admin'}
                          </h4>
                          <span className="text-[9px] text-[var(--text-muted)] opacity-60">
                            {new Date(chat.last_message_time).toLocaleTimeString(undefined, {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                          By: {chat.admin_name}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)] truncate max-w-full italic">
                          "{chat.last_message}"
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </GlassCard>

              {/* Right Column: Chat History Area */}
              <GlassCard className="p-0 overflow-hidden flex flex-col border border-white/5 shadow-2xl h-full lg:col-span-2 relative">
                {selectedChatId ? (
                  <>
                    {/* Active Chat Info Bar */}
                    <div className="p-6 border-b border-white/5 bg-white/[0.01] flex items-center justify-between flex-shrink-0">
                      <div>
                        <h3 className="font-bold text-white font-display text-base">
                          {supportChats.find((c) => c.admin_id === selectedChatId)?.company_name || 'Global Admin'}
                        </h3>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                          Admin Partner: {supportChats.find((c) => c.admin_id === selectedChatId)?.admin_name} ({supportChats.find((c) => c.admin_id === selectedChatId)?.admin_email})
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedChatId('')}
                        className="text-xs text-[var(--text-muted)] hover:text-white font-medium hover:underline cursor-pointer"
                      >
                        Close Chat
                      </button>
                    </div>

                    {/* Support Conversation Pane */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 bg-black/10">
                      {isMessagesLoading && chatMessages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
                          <div className="animate-spin w-6 h-6 border-2 border-[var(--violet-bright)] border-t-transparent rounded-full mr-2" />
                          Retrieving historic conversation...
                        </div>
                      ) : (
                        chatMessages.map((msg) => {
                          const isMe = msg.sender_role === 'superadmin';

                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1 max-w-[85%] ${
                                isMe ? 'ml-auto' : 'mr-auto'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] px-1">
                                <span className="font-semibold text-white/70">{msg.sender_name}</span>
                                <span className="opacity-60">({msg.sender_role})</span>
                              </div>

                              <div
                                className={`px-5 py-3 rounded-2xl text-sm leading-relaxed ${
                                  isMe
                                    ? 'bg-[var(--accent-pink)] text-white rounded-tr-none border border-[var(--accent-pink)]/35 shadow-[0_4px_20px_rgba(244,63,94,0.15)]'
                                    : 'bg-white/5 text-white/90 border border-white/5 rounded-tl-none shadow-[0_4px_20px_rgba(255,255,255,0.01)]'
                                }`}
                              >
                                <p className="whitespace-pre-wrap">{msg.message}</p>
                              </div>

                              <span className="text-[9px] text-[var(--text-muted)] opacity-50 px-1.5">
                                {new Date(msg.created_at).toLocaleTimeString(undefined, {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          );
                        })
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Chat Text Input Area */}
                    <div className="p-4 border-t border-white/5 bg-white/[0.01] flex-shrink-0">
                      <form onSubmit={handleSendReply} className="flex gap-3">
                        <input
                          type="text"
                          value={newReply}
                          onChange={(e) => setNewReply(e.target.value)}
                          placeholder="Type your answer to help this admin..."
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-sm focus:border-[var(--violet-bright)] focus:bg-white/[0.08] outline-none transition-all duration-300"
                          disabled={isReplying}
                        />
                        <GlowButton
                          type="submit"
                          disabled={isReplying || !newReply.trim()}
                          className="px-6 flex items-center justify-center cursor-pointer"
                        >
                          {isReplying ? (
                            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </GlowButton>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-[var(--text-muted)] space-y-4 bg-black/10">
                    <MessageSquare className="w-16 h-16 opacity-10 text-[var(--text-muted)]" />
                    <div>
                      <h4 className="text-xl font-bold font-display text-white/80">Support Resolution Center</h4>
                      <p className="text-sm max-w-sm mt-2">
                        Select an active administrator support thread from the sidebar to review reported questions and submit answers instantly.
                      </p>
                    </div>
                  </div>
                )}
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
                      <div className="flex flex-col gap-2 w-full items-center">
                        {selectedEvent.status !== 'published' ? (
                          <button 
                            onClick={() => {
                              handleApproveEvent(selectedEvent.id);
                              setSelectedEvent(null);
                            }}
                            className="w-full px-4 py-2 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/25 transition-all text-xs font-bold"
                          >
                            Approve & Publish Live
                          </button>
                        ) : (
                          <div className="text-green-500 font-bold text-xs flex items-center gap-1 mb-1">
                            <CheckCircle className="w-4 h-4" /> Live on Platform
                          </div>
                        )}
                        <button 
                          onClick={() => {
                            handleDeleteEvent(selectedEvent.id);
                          }}
                          className="w-full px-4 py-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/25 transition-all text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                          <Trash2 className="w-4 h-4" /> Delete Event
                        </button>
                      </div>
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
