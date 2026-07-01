import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LANGUAGES } from '../i18n/translations';
import { cardsApi, decksApi, Card } from '../hooks/useApi';
import { FileText, Image, File, Loader, Globe, Lock } from 'lucide-react';
import GlassButton from '../components/GlassButton';

type Tab = 'text' | 'pdf' | 'image';

const Create: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState<Tab>('text');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [numCards, setNumCards] = useState(10);
  const [isPublic, setIsPublic] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [generatedCards, setGeneratedCards] = useState<Card[]>([]);
  const [editingCards, setEditingCards] = useState<Card[]>([]);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!user || !title.trim()) { setError('Please enter a deck title'); return; }
    setError('');
    setLoading(true);
    const langEnglish = LANGUAGES.find(l => l.code === lang)?.english ?? 'English';
    try {
      const deckRes = await decksApi.create({ user_id: user.id, title, description: '', is_public: isPublic });
      const deckId = deckRes.data.deck.id;

      let cards: Card[] = [];
      if (tab === 'text') {
        if (!text.trim()) throw new Error('Please enter some text');
        const res = await cardsApi.generateFromText({ text, deck_id: deckId, num_cards: numCards, language: langEnglish });
        cards = res.data.cards;
      } else if (tab === 'pdf' || tab === 'image') {
        if (!file) throw new Error('Please select a file');
        const fd = new FormData();
        fd.append('file', file);
        fd.append('deck_id', deckId);
        fd.append('num_cards', String(numCards));
        fd.append('language', langEnglish);
        const res = tab === 'pdf' ? await cardsApi.generateFromPdf(fd) : await cardsApi.generateFromImage(fd);
        cards = res.data.cards;
      }

      setGeneratedCards(cards);
      setEditingCards(cards.map(c => ({ ...c, hint: c.hint || '' })));
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(
        editingCards.map((card, i) => {
          const orig = generatedCards[i];
          if (card.front !== orig.front || card.back !== orig.back || (card.hint || '') !== (orig.hint || '')) {
            return cardsApi.update(card.id, { front: card.front, back: card.back, hint: card.hint || '' });
          }
          return Promise.resolve(null);
        })
      );
    } catch (e) {
      console.error('Failed to persist edits', e);
    } finally {
      setSaving(false);
    }
    setSaved(true);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem',
    border: `1px solid ${theme.primary}44`, borderRadius: theme.borderRadius,
    fontFamily: theme.font, fontSize: '0.95rem', color: theme.text,
    background: theme.background, outline: 'none', boxSizing: 'border-box',
  };

  if (saved) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', fontFamily: theme.font }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ color: theme.primary, fontWeight: 900 }}>{t('deckCreated')}</h2>
          <p style={{ color: theme.textLight }}>{editingCards.length} {t('cardsGenerated')} "{title}"</p>
          <GlassButton onClick={() => { setSaved(false); setGeneratedCards([]); setTitle(''); setText(''); setFile(null); }} style={{ marginTop: '1.5rem' }}>
            {t('createAnother')}
          </GlassButton>
        </motion.div>
      </div>
    );
  }

  if (generatedCards.length > 0) {
    return (
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1rem', fontFamily: theme.font }}>
        <h2 style={{ color: theme.text, fontWeight: 900, marginBottom: '0.35rem' }}>{t('previewCards')}</h2>
        <p style={{ color: theme.textLight, marginBottom: '1.5rem' }}>{editingCards.length} {t('cardsGeneratedHint')}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', marginBottom: '2rem' }}>
          {editingCards.map((card, i) => (
            <motion.div key={card.id || i}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              style={{ background: theme.card, borderRadius: theme.borderRadius, padding: '1.25rem', boxShadow: theme.shadow, border: `1px solid ${theme.primary}22` }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: theme.textLight, fontWeight: 700, marginBottom: '0.4rem', letterSpacing: '0.06em' }}>{t('frontLabel')}</div>
                  <textarea value={card.front}
                    onChange={e => { const u = [...editingCards]; u[i] = { ...u[i], front: e.target.value }; setEditingCards(u); }}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: '70px' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: theme.textLight, fontWeight: 700, marginBottom: '0.4rem', letterSpacing: '0.06em' }}>{t('backLabel')}</div>
                  <textarea value={card.back}
                    onChange={e => { const u = [...editingCards]; u[i] = { ...u[i], back: e.target.value }; setEditingCards(u); }}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: '70px' }} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: theme.secondary, fontWeight: 700, marginBottom: '0.35rem', letterSpacing: '0.06em' }}>💡 {t('mnemonicLabel')}</div>
                <input value={card.hint || ''}
                  onChange={e => { const u = [...editingCards]; u[i] = { ...u[i], hint: e.target.value }; setEditingCards(u); }}
                  placeholder={t('mnemonicPlaceholder')}
                  style={{ ...inputStyle, fontSize: '0.88rem', padding: '0.55rem 0.9rem' }} />
              </div>
            </motion.div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <GlassButton variant="outline" onClick={() => setGeneratedCards([])} style={{ flex: 1 }}>{t('back')}</GlassButton>
          <GlassButton onClick={handleSave} loading={saving} style={{ flex: 2 }}>
            {saving ? t('loading') : `${t('saveCardsBtn')} ${editingCards.length} ✓`}
          </GlassButton>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem 1rem', fontFamily: theme.font }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: theme.text, marginBottom: '1.5rem' }}>{t('createFlashcards')}</h1>

      <div data-tour="create-title" style={{ marginBottom: '1.25rem' }}>
        <label style={{ fontWeight: 700, color: theme.text, display: 'block', marginBottom: '0.5rem' }}>{t('deckTitle')}</label>
        <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder={t('deckTitlePlaceholder')} />
      </div>

      <div data-tour="create-tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: `${theme.primary}11`, borderRadius: theme.borderRadius, padding: '0.35rem' }}>
        {([['text', 'Text', FileText], ['pdf', 'PDF', File], ['image', 'Image', Image]] as [Tab, string, any][]).map(([tabKey, label, Icon]) => (
          <GlassButton key={tabKey} onClick={() => setTab(tabKey)} variant={tab === tabKey ? 'primary' : 'outline'} size="sm" style={{ flex: 1 }}>
            <Icon size={15} /> {label}
          </GlassButton>
        ))}
      </div>

      {tab === 'text' && (
        <textarea data-tour="create-input"
          style={{ ...inputStyle, minHeight: '180px', resize: 'vertical', marginBottom: '1.25rem' }}
          value={text} onChange={e => setText(e.target.value)} placeholder={t('textPlaceholder')} />
      )}

      {(tab === 'pdf' || tab === 'image') && (
        <div onClick={() => fileRef.current?.click()} style={{
          border: `2px dashed ${theme.primary}55`, borderRadius: theme.borderRadius,
          padding: '3rem 1.5rem', textAlign: 'center', cursor: 'pointer', marginBottom: '1.25rem',
          background: file ? `${theme.accent}11` : 'transparent', transition: 'all 0.15s',
        }}>
          {file ? (
            <div>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{tab === 'pdf' ? '📄' : '🖼️'}</div>
              <div style={{ fontWeight: 700, color: theme.text }}>{file.name}</div>
              <div style={{ color: theme.textLight, fontSize: '0.85rem' }}>{(file.size / 1024).toFixed(1)} KB</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{tab === 'pdf' ? '📄' : '🖼️'}</div>
              <div style={{ fontWeight: 700, color: theme.text }}>{t('dropFileHere')}</div>
              <div style={{ color: theme.textLight, fontSize: '0.85rem', marginTop: '0.25rem' }}>{t('clickBrowse')}</div>
            </>
          )}
          <input ref={fileRef} type="file" accept={tab === 'pdf' ? '.pdf' : 'image/*'}
            style={{ display: 'none' }} onChange={e => setFile(e.target.files?.[0] || null)} />
        </div>
      )}

      <div data-tour="create-num-cards" style={{ marginBottom: '1.25rem' }}>
        <label style={{ fontWeight: 700, color: theme.text, display: 'block', marginBottom: '0.5rem' }}>
          {t('numCards')}: {numCards}
        </label>
        <input type="range" min={5} max={50} value={numCards} onChange={e => setNumCards(Number(e.target.value))}
          style={{ width: '100%', accentColor: theme.primary }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: theme.textLight }}>
          <span>5</span><span>50</span>
        </div>
      </div>

      {/* Visibility toggle */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: `${theme.primary}0d`, borderRadius: theme.borderRadius,
        padding: '0.85rem 1rem', marginBottom: '1.25rem', border: `1px solid ${theme.primary}22`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {isPublic ? <Globe size={18} style={{ color: theme.primary }} /> : <Lock size={18} style={{ color: theme.textLight }} />}
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: theme.text }}>
              {isPublic ? t('publicLabel') : t('privateLabel')}
            </div>
            <div style={{ fontSize: '0.75rem', color: theme.textLight }}>
              {isPublic ? t('publicDesc') : t('privateDesc')}
            </div>
          </div>
        </div>
        <button type="button" onClick={() => setIsPublic(v => !v)} style={{
          width: 44, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer',
          background: isPublic ? theme.primary : `${theme.primary}33`,
          position: 'relative', transition: 'background 0.25s', flexShrink: 0,
        }}>
          <span style={{
            position: 'absolute', top: 3, left: isPublic ? 23 : 3,
            width: 18, height: 18, borderRadius: '50%', background: '#fff',
            transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
          }} />
        </button>
      </div>

      {error && <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

      <div data-tour="create-generate-btn">
        <GlassButton onClick={handleGenerate} loading={loading} fullWidth size="lg">
          {loading ? (
            <>
              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }}>
                <Loader size={18} />
              </motion.span>
              {t('generating')}
            </>
          ) : t('generateBtn')}
        </GlassButton>
      </div>
    </div>
  );
};

export default Create;
