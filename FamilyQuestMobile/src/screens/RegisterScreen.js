import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { InputField } from '../components/InputField';
import { registerUser } from '../services/authService';
import { parentAvatarOptions } from '../utils/parentAvatars';

export function RegisterScreen({ onNavigateToLogin }) {
  const navigateToLogin = () => {
    if (onNavigateToLogin) {
      onNavigateToLogin();
    }
  };

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(parentAvatarOptions[0]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordRules = useMemo(
    () => [
      { label: 'Minimum 8 karaktera', isValid: password.length >= 8 },
      { label: 'Minimum 1 veliko slovo', isValid: /[A-Z]/.test(password) },
      { label: 'Minimum 1 numerički znak', isValid: /\d/.test(password) },
    ],
    [password],
  );

  const isPasswordValid = passwordRules.every((rule) => rule.isValid);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setAcceptedTerms(false);
    setSelectedAvatar(parentAvatarOptions[0]);
    setStatusMessage('');
    setStatusType('');
  };

  const handleRegister = async () => {
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedFirstName || !trimmedLastName || !trimmedEmail || !password || !confirmPassword) {
      setStatusType('error');
      setStatusMessage('Molimo popunite sva polja.');
      return;
    }

    if (!isPasswordValid) {
      setStatusType('error');
      setStatusMessage('Lozinka ne ispunjava sva pravila.');
      return;
    }

    if (password !== confirmPassword) {
      setStatusType('error');
      setStatusMessage('Lozinka i potvrda lozinke se ne poklapaju.');
      return;
    }

    if (!acceptedTerms) {
      setStatusType('error');
      setStatusMessage('Morate prihvatiti uvjete korištenja i politiku privatnosti.');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage('');
    setStatusType('');

    try {
      await registerUser({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        email: trimmedEmail,
        password,
        avatarKey: selectedAvatar.key,
      });

      resetForm();
      setStatusType('success');
      setStatusMessage('Nalog je uspješno kreiran. Sada se možete prijaviti.');
    } catch (error) {
      setStatusType('error');
      setStatusMessage(error.message || 'Došlo je do greške prilikom registracije.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Image source={require('../../assets/register-hero.png')} style={styles.heroImage} resizeMode="contain" />

            <Text style={styles.title}>Kreirajte svoj nalog</Text>
            <Text style={styles.description}>
              Registrujte se kako biste koristili sve funkcionalnosti aplikacije. Dobrodošli nazad!
            </Text>

            <InputField label="Ime" placeholder="Unesite ime" icon="person" value={firstName} onChangeText={setFirstName} />
            <InputField label="Prezime" placeholder="Unesite prezime" icon="person" value={lastName} onChangeText={setLastName} />

            <View style={styles.avatarBlock}>
              <Text style={styles.avatarTitle}>Odaberite profilnu ikonu</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarOptionsRow}>
                {parentAvatarOptions.map((avatar) => {
                  const isSelected = selectedAvatar.key === avatar.key;

                  return (
                    <Pressable
                      key={avatar.key}
                      style={[styles.avatarOption, isSelected && styles.avatarOptionSelected]}
                      onPress={() => setSelectedAvatar(avatar)}
                      disabled={isSubmitting}
                    >
                      <Image source={avatar.source} style={styles.avatarImage} resizeMode="cover" />
                      <Text style={[styles.avatarLabel, isSelected && styles.avatarLabelSelected]}>{avatar.label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

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
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
              onRightActionPress={() => setShowPassword((current) => !current)}
            />

            {isPasswordFocused ? (
              <View style={styles.passwordRules}>
                <View style={styles.passwordRulesPointer} />
                <Text style={styles.rulesTitle}>Lozinka mora sadržati:</Text>
                {passwordRules.map((rule) => (
                  <View key={rule.label} style={styles.ruleRow}>
                    <Text style={[styles.ruleCheck, rule.isValid && styles.ruleCheckValid]}>✓</Text>
                    <Text style={styles.ruleText}>{rule.label}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <InputField
              label="Potvrda lozinke"
              placeholder="Ponovite lozinku"
              icon="lock"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onRightActionPress={() => setShowConfirmPassword((current) => !current)}
            />

            <Pressable style={styles.termsRow} onPress={() => setAcceptedTerms((current) => !current)}>
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                {acceptedTerms ? <Text style={styles.checkboxMark}>✓</Text> : null}
              </View>
              <Text style={styles.termsText}>
                Prihvatam <Text style={styles.linkText}>uvjete korištenja</Text> i{' '}
                <Text style={styles.linkText}>politiku privatnosti.</Text>
              </Text>
            </Pressable>

            {statusMessage ? (
              <View style={[styles.statusBox, statusType === 'success' ? styles.statusSuccess : styles.statusError]}>
                <Text style={styles.statusText}>{statusMessage}</Text>
              </View>
            ) : null}

            <Pressable style={[styles.primaryButton, isSubmitting && styles.disabledButton]} onPress={handleRegister} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>Registruj se</Text>}
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={resetForm}>
              <Text style={styles.secondaryButtonText}>Odustani</Text>
            </Pressable>

            <Pressable style={styles.loginRow} onPress={navigateToLogin} hitSlop={12}>
              <Text style={styles.loginText}>Već imate nalog? </Text>
              <Text style={styles.loginLink} onPress={navigateToLogin}>Prijavite se</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#edf5ff' },
  keyboardAvoidingView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 24, paddingBottom: 108 },
  card: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingBottom: 24,
    shadowColor: '#0f2b5f',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 8,
  },
  heroImage: { width: 235, height: 165, alignSelf: 'center', marginTop: 18, marginBottom: 4 },
  title: { color: '#072766', fontSize: 29, fontWeight: '800', textAlign: 'center', marginTop: 4 },
  description: { color: '#46536c', fontSize: 16, lineHeight: 24, textAlign: 'center', marginTop: 10, marginBottom: 20 },
  avatarBlock: { marginTop: -2, marginBottom: 16 },
  avatarTitle: { color: '#052461', fontSize: 15, fontWeight: '800', marginBottom: 10 },
  avatarOptionsRow: { gap: 8, paddingRight: 2 },
  avatarOption: { width: 66, minHeight: 80, borderRadius: 12, borderWidth: 1, borderColor: '#dce3ef', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 4, backgroundColor: '#ffffff' },
  avatarOptionSelected: { borderColor: '#0065ff', backgroundColor: '#eef5ff' },
  avatarImage: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#dfe5ff' },
  avatarLabel: { color: '#536079', fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 5 },
  avatarLabelSelected: { color: '#0065ff' },
  passwordRules: { position: 'relative', backgroundColor: '#eef5ff', borderRadius: 11, borderWidth: 1, borderColor: '#cfe1ff', paddingHorizontal: 14, paddingVertical: 12, marginTop: -6, marginBottom: 16 },
  passwordRulesPointer: { position: 'absolute', top: -7, left: 24, width: 13, height: 13, backgroundColor: '#eef5ff', borderLeftWidth: 1, borderTopWidth: 1, borderColor: '#cfe1ff', transform: [{ rotate: '45deg' }] },
  rulesTitle: { color: '#052461', fontSize: 14, fontWeight: '700', marginBottom: 5 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ruleCheck: { color: '#93a0b6', fontSize: 16, fontWeight: '800', width: 24 },
  ruleCheckValid: { color: '#169c55' },
  ruleText: { color: '#082a68', fontSize: 14 },
  termsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, marginBottom: 16 },
  checkbox: { width: 25, height: 25, borderWidth: 2, borderColor: '#8b95a7', borderRadius: 5, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkboxChecked: { borderColor: '#052b78', backgroundColor: '#052b78' },
  checkboxMark: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  termsText: { flex: 1, color: '#052461', fontSize: 14, lineHeight: 21 },
  linkText: { color: '#0065ff' },
  statusBox: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14 },
  statusSuccess: { backgroundColor: '#e9f8ef', borderWidth: 1, borderColor: '#b9e6ca' },
  statusError: { backgroundColor: '#fff0f0', borderWidth: 1, borderColor: '#f3c2c2' },
  statusText: { color: '#052461', fontSize: 14, lineHeight: 20 },
  primaryButton: { height: 58, borderRadius: 12, backgroundColor: '#052b78', alignItems: 'center', justifyContent: 'center', shadowColor: '#052b78', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 5 },
  disabledButton: { opacity: 0.7 },
  primaryButtonText: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  secondaryButton: { height: 56, borderRadius: 11, borderWidth: 1, borderColor: '#cfd6e2', alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  secondaryButtonText: { color: '#052461', fontSize: 18, fontWeight: '600' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  loginText: { color: '#536079', fontSize: 15 },
  loginLink: { color: '#0065ff', fontSize: 15, fontWeight: '700' },
});


