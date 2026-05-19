import React, { useState, useEffect } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowButton } from '../../components/ui/GlowButton';
import { Building2, Mail, Phone, Globe, CreditCard, Save } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const AdminSettings: React.FC = () => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [company, setCompany] = useState<any>(null);
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
      try {
        const response = await fetch(`https://vhop.in/api/admin/dashboard/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          const comp = data.company;
          setCompany(comp);
          setFormData({
            companyName: comp.name || '',
            email: comp.contact_email || user.email || '',
            phone: comp.phone || '',
            website: comp.website || '',
            bio: comp.description || '',
            payoutUpi: comp.payout_upi || '',
          });
        } else {
            // Default global settings if no specific company exists
            setFormData({
                companyName: 'Global Admin',
                email: user.email || '',
                phone: '',
                website: 'https://vhop.in',
                bio: 'Platform wide settings',
                payoutUpi: '',
            });
        }
      } catch (error) {
        console.error('Error fetching admin settings from MySQL:', error);
      }
    };
    fetchSettings();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);
    
    const targetId = company?.id || 'vhop_official';
    
    try {
      const response = await fetch(`https://vhop.in/api/companies/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: formData.companyName,
            phone: formData.phone,
            website: formData.website,
            description: formData.bio,
            payout_upi: formData.payoutUpi,
            contact_email: formData.email
        })
      });

      if (response.ok) {
        alert('Settings updated successfully!');
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <header>
          <h1 className="text-4xl font-display font-bold">Settings</h1>
          <p className="text-[var(--text-secondary)]">Manage your organization and account preferences.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
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
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:border-[var(--violet-bright)] outline-none transition-all"
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

          <div className="flex justify-end gap-4">
            <GlowButton type="submit" disabled={isLoading} className="px-12 py-4">
              <Save className="w-5 h-5 mr-2" /> Save Changes
            </GlowButton>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};
