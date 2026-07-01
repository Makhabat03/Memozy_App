import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { decksApi } from '../../lib/api';
import api from '../../lib/api';

export default function DecksScreen() {
  const router = useRouter();
  const [decks, setDecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      decksApi.list(data.user.id).then((r) => {
        setDecks(r.data.decks);
        setLoading(false);
      });
    });
  }, []);

  const handleShare = async (deck: any) => {
    await api.post(`/decks/${deck.id}/share`);
    Share.share({ message: `Check out my FlashAI deck: "${deck.title}"` });
  };

  const handleDelete = async (deckId: string) => {
    Alert.alert('Delete Deck', 'This will delete all cards too.', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await api.delete(`/decks/${deckId}`);
        setDecks((d) => d.filter((dk) => dk.id !== deckId));
      }},
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6366f1" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Decks</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => router.push('/create')}>
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={decks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardMeta}>{item.card_count} cards</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.studyBtn} onPress={() => router.push(`/study/${item.id}`)}>
                <Text style={styles.studyBtnText}>Study</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => handleShare(item)}>
                <Text>🔗</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item.id)}>
                <Text>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 0 },
  title: { fontSize: 22, fontWeight: '900', color: '#111827' },
  newBtn: { backgroundColor: '#6366f1', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  newBtnText: { color: '#fff', fontWeight: '800' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontWeight: '800', fontSize: 15, color: '#111827', marginBottom: 3 },
  cardMeta: { fontSize: 13, color: '#6b7280' },
  actions: { flexDirection: 'row', gap: 6 },
  studyBtn: { backgroundColor: '#6366f1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  studyBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  iconBtn: { padding: 7, backgroundColor: '#f3f4f6', borderRadius: 8 },
});
