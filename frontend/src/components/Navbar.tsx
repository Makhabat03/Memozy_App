import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useAmbientSound } from '../hooks/useAmbientSound';
import { Home, PlusCircle, BookOpen, Users, User, Volume2, VolumeX, HelpCircle, LogOut } from 'lucide-react';
import GlassButton from './GlassButton';
import LanguageDropdown from './LanguageDropdown';
import { useTour } from '../context/TourContext';

// Simple, dependency-free mobile breakpoint hook.
// Anything narrower than 640px gets the compact, icon-only nav layout.
const useIsMobile = (breakpoint = 640) => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [breakpoint]);
  return isMobile;
};

const Navbar: React.FC = () => {
  const { theme } = useTheme();
  const { signOut } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const { playing, toggle } = useAmbientSound();
  const { startTour } = useTour();
  const isMobile = useIsMobile();

  const links = [
    { to: '/', icon: <Home size={isMobile ? 19 : 20} />, label: t('home') },
    { to: '/create', icon: <PlusCircle size={isMobile ? 19 : 20} />, label: t('create') },
    { to: '/decks', icon: <BookOpen size={isMobile ? 19 : 20} />, label: t('decks') },
    { to: '/social', icon: <Users size={isMobile ? 19 : 20} />, label: t('social') },
    { to: '/profile', icon: <User size={isMobile ? 19 : 20} />, label: t('profile') },
  ];

  return (
    <nav
      className="glass-nav"
      style={{
        background: theme.card,
        borderBottom: `1px solid ${theme.primary}22`,
        padding: isMobile ? '0 0.6rem' : '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '56px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: theme.shadow,
        fontFamily: theme.font,
        gap: isMobile ? '0.35rem' : '0',
        overflowX: isMobile ? 'auto' : 'visible',
      }}
    >
      <Link
        to="/"
        style={{
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 800, fontSize: isMobile ? '1rem' : '1.25rem', color: theme.primary }}>
          {isMobile ? '🌸' : 'Memozy'}
        </span>
      </Link>

      <div style={{ display: 'flex', gap: isMobile ? '0.1rem' : '0.25rem', flexShrink: 0 }}>
        {links.map((link) => {
          const active = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 0 : '0.4rem',
                padding: isMobile ? '0.45rem' : '0.5rem 0.75rem',
                borderRadius: theme.borderRadius,
                textDecoration: 'none',
                color: active ? theme.primary : theme.textLight,
                background: active ? `${theme.primary}15` : 'transparent',
                fontWeight: active ? 700 : 500,
                fontSize: '0.875rem',
                transition: 'all 0.15s',
              }}
            >
              {link.icon}
              {!isMobile && <span>{link.label}</span>}
            </Link>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.25rem' : '0.5rem', flexShrink: 0 }}>
        {!isMobile && <LanguageDropdown />}
        <GlassButton
          variant="outline"
          size="sm"
          onClick={startTour}
          title="Replay walkthrough"
          style={{ padding: isMobile ? '0.4rem' : '0.5rem 0.65rem' }}
        >
          <HelpCircle size={16} />
        </GlassButton>
        {!isMobile && (
          <GlassButton
            variant="outline"
            size="sm"
            onClick={toggle}
            tintColor={playing ? theme.accent : theme.textLight}
            title={playing ? 'Stop ambient sound' : 'Play ambient sound'}
            style={{ padding: '0.5rem 0.65rem' }}
          >
            {playing ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </GlassButton>
        )}
        <GlassButton
          variant="outline"
          size="sm"
          onClick={signOut}
          style={isMobile ? { padding: '0.4rem' } : undefined}
        >
          {isMobile ? <LogOut size={16} /> : t('signOut')}
        </GlassButton>
      </div>
    </nav>
  );
};

export default Navbar;
