import React, { useState, useEffect } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowButton } from '../../components/ui/GlowButton';
import { Sparkles, Image as ImageIcon, ArrowLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL, getImageUrl } from '../../config';
import { AdminLogin } from './AdminLogin';
import { ImageCropper } from '../../components/profile/ImageCropper';

export const CreateEvent: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [cropError, setCropError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    short_description: '',
    description: '',
    category: '',
    price: '',
    city: 'Visakhapatnam',
    venue_name: '',
    cover_image: '',
    start_date: '',
    total_tickets: '100',
    ticket_types: [] as any[],
    google_maps_url: '',
    artists: [] as any[],
  });

  const [newArtist, setNewArtist] = useState({
    name: '',
    role: '',
  });

  const [newTicketType, setNewTicketType] = useState({
    name: '',
    price: '',
    benefits: '',
  });

  useEffect(() => {
    const init = async () => {
      if (!user) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setCompany(data.company);
        } else {
          // Default company for simplified admin mode
          setCompany({ id: 'vhop_official', name: 'Global Admin' });
        }
      } catch (error) {
        console.error('Error fetching company:', error);
        setCompany({ id: 'vhop_official', name: 'Global Admin' });
      } 

      if (id) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/events/${id}`);
          if (response.ok) {
            const eventData = await response.json();
            if (typeof eventData.ticket_types === 'string') {
              eventData.ticket_types = JSON.parse(eventData.ticket_types);
            }
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
            ticket_types: eventData.ticket_types || [],
            google_maps_url: eventData.google_maps_url || '',
            artists: typeof eventData.artists === 'string' ? JSON.parse(eventData.artists) : eventData.artists || [],
          });
        }
      } catch (error) {
        console.error('Error fetching event details:', error);
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
        city: 'Visakhapatnam',
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
    
    const isSuperAdmin = user?.role === 'superadmin';
    const eventPayload = {
      ...formData,
      company_id: company.id,
      price: parseFloat(formData.price) || 0,
      total_tickets: parseInt(formData.total_tickets) || 100,
      status: isSuperAdmin ? 'published' : 'draft',
      start_date: new Date(formData.start_date).toISOString(),
      ticket_types: formData.ticket_types.map((t: any) => ({
        ...t,
        id: t.id || `t-${Math.random().toString(36).substring(2, 9)}`,
        price: parseFloat(t.price) || 0,
      })),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventPayload)
      });
      
      if (response.ok) {
        if (!isSuperAdmin) {
          alert('Event submitted! Once approved by the Super Admin, it will go live on the website.');
        } else {
          alert('Event published successfully!');
        }
        navigate('/admin');
      } else {
        throw new Error('Failed to save event');
      }
    } catch (error) {
      console.error('Error saving event to MySQL:', error);
      alert('Error saving event. Please check your connection.');
    }
    setIsSubmitting(false);
  };

  if (!user || (user.role !== 'admin' && user.role !== 'subadmin' && user.role !== 'superadmin')) {
    return <AdminLogin forcedRole="admin" />;
  }

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
                    className="w-full bg-[#110F20] text-white border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--violet-bright)] outline-none transition-all"
                  >
                    <option value="" className="bg-[#110F20] text-white">Select Category</option>
                    <option value="Music" className="bg-[#110F20] text-white">Music</option>
                    <option value="Comedy" className="bg-[#110F20] text-white">Comedy</option>
                    <option value="Art" className="bg-[#110F20] text-white">Art</option>
                    <option value="Club" className="bg-[#110F20] text-white">Club</option>
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
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold font-display text-white">Ticket Types</h3>
                <p className="text-xs text-[var(--text-secondary)]">Define your pricing tiers</p>
              </div>

              {/* Add Ticket Type Form */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Type Name</label>
                    <input 
                      type="text" 
                      value={newTicketType.name}
                      onChange={(e) => setNewTicketType({...newTicketType, name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-[var(--violet-bright)] outline-none"
                      placeholder="e.g. VIP Access"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Price (INR)</label>
                    <input 
                      type="number" 
                      value={newTicketType.price}
                      onChange={(e) => setNewTicketType({...newTicketType, price: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-[var(--violet-bright)] outline-none"
                      placeholder="999"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Benefits (One per line)</label>
                  <textarea 
                    rows={3}
                    value={newTicketType.benefits}
                    onChange={(e) => setNewTicketType({...newTicketType, benefits: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-[var(--violet-bright)] outline-none resize-none"
                    placeholder="Unlimited Drinks&#10;VIP Lounge Access&#10;After Party Entry"
                  />
                </div>
                <GlowButton 
                  type="button"
                  onClick={() => {
                    if (!newTicketType.name || !newTicketType.price) return;
                    setFormData({
                      ...formData,
                      ticket_types: [
                        ...formData.ticket_types,
                        {
                          ...newTicketType,
                          benefits: newTicketType.benefits.split('\n').filter(b => b.trim() !== '')
                        }
                      ]
                    });
                    setNewTicketType({ name: '', price: '', benefits: '' });
                  }}
                  className="w-full py-2.5 text-sm"
                >
                  Add Ticket Type
                </GlowButton>
              </div>

              {/* List of Added Ticket Types */}
              <div className="space-y-3">
                {formData.ticket_types.map((type: any, index: number) => (
                  <div key={index} className="p-4 rounded-xl bg-[var(--violet-bright)]/5 border border-[var(--violet-bright)]/20 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{type.name}</span>
                        <span className="text-[var(--violet-bright)] font-bold">₹{type.price}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 mt-1">
                        {type.benefits.map((benefit: string, bIndex: number) => (
                          <span key={bIndex} className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1">
                            • {benefit}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        const updated = [...formData.ticket_types];
                        updated.splice(index, 1);
                        setFormData({...formData, ticket_types: updated});
                      }}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-8 space-y-6">
              <h3 className="text-xl font-bold font-display">Logistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">City</label>
                  <select 
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="w-full bg-[#110F20] text-white border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--violet-bright)] outline-none"
                  >
                    <option value="Visakhapatnam" className="bg-[#110F20] text-white">Visakhapatnam</option>
                    <option value="Mumbai" className="bg-[#110F20] text-white">Mumbai</option>
                    <option value="Bangalore" className="bg-[#110F20] text-white">Bangalore</option>
                    <option value="Hyderabad" className="bg-[#110F20] text-white">Hyderabad</option>
                    <option value="Delhi" className="bg-[#110F20] text-white">Delhi</option>
                  </select>
                </div>
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
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Google Maps URL</label>
                  <input 
                    type="url" 
                    value={formData.google_maps_url}
                    onChange={(e) => setFormData({...formData, google_maps_url: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--violet-bright)] outline-none"
                    placeholder="https://maps.app.goo.gl/..."
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

            <GlassCard className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold font-display text-white">Artists / Lineup</h3>
                <p className="text-xs text-[var(--text-secondary)]">Who is performing?</p>
              </div>

              {/* Add Artist Form */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Artist Name</label>
                    <input 
                      type="text" 
                      value={newArtist.name}
                      onChange={(e) => setNewArtist({...newArtist, name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-[var(--violet-bright)] outline-none"
                      placeholder="e.g. DJ Snake"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Role / Genre</label>
                    <input 
                      type="text" 
                      value={newArtist.role}
                      onChange={(e) => setNewArtist({...newArtist, role: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-[var(--violet-bright)] outline-none"
                      placeholder="e.g. Headliner"
                    />
                  </div>
                </div>
                <GlowButton 
                  type="button"
                  onClick={() => {
                    if (!newArtist.name) return;
                    setFormData({
                      ...formData,
                      artists: [...formData.artists, newArtist]
                    });
                    setNewArtist({ name: '', role: '' });
                  }}
                  className="w-full py-2.5 text-sm"
                >
                  Add Artist
                </GlowButton>
              </div>

              {/* List of Added Artists */}
              <div className="space-y-3">
                {formData.artists.map((artist: any, index: number) => (
                  <div key={index} className="p-4 rounded-xl bg-[var(--violet-bright)]/5 border border-[var(--violet-bright)]/20 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white">{artist.name}</span>
                      {artist.role && <span className="text-[10px] text-[var(--text-secondary)] ml-2 bg-white/10 px-2 py-0.5 rounded-full">{artist.role}</span>}
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        const updated = [...formData.artists];
                        updated.splice(index, 1);
                        setFormData({...formData, artists: updated});
                      }}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          <div className="space-y-6">
            <GlassCard className="p-6 border-dashed border-2 border-white/10 hover:border-[var(--violet-bright)] transition-colors relative group">
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setCropError(null);
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (reader.result) {
                        setSelectedImageSrc(reader.result as string);
                        setIsCropperOpen(true);
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 text-[var(--text-muted)] flex flex-col items-center">
                  {formData.cover_image ? (
                    <img 
                      src={getImageUrl(formData.cover_image)} 
                      className="w-full h-32 object-cover rounded-lg mb-4" 
                      alt="Preview" 
                    />
                  ) : (
                    <ImageIcon className="w-10 h-10 mb-2" />
                  )}
                  <p className="text-xs font-bold text-white group-hover:text-[var(--violet-bright)] transition-colors">
                    {formData.cover_image ? 'Change Image' : 'Upload Cover Image'}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">PNG, JPG or WebP (Max 5MB)</p>
                  {cropError && <p className="text-[10px] text-red-500 font-bold mt-1 text-center">{cropError}</p>}
                </div>
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

      <AnimatePresence>
        {isCropperOpen && selectedImageSrc && (
          <ImageCropper
            imageSrc={selectedImageSrc}
            aspectRatio="landscape"
            onCancel={() => {
              setIsCropperOpen(false);
              setSelectedImageSrc(null);
            }}
            onCropComplete={async (blob) => {
              setIsCropperOpen(false);
              setSelectedImageSrc(null);
              setIsSubmitting(true);
              try {
                const uploadFormData = new FormData();
                uploadFormData.append('image', blob, 'event_cover.jpg');
                const response = await fetch(`${API_BASE_URL}/api/upload`, {
                  method: 'POST',
                  body: uploadFormData
                });
                if (!response.ok) {
                  throw new Error('Failed to upload cropped cover image.');
                }
                const data = await response.json();
                if (data.url) {
                  setFormData(prev => ({ ...prev, cover_image: data.url }));
                }
              } catch (err: any) {
                console.error(err);
                setCropError(err.message || 'Failed to upload cropped image.');
              } finally {
                setIsSubmitting(false);
              }
            }}
          />
        )}
      </AnimatePresence>
    </PageWrapper>
  );
};
