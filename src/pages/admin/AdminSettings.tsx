import React, { useState, useEffect } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowButton } from '../../components/ui/GlowButton';
import { Building2, Mail, Phone, Globe, Shield, CreditCard, Bell, Save } from 'lucide-react';
import { mockDb as dbClient } from '../../lib/mockDb';
import { useAuthStore } from '../../store/authStore';

export const AdminSettings: React.FC = () => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    phone: '',
    website: '',
    bio: '',
    payoutUpi: '',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      const { data: company } = await dbClient
        .from('companies')
        .select('*')
        .eq('admin_user_id', user.id)
        .single();
      
      if (company) {
        setFormData({
          companyName: company.name || '',
          email: user.email || '',
          phone: company.phone || '',
          website: company.website || '',
          bio: company.description || '',
          payoutUpi: company.payout_upi || '',
        });
      }
    };
    fetchSettings();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate update
    setTimeout(() => {
      setIsLoading(false);
      alert('Settings updated successfully!');
    }, 1000);
  };

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <header>
          <h1 className="text-4xl font-display font-bold">Settings</h1>
          <p className="text-[var(--text-secondary)]">Manage your organization and account preferences.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Organization Profile */}
          <GlassCard className="p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
              <Building2 className="w-5 h-5 text-[var(--violet-bright)]" />
              <h3 className="text-xl font-bold font-display">Organization Profile</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase">Company Name</label>
                <input 
                  type="text" 
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--violet-bright)] outline-none transition-all"
                  placeholder="My Nightlife Co."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase">Business Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input 
                    type="email" 
                    value={formData.email}
                    disabled
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 opacity-50 cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:border-[var(--violet-bright)] outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase">Website</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input 
                    type="url" 
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:border-[var(--violet-bright)] outline-none transition-all"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase">Bio / Description</label>
              <textarea 
                rows={4}
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--violet-bright)] outline-none transition-all resize-none"
                placeholder="Tell us about your organization..."
              />
            </div>
          </GlassCard>

          {/* Payout Details */}
          <GlassCard className="p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
              <CreditCard className="w-5 h-5 text-[var(--accent-cyan)]" />
              <h3 className="text-xl font-bold font-display">Payout Details</h3>
            </div>

            <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-xs text-cyan-200">
              Payments are processed every Monday for events completed in the previous week.
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase">UPI ID for Payouts</label>
              <input 
                type="text" 
                value={formData.payoutUpi}
                onChange={(e) => setFormData({...formData, payoutUpi: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--violet-bright)] outline-none transition-all"
                placeholder="business@upi"
              />
            </div>
          </GlassCard>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <button 
              type="button"
              className="px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 font-bold transition-all"
            >
              Cancel
            </button>
            <GlowButton type="submit" isLoading={isLoading} className="px-12 py-4">
              <Save className="w-5 h-5 mr-2" /> Save Changes
            </GlowButton>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};
