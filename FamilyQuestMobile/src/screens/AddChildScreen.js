import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { InputField } from '../components/InputField';
import { createChildUser } from '../services/authService';
import { createParentChildRelationship } from '../services/parentChildService';
import { childAvatarOptions } from '../utils/childAvatars';

const icons = {
  chevronRight: require('../../assets/home-icons/chevron-right.png'),
  profile: require('../../assets/home-icons/profile.png'),
};

export function AddChildScreen({ token, onBack }) {
  const [childIdentifier, setChildIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(childAvatarOptions[0]);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  const handleSubmit = async () => {
    const trimmedIdentifier = childIdentifier.trim();

    if (!trimmedIdentifier || !password || !confirmPassword) {
      setStatusType('error');
      setStatusMessage('Molimo popunite sva polja.');
      return;
    }

    if (!token) {
      setStatusType('error');
      setStatusMessage('Morate biti prijavljeni kao roditelj da biste povezali dijete.');
      return;
    }

    if (password !== confirmPassword) {
      setStatusType('error');
      setStatusMessage('Šifra i potvrda šifre se ne poklapaju.');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage('');
    setStatusType('');

    try {
      const createdChild = await createChildUser({
        identifier: trimmedIdentifier,
        password,
        avatarKey: selectedAvatar.key,
      });

      await createParentChildRelationship({
        childId: createdChild.id,
        token,
      });

      setChildIdentifier('');
      setPassword('');
      setConfirmPassword('');
      setSelectedAvatar(childAvatarOptions[0]);
      setStatusType('success');
      setStatusMessage(`Dijete ${createdChild.name} je uspješno dodano i povezano sa roditeljem.`);
    } catch (error) {
      setStatusType('error');
      setStatusMessage(error.message || 'Došlo je do greške prilikom dodavanja djeteta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={handleBack} hitSlop={16}>
            <Image source={icons.chevronRight} style={styles.backIcon} resizeMode="contain" />
          </Pressable>
          <Text style={styles.headerTitle}>Dodaj dijete</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Image source={require('../../assets/child-add.png')} style={styles.heroImage} resizeMode="contain" />

        <Text style={styles.description}>Dodajte dijete kako bi moglo koristiti aplikaciju sa svojim nalogom.</Text>

        <View style={styles.formArea}>
          <InputField
            label="Ime / e-mail djeteta"
            placeholder="Unesite ime ili e-mail djeteta"
            icon="person"
            autoCapitalize="none"
            value={childIdentifier}
            onChangeText={setChildIdentifier}
          />
          <InputField
            label="Šifra"
            placeholder="Unesite šifru"
            icon="lock"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            onRightActionPress={() => setShowPassword((current) => !current)}
          />
          <InputField
            label="Potvrdi šifru"
            placeholder="Ponovo unesite šifru"
            icon="lock"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            onRightActionPress={() => setShowConfirmPassword((current) => !current)}
          />

          <View style={styles.avatarBlock}>
            <Text style={styles.avatarTitle}>Odaberite ikonu djeteta</Text>
            <View style={styles.avatarOptionsGrid}>
              {childAvatarOptions.map((avatar) => {
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
            </View>
          </View>

          <View style={styles.infoBox}>
            <View style={styles.shieldIcon}>
              <Image source={icons.profile} style={styles.shieldInnerIcon} resizeMode="contain" />
            </View>
            <Text style={styles.infoText}>Dijete će moći koristiti aplikaciju sa svojim nalogom i šifrom.</Text>
          </View>

          {statusMessage ? (
            <View style={[styles.statusBox, statusType === 'success' ? styles.statusSuccess : styles.statusError]}>
              <Text style={styles.statusText}>{statusMessage}</Text>
            </View>
          ) : null}

          <View style={styles.actionsRow}>
            <Pressable style={styles.secondaryButton} onPress={handleBack} disabled={isSubmitting}>
              <Text style={styles.secondaryButtonText}>Odustani</Text>
            </Pressable>
            <Pressable style={[styles.primaryButton, isSubmitting && styles.disabledButton]} onPress={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>Dodaj</Text>}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 30, paddingBottom: 16, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  backButton: { width: 44, height: 44, alignItems: 'flex-start', justifyContent: 'center' },
  backIcon: { width: 23, height: 23, tintColor: '#052b78', transform: [{ rotate: '180deg' }] },
  headerTitle: { color: '#071e60', fontSize: 24, fontWeight: '800', textAlign: 'center' },
  headerSpacer: { width: 44 },
  heroImage: { width: 185, height: 125, alignSelf: 'center', marginTop: 0, marginBottom: 8 },
  description: { color: '#4c5877', fontSize: 15, lineHeight: 21, textAlign: 'center', marginBottom: 16, paddingHorizontal: 12 },
  formArea: { width: '100%' },
  avatarBlock: { marginTop: -2, marginBottom: 10 },
  avatarTitle: { color: '#052461', fontSize: 14, fontWeight: '800', marginBottom: 7 },
  avatarOptionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 7 },
  avatarOption: { width: '23%', minHeight: 67, borderRadius: 11, borderWidth: 1, borderColor: '#dce3ef', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 3, backgroundColor: '#ffffff' },
  avatarOptionSelected: { borderColor: '#0065ff', backgroundColor: '#eef5ff' },
  avatarImage: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#dfe5ff' },
  avatarLabel: { color: '#536079', fontSize: 9, fontWeight: '700', textAlign: 'center', marginTop: 3 },
  avatarLabelSelected: { color: '#0065ff' },
  infoBox: {
    minHeight: 60,
    borderWidth: 1,
    borderColor: '#c9ddfb',
    borderRadius: 12,
    backgroundColor: '#f2f7ff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  shieldIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  shieldInnerIcon: { width: 22, height: 22, tintColor: '#0065ff' },
  infoText: { flex: 1, color: '#4c5877', fontSize: 13, lineHeight: 18 },
  statusBox: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16, borderWidth: 1 },
  statusSuccess: { backgroundColor: '#e9f8ef', borderColor: '#b9e6ca' },
  statusError: { backgroundColor: '#fff0f0', borderColor: '#f3c2c2' },
  statusText: { color: '#052461', fontSize: 14, lineHeight: 20 },
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 2 },
  secondaryButton: { flex: 1, height: 50, borderRadius: 12, borderWidth: 1.5, borderColor: '#052b78', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' },
  secondaryButtonText: { color: '#052b78', fontSize: 17, fontWeight: '800' },
  primaryButton: { flex: 1, height: 50, borderRadius: 12, backgroundColor: '#052b78', alignItems: 'center', justifyContent: 'center', shadowColor: '#052b78', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 4 },
  disabledButton: { opacity: 0.7 },
  primaryButtonText: { color: '#ffffff', fontSize: 17, fontWeight: '800' },
});




