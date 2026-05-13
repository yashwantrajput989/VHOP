import React, { useEffect, useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { Users, Building, Calendar, IndianRupee, CheckCircle, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { mockDb as dbClient } from '../../lib/mockDb';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { AdminLogin } from '../admin/AdminLogin';

export const SuperDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeCompanies: 0,
    totalEvents: 0,
    grossRevenue: 0
  });
  const [pendingCompanies, setPendingCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchPlatformStats = async () => {
      setIsLoading(true);
      
      // Fetch users count
      const { count: userCount } = await dbClient.from('profiles').select('*', { count: 'exact', head: true });
      
      // Fetch companies
      const { data: companies } = await dbClient.from('companies').select('*');
      const { data: pending } = await dbClient.from('companies').select('*').eq('verified', false);
      
      // Fetch events
      const { data: events } = await dbClient.from('events').select('*');
      
      const totalRevenue = events?.reduce((acc, ev) => acc + (ev.price * ev.tickets_sold), 0) || 0;

      setStats({
        totalUsers: userCount || 0,
        activeCompanies: companies?.filter(c => c.verified).length || 0,
        totalEvents: events?.length || 0,
        grossRevenue: totalRevenue
      });
      
      setPendingCompanies(pending || []);
      setIsLoading(false);
    };

    fetchPlatformStats();
  }, []);

  const handleApproveCompany = async (id: string) => {
    const { error } = await dbClient
      .from('companies')
      .update({ verified: true })
      .eq('id', id);
    
    if (!error) {
      setPendingCompanies(prev => prev.filter(c => c.id !== id));
      setStats(prev => ({ ...prev, activeCompanies: prev.activeCompanies + 1 }));
    }
  };

  const handleRejectCompany = async (id: string) => {
    if (window.confirm('Reject this company application?')) {
      const { error } = await dbClient
        .from('companies')
        .delete()
        .eq('id', id);
      
      if (!error) {
        setPendingCompanies(prev => prev.filter(c => c.id !== id));
      }
    }
  };

  const platformData = [
    { name: 'Music', value: 45, color: 'var(--violet-bright)' },
    { name: 'Comedy', value: 25, color: 'var(--accent-pink)' },
    { name: 'Art', value: 15, color: 'var(--accent-cyan)' },
    { name: 'Other', value: 15, color: 'var(--text-muted)' },
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

  if (!user || user.role !== 'superadmin') {
    return <AdminLogin forcedRole="superadmin" />;
  }

  return (
    <PageWrapper>
      <div className="space-y-8 pb-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-display font-bold">Platform Overview</h1>
            <p className="text-[var(--text-secondary)]">Super Admin Control Center • VHOP Global</p>
          </div>
          <div className="flex gap-4">
            <button className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 font-bold text-sm">Export Report</button>
            <button className="px-6 py-2 rounded-xl bg-[image:var(--gradient-hero)] font-bold text-sm">Global Broadcast</button>
          </div>
        </header>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'var(--violet-bright)' },
            { label: 'Active Companies', value: stats.activeCompanies.toLocaleString(), icon: Building, color: 'var(--accent-pink)' },
            { label: 'Total Events', value: stats.totalEvents.toLocaleString(), icon: Calendar, color: 'var(--accent-cyan)' },
            { label: 'Gross Revenue', value: `₹${(stats.grossRevenue / 100000).toFixed(1)}L`, icon: IndianRupee, color: 'var(--accent-gold)' },
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <GlassCard className="p-8">
            <h3 className="text-xl font-bold font-display mb-8">Category Performance</h3>
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
            <h3 className="text-xl font-bold font-display mb-8">Category Distribution</h3>
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
                    <span className="text-sm text-[var(--text-muted)] ml-auto">{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>

        <GlassCard className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold font-display">New Company Requests</h3>
            <span className="bg-[var(--violet-primary)] px-3 py-1 rounded-full text-xs font-bold">{pendingCompanies.length} Pending</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[var(--text-muted)] text-xs uppercase tracking-wider border-b border-[var(--border-subtle)]">
                  <th className="pb-4 font-bold">Company Name</th>
                  <th className="pb-4 font-bold">Location</th>
                  <th className="pb-4 font-bold">Contact</th>
                  <th className="pb-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {pendingCompanies.length > 0 ? pendingCompanies.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--border-subtle)]/50 group hover:bg-white/5 transition-colors">
                    <td className="py-4 font-bold">{row.name}</td>
                    <td className="py-4 text-[var(--text-secondary)]">{row.city}</td>
                    <td className="py-4 text-[var(--text-secondary)]">{row.contact_email}</td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setSelectedCompany(row)}
                          className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-colors"
                        >
                          Review Details
                        </button>
                        <button 
                          onClick={() => handleRejectCompany(row.id)}
                          className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                          title="Quick Reject"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleApproveCompany(row.id)}
                          className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
                          title="Quick Approve"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-[var(--text-muted)]">No pending requests at the moment.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Review Modal */}
        <AnimatePresence>
          {selectedCompany && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedCompany(null)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-2xl z-10"
              >
                <GlassCard className="p-8 border-[var(--violet-primary)]/30">
                  <header className="flex justify-between items-start mb-8">
                    <div>
                      <h2 className="text-3xl font-display font-bold">{selectedCompany.name}</h2>
                      <p className="text-[var(--text-muted)]">Application Review</p>
                    </div>
                    <button onClick={() => setSelectedCompany(null)} className="p-2 hover:bg-white/5 rounded-lg">
                      <IndianRupee className="w-6 h-6 rotate-45" /> {/* Use IndianRupee as X for now or Lucide X */}
                    </button>
                  </header>

                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Business Location</label>
                        <p className="text-lg font-medium">{selectedCompany.city}</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Contact Email</label>
                        <p className="text-lg font-medium">{selectedCompany.contact_email}</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Point of Contact (POC)</label>
                        <p className="text-lg font-medium">{selectedCompany.poc || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Website</label>
                        <p className="text-lg font-medium text-[var(--violet-bright)]">{selectedCompany.website || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Registered At</label>
                        <p className="text-lg font-medium">{new Date(selectedCompany.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Mobile Number</label>
                        <p className="text-lg font-medium">{selectedCompany.phone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-10">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">About the Company</label>
                    <p className="text-[var(--text-secondary)] mt-2 leading-relaxed">
                      {selectedCompany.description || 'No description provided by the partner.'}
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        handleRejectCompany(selectedCompany.id);
                        setSelectedCompany(null);
                      }}
                      className="flex-1 py-4 rounded-xl bg-red-500/10 text-red-500 font-bold border border-red-500/20 hover:bg-red-500/20 transition-all"
                    >
                      Reject Application
                    </button>
                    <button 
                      onClick={() => {
                        handleApproveCompany(selectedCompany.id);
                        setSelectedCompany(null);
                      }}
                      className="flex-1 py-4 rounded-xl bg-green-500/10 text-green-500 font-bold border border-green-500/20 hover:bg-green-500/20 transition-all"
                    >
                      Approve & Verify
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
};
