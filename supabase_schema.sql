-- ============================================
-- ModLink Database Schema — Full Reset Version
-- ============================================
-- HOW TO APPLY A CLEAN RESET:
--
-- STEP 1: Delete all existing auth users
--   Supabase Dashboard → Authentication → Users → select all → Delete
--
-- STEP 2: Drop everything in the public schema
--   Go to SQL Editor and run the DROP SCRIPT below (Section 0).
--
-- STEP 3: Run this entire file in the SQL Editor.
--
-- STEP 4: In Authentication → Providers → Email
--   Turn OFF "Confirm email" (for development).
--
-- STEP 5: Create Storage Buckets in the Dashboard:
--   portfolios       → Public
--   avatars          → Public
--   campaign-images  → Public
--   verification-docs → Private
--   contracts        → Private
-- ============================================


-- ============================================
-- SECTION 0: CLEAN SLATE (run this first if resetting)
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_review_insert ON reviews;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_average_rating() CASCADE;
DROP FUNCTION IF EXISTS public.expire_old_matches() CASCADE;

DROP TABLE IF EXISTS campaign_images       CASCADE;
DROP TABLE IF EXISTS reports               CASCADE;
DROP TABLE IF EXISTS payments              CASCADE;
DROP TABLE IF EXISTS reviews               CASCADE;
DROP TABLE IF EXISTS messages              CASCADE;
DROP TABLE IF EXISTS bookings              CASCADE;
DROP TABLE IF EXISTS contracts             CASCADE;
DROP TABLE IF EXISTS matches               CASCADE;
DROP TABLE IF EXISTS swipes                CASCADE;
DROP TABLE IF EXISTS verification_documents CASCADE;
DROP TABLE IF EXISTS portfolio_images      CASCADE;
DROP TABLE IF EXISTS brand_profiles        CASCADE;
DROP TABLE IF EXISTS model_profiles        CASCADE;
DROP TABLE IF EXISTS profiles              CASCADE;


-- ============================================
-- SECTION 1: EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================
-- SECTION 2: TABLES
-- ============================================

-- Profiles (one row per auth user)
CREATE TABLE profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type           TEXT CHECK (user_type IN ('model', 'brand')),
  full_name           TEXT NOT NULL DEFAULT '',
  email               TEXT UNIQUE NOT NULL,
  phone               TEXT,
  city                TEXT,
  state               TEXT,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified            BOOLEAN DEFAULT FALSE,
  verification_status TEXT DEFAULT 'pending'
                        CHECK (verification_status IN ('pending', 'submitted', 'approved', 'rejected')),
  profile_image_url   TEXT,
  average_rating      DECIMAL(2,1) DEFAULT 0,
  total_reviews       INTEGER DEFAULT 0,
  push_token          TEXT
);

-- Model-specific data
CREATE TABLE model_profiles (
  id                UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  height            INTEGER,
  bust              INTEGER,
  waist             INTEGER,
  hips              INTEGER,
  shoe_size         INTEGER,
  hair_color        TEXT,
  eye_color         TEXT,
  date_of_birth     DATE,
  experience_level  TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'experienced')),
  bio               TEXT,
  instagram_handle  TEXT,
  categories        TEXT[],
  willing_to_travel BOOLEAN DEFAULT FALSE,
  rate_half_day     INTEGER,
  rate_full_day     INTEGER,
  open_to_offers    BOOLEAN DEFAULT FALSE,
  portfolio_complete BOOLEAN DEFAULT FALSE,
  available         BOOLEAN DEFAULT TRUE,
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brand-specific data
CREATE TABLE brand_profiles (
  id                    UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  brand_name            TEXT NOT NULL DEFAULT '',
  business_type         TEXT CHECK (business_type IN ('d2c', 'boutique', 'designer', 'agency', 'other')),
  website               TEXT,
  instagram_handle      TEXT,
  gst_number            TEXT,
  business_registration TEXT,
  brand_identity        TEXT[],
  bio                   TEXT,
  verified              BOOLEAN DEFAULT FALSE,
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portfolio images (models only)
CREATE TABLE portfolio_images (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id    UUID REFERENCES model_profiles(id) ON DELETE CASCADE,
  image_url   TEXT NOT NULL,
  category    TEXT,
  is_primary  BOOLEAN DEFAULT FALSE,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Identity / business verification documents
CREATE TABLE verification_documents (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  document_type TEXT CHECK (document_type IN ('govt_id', 'business_reg', 'selfie_video')),
  document_url  TEXT NOT NULL,
  uploaded_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified      BOOLEAN DEFAULT FALSE
);

-- Swipes (like / pass)
CREATE TABLE swipes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  swiper_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  swiped_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  swipe_type TEXT CHECK (swipe_type IN ('like', 'pass')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(swiper_id, swiped_id)
);

-- Matches (mutual likes)
CREATE TABLE matches (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  brand_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  status     TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'unmatched')),
  UNIQUE(model_id, brand_id)
);

-- Contracts (created before bookings so bookings can FK to it)
CREATE TABLE contracts (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_type  TEXT,
  contract_data  JSONB,
  model_signed   BOOLEAN DEFAULT FALSE,
  brand_signed   BOOLEAN DEFAULT FALSE,
  model_signed_at TIMESTAMP WITH TIME ZONE,
  brand_signed_at TIMESTAMP WITH TIME ZONE,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  pdf_url        TEXT
);

-- Bookings
CREATE TABLE bookings (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id             UUID REFERENCES profiles(id),
  brand_id             UUID REFERENCES profiles(id),
  match_id             UUID REFERENCES matches(id),
  contract_id          UUID REFERENCES contracts(id),
  shoot_date           DATE NOT NULL,
  shoot_time           TIME,
  duration             TEXT CHECK (duration IN ('half_day', 'full_day')),
  shoot_type           TEXT,
  location_city        TEXT,
  location_address     TEXT,
  payment_amount       INTEGER NOT NULL,
  platform_fee         INTEGER,
  status               TEXT DEFAULT 'pending'
                         CHECK (status IN ('pending','accepted','rejected','confirmed','completed','cancelled','disputed')),
  deliverables_count   INTEGER DEFAULT 20,
  deliverables_videos  INTEGER DEFAULT 0,
  special_requirements TEXT,
  created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add booking reference back to contracts
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id);

-- Messages
CREATE TABLE messages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id     UUID REFERENCES matches(id) ON DELETE CASCADE,
  sender_id    UUID REFERENCES profiles(id),
  message_text TEXT NOT NULL,
  flagged      BOOLEAN DEFAULT FALSE,
  flag_reason  TEXT,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews
CREATE TABLE reviews (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id            UUID REFERENCES bookings(id),
  reviewer_id           UUID REFERENCES profiles(id),
  reviewee_id           UUID REFERENCES profiles(id),
  rating                INTEGER CHECK (rating BETWEEN 1 AND 5),
  review_text           TEXT,
  would_work_again      BOOLEAN,
  professionalism_rating INTEGER CHECK (professionalism_rating BETWEEN 1 AND 5),
  quality_rating        INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  punctuality_rating    INTEGER CHECK (punctuality_rating BETWEEN 1 AND 5),
  communication_rating  INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(booking_id, reviewer_id)
);

-- Payments (escrow)
CREATE TABLE payments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id          UUID REFERENCES bookings(id),
  razorpay_order_id   TEXT UNIQUE,
  razorpay_payment_id TEXT,
  amount              INTEGER NOT NULL,
  status              TEXT CHECK (status IN ('pending','escrowed','released','refunded','failed')),
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  released_at         TIMESTAMP WITH TIME ZONE
);

-- Reports
CREATE TABLE reports (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES profiles(id),
  reported_id UUID REFERENCES profiles(id),
  report_type TEXT CHECK (report_type IN ('harassment','fake_profile','payment_issue','off_platform','inappropriate','other')),
  description TEXT,
  status      TEXT DEFAULT 'pending' CHECK (status IN ('pending','under_review','resolved','dismissed')),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brand past campaign images
CREATE TABLE campaign_images (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id    UUID REFERENCES brand_profiles(id) ON DELETE CASCADE,
  image_url   TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================
-- SECTION 3: ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_images      ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes                ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches               ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages              ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews               ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports               ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_images       ENABLE ROW LEVEL SECURITY;


-- ============================================
-- SECTION 4: RLS POLICIES
-- ============================================

-- ---------- profiles ----------
CREATE POLICY "profiles: own read"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles: own insert"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: own update"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Allow seeing other verified profiles (for discover)
CREATE POLICY "profiles: read verified"
  ON profiles FOR SELECT USING (verified = true);

-- Allow reading any profile by authenticated users (needed for swipe/match flows)
CREATE POLICY "profiles: authenticated read all"
  ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);

-- ---------- model_profiles ----------
CREATE POLICY "model_profiles: own read"
  ON model_profiles FOR SELECT USING (id = auth.uid());

CREATE POLICY "model_profiles: own insert"
  ON model_profiles FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "model_profiles: own update"
  ON model_profiles FOR UPDATE USING (id = auth.uid());

CREATE POLICY "model_profiles: brands can read"
  ON model_profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'brand')
  );

-- ---------- brand_profiles ----------
CREATE POLICY "brand_profiles: own read"
  ON brand_profiles FOR SELECT USING (id = auth.uid());

CREATE POLICY "brand_profiles: own insert"
  ON brand_profiles FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "brand_profiles: own update"
  ON brand_profiles FOR UPDATE USING (id = auth.uid());

CREATE POLICY "brand_profiles: models can read"
  ON brand_profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'model')
  );

-- ---------- portfolio_images ----------
CREATE POLICY "portfolio: model manages own"
  ON portfolio_images FOR ALL USING (model_id = auth.uid());

CREATE POLICY "portfolio: brands can view"
  ON portfolio_images FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'brand')
  );

-- ---------- verification_documents ----------
CREATE POLICY "verdocs: own all"
  ON verification_documents FOR ALL USING (user_id = auth.uid());

-- ---------- swipes ----------
CREATE POLICY "swipes: own insert"
  ON swipes FOR INSERT WITH CHECK (swiper_id = auth.uid());

CREATE POLICY "swipes: own read"
  ON swipes FOR SELECT USING (swiper_id = auth.uid() OR swiped_id = auth.uid());

-- ---------- matches ----------
CREATE POLICY "matches: participants read"
  ON matches FOR SELECT USING (model_id = auth.uid() OR brand_id = auth.uid());

CREATE POLICY "matches: participants insert"
  ON matches FOR INSERT WITH CHECK (model_id = auth.uid() OR brand_id = auth.uid());

CREATE POLICY "matches: participants update"
  ON matches FOR UPDATE USING (model_id = auth.uid() OR brand_id = auth.uid());

-- ---------- messages ----------
CREATE POLICY "messages: participants read"
  ON messages FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE id = match_id AND (model_id = auth.uid() OR brand_id = auth.uid())
    )
  );

CREATE POLICY "messages: participants send"
  ON messages FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM matches
      WHERE id = match_id AND (model_id = auth.uid() OR brand_id = auth.uid())
    )
  );

-- ---------- bookings ----------
CREATE POLICY "bookings: participants read"
  ON bookings FOR SELECT USING (model_id = auth.uid() OR brand_id = auth.uid());

CREATE POLICY "bookings: brand creates"
  ON bookings FOR INSERT WITH CHECK (brand_id = auth.uid());

CREATE POLICY "bookings: participants update"
  ON bookings FOR UPDATE USING (model_id = auth.uid() OR brand_id = auth.uid());

-- ---------- contracts ----------
CREATE POLICY "contracts: participants read"
  ON contracts FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE contracts.booking_id = bookings.id
        AND (bookings.model_id = auth.uid() OR bookings.brand_id = auth.uid())
    )
  );

CREATE POLICY "contracts: authenticated insert"
  ON contracts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "contracts: participants update"
  ON contracts FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE contracts.booking_id = bookings.id
        AND (bookings.model_id = auth.uid() OR bookings.brand_id = auth.uid())
    )
  );

-- ---------- reviews ----------
CREATE POLICY "reviews: participants read"
  ON reviews FOR SELECT USING (reviewer_id = auth.uid() OR reviewee_id = auth.uid());

CREATE POLICY "reviews: reviewer inserts"
  ON reviews FOR INSERT WITH CHECK (reviewer_id = auth.uid());

-- ---------- payments ----------
CREATE POLICY "payments: participants read"
  ON payments FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE id = booking_id AND (model_id = auth.uid() OR brand_id = auth.uid())
    )
  );

-- ---------- reports ----------
CREATE POLICY "reports: reporter all"
  ON reports FOR ALL USING (reporter_id = auth.uid());

-- ---------- campaign_images ----------
CREATE POLICY "campaign: brand manages own"
  ON campaign_images FOR ALL USING (
    brand_id = auth.uid()
  );

CREATE POLICY "campaign: authenticated read"
  ON campaign_images FOR SELECT USING (auth.uid() IS NOT NULL);


-- ============================================
-- SECTION 5: FUNCTIONS & TRIGGERS
-- ============================================

-- -------------------------------------------------
-- Trigger: auto-create profiles row on new auth user
-- SECURITY DEFINER = runs as superuser, bypasses RLS
-- This fires whether or not email confirmation is on
-- -------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'user_type'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- -------------------------------------------------
-- Trigger: keep average_rating up to date on reviews
-- -------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_average_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET
    average_rating = (
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM reviews
      WHERE reviewee_id = NEW.reviewee_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE reviewee_id = NEW.reviewee_id
    )
  WHERE id = NEW.reviewee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_review_insert
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_average_rating();

-- -------------------------------------------------
-- Function: expire matches older than 48 hours
-- Call this from a Supabase cron job or Edge Function
-- -------------------------------------------------
CREATE OR REPLACE FUNCTION public.expire_old_matches()
RETURNS void AS $$
BEGIN
  UPDATE matches
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- SECTION 6: BACKFILL (run after applying schema
-- if you have existing auth users with no profile)
-- ============================================
INSERT INTO profiles (id, email, full_name, phone, user_type)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', ''),
  raw_user_meta_data->>'phone',
  raw_user_meta_data->>'user_type'
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;
