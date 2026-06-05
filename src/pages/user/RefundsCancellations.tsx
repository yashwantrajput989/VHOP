import React from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { FloatingOrb } from '../../components/ui/FloatingOrb';
import { RefreshCw, Ban, CreditCard, HelpCircle } from 'lucide-react';

export const RefundsCancellations: React.FC = () => {
  return (
    <PageWrapper className="relative px-4 pb-24 overflow-x-hidden">
      <FloatingOrb className="-top-40 -right-40 pointer-events-none" color="violet" size={400} />
      <FloatingOrb className="bottom-0 left-0 pointer-events-none" color="pink" size={300} delay={2} />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10 pt-4">
        <header className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-display font-black tracking-tight text-white">
            Refunds & <span className="text-gradient">Cancellations</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto">
            Review our ticketing refund guidelines, convenience charges, and processing windows.
          </p>
        </header>

        <GlassCard className="p-6 md:p-10 border border-white/5 space-y-8 text-slate-300 text-sm md:text-base leading-relaxed">
          <section className="flex gap-4 items-start pb-6 border-b border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-amber-400">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">1. Event Cancellations & Rescheduling</h2>
              <p className="mt-2 text-slate-400 text-xs md:text-sm">
                If an event is fully cancelled by the organizer or zenvybe, you are entitled to a <strong>100% refund</strong> of the event ticket purchase price. If an event is rescheduled to another date and you cannot attend, you can claim a refund by writing to us.
              </p>
            </div>
          </section>

          <section className="flex gap-4 items-start pb-6 border-b border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-red-400">
              <Ban className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">2. Customer Cancellations & No-Shows</h2>
              <p className="mt-2 text-slate-400 text-xs md:text-sm">
                Event tickets are generally non-refundable and non-exchangeable for customer cancellations or no-shows unless explicitly authorized by the event organizer. Please verify your calendar and location availability in INR before checking out.
              </p>
            </div>
          </section>

          <section className="flex gap-4 items-start pb-6 border-b border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-cyan-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">3. Processing Fees and Non-Refundable Items</h2>
              <p className="mt-2 text-slate-400 text-xs md:text-sm">
                The platform convenience / booking fee of <strong>₹49</strong> is charged per booking to process safe payments and maintain servers, and is <strong>non-refundable</strong> in the event of custom customer refunds.
              </p>
            </div>
          </section>

          <section className="flex gap-4 items-start pb-6 border-b border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-emerald-400 shadow-glow">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">4. Refund Timelines</h2>
              <p className="mt-2 text-slate-400 text-xs md:text-sm">
                Once a refund has been approved by our support department, the amount will be processed back to your original source of payment (Bank Card, UPI ID, NetBanking account, or Wallet). The refund will be credited to your account within <strong>5-7 working days</strong>, subject to standard banking settlement cycles.
              </p>
            </div>
          </section>

          <section className="flex gap-4 items-start">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-indigo-400">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">5. Need Help / Filing a Claim?</h2>
              <p className="mt-2 text-slate-400 text-xs md:text-sm">
                To raise a ticket cancellation or refund inquiry:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Send an email to <strong>support@openct.com</strong> with your order ID.</li>
                  <li>Call our support hotline at <strong>+91-9851437143</strong>.</li>
                  <li>Our grievances desk represents <strong>zenvybe</strong> at Visakhapatnam.</li>
                </ul>
              </p>
            </div>
          </section>
        </GlassCard>
      </div>
    </PageWrapper>
  );
};
export default RefundsCancellations;
