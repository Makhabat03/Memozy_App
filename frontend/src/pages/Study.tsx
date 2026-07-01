import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { studyApi, cardsApi, gamifyApi, Card } from '../hooks/useApi';
import { useSounds } from '../hooks/useSounds';
import DeckCompleteScreen from '../components/animations/DeckCompleteScreen';
import GlassButton from '../components/GlassButton';
import CardFlipParticles from '../components/animations/CardFlipParticles';
import RatingFeedback from '../components/animations/RatingFeedback';

type StudyMode = 'flashcard' | 'multiple-choice';

const shuffleArray = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const updateDailyProgress = () => {
  const key = `memozy_daily_${new Date().toISOString().split('T')[0]}`;
  localStorage.setItem(key, String(parseInt(localStorage.getItem(key) || '0') + 1));
};

const Study: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const [searchParams] = useSearchParams();
  const isPractice = searchParams.get('mode') === 'practice';
  const tagParam = searchParams.get('tag');
  const { theme } = useTheme();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { play } = useSounds();

  const [cards, setCards] = useState<Card[]>([]);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [dueCards, setDueCards] = useState<Card[]>([]);   // unfiltered pool for selection screen
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  // Tag selection phase
  const [phase, setPhase] = useState<'selecting' | 'studying'>(tagParam ? 'studying' : 'selecting');
  const [selectedTagSet, setSelectedTagSet] = useState<Set<string>>(new Set());
  const [includeUntagged, setIncludeUntagged] = useState(false);

  // Study modes & features
  const [mode, setMode] = useState<StudyMode>('flashcard');
  const [mcOptions, setMcOptions] = useState<string[]>([]);
  const [mcSelected, setMcSelected] = useState<string | null>(null);
  const [mcRevealed, setMcRevealed] = useState(false);

  // Gamification state
  const [xpEarned, setXpEarned] = useState(0);
  const [showXP, setShowXP] = useState(false);
  const [levelUp, setLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(1);
  const [badges, setBadges] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lastRating, setLastRating] = useState<'easy' | 'good' | 'hard' | null>(null);
  const [ratingKey, setRatingKey] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [flipTrigger, setFlipTrigger] = useState(0);

  // Load cards — always fetch both due and all so selection screen has correct counts
  useEffect(() => {
    if (!deckId) return;
    Promise.all([
      studyApi.getDueCards(deckId),
      cardsApi.getByDeck(deckId),
    ]).then(([dueRes, allRes]) => {
      const due = dueRes.data.cards;
      const all = allRes.data.cards;
      setDueCards(due);
      setAllCards(all);
      if (tagParam) {
        const pool = isPractice ? all : due;
        setCards(pool.filter(c => (c.tags || []).includes(tagParam)));
      }
      setLoading(false);
    });
  }, [deckId, isPractice, tagParam]);

  const handleStartStudy = () => {
    const pool = isPractice ? allCards : dueCards;
    const noneSelected = selectedTagSet.size === 0 && !includeUntagged;
    const tagArr = Array.from(selectedTagSet);
    const filtered = noneSelected ? pool : pool.filter(c => {
      const ct = c.tags || [];
      if (ct.length === 0) return includeUntagged;
      return tagArr.some(t => ct.includes(t));
    });
    setCards(filtered);
    if (!noneSelected) {
      setAllCards(allCards.filter(c => {
        const ct = c.tags || [];
        if (ct.length === 0) return includeUntagged;
        return tagArr.some(t => ct.includes(t));
      }));
    }
    setPhase('studying');
  };

  const toggleTag = (tag: string) => {
    setSelectedTagSet(prev => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  };

  // MC options when card or mode changes
  useEffect(() => {
    if (mode !== 'multiple-choice' || cards.length === 0 || allCards.length === 0) return;
    const cur = cards[index];
    const pool = allCards.filter(c => c.id !== cur?.id);
    const distractors = shuffleArray(pool).slice(0, 3).map(c => c.back);
    while (distractors.length < 3) distractors.push(pool[0]?.back ?? '—');
    setMcOptions(shuffleArray([cur.back, ...distractors]));
    setMcSelected(null);
    setMcRevealed(false);
  }, [index, mode, allCards]);

  const handleFlip = useCallback(() => {
    play('waterDrop');
    setFlipped(prev => { if (!prev) setFlipTrigger(t => t + 1); return !prev; });
  }, [play]);

  // Stable ref so keyboard handler always has latest rate()
  const rateRef = useRef<(q: number) => void>(() => {});
  const flippedRef = useRef(flipped);
  flippedRef.current = flipped;
  const modeRef = useRef(mode);
  modeRef.current = mode;

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (modeRef.current !== 'flashcard') return;
      if ((e.key === ' ' || e.key === 'ArrowRight') && !flippedRef.current) {
        e.preventDefault(); handleFlip();
      }
      if (flippedRef.current) {
        if (e.key === '1') rateRef.current(1);
        else if (e.key === '2') rateRef.current(3);
        else if (e.key === '3') rateRef.current(5);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleFlip]);

  const rate = useCallback(async (quality: number) => {
    const card = cards[index];
    updateDailyProgress();
    await studyApi.rateCard(card.id, quality);

    const isCorrect = quality >= 3;
    const newCorrect = correct + (isCorrect ? 1 : 0);
    const newCombo = isCorrect ? combo + 1 : 0;

    if (isCorrect) {
      play(quality === 5 ? 'easy' : 'good');
      setCorrect(newCorrect);
      setCombo(newCombo);
      if (newCombo >= 3) play('combo');
      setLastRating(quality === 5 ? 'easy' : 'good');
    } else {
      play('incorrect');
      setCombo(0);
      setLastRating('hard');
      setShaking(true);
      setTimeout(() => setShaking(false), 440);
    }
    setRatingKey(k => k + 1);

    const next = index + 1;
    if (next >= cards.length) { await finishSession(newCorrect); }
    else { setIndex(next); setFlipped(false); }
  }, [cards, index, correct, combo, play]); // eslint-disable-line

  useEffect(() => { rateRef.current = rate; });

  const handleMCSelect = useCallback((opt: string) => {
    if (mcSelected) return;
    setMcSelected(opt);
    setMcRevealed(true);
    const isCorrect = opt === cards[index]?.back;
    setTimeout(() => rate(isCorrect ? 3 : 1), 900);
  }, [mcSelected, cards, index, rate]);

  const finishSession = async (finalCorrect: number) => {
    play('deckComplete');
    if (!user || !deckId) return setDone(true);
    try {
      const res = await gamifyApi.studyComplete({
        user_id: user.id, deck_id: deckId,
        cards_reviewed: cards.length, correct_count: finalCorrect,
      });
      setXpEarned(res.data.xp_earned);
      setShowXP(true); setTimeout(() => setShowXP(false), 1500);
      setStreak(res.data.streak);
      if (res.data.leveled_up) { play('levelUp'); setNewLevel(res.data.new_level); setLevelUp(true); }
      if (res.data.badges_earned.length > 0) { play('badgeEarned'); setBadges(res.data.badges_earned); }
      if (res.data.streak > 1) play('streakContinue');
    } catch (e) { console.error(e); }
    setDone(true);
  };

  const switchMode = (m: StudyMode) => {
    setMode(m); setFlipped(false); setMcSelected(null); setMcRevealed(false);
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', fontFamily: theme.font }}>
      {t('loading')}
    </div>
  );

  // ── Tag selection screen ──────────────────────────────────────────────────
  if (phase === 'selecting') {
    const deckTags = Array.from(new Set(allCards.flatMap(c => c.tags || [])));
    const untaggedTotal = allCards.filter(c => !c.tags?.length).length;
    const untaggedDue   = dueCards.filter(c => !c.tags?.length).length;

    // Skip only if there is truly nothing to show (no tags, no untagged cards)
    // For "Select & Study" (isPractice), always show the screen
    if (!isPractice && deckTags.length === 0 && untaggedTotal === 0) {
      handleStartStudy(); return null;
    }

    const now = new Date();
    const tagTotal  = (tag: string) => allCards.filter(c => (c.tags || []).includes(tag)).length;
    const tagDue    = (tag: string) => dueCards.filter(c => (c.tags || []).includes(tag)).length;

    // Next upcoming review date label for a caught-up tag/group
    const nextReviewLabel = (pool: Card[]) => {
      const upcoming = pool
        .filter(c => c.next_review && new Date(c.next_review) > now)
        .sort((a, b) => new Date(a.next_review!).getTime() - new Date(b.next_review!).getTime());
      if (!upcoming.length) return null;
      const days = Math.ceil((new Date(upcoming[0].next_review!).getTime() - now.getTime()) / 86400000);
      if (days <= 0) return 'later today';
      if (days === 1) return 'tomorrow';
      return `in ${days}d`;
    };

    // Sort: tags with due cards first, then alphabetical
    const sortedTags = [...deckTags].sort((a, b) => {
      const dA = tagDue(a), dB = tagDue(b);
      if (dA > 0 && dB === 0) return -1;
      if (dA === 0 && dB > 0) return 1;
      return a.localeCompare(b);
    });

    const dueTagsList = sortedTags.filter(t => tagDue(t) > 0);
    const hasAnyDue   = dueTagsList.length > 0 || untaggedDue > 0;

    const selPool = isPractice ? allCards : dueCards;
    const noneSelected = selectedTagSet.size === 0 && !includeUntagged;
    const selTagArr = Array.from(selectedTagSet);
    const previewCount = noneSelected ? selPool.length : selPool.filter(c => {
      const ct = c.tags || [];
      if (ct.length === 0) return includeUntagged;
      return selTagArr.some(t => ct.includes(t));
    }).length;

    const selectAllDue = () => {
      setSelectedTagSet(new Set(dueTagsList));
      setIncludeUntagged(untaggedDue > 0);
    };

    return (
      <div style={{ maxWidth: '580px', margin: '2.5rem auto', padding: '1.5rem 1rem', fontFamily: theme.font }}>
        <button onClick={() => navigate('/decks')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.primary, fontFamily: theme.font, fontWeight: 700, fontSize: '0.9rem', padding: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          ← {t('backToDecks')}
        </button>

        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem', fontWeight: 900, color: theme.text }}>
          {isPractice ? 'Select tags to study' : 'Choose tags to review'}
        </h2>
        <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: theme.textLight }}>
          {isPractice ? 'Pick tags from your full deck — all cards included.' : 'Showing cards due for review today.'}
        </p>

        {/* SRS summary banner */}
        {hasAnyDue ? (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', background: '#f9731618', border: '1.5px solid #f9731644', borderRadius: theme.borderRadius, padding: '0.75rem 1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.6 }} style={{ fontSize: '1rem' }}>🔔</motion.span>
              <span style={{ fontSize: '0.88rem', color: theme.text }}>
                <strong style={{ color: '#f97316' }}>{dueCards.length} card{dueCards.length !== 1 ? 's' : ''}</strong> due for review — your memory is fading!
              </span>
            </div>
            <button onClick={selectAllDue} style={{ background: '#f97316', color: '#fff', border: 'none', borderRadius: '999px', padding: '0.3rem 0.85rem', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: theme.font }}>
              Review due →
            </button>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#10b98118', border: '1.5px solid #10b98144', borderRadius: theme.borderRadius, padding: '0.75rem 1rem', marginBottom: '1.5rem' }}>
            <span>✅</span>
            <span style={{ fontSize: '0.88rem', color: '#10b981', fontWeight: 700 }}>All caught up! Use Practice mode to review anyway.</span>
          </div>
        )}

        {/* Tag grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {sortedTags.map(tag => {
            const sel  = selectedTagSet.has(tag);
            const due  = tagDue(tag);
            const total = tagTotal(tag);
            const nextLabel = due === 0
              ? nextReviewLabel(allCards.filter(c => (c.tags || []).includes(tag)))
              : null;
            return (
              <motion.button key={tag} onClick={() => toggleTag(tag)}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{
                  padding: '0.9rem 1rem', textAlign: 'left', cursor: 'pointer', fontFamily: theme.font,
                  border: `2px solid ${sel ? theme.primary : due > 0 ? '#f9731644' : theme.primary + '28'}`,
                  borderRadius: theme.borderRadius, transition: 'all 0.15s',
                  background: sel ? `${theme.primary}14` : due > 0 ? '#f9731608' : theme.card,
                  boxShadow: sel ? `0 0 0 3px ${theme.primary}22` : theme.shadow,
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '1rem' }}>🏷️</span>
                  {due > 0 && (
                    <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.4 }}
                      style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316', flexShrink: 0 }} />
                  )}
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: theme.text, marginBottom: '0.35rem', wordBreak: 'break-word' }}>{tag}</div>
                {due > 0 ? (
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#f97316' }}>{due} due · {total} total</div>
                ) : (
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981' }}>
                    ✓ caught up{nextLabel ? ` · next ${nextLabel}` : ''}
                  </div>
                )}
                <div style={{ fontSize: '0.65rem', color: theme.textLight, marginTop: '0.15rem' }}>{total} cards</div>
              </motion.button>
            );
          })}

          {untaggedTotal > 0 && (() => {
            const nextLabel = untaggedDue === 0
              ? nextReviewLabel(allCards.filter(c => !c.tags?.length))
              : null;
            return (
              <motion.button onClick={() => setIncludeUntagged(v => !v)}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{
                  padding: '0.9rem 1rem', textAlign: 'left', cursor: 'pointer', fontFamily: theme.font,
                  border: `2px solid ${includeUntagged ? theme.secondary : untaggedDue > 0 ? '#f9731644' : theme.primary + '28'}`,
                  borderRadius: theme.borderRadius, transition: 'all 0.15s',
                  background: includeUntagged ? `${theme.secondary}14` : untaggedDue > 0 ? '#f9731608' : theme.card,
                  boxShadow: includeUntagged ? `0 0 0 3px ${theme.secondary}22` : theme.shadow,
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '1rem' }}>📝</span>
                  {untaggedDue > 0 && (
                    <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.4 }}
                      style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316', flexShrink: 0 }} />
                  )}
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: theme.text, marginBottom: '0.35rem' }}>Untagged</div>
                {untaggedDue > 0 ? (
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#f97316' }}>{untaggedDue} due · {untaggedTotal} total</div>
                ) : (
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981' }}>
                    ✓ caught up{nextLabel ? ` · next ${nextLabel}` : ''}
                  </div>
                )}
                <div style={{ fontSize: '0.65rem', color: theme.textLight, marginTop: '0.15rem' }}>{untaggedTotal} cards</div>
              </motion.button>
            );
          })()}
        </div>

        <GlassButton onClick={handleStartStudy} fullWidth size="lg"
          tintColor={noneSelected && hasAnyDue ? '#f97316' : undefined}>
          {noneSelected
            ? `${hasAnyDue && !isPractice ? '⚡ ' : ''}Study All · ${selPool.length} card${selPool.length !== 1 ? 's' : ''}`
            : `Start · ${previewCount} card${previewCount !== 1 ? 's' : ''}`}
        </GlassButton>
        {!isPractice && (
          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: theme.textLight, marginTop: '0.75rem', lineHeight: 1.5 }}>
            Only cards due today are shown. Ratings schedule your next review using spaced repetition.
          </p>
        )}
      </div>
    );
  }
  // ─────────────────────────────────────────────────────────────────────────

  if (cards.length === 0) return (
    <div style={{ maxWidth: '500px', margin: '4rem auto', textAlign: 'center', fontFamily: theme.font }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{isPractice ? '📚' : '✅'}</div>
      <h2 style={{ color: theme.text }}>
        {isPractice ? 'No cards in this deck' : t('allCaughtUp')}
      </h2>
      {tagParam && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: `${theme.primary}18`, color: theme.primary, borderRadius: '999px', padding: '0.2rem 0.75rem', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          🏷️ {tagParam}
        </div>
      )}
      <p style={{ color: theme.textLight }}>
        {isPractice
          ? 'Add some cards first.'
          : tagParam
            ? `No cards due for tag "${tagParam}" right now.`
            : t('noDue')}
      </p>
      {tagParam && !isPractice && (
        <GlassButton onClick={() => navigate(`/study/${deckId}?tag=${encodeURIComponent(tagParam)}&mode=practice`)} variant="outline" style={{ marginTop: '0.75rem', marginRight: '0.5rem' }}>
          Practice all "{tagParam}"
        </GlassButton>
      )}
      <GlassButton onClick={() => navigate('/decks')} style={{ marginTop: '1rem' }}>{t('backToDecks')}</GlassButton>
    </div>
  );

  if (done) return (
    <DeckCompleteScreen
      correct={correct} total={cards.length}
      xpEarned={xpEarned} showXP={showXP}
      levelUp={levelUp} newLevel={newLevel}
      badges={badges} streak={streak}
      onLevelUpClose={() => setLevelUp(false)}
      onBadgeDismiss={() => setBadges([])}
      onStudyAgain={() => {
        setIndex(0); setFlipped(false); setDone(false);
        setCorrect(0); setCombo(0); setLastRating(null);
        setMcSelected(null); setMcRevealed(false);
        if (!tagParam) { setSelectedTagSet(new Set()); setIncludeUntagged(false); setPhase('selecting'); }
      }}
      onBack={() => navigate('/decks')}
    />
  );

  const current = cards[index];
  const progress = (index / cards.length) * 100;

  return (
    <>
      <CardFlipParticles trigger={flipTrigger} />
      <RatingFeedback rating={lastRating} ratingKey={ratingKey} combo={combo} />

      <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: theme.font }}>
        <div style={{ width: '100%', maxWidth: '580px' }}>

          {/* Mode selector */}
          <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1.1rem',
            background: `${theme.primary}0e`, borderRadius: theme.borderRadius, padding: '0.28rem' }}>
            {([
              ['flashcard', '🃏 Flashcard'],
              ['multiple-choice', '🎯 Multiple Choice'],
            ] as [StudyMode, string][]).map(([m, label]) => (
              <button key={m} onClick={() => switchMode(m)} style={{
                flex: 1, padding: '0.42rem 0.25rem', border: 'none', borderRadius: '8px',
                cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700,
                background: mode === m ? theme.primary : 'transparent',
                color: mode === m ? '#fff' : theme.textLight,
                transition: 'all 0.15s', fontFamily: theme.font,
              }}>
                {label}
              </button>
            ))}
          </div>

          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
            <span style={{ color: theme.textLight, fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              {index + 1} / {cards.length}
              {isPractice && <span style={{ fontSize: '0.7rem', color: theme.secondary, fontWeight: 800 }}>PRACTICE</span>}
              {tagParam && <span style={{ fontSize: '0.7rem', color: theme.primary, fontWeight: 800, background: `${theme.primary}18`, padding: '0.1rem 0.5rem', borderRadius: '999px' }}>🏷️ {tagParam}</span>}
            </span>

            <AnimatePresence>
              {combo >= 2 && (
                <motion.span key={combo} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  style={{ fontSize: '0.76rem', fontWeight: 800, color: combo >= 5 ? theme.accent : theme.primary,
                    background: `${theme.primary}15`, padding: '0.18rem 0.6rem',
                    borderRadius: '999px', border: `1px solid ${theme.primary}30` }}>
                  🔥 {combo}×
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Progress bar */}
          <div style={{ background: `${theme.primary}22`, borderRadius: '999px', height: '6px', marginBottom: '1.4rem' }}>
            <motion.div animate={{ width: `${progress}%` }} transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              style={{ height: '100%', borderRadius: '999px',
                background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`,
                boxShadow: `0 0 8px ${theme.primary}55` }} />
          </div>

          {/* ════ FLASHCARD MODE ════ */}
          {mode === 'flashcard' && (
            <motion.div animate={shaking ? { x: [-13, 13, -9, 9, -4, 4, 0] } : { x: 0 }} transition={{ duration: 0.42 }}>
              <div style={{ perspective: '1200px', cursor: 'pointer', marginBottom: '1.4rem' }} onClick={handleFlip}>
                <motion.div animate={{ rotateY: flipped ? 180 : 0 }} transition={{ type: 'spring', stiffness: 370, damping: 28 }}
                  style={{ transformStyle: 'preserve-3d', position: 'relative', height: '250px' }}>
                  {/* Front */}
                  <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                    background: theme.card, borderRadius: theme.borderRadius, boxShadow: theme.shadow,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '2rem', border: `2px solid ${theme.primary}33` }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: theme.secondary, marginBottom: '1rem', letterSpacing: '0.1em' }}>QUESTION</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: theme.text, textAlign: 'center', lineHeight: 1.5 }}>{current.front}</div>
                    <div style={{ marginTop: '1.4rem', color: theme.textLight, fontSize: '0.8rem' }}>
                      {t('flipHint')}
                    </div>
                  </div>
                  {/* Back */}
                  <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
                    background: `linear-gradient(135deg, ${theme.primary}14, ${theme.secondary}14)`,
                    borderRadius: theme.borderRadius, boxShadow: `${theme.shadow}, 0 0 24px ${theme.primary}33`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '2rem', border: `2px solid ${theme.primary}66`, overflow: 'hidden' }}>
                    <AnimatePresence>
                      {flipped && (
                        <motion.div key={`shimmer-${index}`} initial={{ x: '-110%', opacity: 0.7 }} animate={{ x: '110%', opacity: 0 }}
                          transition={{ duration: 0.52, ease: 'easeOut' }}
                          style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
                            background: `linear-gradient(90deg, transparent, ${theme.primary}55, transparent)`,
                            borderRadius: theme.borderRadius }} />
                      )}
                    </AnimatePresence>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: theme.accent, marginBottom: '1rem', letterSpacing: '0.1em' }}>ANSWER</div>
                    <div style={{ fontSize: '1.1rem', color: theme.text, textAlign: 'center', lineHeight: 1.6 }}>{current.back}</div>
                  </div>
                </motion.div>
              </div>

              <AnimatePresence>
                {flipped && (
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                    {current.hint && (
                      <div style={{ background: `${theme.primary}14`, border: `1px solid ${theme.primary}30`,
                        borderRadius: theme.borderRadius, padding: '0.8rem 1rem' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: theme.secondary, letterSpacing: '0.08em' }}>💡 REMEMBER IT</span>
                        <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: theme.text }}>{current.hint}</div>
                      </div>
                    )}
                    {current.example && (
                      <div style={{ background: `${theme.accent}11`, border: `1px solid ${theme.accent}30`,
                        borderRadius: theme.borderRadius, padding: '0.7rem 1rem' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: theme.accent, letterSpacing: '0.08em' }}>📝 EXAMPLE</span>
                        <div style={{ marginTop: '0.25rem', fontSize: '0.88rem', color: theme.textLight, fontStyle: 'italic' }}>"{current.example}"</div>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      {([
                        { label: `😤 ${t('hard')}`, quality: 1, tintColor: '#dc2626' },
                        { label: `👍 ${t('good')}`, quality: 3, tintColor: theme.secondary },
                        { label: `😎 ${t('easy')}`, quality: 5, tintColor: '#059669' },
                      ]).map(({ label, quality, tintColor }) => (
                        <GlassButton key={quality} onClick={() => rate(quality)} tintColor={tintColor}
                          style={{ flex: 1, padding: '0.85rem', fontSize: '0.93rem' }}>
                          {label}
                        </GlassButton>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ════ MULTIPLE CHOICE MODE ════ */}
          {mode === 'multiple-choice' && (
            <div>
              <motion.div animate={shaking ? { x: [-13, 13, -9, 9, 0] } : { x: 0 }} transition={{ duration: 0.38 }}
                style={{ background: theme.card, borderRadius: theme.borderRadius, boxShadow: theme.shadow,
                  border: `2px solid ${theme.primary}33`, padding: '2rem', textAlign: 'center', marginBottom: '1.1rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: theme.secondary, marginBottom: '0.9rem', letterSpacing: '0.1em' }}>QUESTION</div>
                <div style={{ fontSize: '1.18rem', fontWeight: 700, color: theme.text, lineHeight: 1.5 }}>{current.front}</div>
              </motion.div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {mcOptions.map((opt, i) => {
                  const isCorrect = opt === current.back;
                  const isSelected = opt === mcSelected;
                  const revealed = mcRevealed;
                  const bg = revealed
                    ? isCorrect ? '#05966920' : isSelected ? '#dc262620' : `${theme.primary}08`
                    : `${theme.primary}0a`;
                  const border = revealed
                    ? isCorrect ? '1.5px solid #05966660' : isSelected ? '1.5px solid #dc262660' : `1.5px solid ${theme.primary}18`
                    : `1.5px solid ${theme.primary}28`;
                  const color = revealed
                    ? isCorrect ? '#059669' : isSelected ? '#dc2626' : theme.textLight
                    : theme.text;
                  return (
                    <motion.button key={i} whileHover={!mcSelected ? { scale: 1.02, x: 3 } : {}} whileTap={!mcSelected ? { scale: 0.98 } : {}}
                      onClick={() => !mcSelected && handleMCSelect(opt)}
                      style={{ width: '100%', padding: '0.95rem 1.2rem', textAlign: 'left', background: bg,
                        border, borderRadius: theme.borderRadius, cursor: mcSelected ? 'default' : 'pointer',
                        color, fontWeight: 600, fontSize: '0.93rem', fontFamily: theme.font,
                        display: 'flex', alignItems: 'center', gap: '0.8rem', transition: 'all 0.18s' }}>
                      <span style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800,
                        background: revealed && isCorrect ? '#059669' : revealed && isSelected ? '#dc2626' : `${theme.primary}20`,
                        color: revealed && (isCorrect || isSelected) ? '#fff' : theme.textLight }}>
                        {revealed ? (isCorrect ? '✓' : isSelected ? '✗' : String.fromCharCode(65 + i)) : String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default Study;
