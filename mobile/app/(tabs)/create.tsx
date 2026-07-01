import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { decksApi, cardsApi } from '../../lib/api';

type Tab = 'text' | 'pdf' | 'image';

export default function CreateScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('text');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [numCards, setNumCards] = useState(10);
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const pickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (!result.canceled) setFile(result.assets[0]);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled) setFile(result.assets[0]);
  };

  const handleGenerate = async () => {
    if (!title.trim()) { Alert.alert('Error', 'Please enter a deck title'); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setLoading(true);
    try {
      const deckRes = await decksApi.create({ user_id: user.id, title });
      const deckId = deckRes.data.deck.id;

      if (tab === 'text') {
        if (!text.trim()) throw new Error('Please enter text');
        await cardsApi.generateFromText({ text, deck_id: deckId, num_cards: numCards });
      } else if (tab === 'pdf' && file) {
        const fd = new FormData();
        fd.append('file', { uri: file.uri, name: file.name, type: 'application/pdf' } as any);
        fd.append('deck_id', deckId);
        fd.append('num_cards', String(numCards));
        await cardsApi.generateFromPdf(fd);
      } else if (tab === 'image' && file) {
        const fd = new FormData();
        fd.append('file', { uri: file.uri, name: 'image.jpg', type: 'image/jpeg' } as any);
        fd.append('deck_id', deckId);
        fd.append('num_cards', String(numCards));
        await cardsApi.generateFromImage(fd);
      }

      Alert.alert('Success!', `${numCards} cards created for "${title}"`, [
        { text: 'Study Now', onPress: () => router.push(`/study/${deckId}`) },
        { text: 'OK', onPress: () => { setTitle(''); setText(''); setFile(null); } },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Create Flashcards</Text>

      <TextInput
        style={styles.input}
        placeholder="Deck title"
        value={title}
        onChangeText={setTitle}
        placeholderTextColor="#9ca3af"
      />

      <View style={styles.tabs}>
        {(['text', 'pdf', 'image'] as Tab[]).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'text' && (
        <TextInput
          style={[styles.input, { height: 150, textAlignVertical: 'top' }]}
          placeholder="Paste your notes here..."
          multiline
          value={text}
          onChangeText={setText}
          placeholderTextColor="#9ca3af"
        />
      )}

      {tab === 'pdf' && (
        <TouchableOpacity style={styles.filePicker} onPress={pickPdf}>
          <Text style={styles.filePickerText}>{file ? `📄 ${file.name}` : '📄 Select PDF'}</Text>
        </TouchableOpacity>
      )}

      {tab === 'image' && (
        <TouchableOpacity style={styles.filePicker} onPress={pickImage}>
          <Text style={styles.filePickerText}>{file ? '🖼️ Image selected' : '🖼️ Select Image'}</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.label}>Cards to generate: {numCards}</Text>
      <View style={styles.slider}>
        {[5, 10, 15, 20, 25, 30].map((n) => (
          <TouchableOpacity key={n} style={[styles.sliderBtn, numCards === n && styles.sliderBtnActive]} onPress={() => setNumCards(n)}>
            <Text style={[styles.sliderBtnText, numCards === n && styles.sliderBtnTextActive]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[styles.generateBtn, loading && { opacity: 0.7 }]} onPress={handleGenerate} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.generateBtnText}>⚡ Generate with AI</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  title: { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 16 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12, fontSize: 15, color: '#111827' },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16, backgroundColor: '#f3f4f6', borderRadius: 12, padding: 4 },
  tab: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#6366f1' },
  tabText: { fontWeight: '700', fontSize: 13, color: '#6b7280' },
  tabTextActive: { color: '#fff' },
  filePicker: { backgroundColor: '#ede9fe', borderRadius: 12, padding: 40, alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: '#a78bfa', borderStyle: 'dashed' },
  filePickerText: { fontWeight: '700', color: '#6366f1', fontSize: 16 },
  label: { fontWeight: '700', color: '#374151', marginBottom: 8 },
  slider: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  sliderBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f3f4f6' },
  sliderBtnActive: { backgroundColor: '#6366f1' },
  sliderBtnText: { fontWeight: '700', color: '#6b7280' },
  sliderBtnTextActive: { color: '#fff' },
  generateBtn: { backgroundColor: '#6366f1', borderRadius: 12, padding: 16, alignItems: 'center' },
  generateBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
