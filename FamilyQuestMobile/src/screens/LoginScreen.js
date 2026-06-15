import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { InputField } from '../components/InputField';
import { loginUser } from '../services/authService';

export function LoginScreen({ onNavigateToRegister, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setStatusMessage('Molimo unesite e-mail adresu i lozinku.');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage('');

    try {
      const loginResponse = await loginUser({ email: trimmedEmail, password });
      onLoginSuccess(loginResponse);
    } catch (error) {
      setStatusMessage(error.message || 'Prijava nije uspjela.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Image source={require('../../assets/register-hero.png')} style={styles.heroImage} resizeMode="contain" />

          <Text style={styles.title}>Prijava</Text>
          <Text style={styles.description}>Dobrodošli nazad! Prijavite se kako biste nastavili koristiti aplikaciju.</Text>

          <View style={styles.formArea}>
            <InputField
              label="E-mail adresa"
              placeholder="Unesite e-mail adresu"
              icon="mail"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <InputField
              label="Lozinka"
              placeholder="Unesite lozinku"
              icon="lock"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              onRightActionPress={() => setShowPassword((current) => !current)}
            />

            <Pressable style={styles.forgotPasswordRow}>
              <Text style={styles.linkText}>Zaboravili ste lozinku?</Text>
            </Pressable>

            {statusMessage ? (
              <View style={styles.statusBox}>
                <Text style={styles.statusText}>{statusMessage}</Text>
              </View>
            ) : null}

            <Pressable style={[styles.primaryButton, isSubmitting && styles.disabledButton]} onPress={handleLogin} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>Prijavi se</Text>}
            </Pressable>

            <Pressable style={styles.registerRow} onPress={onNavigateToRegister}>
              <Text style={styles.registerText}>Nemate nalog? </Text>
              <Text style={styles.registerLink}>Registruj se</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#edf5ff' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 18, paddingVertical: 24 },
  card: {
    width: '100%',
    maxWidth: 430,
    minHeight: 690,
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingBottom: 34,
    shadowColor: '#0f2b5f',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 8,
  },
  heroImage: { width: 265, height: 205, alignSelf: 'center', marginTop: 44, marginBottom: 6 },
  title: { color: '#072766', fontSize: 34, fontWeight: '800', textAlign: 'center', marginTop: 4 },
  description: {
    color: '#46536c',
    fontSize: 17,
    lineHeight: 28,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 46,
    paddingHorizontal: 22,
  },
  formArea: { width: '100%' },
  forgotPasswordRow: { alignSelf: 'flex-start', marginTop: 2, marginBottom: 28 },
  linkText: { color: '#0065ff', fontSize: 16, fontWeight: '500' },
  statusBox: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14, backgroundColor: '#fff0f0', borderWidth: 1, borderColor: '#f3c2c2' },
  statusText: { color: '#052461', fontSize: 14, lineHeight: 20 },
  primaryButton: {
    height: 58,
    borderRadius: 12,
    backgroundColor: '#052b78',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#052b78',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 5,
  },
  disabledButton: { opacity: 0.7 },
  primaryButtonText: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 36 },
  registerText: { color: '#536079', fontSize: 16 },
  registerLink: { color: '#0065ff', fontSize: 16, fontWeight: '700' },
});




