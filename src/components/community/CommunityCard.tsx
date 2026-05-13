import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import { Users, ArrowRight } from 'lucide-react';

interface CommunityCardProps {
  community: {
    name: string;
    description: string;
    category: string;
    members_count: number;
    cover_image: string;
    avatar_image: string;
  };
}

export const CommunityCard: React.FC<CommunityCardProps> = ({ community }) => {
  return (
    <GlassCard className="group p-0 overflow-hidden flex flex-col h-full">
      <div className="relative h-32 overflow-hidden">
        <img src={community.cover_image} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] to-transparent" />
      </div>
      
      <div className="px-6 pb-6 relative">
        <div className="absolute -top-10 left-6">
          <div className="w-16 h-16 rounded-2xl border-4 border-[var(--bg-card)] bg-[var(--bg-secondary)] overflow-hidden shadow-xl">
            <img src={community.avatar_image} className="w-full h-full object-cover" alt="" />
          </div>
        </div>
        
        <div className="mt-10 space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="glass">{community.category}</Badge>
            <div className="flex items-center gap-1 text-[var(--text-muted)] text-xs">
              <Users className="w-3 h-3" />
              <span>{community.members_count}</span>
            </div>
          </div>
          
          <h3 className="text-xl font-bold font-display">{community.name}</h3>
          <p className="text-[var(--text-secondary)] text-sm line-clamp-2">
            {community.description}
          </p>
          
          <button className="flex items-center gap-2 text-[var(--violet-bright)] font-semibold text-sm hover:translate-x-1 transition-transform pt-2">
            View Community <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </GlassCard>
  );
};
