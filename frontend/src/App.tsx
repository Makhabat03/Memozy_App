import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import AnimatedBackground from './components/AnimatedBackground';
import CursorEffect from './components/CursorEffect';
import Navbar from './components/Navbar';
import FirstLaunch from './pages/FirstLaunch';
import Auth from './pages/Auth';
import TourOverlay from './components/TourOverlay';
import WakingUpBanner from './components/WakingUpBanner';
import { TourProvider, useTour } from './context/TourContext';

const Dashboard  = React.lazy(() => import('./pages/Dashboard'));
const Create     = React.lazy(() => import('./pages/Create'));
const Study      = React.lazy(() => import('./pages/Study'));
const Decks      = React.lazy(() => import('./pages/Decks'));
const Social     = React.lazy(() => import('./pages/Social'));
const ProfilePage = React.lazy(() => import('./pages/Profile'));
const EditDeck   = React.lazy(() => import('./pages/EditDeck'));

const PageLoader = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
    ⚡
  </div>
);

const hasLaunched  = () => !!localStorage.getItem('memozy_launched');
const hasOnboarded = () => !!localStorage.getItem('memozy_onboarded');

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();
  const { startTour, isActive } = useTour();
  const [launched, setLaunched] = React.useState(hasLaunched);

  // Auto-start tour on first sign-in.
  // Depends on user?.id (stable) rather than the whole `user` object, and
  // checks `isActive` — Supabase can hand back a new `user` object on
  // background token refreshes even for the same logged-in person, which
  // was re-triggering this effect and resetting the tour mid-way.
  React.useEffect(() => {
    if (user && !hasOnboarded() && !isActive) {
      const t = setTimeout(startTour, 900);
      return () => clearTimeout(t);
    }
  }, [user?.id]); // eslint-disable-line

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
        ⚡
      </div>
    );
  }

  if (!launched) {
    return <FirstLaunch onComplete={() => setLaunched(true)} />;
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <>
      <Navbar />
      <TourOverlay />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create" element={<Create />} />
          <Route path="/study/:deckId" element={<Study />} />
          <Route path="/edit/:deckId" element={<EditDeck />} />
          <Route path="/decks" element={<Decks />} />
          <Route path="/social" element={<Social />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
};

const App: React.FC = () => (
  <LanguageProvider>
  <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <TourProvider>
        {/* Shows a small banner whenever a backend request is slow (e.g. cold start) */}
        <WakingUpBanner />
        {/* Animated background behind everything */}
        <AnimatedBackground />
        <CursorEffect />
        {/* All app content sits above the canvas */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <AppRoutes />
        </div>
        </TourProvider>
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
  </LanguageProvider>
);

export default App;
