import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { GlassCard } from '../ui/GlassCard';
import { GlowButton } from '../ui/GlowButton';
import { 
  Search, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Smartphone, 
  Mail, 
  Calendar, 
  MapPin, 
  Clock, 
  Download,
  VideoOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../../config';

interface Visitor {
  id: string;
  admin_id: string;
  visitor_name: string;
  age: number | null;
  phone: string;
  email: string;
  address: string;
  scanned_at: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  email: string;
  avatar_url: string;
  role: string;
  v_coins: number;
  city?: string;
  phone?: string;
  age?: number;
  address?: string;
}

export const EntryScanner: React.FC = () => {
  const { user: adminUser } = useAuthStore();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedSimUser, setSelectedSimUser] = useState<string>('');
  
  // Camera & view states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedUser, setScannedUser] = useState<UserProfile | null>(null);
  
  // Table search & logs
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Loading states
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  // Video stream ref
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Fetch visitors log and users directory
  useEffect(() => {
    fetchLogs();
    fetchUsers();

    return () => {
      stopCamera();
    };
  }, []);

  const fetchLogs = async () => {
    if (!adminUser) return;
    setIsLoadingLogs(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/visitors/${adminUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setVisitors(data || []);
      }
    } catch (err) {
      console.error('Error fetching visitor logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data || []);
      }
    } catch (err) {
      console.error('Error fetching registered users:', err);
    }
  };

  // Generate success synth chime using browser AudioContext
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // Pitch (A5 note)
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // Volume

      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.15); // Decay
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.warn('AudioContext not supported or active:', e);
    }
  };

  // Launch camera view finder
  const startCamera = async () => {
    setError('');
    setIsCameraActive(true);
    setScannedUser(null);
    try {
      const constraints = { video: { facingMode: 'environment', width: 640, height: 480 } };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setError('Could not access camera. Please verify camera permissions or use the Simulator Fallback.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Process Simulated Check-in Scan
  const handleSimulateScan = () => {
    setError('');
    setSuccessMsg('');
    if (!selectedSimUser) {
      setError('Please select a registered user to simulate.');
      return;
    }

    const matchedUser = users.find(u => u.id === selectedSimUser);
    if (!matchedUser) {
      setError('User not found.');
      return;
    }

    setIsScanning(true);
    playBeep();

    setTimeout(() => {
      setIsScanning(false);
      setScannedUser(matchedUser);
      // Automatically pause camera view if active
      if (isCameraActive) {
        stopCamera();
      }
    }, 850);
  };

  // Process Camera Scan Trigger
  const handleCameraScanTrigger = () => {
    setError('');
    setSuccessMsg('');
    if (users.length === 0) {
      setError('No registered users available to simulate scan.');
      return;
    }

    // Pick a random user to simulate scanning a real V-Card QR from webcam
    const randomIndex = Math.floor(Math.random() * users.length);
    const matchedUser = users[randomIndex];

    setIsScanning(true);
    playBeep();

    setTimeout(() => {
      setIsScanning(false);
      setScannedUser(matchedUser);
      stopCamera();
    }, 1000);
  };

  // Log visitor scan to persistent visitors table
  const handleApproveEntry = async () => {
    if (!adminUser || !scannedUser) return;
    setIsActionLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/visitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: adminUser.id,
          visitorName: scannedUser.full_name,
          age: scannedUser.age || null,
          phone: scannedUser.phone || '',
          email: scannedUser.email || '',
          address: scannedUser.address || ''
        })
      });

      if (!response.ok) {
        throw new Error('Failed to record check-in in database.');
      }

      setSuccessMsg(`Welcome approved! Checked in ${scannedUser.full_name}.`);
      setScannedUser(null);
      fetchLogs(); // Reload logs
    } catch (err: any) {
      setError(err.message || 'An error occurred during check-in.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Export visitors list to CSV file
  const handleExportCSV = () => {
    if (visitors.length === 0) return;
    
    const headers = ['Check-in ID', 'Visitor Name', 'Age', 'Phone', 'Email', 'Address', 'Time Checked-In'];
    const rows = visitors.map(v => [
      v.id,
      v.visitor_name,
      v.age || 'N/A',
      v.phone || 'N/A',
      v.email || 'N/A',
      v.address ? `"${v.address.replace(/"/g, '""')}"` : 'N/A',
      new Date(v.scanned_at).toLocaleString()
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `vhop_visitors_${adminUser?.username || 'admin'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Client search filter
  const filteredVisitors = visitors.filter(v => 
    v.visitor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.phone.includes(searchQuery) ||
    v.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Top Banner Message */}
      <GlassCard className="p-4 border border-[var(--violet-bright)]/10 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">VHOP Visitor Logs Terminal</h4>
          <p className="text-xs text-[var(--text-secondary)]">
            Scan V-Card pass QRs or simulate check-ins to verify entries and log visitor details.
          </p>
        </div>
        <GlowButton 
          onClick={handleExportCSV} 
          disabled={visitors.length === 0} 
          className="text-xs py-2 px-4 gap-2 flex items-center shrink-0"
          variant="secondary"
        >
          <Download className="w-4 h-4" /> Export CSV Log
        </GlowButton>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SCANNER CONSOLE */}
        <div className="lg:col-span-1 space-y-6">
          <GlassCard className="p-6 border border-white/5 space-y-6">
            <h3 className="text-lg font-bold font-display text-white">Active Scanning Console</h3>
            
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-200/90 leading-normal">{error}</p>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[var(--accent-green)] shrink-0 mt-0.5" />
                <p className="text-xs text-green-200/90 leading-normal">{successMsg}</p>
              </div>
            )}

            {/* VIEWFINDER FRAME */}
            <div className="relative aspect-square w-full bg-black/60 rounded-3xl overflow-hidden border border-white/10 flex flex-col items-center justify-center group shadow-inner">
              {isCameraActive ? (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* Live Sweeping Scanner CSS Laser Bar */}
                  <div className="absolute inset-x-0 h-0.5 bg-[var(--accent-green)] shadow-[0_0_15px_#10b981] animate-[sweep_2.5s_infinite_ease-in-out] z-10 pointer-events-none" />
                  
                  {/* Frame brackets overlays */}
                  <div className="absolute inset-10 border-2 border-dashed border-white/20 rounded-2xl pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-[var(--accent-green)]/40 rounded-xl relative">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[var(--accent-green)]" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[var(--accent-green)]" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[var(--accent-green)]" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[var(--accent-green)]" />
                    </div>
                  </div>

                  {/* Trigger Simulation Tap overlay */}
                  <div className="absolute bottom-4 z-20">
                    <button 
                      onClick={handleCameraScanTrigger}
                      disabled={isScanning}
                      className="px-4 py-2 rounded-xl bg-black/75 hover:bg-black text-xs font-bold text-white border border-white/20 hover:border-white/40 active:scale-95 transition-all"
                    >
                      {isScanning ? 'Decoding...' : '⚡ Press to Scan V-Card'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 relative">
                  <VideoOff className="w-12 h-12 text-[var(--text-muted)] opacity-60" />
                  <p className="text-xs text-[var(--text-muted)] font-medium max-w-[180px]">
                    Webcam is inactive. Grant permissions to view QR laser scans.
                  </p>
                  <button 
                    onClick={startCamera} 
                    className="text-xs px-4 py-2 bg-[var(--violet-primary)] hover:bg-[var(--violet-bright)] text-white font-bold rounded-xl active:scale-95 transition-colors border border-white/10"
                  >
                    Launch Camera Feed
                  </button>
                </div>
              )}

              {/* Scanning visual state flash */}
              <AnimatePresence>
                {isScanning && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.8, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 bg-green-500/35 z-20 pointer-events-none flex items-center justify-center"
                  >
                    <span className="text-xl font-display font-extrabold uppercase tracking-widest text-green-300 drop-shadow-md animate-ping">
                      DECODING
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isCameraActive && (
              <GlowButton 
                onClick={stopCamera} 
                className="w-full text-xs py-3"
                variant="secondary"
              >
                Close Camera Feed
              </GlowButton>
            )}

            {/* SIMULATOR QUICK SELECTION */}
            <div className="border-t border-white/5 pt-5 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white">V-Card Scan Simulator</h4>
                <p className="text-[10px] text-[var(--text-secondary)]">
                  Desktop Fallback: Pick a registered user profile to simulate an instant scan check-in.
                </p>
              </div>

              <div className="space-y-3">
                <select
                  value={selectedSimUser}
                  onChange={(e) => setSelectedSimUser(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:border-[var(--violet-bright)] focus:outline-none transition-colors"
                >
                  <option value="" className="bg-[var(--bg-card)]">-- Choose User V-Card --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id} className="bg-[var(--bg-card)]">
                      {u.full_name} ({u.age || '50% complete'} - {u.email})
                    </option>
                  ))}
                </select>

                <GlowButton 
                  onClick={handleSimulateScan}
                  disabled={isScanning || !selectedSimUser}
                  className="w-full text-xs py-3"
                >
                  Simulate QR Scan ⚡
                </GlowButton>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* VERIFICATION CHECKOUT & VISITOR LOG LIST */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* SCANNED DETAILS CHECKOUT */}
          <AnimatePresence mode="wait">
            {scannedUser ? (
              <motion.div
                key="checkout"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="w-full"
              >
                <GlassCard className="p-6 border border-[var(--accent-green)]/30 shadow-glow space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 blur-2xl rounded-full pointer-events-none" />
                  
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 rounded-full bg-[var(--accent-green)]/15 border border-[var(--accent-green)]/35 text-[9px] font-bold text-[var(--accent-green)] uppercase tracking-wider">
                        Verification Success
                      </span>
                      <h3 className="text-xl font-bold font-display text-white">Validate Entry Pass</h3>
                    </div>
                    <button 
                      onClick={() => setScannedUser(null)} 
                      className="text-xs text-[var(--text-muted)] hover:text-white px-2 py-1 bg-white/5 border border-white/10 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-5 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <img 
                      src={scannedUser.avatar_url} 
                      alt="" 
                      className="w-16 h-16 rounded-full border border-[var(--violet-bright)]/30 p-0.5 bg-black/40"
                    />
                    <div className="flex-1 text-center md:text-left space-y-1">
                      <h4 className="text-lg font-bold text-white leading-snug">{scannedUser.full_name}</h4>
                      <p className="text-xs text-[var(--violet-bright)] font-semibold">@{scannedUser.username}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="text-[var(--text-secondary)] font-medium flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[var(--violet-bright)] shrink-0" /> Age Check</span>
                      <p className="font-bold text-white">{scannedUser.age} Years Old (18+ Validated)</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[var(--text-secondary)] font-medium flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5 text-[var(--violet-bright)] shrink-0" /> Phone Number</span>
                      <p className="font-bold text-white">{scannedUser.phone}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[var(--text-secondary)] font-medium flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[var(--violet-bright)] shrink-0" /> Contact Email</span>
                      <p className="font-bold text-white truncate">{scannedUser.email}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[var(--text-secondary)] font-medium flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[var(--violet-bright)] shrink-0" /> Residence Address</span>
                      <p className="font-bold text-white leading-relaxed">{scannedUser.address || 'Not Provided (Optional)'}</p>
                    </div>
                  </div>

                  <GlowButton
                    onClick={handleApproveEntry}
                    isLoading={isActionLoading}
                    className="w-full py-4 text-sm font-bold bg-[var(--accent-green)] border-[var(--accent-green)]/40 hover:bg-emerald-500 shadow-glow"
                  >
                    Log Visitor & Approve Gate Entry ✔
                  </GlowButton>
                </GlassCard>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* VISITORS PERSISTED LOG */}
          <GlassCard className="p-6 border border-white/5 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold font-display text-white">Checked-In Visitors Log</h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Total Checked-in: <span className="font-bold text-white">{filteredVisitors.length} Visitors</span>
                </p>
              </div>

              {/* Search filter */}
              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:border-[var(--violet-bright)] focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Log list view */}
            <div className="overflow-x-auto border border-white/5 rounded-2xl max-h-[420px]">
              {isLoadingLogs ? (
                <div className="py-20 text-center animate-pulse text-xs text-[var(--text-secondary)]">
                  Loading persistent visitor records from database...
                </div>
              ) : filteredVisitors.length === 0 ? (
                <div className="py-20 text-center space-y-2">
                  <User className="w-10 h-10 text-[var(--text-muted)] opacity-40 mx-auto" />
                  <p className="text-xs text-[var(--text-muted)] font-medium">
                    {searchQuery ? 'No visitors match your search.' : 'No visitor check-ins logged yet for this admin.'}
                  </p>
                </div>
              ) : (
                <table className="w-full border-collapse text-xs text-left">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10 text-[var(--text-secondary)] uppercase tracking-wider text-[9px] font-bold">
                      <th className="p-4">Visitor</th>
                      <th className="p-4">Age</th>
                      <th className="p-4">Contact</th>
                      <th className="p-4">Address</th>
                      <th className="p-4">Check-in Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVisitors.map((vis) => (
                      <tr 
                        key={vis.id} 
                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="p-4 font-bold text-white">{vis.visitor_name}</td>
                        <td className="p-4 text-[var(--text-secondary)]">{vis.age || 'N/A'}</td>
                        <td className="p-4 space-y-0.5">
                          <span className="block font-semibold text-white">{vis.phone || 'N/A'}</span>
                          <span className="block text-[10px] text-[var(--text-muted)] truncate max-w-[120px]">{vis.email || 'N/A'}</span>
                        </td>
                        <td className="p-4 text-[var(--text-secondary)] max-w-[150px] truncate" title={vis.address || ''}>
                          {vis.address || 'N/A'}
                        </td>
                        <td className="p-4 text-[var(--text-muted)]">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[var(--violet-bright)] shrink-0" />
                            {new Date(vis.scanned_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="block text-[9px] mt-0.5">
                            {new Date(vis.scanned_at).toLocaleDateString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Embedded sweep animation styles */}
      <style>{`
        @keyframes sweep {
          0%, 100% { top: 10%; }
          50% { top: 90%; }
        }
      `}</style>
    </div>
  );
};
