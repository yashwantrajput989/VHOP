import React from 'react';
import { cn } from '../../lib/utils';

interface AvatarProps {
  src?: string;
  alt?: string;
  initials?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  ring?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  initials,
  size = 'md',
  className,
  ring = false
}) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl'
  };

  const ringClass = ring ? 'ring-2 ring-[var(--violet-primary)] ring-offset-2 ring-offset-[var(--bg-primary)]' : '';

  return (
    <div
      className={cn(
        "relative flex items-center justify-center shrink-0 rounded-full overflow-hidden bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-semibold",
        sizes[size],
        ringClass,
        className
      )}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span>{initials || alt.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
};
