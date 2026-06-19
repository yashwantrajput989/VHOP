import React from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { FloatingOrb } from '../../components/ui/FloatingOrb';
import { Shield, Lock, Eye, RefreshCw, Ban, UserCheck, Mail } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <PageWrapper className="relative px-4 pb-24 overflow-x-hidden">
      <FloatingOrb className="-top-40 -left-20 pointer-events-none" color="violet" size={400} />
      <FloatingOrb className="bottom-0 right-0 pointer-events-none" color="cyan" size={300} delay={2} />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10 pt-4">
        <header className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-display font-black tracking-tight text-white">
            Privacy <span className="text-gradient">Policy</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto">
            Your privacy is our priority. Please review our data collection practices, permissions, and refund rules.
          </p>
        </header>

        <GlassCard className="p-6 md:p-10 border border-white/5 space-y-8 text-slate-300 text-sm md:text-base leading-relaxed">
          <section className="flex gap-4 items-start pb-6 border-b border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-[var(--violet-bright)] shadow-glow">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">1. Introduction & Overview</h2>
              <p className="mt-2 text-slate-400 text-xs md:text-sm">
                This Privacy Policy describes how <strong>VHOP</strong> (a platform owned and operated by <strong>zenvybe</strong>) collects, uses, processes, and protects your information. By using the VHOP website or mobile application, you consent to the practices outlined in this policy.
              </p>
            </div>
          </section>

          <section className="flex gap-4 items-start pb-6 border-b border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-pink-400">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">2. Information We Collect</h2>
              <p className="mt-2 text-slate-400 text-xs md:text-sm">
                We collect information to provide a seamless ticketing and community experience:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><strong>Account Data:</strong> Name, email address, phone number, and profile details provided during registration.</li>
                  <li><strong>Squad & Payout Info:</strong> UPI IDs and optional payment QR code images provided by squad hosts for payout processing.</li>
                  <li><strong>Transaction Details:</strong> Event tickets purchased, referral codes applied, and payment status (payouts and refunds).</li>
                  <li><strong>Device Permissions:</strong> Storage access (to upload QR images and profile photos), network state, and notifications.</li>
                </ul>
              </p>
            </div>
          </section>

          <section className="flex gap-4 items-start pb-6 border-b border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-cyan-400">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">3. Payment Security & Processing</h2>
              <p className="mt-2 text-slate-400 text-xs md:text-sm">
                We do not store your credit card, debit card, or net banking credentials. All ticket purchases are securely handled through certified, PCI-DSS compliant payment gateways (Razorpay/Cashfree). Squad payouts are disbursed securely using the host's provided UPI ID/QR image.
              </p>
            </div>
          </section>

          <section className="flex gap-4 items-start pb-6 border-b border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-amber-400">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">4. Refunds & Cancellation Rules</h2>
              <p className="mt-2 text-slate-400 text-xs md:text-sm">
                To ensure a transparent ticketing process, our refund guidelines are defined as follows:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><strong>Event Cancellation:</strong> If an event is cancelled by the organizer or platform, users receive a <strong>100% refund</strong> of the ticket price.</li>
                  <li><strong>Customer Cancellation:</strong> Tickets are non-refundable for no-shows or user cancellations unless explicitly permitted by the event guidelines.</li>
                  <li><strong>Processing Fees:</strong> A standard platform convenience booking fee of <strong>₹49</strong> is non-refundable.</li>
                  <li><strong>Timeline:</strong> Approved refunds are credited to the original payment source (UPI, Bank Account, Card) within <strong>5-7 working days</strong>.</li>
                </ul>
              </p>
            </div>
          </section>

          <section className="flex gap-4 items-start pb-6 border-b border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-red-400">
              <Ban className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">5. Data Retention & Account Deletion</h2>
              <p className="mt-2 text-slate-400 text-xs md:text-sm">
                We retain personal data as long as your account remains active or as required by law. Users have the right to request deletion of their personal information and payment details by contacting support.
              </p>
            </div>
          </section>

          <section className="flex gap-4 items-start pb-6 border-b border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-emerald-400">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">6. Policy Updates & Compliance</h2>
              <p className="mt-2 text-slate-400 text-xs md:text-sm">
                We may periodically update this policy to align with new legal requirements or app features. Important updates will be posted on this page, and your continued use of the platform constitutes agreement to those updates.
              </p>
            </div>
          </section>

          <section className="flex gap-4 items-start">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-indigo-400">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">7. Grievances & Contact Information</h2>
              <p className="mt-2 text-slate-400 text-xs md:text-sm">
                For questions regarding privacy, terms, or refund status:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Email: <strong>support@openct.com</strong></li>
                  <li>Hotline: <strong>+91-9851437143</strong></li>
                  <li>Grievance Officer: <strong>zenvybe</strong>, Visakhapatnam, Andhra Pradesh, India</li>
                </ul>
              </p>
            </div>
          </section>
        </GlassCard>
      </div>
    </PageWrapper>
  );
};

export default PrivacyPolicy;
