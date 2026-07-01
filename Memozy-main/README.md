# 🌸 Memozy

**AI-powered flashcard app for web and mobile — fully free to run.**

Memozy lets you instantly generate flashcard decks from text, PDFs, or images using Groq's free LLaMA API. It features SM-2 spaced repetition, Duolingo-style gamification (XP, streaks, level-ups, badges), and a social layer with deck sharing, following, and a weekly leaderboard.

---

## Screenshots

| Web App | Mobile App |
|---------|------------|
| *(Dashboard screenshot)* | *(Home tab screenshot)* |

| Theme Picker | Study Mode |
|-------------|------------|
| *(First launch screenshot)* | *(Flip card screenshot)* |

---

## Features

- **AI Card Generation** — paste text, upload a PDF, or snap a photo → instant flashcards via Groq LLaMA 3.3
- **SM-2 Spaced Repetition** — Hard/Good/Easy ratings schedule reviews using the SM-2 algorithm
- **Gamification** — XP, levels, daily streaks with fire animation, combos, and 6 badge types
- **5 Themes** — Minimal, Dark Futuristic, Nature, Pink, and Cosmic — each with unique animated backgrounds
- **Custom Emoji Library** — hand-crafted SVG emoji components (MemozyEmoji) for consistent cross-platform look
- **Social** — follow users, share public decks, weekly XP leaderboard
- **Sounds** — programmatic Web Audio API sounds (no external files needed)
- **Mobile** — full React Native Expo app with swipe-to-rate gestures, haptic feedback, and camera/document picker

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Web Frontend | React 18, TypeScript, React Router, Framer Motion |
| Mobile | React Native (Expo), expo-router, react-native-reanimated |
| Backend | FastAPI (Python), uvicorn |
| Database & Auth | Supabase (PostgreSQL + Auth) |
| AI | Groq API (llama-3.3-70b-versatile, free tier) |
| Styling | CSS-in-JS via inline styles + CSS variables |

---

## Setup

### Prerequisites
- Node.js 18+
- Python 3.11+
- Free accounts: [supabase.com](https://supabase.com) · [console.groq.com](https://console.groq.com)

### 1. Clone
```bash
git clone <your-repo>
cd flashai
```

### 2. Database
1. Create a new Supabase project at supabase.com
2. Go to **SQL Editor** and paste the entire contents of `backend/schema.sql`
3. Run it — this creates all tables, RLS policies, and the auto-profile trigger

### 3. Backend
```bash
cd backend
cp .env.example .env
# Fill in GROQ_API_KEY, SUPABASE_URL, SUPABASE_KEY in .env
pip install -r requirements.txt
uvicorn main:app --reload
# Runs on http://localhost:8000
```

### 4. Frontend (Web)
```bash
cd frontend
cp .env.example .env
# Fill in REACT_APP_API_URL, REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY
npm install
npm start
# Runs on http://localhost:3000
```

### 5. Mobile
```bash
cd mobile
cp .env.example .env
# Fill in EXPO_PUBLIC_API_URL, EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
npm install
npx expo start
# Scan the QR code with Expo Go on your phone
```

---

## Architecture

```
flashai/
├── backend/          # FastAPI Python API
│   ├── main.py       # CORS, router registration
│   ├── routers/      # auth, cards, decks, study, gamify, social
│   ├── utils/        # groq_client, supabase, sm2, pdf_parser, image_parser
│   └── schema.sql    # Full Supabase SQL schema
├── frontend/         # React TypeScript web app
│   └── src/
│       ├── pages/    # Dashboard, Create, Study, Decks, Social, Profile, Auth
│       ├── components/
│       │   ├── animations/  # StreakFlame, RatingFeedback, ConfettiEffect, DeckCompleteScreen
│       │   └── MemozyEmoji.tsx  # Custom SVG emoji library
│       ├── context/  # ThemeContext, AuthContext
│       ├── hooks/    # useApi (axios), useSounds (Web Audio API)
│       └── themes/   # 5 theme definitions (minimal, darkFuturistic, nature, pink, cosmic)
└── mobile/           # Expo React Native app
    └── app/
        ├── (tabs)/   # Home, Create, Decks, Social, Profile
        ├── study/    # Full-screen study with swipe gestures + haptics
        └── auth/     # Login/signup screens
```

---

## CV Bullet

*Built Memozy, a full-stack AI-powered flashcard app (web + mobile) with PDF/image/text ingestion via Groq LLaMA 3.3, SM-2 spaced repetition algorithm, Duolingo-style gamification (streaks, XP, level-up sounds, badges), 5 animated themes, and social features including deck sharing, follow system, and weekly leaderboard. Stack: React, React Native (Expo), FastAPI, Supabase, Groq — fully free to run.*
