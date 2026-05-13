import React from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { FloatingOrb } from '../../components/ui/FloatingOrb';
import { ComingSoon } from '../../components/ui/ComingSoon';
import { Map } from 'lucide-react';

export const Community: React.FC = () => {
  return (
    <PageWrapper className="relative">
      <FloatingOrb className="top-0 -right-20" color="cyan" size={500} />
      
      <ComingSoon 
        title="Communities"
        description="Connect with collectives, join live gatherings, and build your own nightlife tribe."
        icon={<Map className="w-10 h-10 text-[var(--accent-cyan)]" />}
      />
    </PageWrapper>
  );
};
