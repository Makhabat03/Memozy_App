import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { decksApi, cardsApi, Deck, Card } from '../hooks/useApi';
import { Link2, BookOpen, Trash2, Globe, Lock, Download, FolderPlus, Folder, FolderOpen, ChevronDown, ChevronRight, X, Pencil, MoreVertical, ChevronLeft, Check } from 'lucide-react';
import GlassButton from '../components/GlassButton';

interface FolderItem {
  id: string;
  name: string;
  deckIds: string[];
}

const loadFolders = (): FolderItem[] =>
  JSON.parse(localStorage.getItem('memozy_folders') || '[]');

const persistFolders = (folders: FolderItem[]) =>
  localStorage.setItem('memozy_folders', JSON.stringify(folders));

const Decks: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [folders, setFolders] = useState<FolderItem[]>(loadFolders);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [deckCards, setDeckCards] = useState<Record<string, Card[]>>({});
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [menuSubView, setMenuSubView] = useState<'main' | 'folder' | 'access'>('main');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    decksApi.list(user.id).then(r => { setDecks(r.data.decks); setLoading(false); });
  }, [user]);

  useEffect(() => {
    if (decks.length === 0) return;
    Promise.all(decks.map(d => cardsApi.getByDeck(d.id).then(r => ({ id: d.id, cards: r.data.cards }))))
      .then(results => {
        const map: Record<string, Card[]> = {};
        results.forEach(r => { map[r.id] = r.cards; });
        setDeckCards(map);
      });
  }, [decks]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const updateFolders = (updated: FolderItem[]) => { setFolders(updated); persistFolders(updated); };

  const handleCopyLink = (deck: Deck) => {
    navigator.clipboard.writeText(`${window.location.origin}/decks/public/${deck.id}`);
    setCopied(deck.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleToggleVisibility = async (deck: Deck) => {
    const newValue = !deck.is_public;
    await decksApi.setVisibility(deck.id, newValue);
    setDecks(prev => prev.map(d => d.id === deck.id ? { ...d, is_public: newValue } : d));
  };

  const handleDelete = async (deckId: string) => {
    if (!window.confirm(t('deleteConfirm'))) return;
    await decksApi.delete(deckId);
    setDecks(d => d.filter(deck => deck.id !== deckId));
    updateFolders(folders.map(f => ({ ...f, deckIds: f.deckIds.filter(id => id !== deckId) })));
  };

  const handleExportAnki = async (deck: Deck) => {
    const res = await cardsApi.getByDeck(deck.id);
    const lines = ['#separator:tab', '#html:false', ''];
    res.data.cards.forEach(c => {
      const front = c.front.replace(/\t/g, ' ');
      const back = [c.back, c.hint ? `💡 ${c.hint}` : ''].filter(Boolean).join('\n\n').replace(/\t/g, ' ');
      lines.push(`${front}\t${back}`);
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${deck.title}.txt`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const folder: FolderItem = { id: `f_${Date.now()}`, name: newFolderName.trim(), deckIds: [] };
    updateFolders([...folders, folder]);
    setExpandedFolders(prev => new Set(prev).add(folder.id));
    setNewFolderName('');
    setCreatingFolder(false);
  };

  const handleMoveToFolder = (deckId: string, folderId: string | null) => {
    updateFolders(folders.map(f => ({
      ...f,
      deckIds: f.id === folderId
        ? Array.from(new Set([...f.deckIds, deckId]))
        : f.deckIds.filter(id => id !== deckId),
    })));
    setMenuOpen(null);
  };

  const handleDeleteFolder = (folderId: string) =>
    updateFolders(folders.filter(f => f.id !== folderId));

  const toggleFolder = (folderId: string) =>
    setExpandedFolders(prev => {
      const next = new Set(prev);
      next.has(folderId) ? next.delete(folderId) : next.add(folderId);
      return next;
    });

  const deckMeta = useMemo(() => {
    const now = new Date();
    const result: Record<string, { tags: string[]; totalDue: number; tagDue: Record<string, number> }> = {};
    Object.keys(deckCards).forEach(deckId => {
      const cards = deckCards[deckId];
      const tags = Array.from(new Set(cards.flatMap(c => c.tags || [])));
      const due = cards.filter(c => !c.next_review || new Date(c.next_review) <= now);
      const tagDue: Record<string, number> = {};
      tags.forEach(tag => {
        tagDue[tag] = due.filter(c => (c.tags || []).includes(tag)).length;
      });
      result[deckId] = { tags, totalDue: due.length, tagDue };
    });
    return result;
  }, [deckCards]);

  const getDeckFolder = (deckId: string) => folders.find(f => f.deckIds.includes(deckId));
  const folderedIds = new Set(folders.flatMap(f => f.deckIds));
  const unfoldered = decks.filter(d => !folderedIds.has(d.id));

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', fontFamily: theme.font }}>{t('loading')}</div>;

  const renderDeckCard = (deck: Deck, i: number) => {
    const currentFolder = getDeckFolder(deck.id);
    const { tags: deckTags, totalDue, tagDue } = deckMeta[deck.id] || { tags: [], totalDue: 0, tagDue: {} };
    const tagDueCount = (tag: string) => tagDue[tag] || 0;

    return (
      <motion.div key={deck.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }} className="glass-card"
        style={{ background: theme.card, borderRadius: theme.borderRadius, padding: '1.5rem', boxShadow: theme.shadow, border: `1px solid ${totalDue > 0 ? '#f9731644' : theme.primary + '28'}`, position: 'relative' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: theme.text, flex: 1, paddingRight: '0.25rem' }}>{deck.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
            {totalDue > 0 && (
              <motion.span
                animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.8 }}
                style={{ background: '#f97316', color: '#fff', borderRadius: '999px', padding: '0.15rem 0.6rem', fontSize: '0.68rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                {totalDue} due
              </motion.span>
            )}
            {/* 3-dot menu */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => { setMenuOpen(menuOpen === deck.id ? null : deck.id); setMenuSubView('main'); }}
                style={{ background: 'none', border: `1px solid transparent`, borderRadius: '8px', cursor: 'pointer', color: theme.textLight, padding: '0.2rem 0.3rem', display: 'flex', alignItems: 'center', transition: 'background 0.15s, border-color 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${theme.primary}14`; (e.currentTarget as HTMLButtonElement).style.borderColor = `${theme.primary}33`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'; }}
              >
                <MoreVertical size={16} />
              </button>
              <AnimatePresence>
                {menuOpen === deck.id && (
                  <motion.div ref={menuRef}
                    initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.12 }}
                    style={{ position: 'absolute', top: '110%', right: 0, background: theme.card, border: `1px solid ${theme.primary}33`, borderRadius: theme.borderRadius, boxShadow: `0 8px 28px rgba(0,0,0,0.18)`, minWidth: '180px', zIndex: 300, overflow: 'hidden' }}>
                    {menuSubView === 'main' ? (
                      <>
                        <div style={{ padding: '0.55rem 1rem', borderBottom: `1px solid ${theme.primary}18`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.75rem', color: theme.textLight, fontWeight: 600 }}>{deck.card_count} {t('cards')}</span>
                          {totalDue > 0 && <span style={{ fontSize: '0.72rem', color: '#f97316', fontWeight: 700 }}>{totalDue} due</span>}
                        </div>
                        <button onClick={() => { handleCopyLink(deck); setMenuOpen(null); }}
                          style={{ width: '100%', textAlign: 'left', padding: '0.6rem 1rem', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.82rem', color: theme.text, fontFamily: theme.font, display: 'flex', alignItems: 'center', gap: '0.6rem' }}
                          onMouseEnter={e => (e.currentTarget.style.background = `${theme.primary}14`)}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <Link2 size={14} style={{ color: theme.primary }} /> {t('copyLink')}
                        </button>
                        <button onClick={() => setMenuSubView('access')}
                          style={{ width: '100%', textAlign: 'left', padding: '0.6rem 1rem', border: 'none', borderBottom: `1px solid ${theme.primary}18`, background: 'transparent', cursor: 'pointer', fontSize: '0.82rem', color: theme.text, fontFamily: theme.font, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                          onMouseEnter={e => (e.currentTarget.style.background = `${theme.primary}14`)}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            {deck.is_public ? <Globe size={14} style={{ color: theme.primary }} /> : <Lock size={14} style={{ color: theme.textLight }} />}
                            Access
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: theme.textLight }}>
                            {deck.is_public ? t('publicLabel') : t('privateLabel')}
                            <ChevronRight size={13} style={{ color: theme.textLight }} />
                          </span>
                        </button>
                        <button onClick={() => setMenuSubView('folder')}
                          style={{ width: '100%', textAlign: 'left', padding: '0.6rem 1rem', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.82rem', color: theme.text, fontFamily: theme.font, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                          onMouseEnter={e => (e.currentTarget.style.background = `${theme.primary}14`)}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <Folder size={14} style={{ color: theme.primary }} /> Move to Folder
                          </span>
                          <ChevronRight size={13} style={{ color: theme.textLight }} />
                        </button>
                        <button onClick={() => { setMenuOpen(null); navigate(`/edit/${deck.id}`); }}
                          style={{ width: '100%', textAlign: 'left', padding: '0.6rem 1rem', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.82rem', color: theme.text, fontFamily: theme.font, display: 'flex', alignItems: 'center', gap: '0.6rem' }}
                          onMouseEnter={e => (e.currentTarget.style.background = `${theme.primary}14`)}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <Pencil size={14} style={{ color: theme.primary }} /> Edit Cards
                        </button>
                        <button onClick={() => { handleExportAnki(deck); setMenuOpen(null); }}
                          style={{ width: '100%', textAlign: 'left', padding: '0.6rem 1rem', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.82rem', color: theme.text, fontFamily: theme.font, display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: `1px solid ${theme.primary}18` }}
                          onMouseEnter={e => (e.currentTarget.style.background = `${theme.primary}14`)}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <Download size={14} style={{ color: theme.primary }} /> {t('exportAnki')}
                        </button>
                        <button onClick={() => { setMenuOpen(null); handleDelete(deck.id); }}
                          style={{ width: '100%', textAlign: 'left', padding: '0.6rem 1rem', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.82rem', color: '#ef4444', fontFamily: theme.font, display: 'flex', alignItems: 'center', gap: '0.6rem' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#ef444414')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </>
                    ) : menuSubView === 'access' ? (
                      <>
                        <button onClick={() => setMenuSubView('main')}
                          style={{ width: '100%', textAlign: 'left', padding: '0.55rem 1rem', border: 'none', borderBottom: `1px solid ${theme.primary}18`, background: 'transparent', cursor: 'pointer', fontSize: '0.82rem', color: theme.text, fontFamily: theme.font, display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
                          onMouseEnter={e => (e.currentTarget.style.background = `${theme.primary}14`)}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <ChevronLeft size={13} /> Access
                        </button>
                        <button onClick={() => { if (!deck.is_public) handleToggleVisibility(deck); setMenuOpen(null); }}
                          style={{ width: '100%', textAlign: 'left', padding: '0.65rem 1rem', border: 'none', background: deck.is_public ? `${theme.primary}10` : 'transparent', cursor: deck.is_public ? 'default' : 'pointer', fontSize: '0.85rem', color: theme.text, fontFamily: theme.font, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}
                          onMouseEnter={e => !deck.is_public && (e.currentTarget.style.background = `${theme.primary}14`)}
                          onMouseLeave={e => (e.currentTarget.style.background = deck.is_public ? `${theme.primary}10` : 'transparent')}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <Globe size={15} style={{ color: theme.primary }} />
                            <span>
                              <div style={{ fontWeight: 700, color: theme.text }}>Public</div>
                              <div style={{ fontSize: '0.72rem', color: theme.textLight }}>Visible in social feed</div>
                            </span>
                          </span>
                          {deck.is_public && <Check size={15} style={{ color: theme.primary, flexShrink: 0 }} />}
                        </button>
                        <button onClick={() => { if (deck.is_public) handleToggleVisibility(deck); setMenuOpen(null); }}
                          style={{ width: '100%', textAlign: 'left', padding: '0.65rem 1rem', border: 'none', background: !deck.is_public ? `${theme.primary}10` : 'transparent', cursor: !deck.is_public ? 'default' : 'pointer', fontSize: '0.85rem', color: theme.text, fontFamily: theme.font, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}
                          onMouseEnter={e => deck.is_public && (e.currentTarget.style.background = `${theme.primary}14`)}
                          onMouseLeave={e => (e.currentTarget.style.background = !deck.is_public ? `${theme.primary}10` : 'transparent')}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <Lock size={15} style={{ color: theme.textLight }} />
                            <span>
                              <div style={{ fontWeight: 700, color: theme.text }}>Private</div>
                              <div style={{ fontSize: '0.72rem', color: theme.textLight }}>Share via link only</div>
                            </span>
                          </span>
                          {!deck.is_public && <Check size={15} style={{ color: theme.primary, flexShrink: 0 }} />}
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setMenuSubView('main')}
                          style={{ width: '100%', textAlign: 'left', padding: '0.55rem 1rem', border: 'none', borderBottom: `1px solid ${theme.primary}18`, background: 'transparent', cursor: 'pointer', fontSize: '0.82rem', color: theme.text, fontFamily: theme.font, display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
                          onMouseEnter={e => (e.currentTarget.style.background = `${theme.primary}14`)}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <ChevronLeft size={13} /> Folders
                        </button>
                        {currentFolder && (
                          <button onClick={() => handleMoveToFolder(deck.id, null)}
                            style={{ width: '100%', textAlign: 'left', padding: '0.55rem 1rem', border: 'none', borderBottom: `1px solid ${theme.primary}18`, background: 'transparent', cursor: 'pointer', fontSize: '0.82rem', color: '#ef4444', fontFamily: theme.font, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#ef444414')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                            <X size={13} /> Remove from "{currentFolder.name}"
                          </button>
                        )}
                        {folders.length === 0 && (
                          <div style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: theme.textLight }}>
                            No folders yet — create one first.
                          </div>
                        )}
                        {folders.map(f => (
                          <button key={f.id} onClick={() => handleMoveToFolder(deck.id, f.id)}
                            style={{ width: '100%', textAlign: 'left', padding: '0.55rem 1rem', border: 'none', background: currentFolder?.id === f.id ? `${theme.primary}14` : 'transparent', cursor: 'pointer', fontSize: '0.82rem', color: theme.text, fontFamily: theme.font, fontWeight: currentFolder?.id === f.id ? 700 : 400, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            onMouseEnter={e => (e.currentTarget.style.background = `${theme.primary}22`)}
                            onMouseLeave={e => (e.currentTarget.style.background = currentFolder?.id === f.id ? `${theme.primary}14` : 'transparent')}>
                            <Folder size={13} style={{ color: theme.primary, flexShrink: 0 }} />
                            {f.name}
                            {currentFolder?.id === f.id && <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: theme.primary }}>✓</span>}
                          </button>
                        ))}
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        {deck.description && <div style={{ fontSize: '0.85rem', color: theme.textLight, marginBottom: '0.75rem' }}>{deck.description}</div>}

        {/* Tag chips — color only, no counts */}
        {deckTags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.85rem' }}>
            {deckTags.map(tag => {
              const isDue = tagDueCount(tag) > 0;
              return (
                <motion.button key={tag}
                  onClick={() => navigate(`/study/${deck.id}?tag=${encodeURIComponent(tag)}`)}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                  title={isDue ? `${tagDueCount(tag)} ${t('dueLabel')}` : t('allCaughtUp')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                    background: isDue ? '#f9731618' : '#10b98118',
                    color: isDue ? '#f97316' : '#10b981',
                    border: `1px solid ${isDue ? '#f9731644' : '#10b98144'}`,
                    borderRadius: '999px', padding: '0.18rem 0.6rem',
                    fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: theme.font,
                  }}>
                  {isDue && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f97316', flexShrink: 0 }} />}
                  {tag}
                </motion.button>
              );
            })}
          </div>
        )}

        <div data-tour={i === 0 ? 'decks-actions' : undefined} style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to={`/study/${deck.id}`} style={{ flex: 1, textDecoration: 'none' }}>
              <GlassButton fullWidth size="sm" tintColor={totalDue > 0 ? '#f97316' : undefined} style={{ whiteSpace: 'nowrap' }}>
                {totalDue > 0 ? `⚡ Review ${totalDue}` : t('study')}
              </GlassButton>
            </Link>
            <Link to={`/study/${deck.id}?mode=practice`} style={{ flex: 1, textDecoration: 'none' }}>
              <GlassButton fullWidth size="sm" variant="outline" style={{ whiteSpace: 'nowrap' }}>🏷️ Select &amp; Study</GlassButton>
            </Link>
          </div>
        </div>

        {copied === deck.id && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            style={{ fontSize: '0.78rem', color: theme.accent, marginTop: '0.5rem', textAlign: 'center', fontWeight: 700 }}>
            {t('linkCopied')}
          </motion.div>
        )}
      </motion.div>
    );
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem', fontFamily: theme.font }}>
      {/* Header */}
      <div data-tour="decks-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: theme.text, margin: 0 }}>{t('myDecks')}</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <GlassButton size="sm" variant="outline" onClick={() => { setCreatingFolder(true); setNewFolderName(''); }}>
            <FolderPlus size={15} /> New Folder
          </GlassButton>
          <Link to="/create">
            <GlassButton size="sm">+ {t('newDeck')}</GlassButton>
          </Link>
        </div>
      </div>

      {/* Create folder input */}
      <AnimatePresence>
        {creatingFolder && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            style={{ background: theme.card, borderRadius: theme.borderRadius, padding: '0.9rem 1.1rem', marginBottom: '1.25rem', border: `1px solid ${theme.primary}33`, display: 'flex', gap: '0.6rem', alignItems: 'center', boxShadow: theme.shadow }}>
            <span style={{ fontSize: '1.1rem' }}>📁</span>
            <input autoFocus value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') setCreatingFolder(false); }}
              placeholder="Folder name..."
              style={{ flex: 1, border: `1px solid ${theme.primary}44`, borderRadius: '8px', padding: '0.45rem 0.75rem', background: theme.background, color: theme.text, fontFamily: theme.font, fontSize: '0.9rem', outline: 'none' }}
            />
            <GlassButton size="sm" onClick={handleCreateFolder}>{t('save')}</GlassButton>
            <GlassButton size="sm" variant="outline" onClick={() => setCreatingFolder(false)}><X size={14} /></GlassButton>
          </motion.div>
        )}
      </AnimatePresence>

      {decks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: theme.textLight }}>
          <BookOpen size={48} style={{ marginBottom: '1rem', opacity: 0.4 }} />
          <p>No decks yet. Create your first one!</p>
        </div>
      ) : (
        <>
          {/* Folders */}
          {folders.map(folder => {
            const folderDecks = folder.deckIds.map(id => decks.find(d => d.id === id)).filter(Boolean) as Deck[];
            const isExpanded = expandedFolders.has(folder.id);
            return (
              <div key={folder.id} style={{ marginBottom: '1.25rem' }}>
                <div onClick={() => toggleFolder(folder.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', padding: '0.65rem 0.9rem', background: `${theme.primary}0e`, borderRadius: isExpanded ? `${theme.borderRadius} ${theme.borderRadius} 0 0` : theme.borderRadius, border: `1px solid ${theme.primary}22`, borderBottom: isExpanded ? 'none' : `1px solid ${theme.primary}22`, userSelect: 'none' }}>
                  {isExpanded
                    ? <ChevronDown size={15} style={{ color: theme.primary, flexShrink: 0 }} />
                    : <ChevronRight size={15} style={{ color: theme.primary, flexShrink: 0 }} />}
                  {isExpanded
                    ? <FolderOpen size={17} style={{ color: theme.primary, flexShrink: 0 }} />
                    : <Folder size={17} style={{ color: theme.primary, flexShrink: 0 }} />}
                  <span style={{ fontWeight: 800, color: theme.text, flex: 1, fontSize: '0.95rem' }}>{folder.name}</span>
                  <span style={{ fontSize: '0.75rem', color: theme.textLight, background: `${theme.primary}18`, borderRadius: '999px', padding: '0.1rem 0.6rem', marginRight: '0.25rem' }}>
                    {folderDecks.length} {folderDecks.length === 1 ? 'deck' : 'decks'}
                  </span>
                  <button onClick={e => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textLight, padding: '0.15rem', display: 'flex', borderRadius: '4px', opacity: 0.5 }}>
                    <X size={13} />
                  </button>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ padding: '1rem', background: `${theme.primary}05`, border: `1px solid ${theme.primary}22`, borderTop: 'none', borderRadius: `0 0 ${theme.borderRadius} ${theme.borderRadius}` }}>
                      {folderDecks.length === 0 ? (
                        <div style={{ padding: '1.5rem', textAlign: 'center', color: theme.textLight, fontSize: '0.85rem' }}>
                          Empty folder — use the 📁 button on a deck to move it here.
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 320px))', justifyContent: 'center', gap: '1rem' }}>
                          {folderDecks.map((deck, i) => renderDeckCard(deck, i))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* Uncategorized */}
          {unfoldered.length > 0 && (
            <div>
              {folders.length > 0 && (
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: theme.textLight, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Uncategorized
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 320px))', justifyContent: 'center', gap: '1.25rem' }}>
                {unfoldered.map((deck, i) => renderDeckCard(deck, i))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Decks;
