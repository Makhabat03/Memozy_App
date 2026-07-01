import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { cardsApi, decksApi, Card, Deck } from '../hooks/useApi';
import { Trash2, Plus, ArrowLeft, Check, X, ChevronDown, Sparkles, PenLine, AlignLeft, FileText, ImageIcon, Upload } from 'lucide-react';
import GlassButton from '../components/GlassButton';

interface EditableCard {
  id: string;
  front: string;
  back: string;
  hint: string;
  tags: string[];
  isNew: boolean;
}

const EditDeck: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { t } = useLanguage();

  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<EditableCard[]>([]);
  const [originalCards, setOriginalCards] = useState<EditableCard[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});
  const [openTagDropdown, setOpenTagDropdown] = useState<string | null>(null);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const [addMenuOpen, setAddMenuOpen] = useState<'header' | 'footer' | null>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiMode, setAiMode] = useState<'text' | 'pdf' | 'image'>('text');
  const [aiText, setAiText] = useState('');
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [aiCount, setAiCount] = useState(5);
  const [aiGenerating, setAiGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!openTagDropdown) return;
    const handler = (e: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node))
        setOpenTagDropdown(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openTagDropdown]);

  useEffect(() => {
    if (!addMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node))
        setAddMenuOpen(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [addMenuOpen]);

  useEffect(() => {
    if (!deckId) return;
    Promise.all([
      decksApi.get(deckId),
      cardsApi.getByDeck(deckId),
    ]).then(([deckRes, cardsRes]) => {
      setDeck(deckRes.data.deck);
      const editable = cardsRes.data.cards.map((c: Card) => ({
        id: c.id, front: c.front, back: c.back, hint: c.hint || '',
        tags: c.tags || [], isNew: false,
      }));
      setCards(editable);
      setOriginalCards(editable);
      setLoading(false);
    });
  }, [deckId]);

  const addCard = () => {
    setCards(prev => [...prev, { id: `new_${Date.now()}`, front: '', back: '', hint: '', tags: [], isNew: true }]);
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
  };

  const handleGenerateAI = async () => {
    if (!deckId) return;
    if (aiMode === 'text' && !aiText.trim()) return;
    if ((aiMode === 'pdf' || aiMode === 'image') && !aiFile) return;
    setAiGenerating(true);
    try {
      let cards: Card[];
      if (aiMode === 'text') {
        const res = await cardsApi.generateFromText({ text: aiText, deck_id: deckId, num_cards: aiCount });
        cards = res.data.cards;
      } else {
        const fd = new FormData();
        fd.append('file', aiFile!);
        fd.append('deck_id', deckId);
        fd.append('num_cards', String(aiCount));
        const res = aiMode === 'pdf'
          ? await cardsApi.generateFromPdf(fd)
          : await cardsApi.generateFromImage(fd);
        cards = res.data.cards;
      }
      const generated: EditableCard[] = cards.map(c => ({
        id: c.id, front: c.front, back: c.back, hint: c.hint || '', tags: c.tags || [], isNew: false,
      }));
      setCards(prev => [...prev, ...generated]);
      setOriginalCards(prev => [...prev, ...generated]);
      setShowAiPanel(false);
      setAiText('');
      setAiFile(null);
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
    } catch (e) {
      console.error(e);
    } finally {
      setAiGenerating(false);
    }
  };

  const removeCard = (idx: number) => {
    const card = cards[idx];
    if (!card.isNew) setDeletedIds(prev => [...prev, card.id]);
    setCards(prev => prev.filter((_, i) => i !== idx));
  };

  const updateCard = (idx: number, field: keyof EditableCard, value: string) => {
    setCards(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  const addTag = (idx: number, direct?: string) => {
    const card = cards[idx];
    const raw = (direct ?? tagInputs[card.id] ?? '').trim().toLowerCase();
    if (!raw || card.tags.includes(raw)) return;
    setCards(prev => prev.map((c, i) => i === idx ? { ...c, tags: [...c.tags, raw] } : c));
    setTagInputs(prev => ({ ...prev, [card.id]: '' }));
  };

  const removeTag = (idx: number, tag: string) => {
    setCards(prev => prev.map((c, i) => i === idx ? { ...c, tags: c.tags.filter(t => t !== tag) } : c));
  };

  const hasChanged = (card: EditableCard): boolean => {
    const orig = originalCards.find(c => c.id === card.id);
    if (!orig) return true;
    const tagsChanged = JSON.stringify([...card.tags].sort()) !== JSON.stringify([...(orig.tags || [])].sort());
    return card.front !== orig.front || card.back !== orig.back || card.hint !== orig.hint || tagsChanged;
  };

  const handleSave = async () => {
    if (!deckId) return;
    setSaving(true);
    setSaveError(null);
    try {
      const toDelete = deletedIds.map(id => cardsApi.deleteCard(id));
      const toUpdate = cards
        .filter(c => !c.isNew && hasChanged(c))
        .map(c => cardsApi.update(c.id, { front: c.front, back: c.back, hint: c.hint, tags: c.tags }));
      const toCreate = cards
        .filter(c => c.isNew && c.front.trim())
        .map(c => cardsApi.createCard({ deck_id: deckId, front: c.front, back: c.back, hint: c.hint, tags: c.tags }));

      await Promise.all([...toDelete, ...toUpdate, ...toCreate]);

      const [deckRes, cardsRes] = await Promise.all([
        decksApi.get(deckId),
        cardsApi.getByDeck(deckId),
      ]);
      setDeck(deckRes.data.deck);
      const fresh = cardsRes.data.cards.map((c: Card) => ({
        id: c.id, front: c.front, back: c.back, hint: c.hint || '',
        tags: c.tags || [], isNew: false,
      }));
      setCards(fresh);
      setOriginalCards(fresh);
      setDeletedIds([]);
      setSavedBanner(true);
      setTimeout(() => navigate('/decks'), 800);
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || 'Save failed. Please try again.';
      setSaveError(msg);
      console.error('Save error:', e);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.65rem 0.85rem',
    border: `1px solid ${theme.primary}33`, borderRadius: '8px',
    fontFamily: theme.font, fontSize: '0.9rem', color: theme.text,
    background: theme.background, outline: 'none', boxSizing: 'border-box',
    resize: 'vertical' as const,
  };

  if (loading) return (
    <div style={{ padding: '4rem', textAlign: 'center', fontFamily: theme.font }}>{t('loading')}</div>
  );

  const visibleCount = cards.filter(c => !deletedIds.includes(c.id)).length;
  const hasUnsaved = deletedIds.length > 0 || cards.some(c => c.isNew || hasChanged(c));

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1rem', fontFamily: theme.font }}>

      {/* Saved banner */}
      <AnimatePresence>
        {savedBanner && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            style={{ position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', background: theme.primary, color: '#fff', borderRadius: '999px', padding: '0.6rem 1.5rem', fontWeight: 700, fontSize: '0.9rem', zIndex: 999, boxShadow: `0 4px 16px ${theme.primary}55`, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Check size={16} /> Saved!
          </motion.div>
        )}
        {saveError && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            style={{ position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', background: '#ef4444', color: '#fff', borderRadius: '12px', padding: '0.7rem 1.5rem', fontWeight: 700, fontSize: '0.85rem', zIndex: 999, boxShadow: '0 4px 16px rgba(239,68,68,0.4)', display: 'flex', alignItems: 'center', gap: '0.75rem', maxWidth: '420px' }}>
            <span>⚠️ {saveError}</span>
            <button onClick={() => setSaveError(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, display: 'flex', opacity: 0.8 }}>
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => navigate('/decks')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.primary, display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: theme.font, fontWeight: 700, fontSize: '0.9rem', padding: 0 }}>
            <ArrowLeft size={16} /> {t('myDecks')}
          </button>
          <span style={{ color: theme.textLight }}>›</span>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: theme.text }}>{deck?.title}</h1>
            <div style={{ fontSize: '0.8rem', color: theme.textLight, marginTop: '2px' }}>
              {visibleCount} {t('cards')}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <div ref={addMenuOpen === 'header' ? addMenuRef : undefined} style={{ position: 'relative' }}>
            <GlassButton onClick={() => setAddMenuOpen(addMenuOpen === 'header' ? null : 'header')} size="sm" variant="outline">
              <Plus size={15} /> Add Card <ChevronDown size={12} style={{ transform: addMenuOpen === 'header' ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </GlassButton>
            <AnimatePresence>
              {addMenuOpen === 'header' && (
                <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.12 }}
                  style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: theme.card, border: `1px solid ${theme.primary}33`, borderRadius: '12px', boxShadow: `0 8px 24px rgba(0,0,0,0.14)`, zIndex: 300, minWidth: '190px', overflow: 'hidden' }}>
                  <button onClick={() => { addCard(); setAddMenuOpen(null); }}
                    style={{ width: '100%', textAlign: 'left', padding: '0.65rem 1rem', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.85rem', color: theme.text, fontFamily: theme.font, display: 'flex', alignItems: 'center', gap: '0.6rem' }}
                    onMouseEnter={e => (e.currentTarget.style.background = `${theme.primary}10`)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <PenLine size={15} style={{ color: theme.primary }} /> Add Manually
                  </button>
                  <button onClick={() => { setShowAiPanel(true); setAddMenuOpen(null); }}
                    style={{ width: '100%', textAlign: 'left', padding: '0.65rem 1rem', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.85rem', color: theme.text, fontFamily: theme.font, display: 'flex', alignItems: 'center', gap: '0.6rem' }}
                    onMouseEnter={e => (e.currentTarget.style.background = `${theme.primary}10`)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <Sparkles size={15} style={{ color: theme.secondary }} /> Generate with AI
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <GlassButton onClick={handleSave} loading={saving} size="sm"
            style={{ opacity: hasUnsaved ? 1 : 0.55 }}>
            <Check size={15} /> {saving ? t('loading') : t('save')}
          </GlassButton>
        </div>
      </div>

      {/* Card list */}
      {cards.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: theme.textLight }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
          <p>No cards yet. Click "Add Card" to create the first one.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {cards.map((card, i) => (
            <motion.div key={card.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              style={{ background: theme.card, borderRadius: theme.borderRadius, padding: '1.25rem', boxShadow: theme.shadow, border: `1px solid ${card.isNew ? theme.primary + '55' : theme.primary + '22'}` }}
            >
              {/* Card number + delete */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: theme.textLight, background: `${theme.primary}15`, borderRadius: '999px', padding: '0.15rem 0.65rem' }}>
                  {card.isNew ? '✨ New' : `#${i + 1}`}
                </span>
                <button onClick={() => removeCard(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', opacity: 0.6, display: 'flex', padding: '0.25rem', borderRadius: '6px' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}>
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Front / Back */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: theme.textLight, marginBottom: '0.35rem', letterSpacing: '0.06em' }}>{t('frontLabel')}</div>
                  <textarea value={card.front} rows={3}
                    onChange={e => updateCard(i, 'front', e.target.value)}
                    style={inputStyle} />
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: theme.textLight, marginBottom: '0.35rem', letterSpacing: '0.06em' }}>{t('backLabel')}</div>
                  <textarea value={card.back} rows={3}
                    onChange={e => updateCard(i, 'back', e.target.value)}
                    style={inputStyle} />
                </div>
              </div>

              {/* Mnemonic */}
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: theme.secondary, marginBottom: '0.35rem', letterSpacing: '0.06em' }}>💡 {t('mnemonicLabel')}</div>
                <input value={card.hint}
                  onChange={e => updateCard(i, 'hint', e.target.value)}
                  placeholder={t('mnemonicPlaceholder')}
                  style={{ ...inputStyle, resize: undefined, padding: '0.5rem 0.85rem', fontSize: '0.85rem' }} />
              </div>

              {/* Tags */}
              {(() => {
                const allDeckTags = Array.from(new Set(cards.flatMap(c => c.tags)));
                const inputVal = tagInputs[card.id] || '';
                const isOpen = openTagDropdown === card.id;
                const filtered = allDeckTags.filter(tag =>
                  !inputVal.trim() || tag.includes(inputVal.toLowerCase().trim())
                );
                const canCreateNew = inputVal.trim() && !allDeckTags.includes(inputVal.trim().toLowerCase());
                return (
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: theme.primary, marginBottom: '0.35rem', letterSpacing: '0.06em' }}>🏷️ {t('tagsLabel')}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                      {/* Applied tag chips */}
                      {card.tags.map(tag => (
                        <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: `${theme.primary}20`, color: theme.primary, borderRadius: '999px', padding: '0.18rem 0.55rem', fontSize: '0.78rem', fontWeight: 700 }}>
                          {tag}
                          <button onClick={() => removeTag(i, tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: theme.primary, display: 'flex', opacity: 0.7 }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                            onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}>
                            <X size={11} />
                          </button>
                        </span>
                      ))}

                      {/* Dropdown trigger */}
                      <div ref={isOpen ? tagDropdownRef : undefined} style={{ position: 'relative' }}>
                        <button
                          onClick={() => setOpenTagDropdown(isOpen ? null : card.id)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                            border: `1px dashed ${theme.primary}55`, borderRadius: '999px',
                            padding: '0.18rem 0.65rem', fontSize: '0.78rem', fontWeight: 700,
                            background: isOpen ? `${theme.primary}12` : 'transparent',
                            color: theme.primary, cursor: 'pointer', fontFamily: theme.font,
                          }}>
                          <Plus size={11} /> {t('addTagPlaceholder').replace('...', '')}
                          <ChevronDown size={11} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                        </button>

                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -6, scale: 0.97 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -6, scale: 0.97 }}
                              transition={{ duration: 0.12 }}
                              style={{
                                position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                                background: theme.card, border: `1px solid ${theme.primary}33`,
                                borderRadius: '12px', boxShadow: `0 8px 24px rgba(0,0,0,0.14)`,
                                zIndex: 200, minWidth: '190px', overflow: 'hidden',
                              }}>
                              {/* Search / new tag input */}
                              <div style={{ padding: '0.5rem 0.6rem', borderBottom: `1px solid ${theme.primary}18` }}>
                                <input
                                  autoFocus
                                  value={inputVal}
                                  onChange={e => setTagInputs(prev => ({ ...prev, [card.id]: e.target.value }))}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') { e.preventDefault(); addTag(i); setOpenTagDropdown(null); }
                                    if (e.key === 'Escape') setOpenTagDropdown(null);
                                  }}
                                  placeholder="Search or create tag..."
                                  style={{
                                    width: '100%', boxSizing: 'border-box',
                                    border: `1px solid ${theme.primary}33`, borderRadius: '6px',
                                    padding: '0.35rem 0.6rem', fontSize: '0.8rem',
                                    background: theme.background, color: theme.text,
                                    outline: 'none', fontFamily: theme.font,
                                  }}
                                />
                              </div>

                              {/* Existing tags */}
                              <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                                {filtered.length === 0 && !canCreateNew && (
                                  <div style={{ padding: '0.65rem 1rem', fontSize: '0.78rem', color: theme.textLight }}>
                                    No tags yet in this deck.
                                  </div>
                                )}
                                {filtered.map(tag => {
                                  const applied = card.tags.includes(tag);
                                  return (
                                    <button key={tag}
                                      onClick={() => { applied ? removeTag(i, tag) : addTag(i, tag); }}
                                      style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        width: '100%', padding: '0.5rem 0.9rem', border: 'none',
                                        background: applied ? `${theme.primary}12` : 'transparent',
                                        cursor: 'pointer', fontSize: '0.82rem', color: theme.text,
                                        fontFamily: theme.font, fontWeight: applied ? 700 : 500,
                                        gap: '0.5rem',
                                      }}
                                      onMouseEnter={e => !applied && (e.currentTarget.style.background = `${theme.primary}08`)}
                                      onMouseLeave={e => !applied && (e.currentTarget.style.background = 'transparent')}
                                    >
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        🏷️ {tag}
                                      </span>
                                      {applied && <Check size={13} style={{ color: theme.primary, flexShrink: 0 }} />}
                                    </button>
                                  );
                                })}
                                {/* Create new tag option */}
                                {canCreateNew && (
                                  <button
                                    onClick={() => { addTag(i); setOpenTagDropdown(null); }}
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                                      width: '100%', padding: '0.5rem 0.9rem', border: 'none',
                                      borderTop: filtered.length > 0 ? `1px solid ${theme.primary}18` : 'none',
                                      background: 'transparent', cursor: 'pointer',
                                      fontSize: '0.82rem', color: theme.secondary,
                                      fontFamily: theme.font, fontWeight: 700,
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = `${theme.secondary}10`)}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                  >
                                    <Plus size={13} /> Create "{inputVal.trim()}"
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          ))}
        </div>
      )}

      {/* Bottom action bar */}
      {cards.length > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem', justifyContent: 'flex-end', alignItems: 'center' }}>
          <div ref={addMenuOpen === 'footer' ? addMenuRef : undefined} style={{ position: 'relative' }}>
            <GlassButton onClick={() => setAddMenuOpen(addMenuOpen === 'footer' ? null : 'footer')} variant="outline">
              <Plus size={15} /> Add Card <ChevronDown size={12} style={{ transform: addMenuOpen === 'footer' ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </GlassButton>
            <AnimatePresence>
              {addMenuOpen === 'footer' && (
                <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.97 }} transition={{ duration: 0.12 }}
                  style={{ position: 'absolute', bottom: 'calc(100% + 6px)', right: 0, background: theme.card, border: `1px solid ${theme.primary}33`, borderRadius: '12px', boxShadow: `0 8px 24px rgba(0,0,0,0.14)`, zIndex: 300, minWidth: '190px', overflow: 'hidden' }}>
                  <button onClick={() => { addCard(); setAddMenuOpen(null); }}
                    style={{ width: '100%', textAlign: 'left', padding: '0.65rem 1rem', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.85rem', color: theme.text, fontFamily: theme.font, display: 'flex', alignItems: 'center', gap: '0.6rem' }}
                    onMouseEnter={e => (e.currentTarget.style.background = `${theme.primary}10`)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <PenLine size={15} style={{ color: theme.primary }} /> Add Manually
                  </button>
                  <button onClick={() => { setShowAiPanel(true); setAddMenuOpen(null); }}
                    style={{ width: '100%', textAlign: 'left', padding: '0.65rem 1rem', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.85rem', color: theme.text, fontFamily: theme.font, display: 'flex', alignItems: 'center', gap: '0.6rem' }}
                    onMouseEnter={e => (e.currentTarget.style.background = `${theme.primary}10`)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <Sparkles size={15} style={{ color: theme.secondary }} /> Generate with AI
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <GlassButton onClick={handleSave} loading={saving} style={{ minWidth: '120px' }}>
            <Check size={15} /> {saving ? t('loading') : t('save')}
          </GlassButton>
        </div>
      )}

      {/* AI generation modal */}
      <AnimatePresence>
        {showAiPanel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={e => { if (e.target === e.currentTarget) { setShowAiPanel(false); setAiFile(null); } }}>
            <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.97 }} transition={{ duration: 0.18 }}
              style={{ background: theme.card, borderRadius: theme.borderRadius, padding: '2rem', width: '100%', maxWidth: '540px', boxShadow: `0 24px 64px rgba(0,0,0,0.25)`, border: `1px solid ${theme.primary}33` }}>

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={18} style={{ color: theme.secondary }} />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: theme.text }}>Generate Cards with AI</h3>
                </div>
                <button onClick={() => { setShowAiPanel(false); setAiFile(null); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textLight, display: 'flex', padding: '0.2rem', borderRadius: '6px' }}>
                  <X size={18} />
                </button>
              </div>

              {/* Mode tabs */}
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', background: `${theme.primary}0c`, borderRadius: '10px', padding: '0.3rem' }}>
                {([
                  { key: 'text', label: 'Text', icon: <AlignLeft size={14} /> },
                  { key: 'pdf',  label: 'PDF',  icon: <FileText size={14} /> },
                  { key: 'image', label: 'Image', icon: <ImageIcon size={14} /> },
                ] as const).map(tab => (
                  <button key={tab.key} onClick={() => { setAiMode(tab.key); setAiFile(null); }}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                      padding: '0.5rem', border: 'none', borderRadius: '8px', cursor: 'pointer',
                      fontFamily: theme.font, fontSize: '0.85rem', fontWeight: 700, transition: 'all 0.15s',
                      background: aiMode === tab.key ? theme.card : 'transparent',
                      color: aiMode === tab.key ? theme.primary : theme.textLight,
                      boxShadow: aiMode === tab.key ? `0 2px 8px rgba(0,0,0,0.1)` : 'none',
                    }}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* Input area */}
              <AnimatePresence mode="wait">
                {aiMode === 'text' && (
                  <motion.div key="text" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.12 }}>
                    <textarea autoFocus value={aiText} onChange={e => setAiText(e.target.value)}
                      placeholder="Paste your notes, a paragraph, or any topic text..."
                      rows={7}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', border: `1px solid ${theme.primary}33`, borderRadius: '10px', fontFamily: theme.font, fontSize: '0.88rem', color: theme.text, background: theme.background, outline: 'none', resize: 'vertical', marginBottom: '1rem' }}
                    />
                  </motion.div>
                )}
                {(aiMode === 'pdf' || aiMode === 'image') && (
                  <motion.div key={aiMode} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.12 }} style={{ marginBottom: '1rem' }}>
                    <input ref={fileInputRef} type="file"
                      accept={aiMode === 'pdf' ? '.pdf' : 'image/*'}
                      style={{ display: 'none' }}
                      onChange={e => setAiFile(e.target.files?.[0] ?? null)}
                    />
                    <div onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: `2px dashed ${aiFile ? theme.primary : theme.primary + '44'}`,
                        borderRadius: '12px', padding: '2.5rem 1rem', textAlign: 'center', cursor: 'pointer',
                        background: aiFile ? `${theme.primary}08` : 'transparent', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = `${theme.primary}10`)}
                      onMouseLeave={e => (e.currentTarget.style.background = aiFile ? `${theme.primary}08` : 'transparent')}>
                      {aiFile ? (
                        <>
                          <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>{aiMode === 'pdf' ? '📄' : '🖼️'}</div>
                          <div style={{ fontWeight: 700, color: theme.primary, fontSize: '0.9rem' }}>{aiFile.name}</div>
                          <div style={{ fontSize: '0.75rem', color: theme.textLight, marginTop: '0.25rem' }}>
                            {(aiFile.size / 1024).toFixed(0)} KB — click to change
                          </div>
                        </>
                      ) : (
                        <>
                          <Upload size={28} style={{ color: theme.primary, opacity: 0.5, marginBottom: '0.6rem' }} />
                          <div style={{ fontWeight: 700, color: theme.text, fontSize: '0.9rem' }}>
                            Click to upload {aiMode === 'pdf' ? 'a PDF' : 'an image'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: theme.textLight, marginTop: '0.25rem' }}>
                            {aiMode === 'pdf' ? 'PDF files up to 10 MB' : 'PNG, JPG, WEBP'}
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Card count + actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: theme.text, whiteSpace: 'nowrap' }}>Number of cards:</label>
                <input type="number" min={1} max={20} value={aiCount}
                  onChange={e => setAiCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                  style={{ width: '70px', padding: '0.4rem 0.6rem', border: `1px solid ${theme.primary}33`, borderRadius: '8px', fontFamily: theme.font, fontSize: '0.9rem', color: theme.text, background: theme.background, outline: 'none', textAlign: 'center' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <GlassButton variant="outline" onClick={() => { setShowAiPanel(false); setAiFile(null); }}>Cancel</GlassButton>
                <GlassButton onClick={handleGenerateAI} loading={aiGenerating} tintColor={theme.secondary}
                  style={{ opacity: (aiMode === 'text' ? aiText.trim() : aiFile) ? 1 : 0.55 }}>
                  <Sparkles size={15} /> {aiGenerating ? 'Generating…' : `Generate ${aiCount} cards`}
                </GlassButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EditDeck;
