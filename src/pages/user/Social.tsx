import React from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { FloatingOrb } from '../../components/ui/FloatingOrb';
import { ComingSoon } from '../../components/ui/ComingSoon';
import { Users } from 'lucide-react';

export const Social: React.FC = () => {
  return (
    <PageWrapper className="relative">
      <FloatingOrb className="top-1/4 -left-20" color="pink" size={300} />
      <FloatingOrb className="bottom-1/4 -right-20" color="violet" size={400} delay={1} />

      <ComingSoon 
        title="Social Feed"
        description="A space to share your nightlife moments, follow friends, and discover what's happening in the VHOP universe."
        icon={<Users className="w-10 h-10 text-[var(--violet-bright)]" />}
      />
    </PageWrapper>
  );
};
