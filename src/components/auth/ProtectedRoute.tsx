import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('user' | 'admin' | 'superadmin' | 'subadmin')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, session, isInitializing } = useAuthStore();
  const location = useLocation();

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg-primary)] text-white space-y-4">
        <div className="relative w-16 h-16">
          {/* Glowing loader */}
          <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-[var(--violet-bright)] animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-r-2 border-l-2 border-pink-500 animate-spin animate-reverse opacity-70"></div>
          <div className="absolute inset-4 rounded-full bg-[var(--violet-primary)]/20 blur-sm"></div>
        </div>
        <p className="text-xs font-semibold tracking-widest uppercase text-[var(--text-muted)] animate-pulse">
          Securing Session...
        </p>
      </div>
    );
  }

  // If there's no session or user, redirect to login
  if (!user || !session) {
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/superadmin')) {
      return <Navigate to="/admin/login" replace state={{ from: location }} />;
    } else {
      // For standard user routes, redirect to /events and trigger the login modal
      return <Navigate to="/events" replace state={{ triggerAuth: true }} />;
    }
  }

  // If roles are specified, check if user's role is allowed
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/superadmin')) {
      // If they are on an admin route but aren't admin, force to admin/login
      return <Navigate to="/admin/login" replace state={{ from: location }} />;
    } else {
      return <Navigate to="/events" replace />;
    }
  }

  return <>{children}</>;
};
