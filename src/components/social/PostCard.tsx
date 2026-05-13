import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Avatar } from '../ui/Avatar';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface PostCardProps {
  post: {
    id: string;
    user: {
      name: string;
      username: string;
      avatar_url: string;
    };
    content: string;
    images?: string[];
    likes_count: number;
    comments_count: number;
    created_at: string;
    event_tag?: string;
  };
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes_count);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
  };

  return (
    <GlassCard className="w-full max-w-xl mx-auto p-0 overflow-hidden" hoverEffect={false}>
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Avatar src={post.user.avatar_url} initials={post.user.name.charAt(0)} ring />
          <div>
            <h4 className="font-semibold text-sm">{post.user.name}</h4>
            <p className="text-[var(--text-muted)] text-xs">@{post.user.username}</p>
          </div>
        </div>
        <button className="text-[var(--text-muted)] hover:text-white transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-[var(--text-primary)] text-sm leading-relaxed">
          {post.content}
        </p>
        {post.event_tag && (
          <div className="mt-2 inline-flex items-center px-2 py-1 rounded-md bg-[var(--violet-primary)]/10 border border-[var(--violet-primary)]/20 text-[var(--violet-bright)] text-xs font-medium cursor-pointer hover:bg-[var(--violet-primary)]/20 transition-all">
            📍 {post.event_tag}
          </div>
        )}
      </div>

      {/* Media */}
      {post.images && post.images.length > 0 && (
        <div className={cn(
          "grid gap-1 px-4 pb-4",
          post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"
        )}>
          {post.images.map((img, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-[var(--bg-secondary)]">
              <img src={img} alt="Post media" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-card)]/30">
        <button 
          onClick={handleLike}
          className="flex items-center gap-2 group transition-all"
        >
          <div className="relative">
            <AnimatePresence mode="wait">
              {isLiked ? (
                <motion.div
                  key="liked"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Heart className="w-6 h-6 fill-[var(--accent-pink)] text-[var(--accent-pink)]" />
                </motion.div>
              ) : (
                <motion.div
                  key="unliked"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Heart className="w-6 h-6 text-[var(--text-muted)] group-hover:text-[var(--accent-pink)]" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <span className={cn("text-sm font-medium", isLiked ? "text-[var(--accent-pink)]" : "text-[var(--text-muted)]")}>
            {likes}
          </span>
        </button>

        <button className="flex items-center gap-2 group text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors">
          <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">{post.comments_count}</span>
        </button>

        <button className="flex items-center gap-2 group text-[var(--text-muted)] hover:text-[var(--violet-bright)] transition-colors ml-auto">
          <Share2 className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        </button>
      </div>
    </GlassCard>
  );
};
