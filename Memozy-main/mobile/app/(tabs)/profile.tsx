import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import { gamifyApi } from '../../lib/api';
import { useRouter } from 'expo-router';

const ALL_BADGES = [
  { type: 'first_deck', icon: '📚', label: 'First Deck' },
  { type: 'streak_7', icon: '🔥', label: '7-Day Streak' },
  { type: 'streak_30', icon: '⚡', label: '30-Day Streak' },
  { type: 'level_5', icon: '⭐', label: 'Level 5' },
  { type: 'cards_100', icon: '💯', label: '100 Cards' },
  { type: 'cards_500', icon: '🏆', label: '500 Cards' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/auth/login'); return; }
      gamifyApi.getProfile(data.user.id).then((r) => {
        setProfile(r.data.profile);
        setBadges(r.data.badges);
        setLoading(false);
      });
    });
  }, []);

  const earnedTypes = new Set(badges.map((b: any) => b.badge_type));

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6366f1" /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile?.username?.[0]?.toUpperCase()}</Text>
        </View>
        <Text style={styles.username}>{profile?.username}</Text>
        <Text style={styles.sub}>Level {profile?.level} · {profile?.xp} XP</Text>
      </View>

      <Text style={styles.sectionTitle}>Badges</Text>
      <View style={styles.badges}>
        {ALL_BADGES.map(({ type, icon, label }) => {
          const earned = earnedTypes.has(type);
          return (
            <View key={type} style={[styles.badge, earned && styles.badgeEarned]}>
              <Text style={[styles.badgeIcon, !earned && { opacity: 0.3 }]}>{icon}</Text>
              <Text style={[styles.badgeLabel, !earned && { opacity: 0.4 }]}>{label}</Text>
              {earned && <Text style={styles.badgeTick}>✓</Text>}
            </View>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.signOut}
        onPress={async () => { await supabase.auth.signOut(); router.replace('/auth/login'); }}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 28 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '900' },
  username: { fontSize: 20, fontWeight: '900', color: '#111827' },
  sub: { fontSize: 14, color: '#6b7280', marginTop: 3 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#374151', marginBottom: 12 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  badge: { width: '30%', backgroundColor: '#f3f4f6', borderRadius: 12, padding: 12, alignItems: 'center' },
  badgeEarned: { backgroundColor: '#ede9fe', borderWidth: 1, borderColor: '#a78bfa' },
  badgeIcon: { fontSize: 26, marginBottom: 4 },
  badgeLabel: { fontSize: 11, fontWeight: '700', color: '#374151', textAlign: 'center' },
  badgeTick: { fontSize: 10, color: '#6366f1', marginTop: 2 },
  signOut: { backgroundColor: '#fee2e2', borderRadius: 12, padding: 14, alignItems: 'center' },
  signOutText: { color: '#dc2626', fontWeight: '800', fontSize: 15 },
});
