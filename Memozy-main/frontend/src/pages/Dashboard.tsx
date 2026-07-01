import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { decksApi, gamifyApi, Deck, Profile } from '../hooks/useApi';
import StreakFlame from '../components/animations/StreakFlame';
import { PlusCircle, BookOpen } from 'lucide-react';
import GlassButton from '../components/GlassButton';
import { MSparkle, MWave } from '../components/MemozyEmoji';

const spring = { type: 'spring' as const, stiffness: 260, damping: 28 };
const gentleSpring = { type: 'spring' as const, stiffness: 180, damping: 24 };

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0 } },
} as any;

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: gentleSpring },
} as any;

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: gentleSpring },
} as any;

const Dashboard: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) return;
    Promise.all([
      decksApi.list(user.id).then((r) => setDecks(r.data.decks)),
      gamifyApi.getProfile(user.id).then((r) => setProfile(r.data.profile)),
    ]).finally(() => setLoading(false));
  }, [user]);

  const xpToNextLevel = profile ? 500 - (profile.xp % 500) : 500;
  const xpProgress = profile ? (profile.xp % 500) / 500 : 0;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', fontFamily: theme.font }}>
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
        >
          <MSparkle size={36} />
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem', fontFamily: theme.font }}
    >
      {/* Header */}
      <motion.div variants={itemVariants} style={{ marginBottom: '2rem' }}>
        <div data-tour="dashboard-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: theme.text, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {t('hey')}, {profile?.username || 'there'}! <MWave size={28} />
            </h1>
            <p style={{ color: theme.textLight, marginTop: '0.25rem' }}>
              {t('levelLabel')} {profile?.level || 1} · {profile?.xp || 0} XP
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div data-tour="streak-display">
              <StreakFlame streak={profile?.streak_count || 0} size="md" />
            </div>
          </div>
        </div>

        {/* XP bar */}
        <div data-tour="xp-bar" style={{ marginTop: '1rem', background: `${theme.primary}22`, borderRadius: '999px', height: '10px', overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress * 100}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 22, delay: 0.3 }}
            style={{ height: '100%', background: theme.primary, borderRadius: '999px' }}
          />
        </div>
        <div style={{ fontSize: '0.8rem', color: theme.textLight, marginTop: '0.25rem' }}>
          {xpToNextLevel} {t('xpToLevel')} {(profile?.level || 1) + 1}
        </div>
      </motion.div>

      {/* Deck header row */}
      <motion.div
        variants={itemVariants}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: theme.text, margin: 0 }}>{t('yourDecks')}</h2>
        <div data-tour="new-deck-btn">
          <Link to="/create">
            <GlassButton size="sm">
              <PlusCircle size={16} /> {t('newDeck')}
            </GlassButton>
          </Link>
        </div>
      </motion.div>

      {/* Deck grid */}
      <div data-tour="decks-grid">
      <AnimatePresence mode="wait">
        {decks.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={gentleSpring}
            style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              background: theme.card,
              borderRadius: theme.borderRadius,
              boxShadow: theme.shadow,
            }}
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            >
              <BookOpen size={48} style={{ color: theme.textLight, marginBottom: '1rem' }} />
            </motion.div>
            <p style={{ color: theme.textLight, fontSize: '1.1rem' }}>{t('noDecksYet')} {t('createFirst')}</p>
            <Link to="/create">
              <GlassButton style={{ marginTop: '1rem' }}>{t('create')}</GlassButton>
            </Link>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}
          >
            {decks.map((deck) => (
              <motion.div
                key={deck.id}
                variants={cardVariants}
                whileHover={{ y: -6, scale: 1.02, boxShadow: `0 16px 40px ${theme.primary}33` }}
                whileTap={{ scale: 0.97 }}
                transition={spring}
              >
                <Link to={`/study/${deck.id}`} style={{ textDecoration: 'none' }}>
                  <div
                    className="glass-card"
                    style={{
                      background: theme.card,
                      borderRadius: theme.borderRadius,
                      padding: '1.5rem',
                      boxShadow: theme.shadow,
                      border: `1px solid ${theme.primary}28`,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: theme.text, marginBottom: '0.5rem' }}>
                      {deck.title}
                    </div>
                    {deck.description && (
                      <div style={{ fontSize: '0.85rem', color: theme.textLight, marginBottom: '0.75rem' }}>
                        {deck.description}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          background: `${theme.secondary}22`,
                          color: theme.secondary,
                          borderRadius: '999px',
                          padding: '0.2rem 0.75rem',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                        }}
                      >
                        {deck.card_count} {t('cards')}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: theme.textLight }}>{t('study')} →</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Dashboard;
