import React, { useState, useEffect } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowButton } from '../../components/ui/GlowButton';
import { Sparkles, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { mockDb as dbClient } from '../../lib/mockDb';
import { useAuthStore } from '../../store/authStore';

export const CreateEvent: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [company, setCompany] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    short_description: '',
    description: '',
    category: '',
    price: '',
    city: 'Mumbai',
    venue_name: '',
    cover_image: '',
    start_date: '',
    total_tickets: '100',
  });

  useEffect(() => {
    const init = async () => {
      if (!user) return;

      // Get admin's company
      const { data: companyData } = await dbClient
        .from('companies')
        .select('*')
        .eq('admin_user_id', user.id)
        .single();
      
      if (companyData) {
        setCompany(companyData);
      } else {
        alert('You need a verified company to create events.');
        navigate('/admin');
        return;
      }

      if (id) {
        // Fetch existing event for editing
        const { data: eventData } = await dbClient
          .from('events')
          .select('*')
          .eq('id', id)
          .single();
        
        if (eventData) {
          setFormData({
            title: eventData.title,
            short_description: eventData.short_description || '',
            description: eventData.description || '',
            category: eventData.category || '',
            price: eventData.price.toString(),
            city: eventData.city,
            venue_name: eventData.venue_name || '',
            cover_image: eventData.cover_image || '',
            start_date: eventData.start_date ? new Date(eventData.start_date).toISOString().slice(0, 16) : '',
            total_tickets: eventData.total_tickets?.toString() || '100',
          });
        }
      }
    };

    init();
  }, [id, user, navigate]);

  const handleAiGenerate = () => {
    setIsAiGenerating(true);
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        title: 'Cyberpunk Rooftop Rave',
        short_description: 'A neon-drenched night of futuristic beats.',
        description: 'Get ready for the most immersive cyberpunk experience Mumbai has ever seen. We\'re taking over the highest rooftop in the city for a night of underground techno, interactive light installations, and synthwave vibes. 🌃🔊🚀',
        category: 'Music',
        price: '1999',
        cover_image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1000',
      }));
      setIsAiGenerating(false);
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    setIsSubmitting(true);
    
    const eventPayload = {
      ...formData,
      company_id: company.id,
      price: parseFloat(formData.price) || 0,
      total_tickets: parseInt(formData.total_tickets) || 100,
      status: 'published',
      start_date: new Date(formData.start_date).toISOString(),
    };

    let result;
    if (id) {
      result = await dbClient
        .from('events')
        .update(eventPayload)
        .eq('id', id);
    } else {
      result = await dbClient
        .from('events')
        .insert([eventPayload]);
    }

    if (!result.error) {
      navigate('/admin');
    } else {
      console.error('Error saving event:', result.error);
      alert('Error saving event. Please check all fields.');
    }
    setIsSubmitting(false);
  };

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin')} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-4xl font-display font-bold">{id ? 'Edit Event' : 'Create Event'}</h1>
              <p className="text-[var(--text-secondary)]">Set up your next big night out.</p>
            </div>
          </div>
          <GlowButton 
            onClick={handleAiGenerate}
            className="gap-2"
            disabled={isAiGenerating}
          >
            <Sparkles className={isAiGenerating ? 'animate-spin' : ''} />
            {isAiGenerating ? 'VHOP AI is thinking...' : 'Generate with AI'}
          </GlowButton>
        </header>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <GlassCard className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Event Title</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--violet-bright)] outline-none transition-all"
                  placeholder="e.g. Underground Techno Night"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Short Hook</label>
                <input 
                  type="text" 
                  required
                  value={formData.short_description}
                  onChange={(e) => setFormData({...formData, short_description: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--violet-bright)] outline-none transition-all"
                  placeholder="A one-liner to grab attention"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Description</label>
                <textarea 
                  rows={6}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--violet-bright)] outline-none transition-all resize-none"
                  placeholder="Describe the vibe, the music, and what to expect..."
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Category</label>
                  <select 
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--violet-bright)] outline-none transition-all"
                  >
                    <option value="">Select Category</option>
                    <option value="Music">Music</option>
                    <option value="Comedy">Comedy</option>
                    <option value="Art">Art</option>
                    <option value="Club">Club</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Ticket Price (INR)</label>
                  <input 
                    type="number" 
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--violet-bright)] outline-none transition-all"
                    placeholder="0 for FREE"
                  />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-8 space-y-6">
              <h3 className="text-xl font-bold font-display">Logistics</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Venue Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.venue_name}
                    onChange={(e) => setFormData({...formData, venue_name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--violet-bright)] outline-none"
                    placeholder="e.g. The Warehouse"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Date & Time</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--violet-bright)] outline-none"
                  />
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="space-y-6">
            <GlassCard className="p-6 border-dashed border-2 border-white/10 hover:border-[var(--violet-bright)] transition-colors">
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 text-[var(--text-muted)] flex flex-col items-center">
                  {formData.cover_image ? (
                    <img src={formData.cover_image} className="w-full h-32 object-cover rounded-lg mb-4" alt="Preview" />
                  ) : (
                    <ImageIcon className="w-10 h-10" />
                  )}
                  <p className="text-xs font-medium">Cover Image URL</p>
                </div>
                <input 
                  type="url" 
                  value={formData.cover_image}
                  onChange={(e) => setFormData({...formData, cover_image: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-[var(--violet-bright)] outline-none"
                  placeholder="Paste image URL here"
                />
              </div>
            </GlassCard>

            <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Total Tickets</span>
                <input 
                  type="number"
                  value={formData.total_tickets}
                  onChange={(e) => setFormData({...formData, total_tickets: e.target.value})}
                  className="w-20 bg-white/10 border-none rounded px-2 py-1 text-right"
                />
              </div>
            </div>

            <GlowButton type="submit" disabled={isSubmitting} className="w-full py-4">
              {isSubmitting ? 'Saving...' : id ? 'Update Event' : 'Publish Event'}
            </GlowButton>
          </div>
        </form>
      </div>

      <AnimatePresence>
        {isAiGenerating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[var(--bg-primary)]/80 backdrop-blur-xl flex flex-col items-center justify-center"
          >
            <div className="relative">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="w-32 h-32 rounded-full border-4 border-t-[var(--violet-bright)] border-r-[var(--accent-pink)] border-b-[var(--accent-cyan)] border-l-transparent"
              />
              <Sparkles className="absolute inset-0 m-auto w-10 h-10 text-white animate-pulse" />
            </div>
            <h2 className="mt-8 text-2xl font-display font-bold">VHOP AI is painting your event... 🎨</h2>
            <p className="mt-2 text-[var(--text-secondary)]">Generating catchy copy and optimized settings...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
};
