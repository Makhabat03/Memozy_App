import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { decksApi, gamifyApi } from '../../lib/api';

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [decks, setDecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      if (!u) { router.replace('/auth/login'); return; }
      setUser(u);
      Promise.all([
        gamifyApi.getProfile(u.id).then((r) => setProfile(r.data.profile)),
        decksApi.list(u.id).then((r) => setDecks(r.data.decks.slice(0, 6))),
      ]).finally(() => setLoading(false));
    });
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6366f1" /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.greeting}>Hey, {profile?.username || 'there'}! 👋</Text>
      <Text style={styles.sub}>Level {profile?.level} · {profile?.xp} XP</Text>

      {(profile?.streak_count || 0) > 0 && (
        <View style={styles.streak}>
          <Text style={styles.streakText}>🔥 {profile.streak_count} day streak!</Text>
        </View>
      )}

      <View style={styles.xpBar}>
        <View style={[styles.xpFill, { width: `${((profile?.xp || 0) % 500) / 5}%` }]} />
      </View>

      <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/create')}>
        <Text style={styles.createBtnText}>+ Create New Deck</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Recent Decks</Text>
      {decks.map((deck) => (
        <TouchableOpacity key={deck.id} style={styles.deckCard} onPress={() => router.push(`/study/${deck.id}`)}>
          <Text style={styles.deckTitle}>{deck.title}</Text>
          <Text style={styles.deckMeta}>{deck.card_count} cards · Study →</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  greeting: { fontSize: 24, fontWeight: '900', color: '#111827', marginBottom: 4 },
  sub: { fontSize: 14, color: '#6b7280', marginBottom: 12 },
  streak: { backgroundColor: '#fef3c7', borderRadius: 12, padding: 10, marginBottom: 12 },
  streakText: { fontWeight: '700', color: '#d97706' },
  xpBar: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 999, marginBottom: 20 },
  xpFill: { height: '100%', backgroundColor: '#6366f1', borderRadius: 999 },
  createBtn: { backgroundColor: '#6366f1', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 24 },
  createBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 12 },
  deckCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  deckTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 4 },
  deckMeta: { fontSize: 13, color: '#6b7280' },
});
