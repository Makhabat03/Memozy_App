import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import api from '../../lib/api';

export default function SocialScreen() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [feed, setFeed] = useState<any[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      const uid = data.user.id;
      setUserId(uid);
      Promise.all([
        api.get('/social/leaderboard', { params: { user_id: uid } }).then((r) => setLeaderboard(r.data.leaderboard || [])),
        api.get('/social/feed', { params: { user_id: uid } }).then((r) => setFeed(r.data.decks || [])),
      ]).finally(() => setLoading(false));
    });
  }, []);

  const handleSearch = async () => {
    if (!searchQ.trim()) return;
    const r = await api.get('/social/search', { params: { q: searchQ } });
    setSearchResults(r.data.users || []);
  };

  const handleFollow = async (targetId: string) => {
    await api.post(`/social/follow/${targetId}`, null, { params: { user_id: userId } });
    setSearchResults((p) => p.filter((u) => u.id !== targetId));
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6366f1" /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Social</Text>

      <Text style={styles.section}>🏆 Weekly Leaderboard</Text>
      {leaderboard.length === 0 ? (
        <Text style={styles.empty}>Follow people to see the leaderboard!</Text>
      ) : leaderboard.map((e, i) => (
        <View key={e.id} style={[styles.lbRow, i === 0 && styles.lbFirst]}>
          <Text style={styles.lbRank}>{['🥇','🥈','🥉'][i] || `${i+1}`}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.lbName}>{e.username}</Text>
            <Text style={styles.lbSub}>Level {e.level}</Text>
          </View>
          <Text style={styles.lbXP}>{e.weekly_xp} XP</Text>
        </View>
      ))}

      <Text style={[styles.section, { marginTop: 24 }]}>🔍 Find People</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search username..."
          value={searchQ}
          onChangeText={setSearchQ}
          placeholderTextColor="#9ca3af"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Go</Text>
        </TouchableOpacity>
      </View>
      {searchResults.map((u) => (
        <View key={u.id} style={styles.userRow}>
          <Text style={styles.userName}>{u.username}</Text>
          <TouchableOpacity style={styles.followBtn} onPress={() => handleFollow(u.id)}>
            <Text style={styles.followBtnText}>Follow</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={[styles.section, { marginTop: 24 }]}>📚 Friends' Decks</Text>
      {feed.length === 0 ? (
        <Text style={styles.empty}>Follow people to see their public decks.</Text>
      ) : feed.map((deck) => (
        <View key={deck.id} style={styles.deckRow}>
          <Text style={styles.deckTitle}>{deck.title}</Text>
          <Text style={styles.deckMeta}>by {deck.profiles?.username} · {deck.card_count} cards</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 16 },
  section: { fontSize: 15, fontWeight: '800', color: '#374151', marginBottom: 10 },
  empty: { color: '#9ca3af', fontSize: 14, marginBottom: 8 },
  lbRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, gap: 10 },
  lbFirst: { borderWidth: 1.5, borderColor: '#6366f1' },
  lbRank: { fontSize: 18 },
  lbName: { fontWeight: '700', color: '#111827' },
  lbSub: { fontSize: 12, color: '#9ca3af' },
  lbXP: { fontWeight: '800', color: '#6366f1' },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  searchInput: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e5e7eb', color: '#111827' },
  searchBtn: { backgroundColor: '#6366f1', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  userRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 6 },
  userName: { flex: 1, fontWeight: '700', color: '#111827' },
  followBtn: { backgroundColor: '#6366f1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  followBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  deckRow: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8 },
  deckTitle: { fontWeight: '700', color: '#111827' },
  deckMeta: { fontSize: 13, color: '#6b7280', marginTop: 3 },
});
