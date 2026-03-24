# ModLink - Setup Guide

## Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (for testing)
- Supabase account at supabase.com
- Razorpay account at razorpay.com (for payments)

---

## Step 1: Configure Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings → API** and copy:
   - Project URL
   - `anon` public key
3. Open `src/utils/supabase.js` and replace:
   ```js
   const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co'
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'
   ```

---

## Step 2: Run the Database Schema

1. Go to **Supabase → SQL Editor**
2. Copy the contents of `supabase_schema.sql`
3. Paste and run it

---

## Step 3: Create Storage Buckets

In **Supabase → Storage**, create these buckets:

| Bucket Name | Public? | Purpose |
|---|---|---|
| `portfolios` | ✅ Public | Model portfolio images |
| `avatars` | ✅ Public | Profile photos |
| `campaign-images` | ✅ Public | Brand past work |
| `verification-docs` | ❌ Private | ID documents |
| `contracts` | ❌ Private | Contract PDFs |

---

## Step 4: Enable Realtime

In **Supabase → Database → Replication**, enable realtime for:
- `messages`
- `matches`
- `bookings`
- `payments`

---

## Step 5: Configure Razorpay (Optional for MVP)

1. Get your API keys from [razorpay.com/dashboard](https://razorpay.com/dashboard)
2. Open `src/utils/razorpay.js` and replace:
   ```js
   const RAZORPAY_KEY = 'YOUR_RAZORPAY_KEY_ID'
   const BACKEND_URL = 'https://YOUR_PROJECT.supabase.co/functions/v1'
   ```
3. Deploy the Edge Functions in the `supabase/functions/` directory (optional)

---

## Step 6: Run the App

```bash
# Start the dev server
npx expo start

# Scan the QR code with Expo Go app on your phone
# OR press 'a' for Android emulator, 'i' for iOS simulator
```

---

## Project Structure

```
modlink/
├── App.js                        # Entry point
├── supabase_schema.sql           # Database schema
├── src/
│   ├── theme/                    # Design tokens
│   │   ├── colors.js
│   │   ├── typography.js
│   │   └── spacing.js
│   ├── context/
│   │   ├── AuthContext.js        # Auth state + signUp/signIn/signOut
│   │   └── UserContext.js        # Profile data + update functions
│   ├── navigation/
│   │   ├── RootNavigator.js      # Decides Auth vs Model vs Brand
│   │   ├── AuthNavigator.js      # Splash → Onboarding → SignUp/In
│   │   ├── ModelNavigator.js     # Model tabs + detail screens
│   │   └── BrandNavigator.js     # Brand tabs + detail screens
│   ├── screens/
│   │   ├── auth/                 # Splash, Onboarding, SignUp, SignIn
│   │   ├── model/                # ModelHome, ModelDiscover, ModelProfileSetup, ModelVerification
│   │   ├── brand/                # BrandHome, BrandDiscover, PostJob, Applications, ContentDelivery, BrandProfileSetup
│   │   └── shared/               # Messages, Chat, Bookings, BookingDetail, Contract, Profile, Settings, Review, SafetyCenter, PortfolioViewer
│   ├── components/
│   │   ├── ProfileCard.js        # Swipe deck card
│   │   ├── BookingCard.js        # Booking list item
│   │   ├── MessageBubble.js      # Chat bubble
│   │   ├── PortfolioGrid.js      # Image grid
│   │   ├── SafetyBanner.js       # Status/warning banner
│   │   ├── PrimaryButton.js      # Reusable button
│   │   ├── InputField.js         # Reusable input
│   │   └── MatchModal.js         # Match celebration modal
│   ├── hooks/
│   │   ├── useMatches.js         # Match/swipe logic
│   │   └── useBookings.js        # Booking CRUD
│   └── utils/
│       ├── supabase.js           # Supabase client
│       ├── imageHandler.js       # Image pick + upload
│       ├── contractTemplates.js  # Contract HTML + PDF generation
│       ├── razorpay.js           # Payment flow
│       ├── notifications.js      # Push notification setup
│       └── moderation.js        # Message content moderation
└── assets/
```

---

## Core User Flow

```
User opens app
  → Splash (2.5s) → Onboarding (3 slides)
  → Sign Up (choose model/brand) → Profile Setup (multi-step)
  → Verification → Home

Model:
  Home → Discover (swipe brands) → Match! → Chat
  → Brand sends booking → Model reviews contract → Accept
  → Shoot day check-in → Delivery → Review

Brand:
  Home → Post Job OR Discover models (swipe) → Match → Chat
  → Create booking → Model accepts → Pay (escrow)
  → Receive content → Approve → Payment released → Review
```

---

## Supabase Edge Functions Needed (Production)

Create these in `supabase/functions/`:

1. **create-razorpay-order** - Creates Razorpay payment order
2. **release-payment** - Triggers payout to model's bank
3. **send-notification** - Sends push notifications via Expo
4. **expire-matches** - Cron: marks matches as expired after 48h

---

## Environment Variables (Production)

For production, use `app.config.js` with EAS secrets:
```js
export default {
  expo: {
    extra: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      razorpayKey: process.env.RAZORPAY_KEY,
    }
  }
}
```
