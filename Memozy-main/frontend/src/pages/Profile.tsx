import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { gamifyApi, Profile as ProfileType, Badge } from '../hooks/useApi';
import StreakFlame from '../components/animations/StreakFlame';
import { ThemeName, themes, Theme } from '../themes';

import type { TranslationKeys } from '../i18n/translations';

const ALL_BADGES: { type: string; icon: string; labelKey: keyof TranslationKeys }[] = [
  { type: 'first_deck', icon: '📚', labelKey: 'badgeFirstDeck' },
  { type: 'streak_7',   icon: '🔥', labelKey: 'badgeStreak7' },
  { type: 'streak_30',  icon: '⚡', labelKey: 'badgeStreak30' },
  { type: 'level_5',    icon: '⭐', labelKey: 'badgeLevel5' },
  { type: 'cards_100',  icon: '💯', labelKey: 'badgeCards100' },
  { type: 'cards_500',  icon: '🏆', labelKey: 'badgeCards500' },
];

const STREAK_MILESTONE_DAYS = [
  { days: 7,   icon: '🔥', key: 'streak1Week'   as const },
  { days: 30,  icon: '⚡', key: 'streak1Month'  as const },
  { days: 60,  icon: '💎', key: 'streak2Months' as const },
  { days: 100, icon: '👑', key: 'streak100Days' as const },
  { days: 365, icon: '🌟', key: 'streak1Year'   as const },
];

const ProfilePage: React.FC = () => {
  const { theme, themeName, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    gamifyApi.getProfile(user.id).then((r) => {
      setProfile(r.data.profile);
      setBadges(r.data.badges);
      setSessions(r.data.recent_sessions);
      setLoading(false);
    });
  }, [user]);

  const STREAK_MILESTONES = STREAK_MILESTONE_DAYS.map(m => ({ ...m, label: t(m.key) }));

  const earnedTypes = new Set(badges.map((b) => b.badge_type));
  const xpProgress = profile ? ((profile.xp % 500) / 500) * 100 : 0;

  const studiedDays = new Set(sessions.map((s) => s.created_at?.split('T')[0]));

  const getLast90Days = () => {
    const days = [];
    for (let i = 89; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };
  const days = getLast90Days();

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const lastStudied = profile?.streak_last_date;
  const streakAlive = lastStudied === today || lastStudied === yesterday;
  const streakCount = profile?.streak_count || 0;
  const maxStreak = profile?.max_streak || streakCount;
  const totalDays = studiedDays.size;

  const nextMilestone = STREAK_MILESTONES.find((m) => m.days > streakCount);
  const daysToNext = nextMilestone ? nextMilestone.days - streakCount : null;

  // High-contrast colors for dark themes
  const isDark = themeName === 'darkFuturistic' || themeName === 'cosmic';
  const safeColor    = isDark ? '#4ade80'  : '#059669';
  const warnColor    = isDark ? '#facc15'  : '#d97706';
  const brokenColor  = isDark ? '#ff6b8a'  : '#dc2626';
  const safeBg       = isDark ? '#4ade8018' : '#d1fae533';
  const warnBg       = isDark ? '#facc1518' : '#fef9c333';
  const brokenBg     = isDark ? '#ff6b8a18' : '#fecaca33';

  const statusColor  = lastStudied === today ? safeColor : streakAlive ? warnColor : brokenColor;
  const statusBg     = lastStudied === today ? safeBg    : streakAlive ? warnBg    : brokenBg;
  const statusText   = lastStudied === today
    ? t('studiedTodaySafe')
    : streakAlive
    ? t('studyTodayKeep')
    : t('streakBrokenMsg');

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', fontFamily: theme.font }}>{t('loading')}</div>;

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem 1rem', fontFamily: theme.font }}>

      {/* User info + XP */}
      <motion.div
        data-tour="profile-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ background: theme.card, borderRadius: theme.borderRadius, padding: '2rem', marginBottom: '1.5rem', boxShadow: theme.shadow, textAlign: 'center' }}
      >
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', margin: '0 auto 1rem', color: '#fff', fontWeight: 900 }}>
          {profile?.username?.[0]?.toUpperCase() || '?'}
        </div>
        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: theme.text }}>{profile?.username}</div>
        <div style={{ color: theme.textLight, marginTop: '0.25rem' }}>{t('levelLabel')} {profile?.level} · {profile?.xp} {t('xpTotal')}</div>
        <div style={{ margin: '1rem 0 0.25rem', background: `${theme.primary}22`, borderRadius: '999px', height: '8px' }}>
          <div style={{ width: `${xpProgress}%`, height: '100%', background: theme.primary, borderRadius: '999px', transition: 'width 1s ease' }} />
        </div>
        <div style={{ fontSize: '0.8rem', color: theme.textLight }}>{500 - (profile?.xp || 0) % 500} {t('xpNextLevel')}</div>
      </motion.div>

      {/* Streak Hero */}
      <motion.div
        data-tour="profile-streak-section"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        style={{
          background: `linear-gradient(135deg, ${theme.primary}18, ${theme.secondary}18)`,
          border: `1.5px solid ${theme.primary}44`,
          borderRadius: theme.borderRadius,
          padding: '1.75rem 1.5rem',
          marginBottom: '1.5rem',
          boxShadow: theme.shadow,
          textAlign: 'center',
        }}
      >
        <StreakFlame streak={streakCount} size="lg" />
        <div style={{ fontSize: '4rem', fontWeight: 900, color: theme.primary, lineHeight: 1 }}>
          {streakCount}
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: theme.text, marginTop: '0.25rem' }}>
          {t('dayStreak')}
        </div>

        {/* Status */}
        <div style={{
          display: 'inline-block',
          marginTop: '0.75rem',
          padding: '0.35rem 1rem',
          borderRadius: '999px',
          fontSize: '0.82rem',
          fontWeight: 700,
          background: statusBg,
          color: statusColor,
          border: `1px solid ${statusColor}66`,
          textShadow: isDark ? `0 0 10px ${statusColor}88` : 'none',
        }}>
          {statusText}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: theme.secondary }}>{maxStreak}</div>
            <div style={{ fontSize: '0.75rem', color: theme.textLight, fontWeight: 600 }}>{t('bestStreak')}</div>
          </div>
          <div style={{ width: '1px', background: `${theme.primary}33` }} />
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: theme.accent }}>{totalDays}</div>
            <div style={{ fontSize: '0.75rem', color: theme.textLight, fontWeight: 600 }}>{t('daysStudied')}</div>
          </div>
          <div style={{ width: '1px', background: `${theme.primary}33` }} />
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: theme.text }}>
              {nextMilestone ? nextMilestone.icon : '👑'}
            </div>
            <div style={{ fontSize: '0.75rem', color: theme.textLight, fontWeight: 600 }}>
              {nextMilestone ? `${nextMilestone.label} ${t('goalSuffix')}` : t('legendaryLabel')}
            </div>
            {daysToNext !== null && (
              <div style={{ fontSize: '0.65rem', color: theme.textLight, opacity: 0.7 }}>
                {daysToNext} {t('daysAway')}
              </div>
            )}
          </div>
        </div>

        {/* Milestone bar */}
        {nextMilestone && (
          <div style={{ marginTop: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: theme.textLight, marginBottom: '0.35rem', textAlign: 'left' }}>
              {t('progressTo')} {nextMilestone.icon} {nextMilestone.label} ({nextMilestone.days} {t('dayStreakLabel')})
            </div>
            <div style={{ background: `${theme.primary}22`, borderRadius: '999px', height: '7px' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(streakCount / nextMilestone.days) * 100}%` }}
                transition={{ duration: 1, delay: 0.4 }}
                style={{ height: '100%', background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`, borderRadius: '999px' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: theme.textLight, marginTop: '0.2rem' }}>
              <span>{t('dayLabel')} {streakCount}</span>
              <span>{t('dayLabel')} {nextMilestone.days}</span>
            </div>
          </div>
        )}

        {/* Milestones earned */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
          {STREAK_MILESTONES.map((m) => {
            const reached = (maxStreak || 0) >= m.days;
            return (
              <div
                key={m.days}
                title={`${m.label} (${m.days} days)`}
                style={{
                  padding: '0.3rem 0.6rem',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  background: reached ? `${theme.primary}22` : `${theme.primary}08`,
                  color: reached ? theme.primary : theme.textLight,
                  border: `1px solid ${reached ? theme.primary + '55' : theme.primary + '18'}`,
                  opacity: reached ? 1 : 0.45,
                }}
              >
                {m.icon} {m.label}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* 90-Day Activity */}
      <div data-tour="profile-activity" style={{ background: theme.card, borderRadius: theme.borderRadius, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: theme.shadow }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontWeight: 800, color: theme.text, margin: 0 }}>{t('activityLabel')}</h3>
          <span style={{ fontSize: '0.78rem', color: theme.textLight }}>{totalDays} {t('activeDays')}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: '3px' }}>
          {days.map((day) => {
            const studied = studiedDays.has(day);
            const isToday = day === today;
            return (
              <div
                key={day}
                title={`${day}${studied ? ' ✓' : ''}`}
                style={{
                  aspectRatio: '1',
                  borderRadius: '3px',
                  background: studied
                    ? `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`
                    : `${theme.primary}15`,
                  border: isToday ? `2px solid ${theme.accent}` : '2px solid transparent',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box',
                }}
              />
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.75rem', fontSize: '0.72rem', color: theme.textLight }}>
          <span>← {t('daysAgoLabel')}</span>
          <span style={{ marginLeft: 'auto' }}>{t('todayLabel')} →</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.72rem', color: theme.textLight }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: `${theme.primary}15` }} />
          <span>{t('noStudy')}</span>
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`, marginLeft: '0.5rem' }} />
          <span>{t('studiedLabel')}</span>
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: `${theme.primary}15`, border: `2px solid ${theme.accent}`, boxSizing: 'border-box', marginLeft: '0.5rem' }} />
          <span>{t('todayLabel')}</span>
        </div>
      </div>

      {/* Badges */}
      <div data-tour="profile-badges" style={{ background: theme.card, borderRadius: theme.borderRadius, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: theme.shadow }}>
        <h3 style={{ fontWeight: 800, color: theme.text, marginBottom: '1rem' }}>{t('badges')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
          {ALL_BADGES.map(({ type, icon, labelKey }) => {
            const earned = earnedTypes.has(type);
            return (
              <div
                key={type}
                style={{
                  background: earned ? `linear-gradient(135deg, ${theme.primary}22, ${theme.secondary}22)` : `${theme.primary}08`,
                  borderRadius: theme.borderRadius,
                  padding: '1rem',
                  textAlign: 'center',
                  opacity: earned ? 1 : 0.4,
                  border: earned ? `1px solid ${theme.primary}44` : `1px solid transparent`,
                }}
              >
                <div style={{ fontSize: '1.75rem', marginBottom: '0.35rem', filter: earned ? 'none' : 'grayscale(1)' }}>{icon}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: theme.text }}>{t(labelKey)}</div>
                {earned && <div style={{ fontSize: '0.65rem', color: theme.accent, marginTop: '0.2rem' }}>{t('badgeEarned')}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Theme */}
      <div data-tour="theme-picker" style={{ background: theme.card, borderRadius: theme.borderRadius, padding: '1.5rem', boxShadow: theme.shadow }}>
        <h3 style={{ fontWeight: 800, color: theme.text, marginBottom: '1rem' }}>{t('theme')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.6rem' }}>
          {(Object.values(themes) as Theme[]).map((th) => (
            <button
              key={th.name}
              onClick={() => setTheme(th.name as ThemeName)}
              style={{
                padding: '0.65rem 0.5rem',
                border: `2px solid ${themeName === th.name ? th.primary : th.primary + '44'}`,
                borderRadius: th.borderRadius,
                background: themeName === th.name ? `${th.primary}18` : th.card,
                fontFamily: theme.font,
                fontWeight: 700,
                fontSize: '0.8rem',
                color: themeName === th.name ? th.primary : theme.textLight,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.3rem',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>{th.emoji}</span>
              <span>{th.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
