import React, { useState, useEffect, useRef } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowButton } from '../../components/ui/GlowButton';
import { Send, MessageSquare, LifeBuoy, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { AdminLogin } from './AdminLogin';
import { API_BASE_URL } from '../../config';

export const AdminSupport: React.FC = () => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const fetchMessages = async (silent = false) => {
    if (!user) return;
    if (!silent) setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/support/messages/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Error fetching support messages:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMessages();
      
      // Auto polling every 5 seconds to get quick updates from Super Admin
      const interval = setInterval(() => {
        fetchMessages(true);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [user]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!user || (user.role !== 'admin' && user.role !== 'subadmin')) {
    return <AdminLogin forcedRole="admin" />;
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSending(true);
    const msgText = newMessage;
    setNewMessage(''); // optimistic clear
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/support/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: user.id, // resolved parent on backend
          senderId: user.id,
          message: msgText,
        }),
      });

      if (response.ok) {
        const addedMsg = await response.json();
        setMessages((prev) => [...prev, addedMsg]);
      } else {
        alert('Failed to send support request.');
        setNewMessage(msgText);
      }
    } catch (err) {
      console.error('Error sending support request:', err);
      alert('Failed to connect to backend.');
      setNewMessage(msgText);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <PageWrapper>
      <div className="space-y-8 pb-12 h-[calc(100vh-6rem)] flex flex-col">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 flex-shrink-0">
          <div>
            <h1 className="text-4xl font-display font-bold">Support Chat</h1>
            <p className="text-[var(--text-secondary)]">Get assistance directly from the platform Super Admin.</p>
          </div>
          <div>
            <button
              onClick={() => fetchMessages()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-colors"
              title="Refresh support thread"
            >
              <RefreshCw className="w-4 h-4" /> Refresh Chat
            </button>
          </div>
        </header>

        <GlassCard className="flex-1 flex flex-col p-0 overflow-hidden relative border border-white/5 shadow-2xl">
          {/* Support Channel Header Banner */}
          <div className="p-6 border-b border-white/5 bg-white/[0.01] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--violet-primary)]/20 border border-[var(--violet-bright)]/20 flex items-center justify-center">
                <LifeBuoy className="w-5 h-5 text-[var(--violet-bright)] animate-spin-slow" />
              </div>
              <div>
                <h3 className="font-bold text-white font-display">VHOP Concierge Support</h3>
                <p className="text-[10px] text-[var(--accent-pink)] font-semibold flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-pink)] animate-ping" />
                  Active Helpdesk
                </p>
              </div>
            </div>
          </div>

          {/* Support Conversation History Section */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 bg-black/10">
            {isLoading && messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] space-y-2">
                <div className="animate-spin w-8 h-8 border-4 border-[var(--violet-bright)] border-t-transparent rounded-full" />
                <p className="text-sm">Retrieving historic support chat...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
                <MessageSquare className="w-12 h-12 text-[var(--text-muted)] opacity-20" />
                <h4 className="text-lg font-bold">Submit a Support Ticket</h4>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Have a question regarding payment payouts, scanner validation errors, or user bookings? Ask your question below and a Super Admin will respond immediately.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === user.id;
                const isSuper = msg.sender_role === 'superadmin';
                
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1 max-w-[85%] ${
                      isMe ? 'ml-auto' : 'mr-auto'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] px-1">
                      <span className="font-semibold text-white/70">{msg.sender_name || 'VHOP Super Admin'}</span>
                      <span className="opacity-60">({msg.sender_role || 'superadmin'})</span>
                    </div>

                    <div
                      className={`px-5 py-3 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? 'bg-[var(--violet-primary)] text-white rounded-tr-none border border-[var(--violet-bright)]/30 shadow-[0_4px_20px_rgba(109,40,217,0.15)]'
                          : isSuper
                          ? 'bg-[var(--accent-pink)]/15 text-pink-200 border border-[var(--accent-pink)]/35 rounded-tl-none shadow-[0_4px_20px_rgba(244,63,94,0.08)]'
                          : 'bg-white/5 text-white/90 border border-white/5 rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                    </div>

                    <span className="text-[9px] text-[var(--text-muted)] opacity-50 px-1.5">
                      {new Date(msg.created_at).toLocaleTimeString(undefined, {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Message Box Input Section */}
          <div className="p-4 border-t border-white/5 bg-white/[0.01] flex-shrink-0">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Describe your issue or question..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-sm focus:border-[var(--violet-bright)] focus:bg-white/[0.08] outline-none transition-all duration-300"
                disabled={isSending}
                maxLength={1000}
              />
              <GlowButton
                type="submit"
                disabled={isSending || !newMessage.trim()}
                className="px-6 flex items-center justify-center"
              >
                {isSending ? (
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </GlowButton>
            </form>
          </div>
        </GlassCard>
      </div>
    </PageWrapper>
  );
};
