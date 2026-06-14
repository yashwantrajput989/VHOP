import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Capacitor } from '@capacitor/core';
import { AuthModal } from './components/ui/AuthModal';
import { Events } from './pages/user/Events';
import { Social } from './pages/user/Social';
import { Community } from './pages/user/Community';
import { Profile } from './pages/user/Profile';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { CreateEvent } from './pages/admin/CreateEvent';
import { SuperDashboard } from './pages/superadmin/SuperDashboard';
import { AdminSettings } from './pages/admin/AdminSettings';
import { GuestList } from './pages/admin/GuestList';
import { AdminTeams } from './pages/admin/AdminTeams';
import { AdminSupport } from './pages/admin/AdminSupport';
import { AdminLogin } from './pages/admin/AdminLogin';

import { EventDetails } from './pages/user/EventDetails';
import { Dashboard } from './pages/user/Dashboard';
import { ContactUs } from './pages/user/ContactUs';
import { TermsConditions } from './pages/user/TermsConditions';
import { RefundsCancellations } from './pages/user/RefundsCancellations';
import { SquadView } from './pages/user/SquadView';

import { useAuthStore } from './store/authStore';
import { useUIStore } from './store/uiStore';
import { useEffect } from 'react';
import ScrollToTop from './components/utils/ScrollToTop';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

function App() {
  const location = useLocation();
  const { initialize, user } = useAuthStore();
  const { openModal } = useUIStore();
  const navigate = useNavigate();
  
  useEffect(() => {
    initialize();
    // Force scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, [initialize]);

  // Handle triggerAuth navigation state to open sign-in modal
  useEffect(() => {
    if (location.state && (location.state as any).triggerAuth) {
      openModal('auth');
      // Clear location state to prevent repeating on reload
      window.history.replaceState({}, document.title);
    }
  }, [location, openModal]);

  // Capture referral code from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const refCode = params.get('ref');
    if (refCode && refCode.startsWith('VHOP-')) {
      localStorage.setItem('referred_by_code', refCode);
      console.log('Successfully captured and saved referral code:', refCode);
    }
  }, [location]);

  // Global redirect when user logs in
  const isTargetAdmin = import.meta.env.VITE_APP_TARGET === 'admin';

  useEffect(() => {
    if (user && location.pathname === '/') {
      if (isTargetAdmin) {
        if (user.role === 'superadmin') {
          navigate('/superadmin', { replace: true });
        } else if (user.role === 'admin' || user.role === 'subadmin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/admin/login', { replace: true });
        }
      } else {
        navigate('/events', { replace: true });
      }
    }
  }, [user, location.pathname, navigate, isTargetAdmin]);

  const isNative = Capacitor.isNativePlatform();
  const isAdminPath = isTargetAdmin ? location.pathname.startsWith('/admin') : (!isNative && location.pathname.startsWith('/admin'));
  const isSuperAdminPath = isTargetAdmin ? location.pathname.startsWith('/superadmin') : (!isNative && location.pathname.startsWith('/superadmin'));

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-x-hidden">
      {/* Loading screen removed for faster transitions */}

      <ScrollToTop />
      {/* Sidebar for desktop - only show for non-admin or verified admin paths */}
      {!isAdminPath && !isSuperAdminPath && <Sidebar isAdmin={false} />}
      { (isAdminPath || isSuperAdminPath) && (user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'subadmin') && location.pathname !== '/admin/login' && <Sidebar isAdmin={true} />}
      
      {/* Navbar for mobile and top-level desktop - HIDE for admin */}
      {!isAdminPath && !isSuperAdminPath && <Navbar />}
 
      <main className={`flex-1 min-w-0 relative ${isAdminPath || isSuperAdminPath ? 'w-full' : ''}`}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* User Routes / Admin Redirect */}
            <Route path="/" element={
              isTargetAdmin ? (
                user?.role === 'superadmin' 
                  ? <Navigate to="/superadmin" replace /> 
                  : (user?.role === 'admin' || user?.role === 'subadmin') 
                    ? <Navigate to="/admin" replace /> 
                    : <Navigate to="/admin/login" replace />
              ) : (
                <Navigate to="/events" replace />
              )
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetails />} />
            <Route path="/social" element={<Social />} />
            <Route path="/community" element={<Community />} />
            <Route path="/squad/:id" element={<SquadView />} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="/terms-conditions" element={<TermsConditions />} />
            <Route path="/refunds-cancellations" element={<RefundsCancellations />} />

            {/* Admin Routes */}
            {(isTargetAdmin || !isNative) && (
              <>
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['admin', 'subadmin', 'superadmin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/create-event" element={
                  <ProtectedRoute allowedRoles={['admin', 'subadmin', 'superadmin']}>
                    <CreateEvent />
                  </ProtectedRoute>
                } />
                <Route path="/admin/edit-event/:id" element={
                  <ProtectedRoute allowedRoles={['admin', 'subadmin', 'superadmin']}>
                    <CreateEvent />
                  </ProtectedRoute>
                } />
                <Route path="/admin/settings" element={
                  <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                    <AdminSettings />
                  </ProtectedRoute>
                } />
                <Route path="/admin/guests" element={
                  <ProtectedRoute allowedRoles={['admin', 'subadmin', 'superadmin']}>
                    <GuestList />
                  </ProtectedRoute>
                } />
                <Route path="/admin/teams" element={
                  <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                    <AdminTeams />
                  </ProtectedRoute>
                } />
                <Route path="/admin/support" element={
                  <ProtectedRoute allowedRoles={['admin', 'subadmin', 'superadmin']}>
                    <AdminSupport />
                  </ProtectedRoute>
                } />
                <Route path="/admin/login" element={<AdminLogin />} />
              </>
            )}
            
            {/* Super Admin Routes */}
            {(isTargetAdmin || !isNative) && (
              <>
                <Route path="/superadmin" element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <SuperDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/superadmin/events" element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <SuperDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/superadmin/partners" element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <SuperDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/superadmin/issues" element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <SuperDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/superadmin/coupons" element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <SuperDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/superadmin/fees" element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <SuperDashboard />
                  </ProtectedRoute>
                } />
              </>
            )}

            {/* Fallback */}
            <Route path="*" element={
              isTargetAdmin ? (
                user?.role === 'superadmin' 
                  ? <Navigate to="/superadmin" replace /> 
                  : (user?.role === 'admin' || user?.role === 'subadmin') 
                    ? <Navigate to="/admin" replace /> 
                    : <Navigate to="/admin/login" replace />
              ) : (
                <Navigate to="/events" replace />
              )
            } />
          </Routes>
        </AnimatePresence>
      </main>

      <AuthModal />
    </div>
  );
}

export default App;
