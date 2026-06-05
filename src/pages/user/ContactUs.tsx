import React, { useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowButton } from '../../components/ui/GlowButton';
import { FloatingOrb } from '../../components/ui/FloatingOrb';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, AlertCircle, Building, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../../config';

export const ContactUs: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/contact/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, message: data.message || 'Your message has been received. We will get back to you shortly!' });
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        setResult({ success: false, message: data.error || 'Something went wrong. Please try again.' });
      }
    } catch (error) {
      console.error('Contact form submission error:', error);
      setResult({ success: false, message: 'Failed to connect to the server. Please check your internet connection.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageWrapper className="relative px-4 pb-24 overflow-x-hidden">
      <FloatingOrb className="-top-40 -right-40 pointer-events-none" color="violet" size={400} />
      <FloatingOrb className="bottom-0 -left-40 pointer-events-none" color="pink" size={300} delay={2} />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10 pt-4">
        <header className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-display font-black tracking-tight text-white">
            Get in <span className="text-gradient">Touch</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto">
            If you have any queries related to refunds, cancellations, or general inquiries, feel free to reach out to us using the details below.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Contact Details Column */}
          <div className="md:col-span-2 space-y-6">
            <GlassCard className="p-6 md:p-8 space-y-6 border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--violet-primary)]/10 blur-2xl rounded-full pointer-events-none" />

              <h2 className="text-xl font-bold font-display text-white">Contact Information</h2>

              <div className="space-y-5">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-[var(--violet-bright)]">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold">Registered Business</p>
                    <p className="text-sm font-bold text-white mt-0.5">zenvybe</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-[var(--violet-bright)]">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold">Representative</p>
                    <p className="text-sm font-bold text-white mt-0.5">Trinadha satya sai ram samsani</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-[var(--violet-bright)]">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold">Email Us</p>
                    <a href="mailto:support@openct.com" className="text-sm font-bold text-white hover:text-[var(--violet-bright)] transition-colors mt-0.5 block break-all">
                      support@openct.com
                    </a>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-pink-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold">Call Us</p>
                    <a href="tel:+919851437143" className="text-sm font-bold text-white hover:text-pink-400 transition-colors mt-0.5 block">
                      +91-9851437143
                    </a>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-cyan-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold">Visit Us</p>
                    <p className="text-sm font-bold text-white mt-0.5 leading-relaxed">
                      zenvybe Headquarters<br />
                      Visakhapatnam, Andhra Pradesh,<br />
                      India.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-amber-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold">Business Hours</p>
                    <p className="text-sm font-bold text-white mt-0.5">
                      Monday to Friday<br />
                      9:00 AM to 6:00 PM (IST)
                    </p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Form Column */}
          <div className="md:col-span-3">
            <GlassCard className="p-6 md:p-8 border border-white/5 space-y-6">
              <h2 className="text-xl font-bold font-display text-white">Send a Message</h2>

              <AnimatePresence mode="wait">
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-3 ${
                      result.success
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}
                  >
                    {result.success ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                    <span>{result.message}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--violet-bright)] outline-none transition-colors"
                    placeholder="Enter your name"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--violet-bright)] outline-none transition-colors"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--violet-bright)] outline-none transition-colors"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Your Message</label>
                  <textarea
                    rows={5}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--violet-bright)] outline-none transition-colors resize-none"
                    placeholder="Briefly describe your query, event booking reference, or cancellation request..."
                  />
                </div>

                <GlowButton type="submit" disabled={isSubmitting} className="w-full py-3.5 flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Sending Message...' : 'Send Message'}
                </GlowButton>
              </form>
            </GlassCard>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};
export default ContactUs;
