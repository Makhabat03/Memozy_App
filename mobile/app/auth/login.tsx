import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');

  const handleSubmit = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please fill in all fields'); return; }
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { username } } });
        if (error) throw error;
        Alert.alert('Check your email', 'We sent a confirmation link.', [{ text: 'OK', onPress: () => setMode('login') }]);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace('/');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.logo}>⚡ FlashAI</Text>
        <Text style={styles.sub}>{mode === 'login' ? 'Welcome back!' : 'Create your account'}</Text>

        {mode === 'signup' && (
          <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} placeholderTextColor="#9ca3af" autoCapitalize="none" />
        )}
        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#9ca3af" />
        <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor="#9ca3af" />

        <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{mode === 'login' ? 'Sign In' : 'Sign Up'}</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
          <Text style={styles.toggle}>
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  inner: { flex: 1, padding: 28, justifyContent: 'center' },
  logo: { fontSize: 32, fontWeight: '900', color: '#1e1b4b', textAlign: 'center', marginBottom: 6 },
  sub: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 28 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12, fontSize: 15, color: '#111827' },
  btn: { backgroundColor: '#6366f1', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 14 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  toggle: { color: '#6366f1', textAlign: 'center', fontWeight: '600', fontSize: 14 },
});
