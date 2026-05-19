-- VHOP MySQL Database Schema
-- (Database creation is handled via Hostinger hPanel)


-- 1. Profiles Table (Syncs with Firebase UID)
CREATE TABLE IF NOT EXISTS profiles (
    id VARCHAR(255) PRIMARY KEY, -- Firebase UID
    full_name VARCHAR(255),
    username VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE,
    avatar_url TEXT,
    role ENUM('user', 'admin', 'superadmin') DEFAULT 'user',
    v_coins INT DEFAULT 100,
    city VARCHAR(100) DEFAULT 'Mumbai',
    phone VARCHAR(20),
    onboarded BOOLEAN DEFAULT FALSE,
    interests JSON, -- Array of interest strings
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Companies Table
CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    admin_user_id VARCHAR(255),
    city VARCHAR(100),
    description TEXT,
    website VARCHAR(255),
    contact_email VARCHAR(255),
    phone VARCHAR(20),
    payout_upi VARCHAR(255),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_user_id) REFERENCES profiles(id)
);

-- 3. Events Table
CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(255) PRIMARY KEY,
    company_id VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    short_description TEXT,
    description TEXT,
    venue_name VARCHAR(255),
    city VARCHAR(100),
    category VARCHAR(50),
    price DECIMAL(10, 2),
    cover_image TEXT,
    start_date DATETIME,
    end_date DATETIME,
    status ENUM('draft', 'published', 'completed', 'cancelled') DEFAULT 'draft',
    tickets_sold INT DEFAULT 0,
    ticket_types JSON, -- Stores array of {name, price, benefits}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- 4. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(255) PRIMARY KEY,
    event_id VARCHAR(255),
    user_id VARCHAR(255),
    quantity INT,
    total_amount DECIMAL(10, 2),
    ticket_name VARCHAR(255),
    price DECIMAL(10, 2),
    payment_id VARCHAR(255),
    payment_status VARCHAR(50),
    booking_status VARCHAR(50) DEFAULT 'confirmed',
    booking_id VARCHAR(50),
    qr_code TEXT,
    guests JSON, -- Stores guest details array
    booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (user_id) REFERENCES profiles(id)
);


-- Mock Data Dump

-- Data for table profiles
INSERT IGNORE INTO profiles (id, full_name, username, email, avatar_url, role, v_coins, city, phone, created_at, onboarded, interests) VALUES ('test-admin-123', 'Demo Admin', 'demoadmin', 'admin@vhop.in', NULL, 'admin', 500, 'Mumbai', NULL, '2026-05-14 13:49:49', 0, NULL);

-- Data for table companies
INSERT IGNORE INTO companies (id, name, admin_user_id, city, description, website, contact_email, phone, payout_upi, verified, created_at) VALUES ('comp_test_1', 'VHOP Events Mumbai', 'test-admin-123', 'Mumbai', 'The official demo company for testing.', NULL, NULL, NULL, NULL, 1, '2026-05-14 13:49:49');
INSERT IGNORE INTO companies (id, name, admin_user_id, city, description, website, contact_email, phone, payout_upi, verified, created_at) VALUES ('vhop_official', 'Global Admin', NULL, 'Mumbai', NULL, NULL, NULL, NULL, NULL, 1, '2026-05-14 15:36:14');

-- Data for table events
INSERT IGNORE INTO events (id, company_id, title, short_description, description, venue_name, city, category, price, cover_image, start_date, end_date, status, tickets_sold, ticket_types, created_at) VALUES ('ev_fxozfzr9f', 'vhop_official', 'Cyberpunk Rooftop Rave', 'A neon-drenched night of futuristic beats.', 'Get ready for the most immersive cyberpunk experience Mumbai has ever seen. We''re taking over the highest rooftop in the city for a night of underground techno, interactive light installations, and synthwave vibes. 🌃🔊🚀', 'ma intlo ', 'Mumbai', 'Music', '1999.00', 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1000', '2026-05-29 02:13:00', NULL, 'published', 0, '[{"name":"vip","price":888,"benefits":["hello ","hi ","bye"],"id":"t-uy2b8d9"},{"name":"adukonodu","price":9,"benefits":["bayita nuchoni chud","lopalki oste tanesta","dengey "],"id":"t-219dvfs"},{"name":"super Vip ","price":1000000,"benefits":["dj ni dengochu ","waitress ochi notlo petkuntadi","last lo happy ending "],"id":"t-y7xm7c1"}]', '2026-05-14 15:44:49');
INSERT IGNORE INTO events (id, company_id, title, short_description, description, venue_name, city, category, price, cover_image, start_date, end_date, status, tickets_sold, ticket_types, created_at) VALUES ('ev_qm89d6v3d', 'vhop_official', 'Cyberpunk Rooftop Rave', 'A neon-drenched night of futuristic beats.', 'Get ready for the most immersive cyberpunk experience Mumbai has ever seen. We''re taking over the highest rooftop in the city for a night of underground techno, interactive light installations, and synthwave vibes. 🌃🔊🚀', 'ma intlo ', 'Mumbai', 'Music', '1999.00', 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1000', '2026-05-29 13:13:00', NULL, 'published', 0, '[{"name":"vip","price":888,"benefits":["hello ","hi ","bye"],"id":"t-uy2b8d9"},{"name":"adukonodu","price":9,"benefits":["bayita nuchoni chud","lopalki oste tanesta","dengey "],"id":"t-219dvfs"},{"name":"super Vip ","price":1000000,"benefits":["dj ni dengochu ","waitress ochi notlo petkuntadi","last lo happy ending "],"id":"t-y7xm7c1"}]', '2026-05-14 15:43:27');
INSERT IGNORE INTO events (id, company_id, title, short_description, description, venue_name, city, category, price, cover_image, start_date, end_date, status, tickets_sold, ticket_types, created_at) VALUES ('ev_ysxehinrt', 'vhop_official', 'Cyberpunk Rooftop Rave', 'A neon-drenched night of futuristic beats.', 'Get ready for the most immersive cyberpunk experience Mumbai has ever seen. We''re taking over the highest rooftop in the city for a night of underground techno, interactive light installations, and synthwave vibes. 🌃🔊🚀', 'ma intlo ', 'Visakhapatnam', 'Music', '1999.00', 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1000', '2026-05-28 15:13:00', NULL, 'published', 0, '[{"name":"vip","price":888,"benefits":["hello ","hi ","bye"],"id":"t-uy2b8d9"},{"name":"adukonodu","price":9,"benefits":["bayita nuchoni chud","lopalki oste tanesta","dengey "],"id":"t-219dvfs"},{"name":"super Vip ","price":1000000,"benefits":["dj ni dengochu ","waitress ochi notlo petkuntadi","last lo happy ending "],"id":"t-y7xm7c1"}]', '2026-05-14 15:47:31');
