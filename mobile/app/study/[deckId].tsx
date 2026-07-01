import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { studyApi, gamifyApi } from '../../lib/api';

const { width } = Dimensions.get('window');

export default function StudyScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const router = useRouter();
  const [cards, setCards] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  const flip = useSharedValue(0);

  useEffect(() => {
    if (!deckId) return;
    studyApi.getDueCards(deckId).then((r) => {
      setCards(r.data.cards || []);
      setLoading(false);
    });
  }, [deckId]);

  const handleFlip = useCallback(() => {
    if (!flipped) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      flip.value = withTiming(1, { duration: 400 });
      setFlipped(true);
    }
  }, [flipped]);

  const rate = useCallback(async (quality: number) => {
    const card = cards[index];
    Haptics.impactAsync(quality >= 3 ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Heavy);
    await studyApi.rateCard(card.id, quality);
    const nextCorrect = correct + (quality >= 3 ? 1 : 0);

    const next = index + 1;
    if (next >= cards.length) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && deckId) {
        const res = await gamifyApi.studyComplete({ user_id: user.id, deck_id: deckId, cards_reviewed: cards.length, correct_count: nextCorrect });
        setXpEarned(res.data.xp_earned);
      }
      setDone(true);
    } else {
      setIndex(next);
      flip.value = withTiming(0, { duration: 300 });
      setFlipped(false);
      if (quality >= 3) setCorrect(nextCorrect);
    }
    if (quality >= 3) setCorrect(nextCorrect);
  }, [cards, index, correct, deckId]);

  const swipeGesture = Gesture.Pan().onEnd((e) => {
    if (!flipped) return;
    if (e.translationX > 80) {
      runOnJS(rate)(5);
    } else if (e.translationX < -80) {
      runOnJS(rate)(1);
    }
  });

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(flip.value, [0, 1], [0, 180], Extrapolation.CLAMP)}deg` }],
    backfaceVisibility: 'hidden',
    position: 'absolute',
    width: '100%',
    height: '100%',
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(flip.value, [0, 1], [180, 360], Extrapolation.CLAMP)}deg` }],
    backfaceVisibility: 'hidden',
    position: 'absolute',
    width: '100%',
    height: '100%',
  }));

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6366f1" /></View>;

  if (cards.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.doneEmoji}>✅</Text>
        <Text style={styles.doneTitle}>All caught up!</Text>
        <Text style={styles.doneSub}>No cards due for review.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
          <Text style={styles.btnText}>Back to Decks</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (done) {
    return (
      <View style={styles.center}>
        <Text style={styles.doneEmoji}>🎉</Text>
        <Text style={styles.doneTitle}>Deck Complete!</Text>
        <Text style={styles.doneSub}>{correct}/{cards.length} correct · +{xpEarned} XP</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
          <Text style={styles.btnText}>Back to Decks</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const current = cards[index];
  const progress = (index / cards.length) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.counter}>{index + 1}/{cards.length}</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <View style={styles.dots}>
        {cards.map((_, i) => (
          <View key={i} style={[styles.dot, i <= index && styles.dotActive]} />
        ))}
      </View>

      <GestureDetector gesture={swipeGesture}>
        <TouchableOpacity activeOpacity={1} onPress={handleFlip} style={styles.cardContainer}>
          <Animated.View style={[styles.cardFace, styles.cardFront, frontStyle]}>
            <Text style={styles.cardLabel}>QUESTION</Text>
            <Text style={styles.cardText}>{current.front}</Text>
            <Text style={styles.tapHint}>Tap to flip · Swipe right=Easy, left=Hard</Text>
          </Animated.View>
          <Animated.View style={[styles.cardFace, styles.cardBack, backStyle]}>
            <Text style={[styles.cardLabel, { color: '#10b981' }]}>ANSWER</Text>
            <Text style={styles.cardText}>{current.back}</Text>
          </Animated.View>
        </TouchableOpacity>
      </GestureDetector>

      {flipped && (
        <View style={styles.buttons}>
          <TouchableOpacity style={[styles.rateBtn, { backgroundColor: '#fecaca' }]} onPress={() => rate(1)}>
            <Text style={[styles.rateBtnText, { color: '#dc2626' }]}>😤 Hard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.rateBtn, { backgroundColor: '#ede9fe' }]} onPress={() => rate(3)}>
            <Text style={[styles.rateBtnText, { color: '#6366f1' }]}>👍 Good</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.rateBtn, { backgroundColor: '#d1fae5' }]} onPress={() => rate(5)}>
            <Text style={[styles.rateBtnText, { color: '#059669' }]}>😎 Easy</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa', padding: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  back: { color: '#6366f1', fontWeight: '700', fontSize: 15 },
  counter: { color: '#6b7280', fontWeight: '600' },
  progressBar: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 999, marginBottom: 12 },
  progressFill: { height: '100%', backgroundColor: '#6366f1', borderRadius: 999 },
  dots: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'center', marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e5e7eb' },
  dotActive: { backgroundColor: '#6366f1' },
  cardContainer: { flex: 1, marginBottom: 20 },
  cardFace: { backgroundColor: '#fff', borderRadius: 20, padding: 28, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 20, elevation: 4, alignItems: 'center', justifyContent: 'center' },
  cardFront: { borderWidth: 1.5, borderColor: '#e5e7eb' },
  cardBack: { backgroundColor: '#f0fdf4', borderWidth: 1.5, borderColor: '#10b981' },
  cardLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: '#6366f1', marginBottom: 16 },
  cardText: { fontSize: 18, fontWeight: '700', color: '#111827', textAlign: 'center', lineHeight: 26 },
  tapHint: { marginTop: 20, fontSize: 12, color: '#9ca3af', textAlign: 'center' },
  buttons: { flexDirection: 'row', gap: 10, paddingBottom: 8 },
  rateBtn: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  rateBtnText: { fontWeight: '800', fontSize: 14 },
  doneEmoji: { fontSize: 56, marginBottom: 12 },
  doneTitle: { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 6 },
  doneSub: { fontSize: 15, color: '#6b7280', marginBottom: 24 },
  btn: { backgroundColor: '#6366f1', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
