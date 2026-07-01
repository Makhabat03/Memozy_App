import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FirstLaunchScreen() {
  const router = useRouter();

  const selectTheme = async (theme: 'minimal' | 'cute') => {
    await AsyncStorage.setItem('flashai_theme', theme);
    await AsyncStorage.setItem('flashai_launched', '1');
    router.replace('/auth/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to FlashAI ⚡</Text>
      <Text style={styles.sub}>Choose your style</Text>
      <View style={styles.choices}>
        <TouchableOpacity style={[styles.choice, styles.choiceCute]} onPress={() => selectTheme('cute')}>
          <Text style={styles.choiceEmoji}>🌸</Text>
          <Text style={styles.choiceName}>Cute</Text>
          <Text style={styles.choiceDesc}>Playful, rounded, pastel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.choice, styles.choiceMinimal]} onPress={() => selectTheme('minimal')}>
          <Text style={styles.choiceEmoji}>✦</Text>
          <Text style={styles.choiceName}>Minimal</Text>
          <Text style={styles.choiceDesc}>Clean, modern, focused</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 26, fontWeight: '900', color: '#1e1b4b', textAlign: 'center', marginBottom: 6 },
  sub: { fontSize: 16, color: '#6b7280', marginBottom: 40 },
  choices: { flexDirection: 'row', gap: 16 },
  choice: { width: 140, borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 2 },
  choiceCute: { backgroundColor: '#fff0f6', borderColor: '#f472b6' },
  choiceMinimal: { backgroundColor: '#f0f0ff', borderColor: '#6366f1' },
  choiceEmoji: { fontSize: 32, marginBottom: 8 },
  choiceName: { fontSize: 16, fontWeight: '900', color: '#111827', marginBottom: 4 },
  choiceDesc: { fontSize: 12, color: '#6b7280', textAlign: 'center' },
});
