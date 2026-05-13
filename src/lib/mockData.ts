export const MOCK_EVENTS = [
  {
    id: '1',
    title: 'Neon Night: Techno Sessions',
    short_description: 'An immersive techno experience with international DJs.',
    description: 'Join us for a night of pure techno energy. Featuring top-tier lighting and sound production, we bring you the finest underground techno from around the world. The Warehouse is known for its incredible acoustics and industrial vibe, making it the perfect setting for this neon-drenched odyssey.',
    category: 'Music',
    city: 'Mumbai',
    venue_name: 'The Warehouse',
    start_date: new Date(Date.now() + 86400000 * 2).toISOString(),
    price: 1500,
    cover_image: 'https://images.unsplash.com/photo-1574391881207-b8ba8d25c485?q=80&w=1000&auto=format&fit=crop',
    tickets_sold: 450,
    total_tickets: 600,
    ticket_types: [
      { id: 't1', name: 'Early Bird', price: 1200, description: 'Limited availability' },
      { id: 't2', name: 'General Admission', price: 1500, description: 'Regular entry' },
      { id: 't3', name: 'VIP Backstage', price: 3500, description: 'Backstage access + 2 drinks' }
    ]
  },
  {
    id: '2',
    title: 'Laugh Out Loud: Standup Comedy',
    short_description: 'Top comedians from around the country.',
    description: 'Get ready for a night of rib-tickling humor. Our lineup includes some of the most sought-after standup artists in India. Perfect for a date night or a fun evening with friends.',
    category: 'Comedy',
    city: 'Bangalore',
    venue_name: 'The Comedy Club',
    start_date: new Date(Date.now() + 86400000 * 3).toISOString(),
    price: 499,
    cover_image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1000&auto=format&fit=crop',
    tickets_sold: 80,
    total_tickets: 100,
    ticket_types: [
      { id: 't4', name: 'Student Pass', price: 399, description: 'Valid student ID required' },
      { id: 't5', name: 'General Entry', price: 499, description: 'Standard admission' },
      { id: 't6', name: 'Front Row Experience', price: 799, description: 'Best seats in the house' }
    ]
  },
  {
    id: '3',
    title: 'Art in the Park',
    short_description: 'A community art exhibition.',
    description: 'A celebration of local creativity. Walk through a curated selection of paintings, sculptures, and digital art installations in the heart of the city.',
    category: 'Art',
    city: 'Delhi',
    venue_name: 'Central Park',
    start_date: new Date(Date.now() + 86400000 * 5).toISOString(),
    price: 0,
    cover_image: 'https://images.unsplash.com/photo-1460661419201-fd4ce18686e6?q=80&w=1000&auto=format&fit=crop',
    tickets_sold: 200,
    total_tickets: 500,
    ticket_types: [
      { id: 't7', name: 'Free Pass', price: 0, description: 'Register to get entry' }
    ]
  },
  {
    id: '4',
    title: 'Midnight Jazz Soiree',
    short_description: 'Elegant jazz performances in a cozy setting.',
    description: 'Experience the soulful sounds of live jazz. Our intimate venue provides the perfect backdrop for an evening of smooth melodies and fine cocktails.',
    category: 'Music',
    city: 'Mumbai',
    venue_name: 'The Blue Note',
    start_date: new Date(Date.now() + 86400000 * 7).toISOString(),
    price: 800,
    cover_image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=1000&auto=format&fit=crop',
    tickets_sold: 45,
    total_tickets: 80,
    ticket_types: [
      { id: 't8', name: 'Standard', price: 800, description: 'Includes 1 drink' }
    ]
  },
  {
    id: '5',
    title: 'Future Bass Festival',
    short_description: 'Electronic music festival with futuristic vibes.',
    description: 'Dive into the world of future bass. Featuring a lineup of cutting-edge producers and DJs, this festival is a journey through sound and light.',
    category: 'Music',
    city: 'Pune',
    venue_name: 'Neon Arena',
    start_date: new Date(Date.now() + 86400000 * 10).toISOString(),
    price: 2500,
    cover_image: 'https://images.unsplash.com/photo-1459749411177-042180ceea72?q=80&w=1000&auto=format&fit=crop',
    tickets_sold: 1200,
    total_tickets: 2000,
    ticket_types: [
      { id: 't9', name: 'Phase 1', price: 2000, description: 'Early bird' },
      { id: 't10', name: 'Phase 2', price: 2500, description: 'General' }
    ]
  },
  {
    id: '6',
    title: 'Culinary Workshop: Sushi Art',
    short_description: 'Learn the art of sushi making from masters.',
    description: 'Master the craft of sushi. Join our expert chefs for a hands-on workshop where you will learn everything from rice preparation to advanced rolling techniques.',
    category: 'Workshop',
    city: 'Bangalore',
    venue_name: 'Kitchen Studio',
    start_date: new Date(Date.now() + 86400000 * 4).toISOString(),
    price: 3000,
    cover_image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=1000&auto=format&fit=crop',
    tickets_sold: 12,
    total_tickets: 20,
    ticket_types: [
      { id: 't11', name: 'Full Workshop', price: 3000, description: 'All materials included' }
    ]
  },
  {
    id: '7',
    title: 'Rooftop Yoga & Brunch',
    short_description: 'Morning yoga session followed by a healthy brunch.',
    description: 'Start your Sunday with a refreshing yoga session on a rooftop overlooking the city. After the session, enjoy a curated healthy brunch with fresh juices and organic dishes.',
    category: 'Wellness',
    city: 'Mumbai',
    venue_name: 'Skyline Terrace',
    start_date: new Date(Date.now() + 86400000 * 6).toISOString(),
    price: 1200,
    cover_image: 'https://images.unsplash.com/photo-1545208393-2160291ba69e?q=80&w=1000&auto=format&fit=crop',
    tickets_sold: 25,
    total_tickets: 40,
    ticket_types: [
      { id: 't12', name: 'Yoga + Brunch', price: 1200, description: 'Complete experience' }
    ]
  },
  {
    id: '8',
    title: 'Indie Rock Live',
    short_description: 'Local indie bands showcasing their latest tracks.',
    description: 'Support the local music scene! Join us for a night of raw indie rock from the most promising bands in the city.',
    category: 'Music',
    city: 'Delhi',
    venue_name: 'The Underground',
    start_date: new Date(Date.now() + 86400000 * 1).toISOString(),
    price: 300,
    cover_image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1000&auto=format&fit=crop',
    tickets_sold: 150,
    total_tickets: 300,
    ticket_types: [
      { id: 't13', name: 'General Entry', price: 300, description: 'Support the bands' }
    ]
  },
  {
    id: 'vizag-1',
    title: 'Vizag Beach Festival',
    short_description: 'Annual music and food festival by the coast.',
    description: 'Celebrate the spirit of Vizag! Join us for a weekend of live music, delicious coastal cuisine, and beach activities at RK Beach.',
    category: 'Festival',
    city: 'Visakhapatnam',
    venue_name: 'RK Beach',
    start_date: new Date(Date.now() + 86400000 * 15).toISOString(),
    price: 999,
    cover_image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop',
    tickets_sold: 2500,
    total_tickets: 5000,
    ticket_types: [
      { id: 'v1', name: 'Standard Pass', price: 999, description: 'Full access' }
    ]
  },
  {
    id: 'vizag-2',
    title: 'Underground Electronic: Vizag',
    short_description: 'Deep house and melodic techno session.',
    description: 'A night of underground sound. Join us at the most exclusive lounge in Visakhapatnam for a journey through electronic music.',
    category: 'Music',
    city: 'Visakhapatnam',
    venue_name: 'The Shore Lounge',
    start_date: new Date(Date.now() + 86400000 * 4).toISOString(),
    price: 1200,
    cover_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1000&auto=format&fit=crop',
    tickets_sold: 120,
    total_tickets: 200,
    ticket_types: [
      { id: 'v2', name: 'General Admission', price: 1200, description: 'Includes 1 drink' }
    ]
  }
];

export const MOCK_USER = {
  id: 'user-1',
  full_name: 'Ratan Bhavisherothi',
  username: 'ratan_vhop',
  email: 'ratan@vhop.in',
  avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ratan',
  role: 'superadmin',
  v_coins: 1250,
};

export const MOCK_POSTS = [
  {
    id: 'p1',
    user: {
      name: 'Sarah Chen',
      username: 'sarahc_vibe',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    },
    content: 'The techno night at The Warehouse was absolutely insane! 🔊✨ The energy was unmatched. Can\'t wait for the next one!',
    images: [
      'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1000&auto=format&fit=crop'
    ],
    likes_count: 124,
    comments_count: 18,
    created_at: '2 hours ago',
    event_tag: 'Neon Night: Techno Sessions'
  },
  {
    id: 'p2',
    user: {
      name: 'Alex Rivera',
      username: 'arivera_beats',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    },
    content: 'Just discovered this hidden gem in Mumbai. The vibe here is so underground and raw. Loving it! 🌃🚀',
    images: [
      'https://images.unsplash.com/photo-1598387181032-a3103a2db5b3?q=80&w=1000&auto=format&fit=crop'
    ],
    likes_count: 85,
    comments_count: 6,
    created_at: '5 hours ago'
  },
  {
    id: 'p3',
    user: {
      name: 'Riya Sharma',
      username: 'riya_art',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Riya',
    },
    content: 'Incredible experience at the Art in the Park exhibition. Such talented local artists! 🎨✨',
    likes_count: 210,
    comments_count: 24,
    created_at: '1 day ago',
    event_tag: 'Art in the Park'
  }
];

export const MOCK_COMMUNITIES = [
  {
    id: 'c1',
    name: 'Mumbai Techno Collective',
    description: 'A community for underground techno heads in Mumbai. Sharing gigs, tracks, and vibes.',
    category: 'Music',
    members_count: 1250,
    cover_image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1000&auto=format&fit=crop',
    avatar_image: 'https://images.unsplash.com/photo-1598387181032-a3103a2db5b3?q=80&w=1000&auto=format&fit=crop'
  },
  {
    id: 'c2',
    name: 'Bangalore Laughs',
    description: 'Finding the best standup comedy spots in the Garden City.',
    category: 'Comedy',
    members_count: 850,
    cover_image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1000&auto=format&fit=crop',
    avatar_image: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?q=80&w=1000&auto=format&fit=crop'
  },
  {
    id: 'c3',
    name: 'Neon Art Collective',
    description: 'Digital and physical art lovers exploring neon aesthetics and street art.',
    category: 'Art',
    members_count: 420,
    cover_image: 'https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=1000&auto=format&fit=crop',
    avatar_image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1000&auto=format&fit=crop'
  }
];
