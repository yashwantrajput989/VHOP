-- VHOP Database Schema

-- Users (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT,
  username TEXT UNIQUE,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  city TEXT,
  referral_code TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  referred_by UUID REFERENCES profiles(id),
  v_coins INTEGER DEFAULT 0,
  kyc_status TEXT DEFAULT 'unverified', -- unverified | pending | verified
  aadhaar_last4 TEXT,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  role TEXT DEFAULT 'user', -- user | admin | superadmin
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies (for admin accounts)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  website TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  city TEXT,
  verified BOOLEAN DEFAULT false,
  admin_user_id UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id), -- superadmin who added
  status TEXT DEFAULT 'active', -- active | suspended
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  category TEXT, -- music | comedy | art | food | sports | networking | club | festival
  city TEXT NOT NULL,
  venue_name TEXT,
  venue_address TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  cover_image TEXT,
  gallery_images TEXT[], -- array of image URLs
  price DECIMAL DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  total_tickets INTEGER,
  tickets_sold INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_free BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'draft', -- draft | published | cancelled | completed
  tags TEXT[],
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id),
  user_id UUID REFERENCES profiles(id),
  quantity INTEGER DEFAULT 1,
  total_amount DECIMAL,
  payment_id TEXT, -- Razorpay payment ID
  payment_status TEXT DEFAULT 'pending', -- pending | paid | refunded
  booking_status TEXT DEFAULT 'confirmed',
  qr_code TEXT, -- unique QR for entry
  checked_in BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social Posts
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  event_id UUID REFERENCES events(id), -- optional tag
  content TEXT,
  images TEXT[],
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post Likes
CREATE TABLE IF NOT EXISTS post_likes (
  post_id UUID REFERENCES posts(id),
  user_id UUID REFERENCES profiles(id),
  PRIMARY KEY (post_id, user_id)
);

-- Post Comments
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id),
  user_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Follows
CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID REFERENCES profiles(id),
  following_id UUID REFERENCES profiles(id),
  PRIMARY KEY (follower_id, following_id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Communities
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  avatar_image TEXT,
  category TEXT, -- music | art | gaming | fitness | food | travel | tech | nightlife
  city TEXT,
  is_private BOOLEAN DEFAULT false,
  members_count INTEGER DEFAULT 0,
  latitude DECIMAL,
  longitude DECIMAL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Community Members
CREATE TABLE IF NOT EXISTS community_members (
  community_id UUID REFERENCES communities(id),
  user_id UUID REFERENCES profiles(id),
  role TEXT DEFAULT 'member', -- member | moderator | admin
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (community_id, user_id)
);

-- Community Gatherings (map pins)
CREATE TABLE IF NOT EXISTS gatherings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id),
  title TEXT NOT NULL,
  description TEXT,
  latitude DECIMAL NOT NULL,
  longitude DECIMAL NOT NULL,
  address TEXT,
  scheduled_at TIMESTAMPTZ,
  max_attendees INTEGER,
  attendees_count INTEGER DEFAULT 0,
  is_open BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gathering Attendees
CREATE TABLE IF NOT EXISTS gathering_attendees (
  gathering_id UUID REFERENCES gatherings(id),
  user_id UUID REFERENCES profiles(id),
  PRIMARY KEY (gathering_id, user_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  type TEXT, -- booking | follow | like | comment | event_reminder | kyc_update
  title TEXT,
  body TEXT,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) - Basic Setup
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE gatherings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gathering_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Events Policies
CREATE POLICY "Events are viewable by everyone" ON events FOR SELECT USING (true);

-- Posts Policies
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
