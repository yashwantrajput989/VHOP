# VHOP — Discover Nightlife

A premium nightlife discovery and event booking platform built for the modern social explorer.

## Features
- ✨ **Vibrant UI**: Sleek, dark-themed interface with framer-motion animations.
- 🎟️ **Real Payments**: Integrated with Razorpay for secure ticket booking.
- 🔐 **Production Auth**: Supabase Auth with Google OAuth integration.
- 📧 **Automated Tickets**: Scannable QR codes for every booking.
- 📍 **Community-First**: Social features and community event discovery.

## Tech Stack
- **Frontend**: React + Vite + TypeScript
- **Styling**: Tailwind CSS + Framer Motion
- **State**: Zustand
- **Backend**: Supabase (Auth, Postgres, Realtime)
- **Payments**: Razorpay

## Production Setup Guide

### 1. Supabase Backend Setup
1.  Create a new project at [supabase.com](https://supabase.com).
2.  Go to the **SQL Editor** and run the `supabase_schema.sql` script.
3.  In **Project Settings** > **API**, copy your `URL` and `Anon Key`.
4.  Add these to your `.env` file as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### 2. Authentication (Google OAuth)
1.  In Supabase, go to **Authentication** > **Providers** > **Google**.
2.  Enable the provider and add your Google Client ID and Secret.
3.  Add `http://localhost:5173` (and your production URL) to your Google Authorized redirect URIs.

### 3. Payments (Razorpay)
1.  Sign up for a [Razorpay](https://razorpay.com) account.
2.  In **Settings** > **API Keys**, generate a Test Key.
3.  Add the Key ID to your `.env` file as `VITE_RAZORPAY_KEY_ID`.

### 4. Deployment
VHOP is optimized for Vercel or Netlify.
```bash
npm run build
```
Ensure all environment variables are added to your hosting provider's dashboard.
