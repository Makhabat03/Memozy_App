import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { socialApi, Deck } from '../hooks/useApi';
import { Search, UserPlus } from 'lucide-react';
import GlassButton from '../components/GlassButton';

const RANK_BADGES = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

const Social: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [feed, setFeed] = useState<Deck[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      socialApi.leaderboard(user.id).then((r: any) => setLeaderboard(r.data.leaderboard || [])),
      socialApi.feed(user.id).then((r: any) => setFeed(r.data.decks || [])),
    ]).finally(() => setLoading(false));
  }, [user]);

  const handleSearch = async () => {
    if (!searchQ.trim()) return;
    const res = await socialApi.search(searchQ);
    setSearchResults((res.data as any).users || []);
  };

  const handleFollow = async (targetId: string) => {
    if (!user) return;
    await socialApi.follow(user.id, targetId);
    setSearchResults((prev) => prev.filter((u) => u.id !== targetId));
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', fontFamily: theme.font }}>{t('loading')}</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem', fontFamily: theme.font }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: theme.text, marginBottom: '2rem' }}>{t('social')}</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div data-tour="social-leaderboard">
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: theme.text, marginBottom: '1rem' }}>🏆 {t('weeklyLeaderboard')}</h2>
          {leaderboard.length === 0 ? (
            <div style={{ color: theme.textLight, fontSize: '0.9rem', padding: '1rem', background: theme.card, borderRadius: theme.borderRadius }}>
              {t('followToLeaderboard')}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {leaderboard.map((entry: any, i: number) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="glass-card"
                  style={{
                    background: theme.card,
                    borderRadius: theme.borderRadius,
                    padding: '0.9rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    boxShadow: i === 0 ? `0 4px 16px ${theme.primary}44` : theme.shadow,
                    border: i === 0 ? `1.5px solid ${theme.primary}88` : `1px solid ${theme.primary}28`,
                  }}
                >
                  <span style={{ fontSize: '1.25rem' }}>{RANK_BADGES[i]}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: theme.text }}>{entry.username}</div>
                    <div style={{ fontSize: '0.8rem', color: theme.textLight }}>{t('levelLabel')} {entry.level}</div>
                  </div>
                  <div style={{ fontWeight: 800, color: theme.primary }}>{entry.weekly_xp} XP</div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div data-tour="social-search">
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: theme.text, marginBottom: '1rem' }}>🔍 {t('findPeople')}</h2>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={t('searchPlaceholder')}
              style={{
                flex: 1,
                padding: '0.65rem 1rem',
                border: `1px solid ${theme.primary}44`,
                borderRadius: theme.borderRadius,
                fontFamily: theme.font,
                background: theme.background,
                color: theme.text,
                outline: 'none',
              }}
            />
            <GlassButton onClick={handleSearch} size="sm" style={{ padding: '0.65rem 1rem' }}>
              <Search size={18} />
            </GlassButton>
          </div>
          {searchResults.map((u: any) => (
            <div key={u.id} className="glass-card" style={{ background: theme.card, borderRadius: theme.borderRadius, padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', boxShadow: theme.shadow, border: `1px solid ${theme.primary}28` }}>
              <div>
                <div style={{ fontWeight: 700, color: theme.text }}>{u.username}</div>
                <div style={{ fontSize: '0.8rem', color: theme.textLight }}>{t('levelLabel')} {u.level}</div>
              </div>
              <GlassButton onClick={() => handleFollow(u.id)} size="sm">
                <UserPlus size={14} /> {t('followBtn')}
              </GlassButton>
            </div>
          ))}
        </div>
      </div>

      <div data-tour="social-feed" style={{ marginTop: '2.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: theme.text, marginBottom: '1rem' }}>📚 {t('friendsDecks')}</h2>
        {feed.length === 0 ? (
          <div style={{ color: theme.textLight, fontSize: '0.9rem', padding: '1.5rem', background: theme.card, borderRadius: theme.borderRadius, textAlign: 'center' }}>
            {t('followToSee')}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
            {feed.map((deck: any, i: number) => (
              <motion.div
                key={deck.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{ background: theme.card, borderRadius: theme.borderRadius, padding: '1.25rem', boxShadow: theme.shadow, border: `1px solid ${theme.primary}22` }}
              >
                <div style={{ fontWeight: 700, color: theme.text, marginBottom: '0.35rem' }}>{deck.title}</div>
                <div style={{ fontSize: '0.8rem', color: theme.textLight, marginBottom: '0.75rem' }}>
                  {t('byAuthor')} {deck.profiles?.username || '—'}
                </div>
                <span style={{ background: `${theme.secondary}22`, color: theme.secondary, borderRadius: '999px', padding: '0.2rem 0.75rem', fontSize: '0.8rem', fontWeight: 700 }}>
                  {deck.card_count} {t('cards')}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Social;
