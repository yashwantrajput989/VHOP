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
  MessageSquare,
  Pencil,
  Ticket,
  Smartphone,
  Radio
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { AdminLogin } from '../admin/AdminLogin';
import { API_BASE_URL } from '../../config';
import { useLocation, useNavigate } from 'react-router-dom';

type TabType = 'dashboard' | 'events' | 'partners' | 'issues' | 'coupons' | 'fees' | 'sms';

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
  const [partnerApplications, setPartnerApplications] = useState<any[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [approvedCredentials, setApprovedCredentials] = useState<any>(null);
  
  // New partner form state
  const [newPartner, setNewPartner] = useState({
    email: '',
    password: '',
    full_name: '',
    company_name: '',
    city: 'Visakhapatnam'
  });
  const [createdPartnerCreds, setCreatedPartnerCreds] = useState<any>(null);

  // ── SMS Broadcast State ──────────────────────────────────────────────
  const [smsTemplates, setSmsTemplates] = useState<any[]>([]);
  const [smsMessage, setSmsMessage] = useState('');
  const [smsTemplateName, setSmsTemplateName] = useState('');
  const [selectedSmsTemplate, setSelectedSmsTemplate] = useState('');
  const [smsSendingEvent, setSmsSendingEvent] = useState(false);
  const [smsSendingAll, setSmsSendingAll] = useState(false);
  const [smsSelectedEventId, setSmsSelectedEventId] = useState('');
  const [smsGuestCount, setSmsGuestCount] = useState<number | null>(null);
  const [smsUserCount, setSmsUserCount] = useState<number | null>(null);
  const [smsFeedback, setSmsFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const fetchSmsTemplates = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/superadmin/sms/templates`);
      if (res.ok) setSmsTemplates(await res.json());
    } catch (e) { console.error('SMS templates fetch error:', e); }
  };

  const fetchSmsUserCount = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/superadmin/sms/user-count`);
      if (res.ok) { const d = await res.json(); setSmsUserCount(d.count); }
    } catch (e) { console.error('SMS user count error:', e); }
  };

  const fetchSmsGuestCount = async (eventId: string) => {
    if (!eventId) { setSmsGuestCount(null); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/api/superadmin/sms/event-guest-count/${eventId}`);
      if (res.ok) { const d = await res.json(); setSmsGuestCount(d.count); }
    } catch (e) { console.error('SMS guest count error:', e); }
  };

  const handleLoadSmsTemplate = (tplId: string) => {
    const tpl = smsTemplates.find(t => t.id === tplId);
    if (tpl) { setSmsMessage(tpl.body); setSmsTemplateName(tpl.name); }
    setSelectedSmsTemplate(tplId);
  };

  const handleSaveSmsTemplate = async () => {
    if (!smsMessage.trim() || !smsTemplateName.trim()) {
      setSmsFeedback({ type: 'error', msg: 'Enter both a name and message to save as template.' }); return;
    }
    setIsSavingTemplate(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/superadmin/sms/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedSmsTemplate || undefined, name: smsTemplateName, body: smsMessage })
      });
      if (res.ok) {
        await fetchSmsTemplates();
        setSmsFeedback({ type: 'success', msg: 'Template saved!' });
        setTimeout(() => setSmsFeedback(null), 3000);
      } else {
        const d = await res.json();
        setSmsFeedback({ type: 'error', msg: d.error || 'Save failed.' });
      }
    } catch (e) { setSmsFeedback({ type: 'error', msg: 'Network error.' }); }
    finally { setIsSavingTemplate(false); }
  };

  const handleDeleteSmsTemplate = async (id: string) => {
    if (!window.confirm('Delete this SMS template?')) return;
    await fetch(`${API_BASE_URL}/api/superadmin/sms/templates/${id}`, { method: 'DELETE' });
    await fetchSmsTemplates();
    if (selectedSmsTemplate === id) { setSelectedSmsTemplate(''); setSmsTemplateName(''); }
  };

  const handleSendToEventGuests = async () => {
    if (!smsSelectedEventId) { setSmsFeedback({ type: 'error', msg: 'Please select an event.' }); return; }
    if (!smsMessage.trim()) { setSmsFeedback({ type: 'error', msg: 'Message cannot be empty.' }); return; }
    if (!window.confirm(`Send this SMS to ${smsGuestCount ?? '?'} event guests?`)) return;
    setSmsSendingEvent(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/superadmin/sms/event-guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: smsSelectedEventId, message: smsMessage })
      });
      const d = await res.json();
      setSmsFeedback({ type: 'success', msg: d.message || 'SMS sending initiated!' });
      setTimeout(() => setSmsFeedback(null), 5000);
    } catch (e) { setSmsFeedback({ type: 'error', msg: 'Network error.' }); }
    finally { setSmsSendingEvent(false); }
  };

  const handleSendToAllUsers = async () => {
    if (!smsMessage.trim()) { setSmsFeedback({ type: 'error', msg: 'Message cannot be empty.' }); return; }
    if (!window.confirm(`Broadcast SMS to ALL ${smsUserCount ?? '?'} registered users? This cannot be undone.`)) return;
    setSmsSendingAll(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/superadmin/sms/all-users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: smsMessage })
      });
      const d = await res.json();
      setSmsFeedback({ type: 'success', msg: d.message || 'Broadcast initiated!' });
      setTimeout(() => setSmsFeedback(null), 5000);
    } catch (e) { setSmsFeedback({ type: 'error', msg: 'Network error.' }); }
    finally { setSmsSendingAll(false); }
  };

  // Coupons state
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discount_type: 'fixed',
    discount_value: '',
    min_purchase: '0',
    active: true
  });

  const fetchCoupons = async () => {
    setIsLoadingCoupons(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/coupons`);
      if (response.ok) {
        const data = await response.json();
        setCoupons(data);
      }
    } catch (err) {
      console.error('Error fetching coupons:', err);
    } finally {
      setIsLoadingCoupons(false);
    }
  };

  const handleAddCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCoupon.code,
          discount_type: newCoupon.discount_type,
          discount_value: Number(newCoupon.discount_value),
          min_purchase: Number(newCoupon.min_purchase),
          active: newCoupon.active
        })
      });
      if (response.ok) {
        setNewCoupon({
          code: '',
          discount_type: 'fixed',
          discount_value: '',
          min_purchase: '0',
          active: true
        });
        fetchCoupons();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add coupon');
      }
    } catch (err) {
      console.error('Add coupon error:', err);
      alert('Network error. Please try again.');
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!window.confirm(`Delete coupon code "${code}"?`)) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/coupons/${code}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchCoupons();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete coupon');
      }
    } catch (err) {
      console.error('Delete coupon error:', err);
      alert('Network error. Please try again.');
    }
  };

  // Fee settings state
  const [fees, setFees] = useState({
    platform_fee: 0,
    gst_rate: 0,
    high_demand_fee: 0,
    genre_fees: [] as { genre: string; price: number }[]
  });
  const [isSavingFees, setIsSavingFees] = useState(false);
  const [isLoadingFees, setIsLoadingFees] = useState(false);

  // New genre fee form state
  const [newGenreFee, setNewGenreFee] = useState({
    genre: '',
    price: ''
  });

  const fetchFees = async () => {
    setIsLoadingFees(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/settings/fees`);
      if (response.ok) {
        const data = await response.json();
        setFees({
          platform_fee: Number(data.platform_fee) || 0,
          gst_rate: Number(data.gst_rate) || 0,
          high_demand_fee: Number(data.high_demand_fee) || 0,
          genre_fees: data.genre_fees || []
        });
      }
    } catch (err) {
      console.error('Error fetching fees:', err);
    } finally {
      setIsLoadingFees(false);
    }
  };

  const handleUpdateGlobalFees = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingFees(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/settings/fees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform_fee: Number(fees.platform_fee),
          gst_rate: Number(fees.gst_rate),
          high_demand_fee: Number(fees.high_demand_fee)
        })
      });
      if (response.ok) {
        alert('Global fee settings updated successfully!');
        fetchFees();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update fees');
      }
    } catch (err) {
      console.error('Update fees error:', err);
      alert('Network error. Please try again.');
    } finally {
      setIsSavingFees(false);
    }
  };

  const handleAddGenreFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGenreFee.genre.trim() || newGenreFee.price === '') return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/settings/genre-fees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genre: newGenreFee.genre.trim(),
          price: Number(newGenreFee.price)
        })
      });
      if (response.ok) {
        setNewGenreFee({ genre: '', price: '' });
        fetchFees();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save genre fee');
      }
    } catch (err) {
      console.error('Add genre fee error:', err);
      alert('Network error. Please try again.');
    }
  };

  const handleDeleteGenreFee = async (genre: string) => {
    if (!window.confirm(`Delete fee mapping for genre "${genre}"?`)) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/settings/genre-fees/${encodeURIComponent(genre)}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchFees();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete genre fee');
      }
    } catch (err) {
      console.error('Delete genre fee error:', err);
      alert('Network error. Please try again.');
    }
  };

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
    if (activeTab === 'partners' && user && user.role === 'superadmin') {
      fetchPartnerApplications();
    }
    if (activeTab === 'coupons' && user && user.role === 'superadmin') {
      fetchCoupons();
    }
    if (activeTab === 'fees' && user && user.role === 'superadmin') {
      fetchFees();
    }
    if (activeTab === 'sms' && user && user.role === 'superadmin') {
      fetchSmsTemplates();
      fetchSmsUserCount();
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

  // Fetch partner applications
  const fetchPartnerApplications = async () => {
    setIsLoadingApplications(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/superadmin/partners/applications`);
      if (response.ok) {
        const data = await response.json();
        setPartnerApplications(data);
      }
    } catch (error) {
      console.error('Error fetching partner applications:', error);
    } finally {
      setIsLoadingApplications(false);
    }
  };

  // Handle approve application
  const handleApproveApplication = async (applicationId: string) => {
    if (!window.confirm('Approve this partner application? This will create admin credentials and send an email.')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/superadmin/partners/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId })
      });
      const data = await response.json();
      if (response.ok) {
        setApprovedCredentials(data.credentials);
        fetchPartnerApplications();
        fetchStats();
      } else {
        alert(data.error || 'Failed to approve application.');
      }
    } catch (error) {
      console.error('Approve error:', error);
      alert('Network error. Please try again.');
    }
  };

  // Handle reject application
  const handleRejectApplication = async (applicationId: string) => {
    if (!window.confirm('Reject this partner application?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/superadmin/partners/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId })
      });
      if (response.ok) {
        fetchPartnerApplications();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to reject application.');
      }
    } catch (error) {
      console.error('Reject error:', error);
      alert('Network error. Please try again.');
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
    } else if (location.pathname.endsWith('/coupons')) {
      setActiveTab('coupons');
    } else if (location.pathname.endsWith('/fees')) {
      setActiveTab('fees');
    } else if (location.pathname.endsWith('/sms')) {
      setActiveTab('sms');
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
            { id: 'coupons', label: 'Coupons', icon: Ticket },
            { id: 'fees', label: 'Fees Configurator', icon: IndianRupee },
            { id: 'sms', label: 'SMS Broadcast', icon: Smartphone },
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
                                onClick={() => navigate(`/admin/edit-event/${row.id}`)}
                                className="p-2 rounded-lg bg-white/5 border border-white/10 text-[var(--text-muted)] hover:text-white hover:border-white/20 transition-all text-xs font-bold flex items-center justify-center"
                                title="Edit Event"
                              >
                                <Pencil className="w-4 h-4" />
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
                                onClick={() => navigate(`/admin/edit-event/${row.id}`)}
                                className="p-2 rounded-lg bg-white/5 border border-white/10 text-[var(--text-muted)] hover:text-white hover:border-white/20 transition-all text-xs font-bold flex items-center justify-center"
                                title="Edit Event"
                              >
                                <Pencil className="w-4 h-4" />
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
              {/* Partner Applications (from public form) */}
              <GlassCard className="p-8 border-amber-500/20">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold font-display text-white">Incoming Partner Applications</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Applications from venues submitted via the user-facing Partner With Us form</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/25 px-3 py-1 rounded-full text-xs font-bold">
                      {partnerApplications.filter(a => a.status === 'pending').length} Pending
                    </span>
                    <button
                      onClick={fetchPartnerApplications}
                      className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-all text-xs"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isLoadingApplications ? (
                  <div className="py-12 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-400" />
                  </div>
                ) : partnerApplications.length === 0 ? (
                  <div className="py-12 text-center text-[var(--text-muted)] text-sm">
                    No partner applications received yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[var(--text-muted)] text-xs uppercase tracking-wider border-b border-[var(--border-subtle)]">
                          <th className="pb-4 font-bold">Applicant</th>
                          <th className="pb-4 font-bold">Company / City</th>
                          <th className="pb-4 font-bold">Contact</th>
                          <th className="pb-4 font-bold">Status</th>
                          <th className="pb-4 font-bold">Submitted</th>
                          <th className="pb-4 font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {partnerApplications.map((app) => (
                          <tr key={app.id} className="border-b border-[var(--border-subtle)]/50 hover:bg-white/5 transition-colors">
                            <td className="py-4">
                              <p className="font-bold text-white">{app.full_name}</p>
                              <p className="text-xs text-[var(--text-muted)] mt-0.5">{app.description?.substring(0, 45) || 'No description'}{app.description?.length > 45 ? '...' : ''}</p>
                            </td>
                            <td className="py-4">
                              <p className="font-semibold text-[var(--violet-bright)]">{app.company_name}</p>
                              <p className="text-xs text-[var(--text-muted)]">{app.company_city}</p>
                            </td>
                            <td className="py-4">
                              <p className="text-xs text-white">{app.email}</p>
                              <p className="text-xs text-[var(--text-muted)]">{app.phone}</p>
                            </td>
                            <td className="py-4">
                              <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                                app.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                app.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}>
                                {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                              </span>
                            </td>
                            <td className="py-4 text-xs text-[var(--text-muted)]">
                              {new Date(app.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-4 text-right">
                              {app.status === 'pending' ? (
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => handleApproveApplication(app.id)}
                                    className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/25 transition-all text-xs font-bold"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectApplication(app.id)}
                                    className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/25 transition-all text-xs font-bold"
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-[var(--text-muted)] italic">
                                  {app.status === 'approved' ? 'Credentials sent' : 'Rejected'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </GlassCard>

              {/* Registered Venue Partners (existing admins) */}
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
                                <span className="font-semibold text-white/70">{msg.sender_name || 'VHOP Super Admin'}</span>
                                <span className="opacity-60">({msg.sender_role || 'superadmin'})</span>
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

          {activeTab === 'coupons' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Create Coupon Form */}
                <GlassCard className="p-8 border-[var(--violet-primary)]/20 h-fit">
                  <h3 className="text-xl font-bold font-display text-white mb-6">Create New Coupon</h3>
                  <form onSubmit={handleAddCouponSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Coupon Code</label>
                      <input
                        type="text"
                        placeholder="e.g. RUPEE1"
                        required
                        value={newCoupon.code}
                        onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--violet-bright)] outline-none transition-all text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Discount Type</label>
                      <select
                        value={newCoupon.discount_type}
                        onChange={(e) => setNewCoupon({ ...newCoupon, discount_type: e.target.value })}
                        className="w-full bg-[#141122] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--violet-bright)] outline-none transition-all text-white font-medium"
                      >
                        <option value="fixed_price">Fixed Ticket Price (e.g. ₹1 Ticket)</option>
                        <option value="fixed">Fixed Discount (Rupees off)</option>
                        <option value="percentage">Percentage Discount (% off)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Discount Value (₹ / %)</label>
                      <input
                        type="number"
                        placeholder="Value (e.g. 1 or 99)"
                        required
                        value={newCoupon.discount_value}
                        onChange={(e) => setNewCoupon({ ...newCoupon, discount_value: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--violet-bright)] outline-none transition-all text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Minimum Purchase (₹)</label>
                      <input
                        type="number"
                        placeholder="Min Purchase (e.g. 0)"
                        required
                        value={newCoupon.min_purchase}
                        onChange={(e) => setNewCoupon({ ...newCoupon, min_purchase: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--violet-bright)] outline-none transition-all text-white"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="couponActive"
                        checked={newCoupon.active}
                        onChange={(e) => setNewCoupon({ ...newCoupon, active: e.target.checked })}
                        className="w-4 h-4 rounded border-white/10 accent-[var(--violet-bright)]"
                      />
                      <label htmlFor="couponActive" className="text-xs text-white font-bold cursor-pointer">Active / Enabled</label>
                    </div>

                    <GlowButton type="submit" className="w-full py-3 mt-4">
                      Create Coupon
                    </GlowButton>
                  </form>
                </GlassCard>

                {/* Right Column: Coupons List */}
                <GlassCard className="p-8 lg:col-span-2">
                  <h3 className="text-xl font-bold font-display text-white mb-6">Manage Coupons</h3>
                  
                  {isLoadingCoupons ? (
                    <div className="py-12 flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--violet-bright)]" />
                    </div>
                  ) : coupons.length === 0 ? (
                    <div className="py-12 text-center text-[var(--text-muted)] text-sm">
                      No coupons found.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-[var(--text-muted)] text-xs uppercase tracking-wider border-b border-[var(--border-subtle)]">
                            <th className="pb-4 font-bold">Code</th>
                            <th className="pb-4 font-bold">Type</th>
                            <th className="pb-4 font-bold">Value</th>
                            <th className="pb-4 font-bold">Min Purchase</th>
                            <th className="pb-4 font-bold">Status</th>
                            <th className="pb-4 font-bold text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {coupons.map((c) => (
                            <tr key={c.code} className="border-b border-[var(--border-subtle)]/50 hover:bg-white/5 transition-colors">
                              <td className="py-4 font-mono font-bold text-white">{c.code}</td>
                              <td className="py-4 text-[var(--text-secondary)] font-medium">
                                {c.discount_type === 'fixed_price' ? 'Fixed Ticket Price' : c.discount_type === 'fixed' ? 'Rupees Off' : 'Percent Off'}
                              </td>
                              <td className="py-4 font-bold text-[var(--violet-bright)]">
                                {c.discount_type === 'percentage' ? `${c.discount_value}%` : `₹${c.discount_value}`}
                              </td>
                              <td className="py-4 text-white">₹{c.min_purchase}</td>
                              <td className="py-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  c.active 
                                    ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                }`}>
                                  {c.active ? 'Active' : 'Disabled'}
                                </span>
                              </td>
                              <td className="py-4 text-right">
                                <button
                                  onClick={() => handleDeleteCoupon(c.code)}
                                  className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 text-red-500 transition-all cursor-pointer"
                                  title="Delete Coupon"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </GlassCard>
              </div>
            </motion.div>
          )}

          {activeTab === 'fees' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Global Fees Card */}
                <GlassCard className="p-8 border-[var(--violet-primary)]/20 h-fit">
                  <h3 className="text-xl font-bold font-display text-white mb-6">Global Fees Settings</h3>
                  <form onSubmit={handleUpdateGlobalFees} className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">GST Rate (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={fees.gst_rate}
                        onChange={(e) => setFees({ ...fees, gst_rate: Number(e.target.value) })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--violet-bright)] outline-none transition-all text-white font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Platform Fee (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={fees.platform_fee}
                        onChange={(e) => setFees({ ...fees, platform_fee: Number(e.target.value) })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--violet-bright)] outline-none transition-all text-white font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">High Demand Fee (₹ per ticket)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={fees.high_demand_fee}
                        onChange={(e) => setFees({ ...fees, high_demand_fee: Number(e.target.value) })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--violet-bright)] outline-none transition-all text-white font-medium"
                      />
                    </div>

                    <GlowButton type="submit" disabled={isSavingFees} className="w-full py-3 mt-4">
                      {isSavingFees ? 'Saving settings...' : 'Save Fees Settings'}
                    </GlowButton>
                  </form>
                </GlassCard>

                {/* Genre Fees Column */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Add Genre Fee */}
                  <GlassCard className="p-8 border-[var(--violet-primary)]/20">
                    <h3 className="text-xl font-bold font-display text-white mb-6">Add Genre Specific Fee</h3>
                    <form onSubmit={handleAddGenreFee} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Genre / Category Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Music, Comedy, Art"
                          required
                          value={newGenreFee.genre}
                          onChange={(e) => setNewGenreFee({ ...newGenreFee, genre: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--violet-bright)] outline-none transition-all text-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Extra Fee (₹ per ticket)</label>
                        <input
                          type="number"
                          placeholder="e.g. 50"
                          required
                          value={newGenreFee.price}
                          onChange={(e) => setNewGenreFee({ ...newGenreFee, price: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--violet-bright)] outline-none transition-all text-white"
                        />
                      </div>
                      <GlowButton type="submit" className="py-3.5">
                        Add Genre Fee
                      </GlowButton>
                    </form>
                  </GlassCard>

                  {/* List Genre Fees */}
                  <GlassCard className="p-8">
                    <h3 className="text-xl font-bold font-display text-white mb-6">Genre Specific Fee Mappings</h3>
                    
                    {isLoadingFees ? (
                      <div className="py-12 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--violet-bright)]" />
                      </div>
                    ) : fees.genre_fees.length === 0 ? (
                      <div className="py-12 text-center text-[var(--text-muted)] text-sm">
                        No genre-specific fee mappings found.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="text-[var(--text-muted)] text-xs uppercase tracking-wider border-b border-[var(--border-subtle)]">
                              <th className="pb-4 font-bold">Genre / Category</th>
                              <th className="pb-4 font-bold">Extra Price per Ticket</th>
                              <th className="pb-4 font-bold text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm">
                            {fees.genre_fees.map((gf) => (
                              <tr key={gf.genre} className="border-b border-[var(--border-subtle)]/50 hover:bg-white/5 transition-colors">
                                <td className="py-4 font-bold text-white">{gf.genre}</td>
                                <td className="py-4 font-bold text-[var(--violet-bright)]">₹{Number(gf.price).toFixed(2)}</td>
                                <td className="py-4 text-right">
                                  <button
                                    onClick={() => handleDeleteGenreFee(gf.genre)}
                                    className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 text-red-500 transition-all cursor-pointer"
                                    title="Delete Mapping"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </GlassCard>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ──── SMS BROADCAST TAB ──────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {activeTab === 'sms' && (
            <motion.div
              key="sms"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Header info */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--violet-primary)]/10 border border-[var(--violet-primary)]/25">
                <div className="p-3 rounded-xl bg-[var(--violet-primary)]/20">
                  <Smartphone className="w-6 h-6 text-[var(--violet-bright)]" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">SMS Broadcast via Message Central</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Compose a message, load a template, then send to a specific event's guest list or broadcast to all users.
                    Auto-confirmation SMS fires automatically on every successful ticket booking.
                  </p>
                </div>
              </div>

              {/* Feedback banner */}
              {smsFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl border text-sm font-semibold ${
                    smsFeedback.type === 'success'
                      ? 'bg-green-500/10 border-green-500/30 text-green-400'
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}
                >
                  {smsFeedback.msg}
                </motion.div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Message Composer */}
                <div className="lg:col-span-2 space-y-6">
                  <GlassCard className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold font-display text-white">Message Composer</h3>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        smsMessage.length > 160
                          ? 'bg-red-500/10 border-red-500/25 text-red-400'
                          : smsMessage.length > 120
                          ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                          : 'bg-green-500/10 border-green-500/25 text-green-400'
                      }`}>
                        {smsMessage.length} / 160 chars {smsMessage.length > 160 ? `(${Math.ceil(smsMessage.length / 160)} SMS units)` : '(1 SMS unit)'}
                      </span>
                    </div>

                    {/* Load template */}
                    <div className="mb-4">
                      <label className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2 block">Load a Saved Template</label>
                      <select
                        value={selectedSmsTemplate}
                        onChange={(e) => handleLoadSmsTemplate(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[var(--violet-bright)] outline-none"
                      >
                        <option value="" className="bg-[#110F20]">— Select template to load —</option>
                        {smsTemplates.map(t => (
                          <option key={t.id} value={t.id} className="bg-[#110F20]">{t.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Message textarea */}
                    <div className="mb-4">
                      <label className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2 block">
                        Message Body
                        <span className="ml-2 font-normal normal-case text-[var(--text-muted)]/60">Variables: {'{{name}}'}, {'{{event}}'}, {'{{booking_id}}'}, {'{{date}}'}</span>
                      </label>
                      <textarea
                        rows={6}
                        value={smsMessage}
                        onChange={(e) => setSmsMessage(e.target.value)}
                        placeholder="Type your SMS message here... Use {{name}}, {{event}} etc. as variables (you'll substitute manually when sending)."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[var(--violet-bright)] outline-none resize-none transition-all"
                      />
                    </div>

                    {/* Save as template */}
                    <div className="flex gap-3 pt-2 border-t border-white/5">
                      <input
                        type="text"
                        placeholder="Template name (e.g. 'Event Reminder')"
                        value={smsTemplateName}
                        onChange={(e) => setSmsTemplateName(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[var(--violet-bright)] outline-none"
                      />
                      <button
                        onClick={handleSaveSmsTemplate}
                        disabled={isSavingTemplate}
                        className="px-5 py-2.5 rounded-xl bg-[var(--violet-primary)]/20 text-[var(--violet-bright)] border border-[var(--violet-primary)]/30 text-xs font-bold hover:bg-[var(--violet-primary)] hover:text-white transition-all disabled:opacity-50"
                      >
                        {isSavingTemplate ? 'Saving...' : 'Save Template'}
                      </button>
                    </div>
                  </GlassCard>

                  {/* Send to Event Guests */}
                  <GlassCard className="p-8 border-[var(--accent-cyan)]/20">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2.5 rounded-xl bg-[var(--accent-cyan)]/10">
                        <Calendar className="w-5 h-5 text-[var(--accent-cyan)]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">Send to Event Guest List</h3>
                        <p className="text-xs text-[var(--text-muted)]">Target all confirmed ticket holders of a specific event</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2 block">Select Event</label>
                        <select
                          value={smsSelectedEventId}
                          onChange={(e) => {
                            setSmsSelectedEventId(e.target.value);
                            fetchSmsGuestCount(e.target.value);
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[var(--violet-bright)] outline-none"
                        >
                          <option value="" className="bg-[#110F20]">— Pick an event —</option>
                          {events.map(ev => (
                            <option key={ev.id} value={ev.id} className="bg-[#110F20]">
                              {ev.title} — {ev.city} ({ev.status})
                            </option>
                          ))}
                        </select>
                      </div>

                      {smsSelectedEventId && (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--accent-cyan)]/5 border border-[var(--accent-cyan)]/20">
                          <Users className="w-4 h-4 text-[var(--accent-cyan)]" />
                          <span className="text-sm text-white">
                            <strong className="text-[var(--accent-cyan)]">{smsGuestCount ?? '...'}</strong> guest(s) with a registered phone number will receive this SMS
                          </span>
                        </div>
                      )}

                      <button
                        onClick={handleSendToEventGuests}
                        disabled={smsSendingEvent || !smsSelectedEventId || !smsMessage.trim()}
                        className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/25 hover:bg-[var(--accent-cyan)] hover:text-[#0a0812] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {smsSendingEvent ? (
                          <><RefreshCw className="w-4 h-4 animate-spin" /> Sending...</>
                        ) : (
                          <><Send className="w-4 h-4" /> Send to Event Guests</>
                        )}
                      </button>
                    </div>
                  </GlassCard>

                  {/* Broadcast to All Users */}
                  <GlassCard className="p-8 border-amber-500/20">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2.5 rounded-xl bg-amber-500/10">
                        <Radio className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">Broadcast to All Users</h3>
                        <p className="text-xs text-[var(--text-muted)]">Send an offer, announcement or reminder to every registered user</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 mb-5">
                      <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span className="text-sm text-white">
                        <strong className="text-amber-400">{smsUserCount ?? '...'}</strong> registered users with phone numbers will receive this SMS. This action cannot be undone.
                      </span>
                    </div>

                    <button
                      onClick={handleSendToAllUsers}
                      disabled={smsSendingAll || !smsMessage.trim()}
                      className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-amber-500/10 text-amber-400 border border-amber-500/25 hover:bg-amber-500 hover:text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {smsSendingAll ? (
                        <><RefreshCw className="w-4 h-4 animate-spin" /> Broadcasting...</>
                      ) : (
                        <><Radio className="w-4 h-4" /> Broadcast to All Users</>
                      )}
                    </button>
                  </GlassCard>
                </div>

                {/* Right: Saved Templates */}
                <div className="space-y-6">
                  <GlassCard className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-white">Saved Templates</h3>
                      <button
                        onClick={fetchSmsTemplates}
                        className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-all"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {smsTemplates.length === 0 ? (
                      <p className="text-xs text-[var(--text-muted)] text-center py-8">No saved templates yet. Compose a message and click Save Template.</p>
                    ) : (
                      <div className="space-y-3">
                        {smsTemplates.map(tpl => (
                          <div
                            key={tpl.id}
                            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                              selectedSmsTemplate === tpl.id
                                ? 'bg-[var(--violet-primary)]/20 border-[var(--violet-primary)]/40'
                                : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <button
                                onClick={() => handleLoadSmsTemplate(tpl.id)}
                                className="flex-1 text-left"
                              >
                                <p className="text-xs font-bold text-white">{tpl.name}</p>
                                <p className="text-[10px] text-[var(--text-muted)] mt-1 line-clamp-3 leading-relaxed">{tpl.body}</p>
                              </button>
                              <button
                                onClick={() => handleDeleteSmsTemplate(tpl.id)}
                                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0 mt-0.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </GlassCard>

                  {/* Auto-send info card */}
                  <GlassCard className="p-6 border-green-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <h4 className="text-sm font-bold text-white">Auto Booking SMS</h4>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      A booking confirmation SMS is automatically sent to the customer's registered mobile number after every successful payment. 
                      No action required — this fires via the <span className="text-[var(--violet-bright)] font-mono">confirmBooking()</span> server function.
                    </p>
                    <div className="mt-3 p-2.5 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-[10px] font-mono text-[var(--text-muted)] leading-relaxed">
                        Hi [Name]! Your VHOP ticket is confirmed 🎉<br/>
                        Event: [Title] · ID: [Booking ID]<br/>
                        Venue: [Venue], [City] · Date: [Date]<br/>
                        Qty: [N] ticket(s) | Total: ₹[Amount]
                      </p>
                    </div>
                  </GlassCard>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


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
                            navigate(`/admin/edit-event/${selectedEvent.id}`);
                            setSelectedEvent(null);
                          }}
                          className="w-full px-4 py-2 rounded-xl bg-[var(--violet-primary)]/20 text-[var(--violet-bright)] border border-[var(--violet-primary)]/35 hover:bg-[var(--violet-primary)] hover:text-white transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" /> Edit Event Details
                        </button>
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

        {/* MODAL: Approved Partner Credentials (from application approval) */}
        <AnimatePresence>
          {approvedCredentials && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setApprovedCredentials(null)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-md z-10"
              >
                <GlassCard className="p-8 border-green-500/30 text-center space-y-6">
                  <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-400">
                    <UserCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white font-display">Partner Approved! 🎉</h3>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Credentials have been emailed to the partner. You can also copy them below:</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/80 border border-white/10 text-left font-mono text-xs space-y-2 select-all">
                    <p className="text-white"><span className="text-[var(--text-muted)]">Portal URL:</span> {approvedCredentials.portalUrl}</p>
                    <p className="text-white"><span className="text-[var(--text-muted)]">Email:</span> {approvedCredentials.email}</p>
                    <p className="text-white"><span className="text-[var(--text-muted)]">Password:</span> <span className="text-green-400 font-bold">{approvedCredentials.password}</span></p>
                    <p className="text-white"><span className="text-[var(--text-muted)]">Company:</span> {approvedCredentials.companyName}</p>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        const text = `VHOP Partner Credentials:\nPortal: ${approvedCredentials.portalUrl}\nEmail: ${approvedCredentials.email}\nPassword: ${approvedCredentials.password}\nCompany: ${approvedCredentials.companyName}`;
                        navigator.clipboard.writeText(text);
                        alert('Credentials copied to clipboard!');
                      }}
                      className="flex-1 py-3.5 rounded-xl bg-[var(--violet-primary)] font-bold text-sm hover:shadow-glow transition-all flex items-center justify-center gap-2"
                    >
                      <Clipboard className="w-4 h-4" /> Copy Credentials
                    </button>
                    <button
                      onClick={() => setApprovedCredentials(null)}
                      className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/10 font-bold text-sm hover:bg-white/10 transition-all text-white"
                    >
                      Close
                    </button>
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
                          className="w-full bg-[#110F20] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[var(--violet-bright)] outline-none"
                        >
                          <option value="Visakhapatnam" className="bg-[#110F20] text-white">Visakhapatnam</option>
                          <option value="Mumbai" className="bg-[#110F20] text-white">Mumbai</option>
                          <option value="Bangalore" className="bg-[#110F20] text-white">Bangalore</option>
                          <option value="Hyderabad" className="bg-[#110F20] text-white">Hyderabad</option>
                          <option value="Delhi" className="bg-[#110F20] text-white">Delhi</option>
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
