import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowButton } from '../../components/ui/GlowButton';
import { Users, Mail, UserPlus, Trash2, X, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { AdminLogin } from './AdminLogin';
import { API_BASE_URL } from '../../config';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminTeams: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role === 'subadmin') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const fetchTeamMembers = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/teams/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data);
      }
    } catch (err) {
      console.error('Error fetching team members:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchTeamMembers();
    }
  }, [user]);

  if (!user || user.role !== 'admin') {
    return <AdminLogin forcedRole="admin" />;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!formData.name || !formData.email || !formData.password) {
      setErrorMsg('All fields are required.');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          parentAdminId: user.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Team member added successfully!');
        setFormData({ name: '', email: '', password: '' });
        setIsModalOpen(false);
        fetchTeamMembers();
      } else {
        setErrorMsg(data.error || 'Failed to add team member.');
      }
    } catch (err) {
      console.error('Error adding team member:', err);
      setErrorMsg('Failed to connect to backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name} from your team?`)) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/teams/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        alert('Team member removed successfully.');
        fetchTeamMembers();
      } else {
        alert('Failed to delete team member.');
      }
    } catch (err) {
      console.error('Error deleting team member:', err);
    }
  };

  return (
    <PageWrapper>
      <div className="space-y-8 pb-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-display font-bold">Teams</h1>
            <p className="text-[var(--text-secondary)]">Manage your subadmins and staff credentials.</p>
          </div>
          <div>
            <GlowButton onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" /> Add Team Member
            </GlowButton>
          </div>
        </header>

        <GlassCard className="p-0 overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
            <h3 className="text-lg font-bold font-display flex items-center gap-2">
              <Users className="w-5 h-5 text-[var(--violet-bright)]" /> Active Team Members
            </h3>
            <span className="text-xs text-[var(--text-muted)] bg-white/5 px-3 py-1 rounded-full">
              {teamMembers.length} Total
            </span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-[var(--text-secondary)]">
              <div className="animate-spin w-8 h-8 border-4 border-[var(--violet-bright)] border-t-transparent rounded-full mx-auto mb-4" />
              Loading team list...
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="p-16 text-center text-[var(--text-secondary)] space-y-4">
              <Users className="w-12 h-12 text-[var(--text-muted)] mx-auto opacity-30" />
              <h4 className="text-xl font-bold">No Team Members Found</h4>
              <p className="max-w-md mx-auto text-sm text-[var(--text-muted)]">
                Create subadmin accounts to allow your staff to manage events, statistics, and scanner simulator services without sharing your primary admin settings.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-[var(--violet-bright)] font-bold hover:underline text-sm"
              >
                Add your first team member &rarr;
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase">Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase">Email</th>
                    <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase">Role</th>
                    <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase">Created At</th>
                    <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {teamMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[var(--violet-primary)]/20 border border-[var(--violet-bright)]/30 flex items-center justify-center font-display font-bold text-[var(--violet-bright)] text-sm">
                            {member.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white">{member.full_name}</p>
                            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">ID: {member.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{member.email}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-md bg-[var(--violet-bright)]/10 text-[var(--violet-bright)] text-[10px] font-bold uppercase tracking-wider border border-[var(--violet-bright)]/20">
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--text-muted)]">
                        {new Date(member.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteMember(member.id, member.full_name)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-all cursor-pointer"
                          title="Delete team member"
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

      {/* Glassmorphic Pink/Violet Neon Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg glass-card border border-white/10 rounded-3xl bg-[var(--bg-card)] shadow-2xl p-8 overflow-hidden z-10"
            >
              <div className="absolute top-0 right-0 p-6">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-full hover:bg-white/5 text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-display font-bold flex items-center gap-2">
                    <ShieldAlert className="w-6 h-6 text-[var(--accent-pink)]" /> Add Team Member
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Create a subadmin credential to access the Admin Panel.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleAddMember} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--text-secondary)]">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. John Doe"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--violet-bright)] outline-none transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--text-secondary)]">Role</label>
                    <input
                      type="text"
                      value="Subadmin (read-only settings)"
                      disabled
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-[var(--text-muted)] outline-none cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--text-secondary)]">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="e.g. staff@vhop.in"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:border-[var(--violet-bright)] outline-none transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--text-secondary)]">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Create login password"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--violet-bright)] outline-none transition-colors"
                      required
                    />
                  </div>

                  <div className="pt-4">
                    <GlowButton
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full justify-center py-3 text-sm"
                    >
                      {isSubmitting ? 'Adding Member...' : 'Create Team Member'}
                    </GlowButton>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
};
