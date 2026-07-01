import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useAmbientSound } from '../hooks/useAmbientSound';
import { Home, PlusCircle, BookOpen, Users, User, Volume2, VolumeX, HelpCircle } from 'lucide-react';
import GlassButton from './GlassButton';
import LanguageDropdown from './LanguageDropdown';
import { useTour } from '../context/TourContext';

const Navbar: React.FC = () => {
  const { theme } = useTheme();
  const { signOut } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const { playing, toggle } = useAmbientSound();
  const { startTour } = useTour();

  const links = [
    { to: '/', icon: <Home size={20} />, label: t('home') },
    { to: '/create', icon: <PlusCircle size={20} />, label: t('create') },
    { to: '/decks', icon: <BookOpen size={20} />, label: t('decks') },
    { to: '/social', icon: <Users size={20} />, label: t('social') },
    { to: '/profile', icon: <User size={20} />, label: t('profile') },
  ];

  return (
    <nav
      className="glass-nav"
      style={{
        background: theme.card,
        borderBottom: `1px solid ${theme.primary}22`,
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '60px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: theme.shadow,
        fontFamily: theme.font,
      }}
    >
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontWeight: 800, fontSize: '1.25rem', color: theme.primary }}>Memozy</span>
      </Link>

      <div style={{ display: 'flex', gap: '0.25rem' }}>
        {links.map((link) => {
          const active = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.75rem',
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
              <span style={{ display: 'none', ['@media(min-width:640px)' as any]: { display: 'inline' } }}>
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <LanguageDropdown />
        <GlassButton
          variant="outline"
          size="sm"
          onClick={startTour}
          title="Replay walkthrough"
          style={{ padding: '0.5rem 0.65rem' }}
        >
          <HelpCircle size={16} />
        </GlassButton>
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
        <GlassButton variant="outline" size="sm" onClick={signOut}>
          {t('signOut')}
        </GlassButton>
      </div>
    </nav>
  );
};

export default Navbar;
