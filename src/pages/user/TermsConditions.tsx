import React from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { FloatingOrb } from '../../components/ui/FloatingOrb';
import { ShieldCheck, Scale, FileText, CheckCircle2 } from 'lucide-react';

export const TermsConditions: React.FC = () => {
  return (
    <PageWrapper className="relative px-4 pb-24 overflow-x-hidden">
      <FloatingOrb className="-top-40 -left-20 pointer-events-none" color="violet" size={400} />
      <FloatingOrb className="bottom-0 right-0 pointer-events-none" color="cyan" size={300} delay={2} />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10 pt-4">
        <header className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-display font-black tracking-tight text-white">
            Terms & <span className="text-gradient">Conditions</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto">
            Please read these terms carefully before using our platform. These terms govern the services provided by zenvybe.
          </p>
        </header>

        <GlassCard className="p-6 md:p-10 border border-white/5 space-y-8 text-slate-300 text-sm md:text-base leading-relaxed">
          <section className="flex gap-4 items-start pb-6 border-b border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-[var(--violet-bright)] shadow-glow">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">1. Agreement to Terms</h2>
              <p className="mt-2 text-slate-400 text-xs md:text-sm">
                By accessing or using the VHOP ticketing platform (owned and operated by <strong>zenvybe</strong>), you agree to be bound by these Terms & Conditions. If you do not agree, you must cease using the platform immediately.
              </p>
            </div>
          </section>

          <section className="flex gap-4 items-start pb-6 border-b border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-pink-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">2. Service & Account Registration</h2>
              <p className="mt-2 text-slate-400 text-xs md:text-sm">
                You must be at least 18 years of age to purchase tickets or register on our site. You are responsible for maintaining the confidentiality of your credentials and are fully liable for all activities that occur under your account.
              </p>
            </div>
          </section>

          <section className="flex gap-4 items-start pb-6 border-b border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-cyan-400">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">3. Pricing and Payments</h2>
              <p className="mt-2 text-slate-400 text-xs md:text-sm">
                All prices for events and services listed on VHOP are denominated in <strong>Indian Rupees (INR)</strong>. 
                We use secure, PCI-DSS compliant payment gateways (such as Cashfree/Razorpay) to process payments safely. By proceeding with a booking, you authorize us and our payment processors to charge your selected payment instrument (Cards, UPI, NetBanking, Wallets) for the total price including any convenience fees or taxes.
              </p>
            </div>
          </section>

          <section className="flex gap-4 items-start pb-6 border-b border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-amber-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">4. Intellectual Property</h2>
              <p className="mt-2 text-slate-400 text-xs md:text-sm">
                All contents, source code, visual designs, brands, animations, and structures displayed on this platform are the intellectual property of <strong>zenvybe</strong>. Any reproduction, distribution, or modifications without written consent is strictly prohibited.
              </p>
            </div>
          </section>

          <section className="flex gap-4 items-start pb-6 border-b border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-emerald-400">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">5. Limitation of Liability</h2>
              <p className="mt-2 text-slate-400 text-xs md:text-sm">
                zenvybe act as a ticketing technology facilitator. We do not host or organize the nightlife/music events ourselves, and therefore, we are not liable for any injuries, safety concerns, cancellations, schedule adjustments, or quality issues arising directly from the event venues or event organizers.
              </p>
            </div>
          </section>

          <section className="flex gap-4 items-start">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-indigo-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">6. Governing Law</h2>
              <p className="mt-2 text-slate-400 text-xs md:text-sm">
                These terms are governed by the laws of India. Any disputes arising out of the services, platform use, or transactions will be subject to the exclusive jurisdiction of the courts of <strong>Visakhapatnam, Andhra Pradesh, India</strong>.
              </p>
            </div>
          </section>
        </GlassCard>
      </div>
    </PageWrapper>
  );
};
export default TermsConditions;
