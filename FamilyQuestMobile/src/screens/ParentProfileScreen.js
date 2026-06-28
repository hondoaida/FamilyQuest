import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { updateMyProfile } from '../services/profileService';
import { getParentAvatarSource, parentAvatarOptions } from '../utils/parentAvatars';

const icons = {
  chat: require('../../assets/home-icons/chat.png'),
  gift: require('../../assets/home-icons/gift.png'),
  home: require('../../assets/home-icons/home.png'),
  profile: require('../../assets/home-icons/profile.png'),
  user: require('../../assets/home-icons/user.png'),
};

export function ParentProfileScreen({
  token,
  user,
  onProfileUpdated,
  onNavigateHome,
  onNavigateToChildren,
  onNavigateToRewards,
  onNavigateToMessages,
  onLogout,
}) {
  const initialAvatar = useMemo(
    () => parentAvatarOptions.find((avatar) => avatar.key === user?.avatarKey) ?? parentAvatarOptions[0],
    [user?.avatarKey],
  );
  const [selectedAvatar, setSelectedAvatar] = useState(initialAvatar);
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const passwordsDoNotMatch = Boolean(newPassword && confirmPassword && newPassword !== confirmPassword);

  const handleSave = async () => {
    const trimmedEmail = email.trim();

    setError('');
    setMessage('');

    if (newPassword || confirmPassword || currentPassword) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setError('Za promjenu šifre unesite trenutnu, novu i ponovljenu šifru.');
        return;
      }

      if (newPassword.length < 8) {
        setError('Nova šifra mora imati najmanje 8 karaktera.');
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('Nova šifra i ponovljena šifra nisu iste.');
        return;
      }
    }

    setIsSaving(true);

    try {
      const updatedUser = await updateMyProfile({
        token,
        email: trimmedEmail || undefined,
        avatarKey: selectedAvatar.key,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });

      onProfileUpdated?.(updatedUser);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Profil je uspješno sačuvan.');
    } catch (saveError) {
      setError(saveError.message || 'Spremanje profila nije uspjelo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Image source={getParentAvatarSource(selectedAvatar.key)} style={styles.heroAvatar} />
            <Text style={styles.title}>Profil roditelja</Text>
            <Text style={styles.subtitle}>{user?.name || 'Roditelj'}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Profilna ikona</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarRow}>
              {parentAvatarOptions.map((avatar) => {
                const isSelected = selectedAvatar.key === avatar.key;

                return (
                  <Pressable
                    key={avatar.key}
                    style={[styles.avatarOption, isSelected && styles.avatarOptionSelected]}
                    onPress={() => setSelectedAvatar(avatar)}
                  >
                    <Image source={avatar.source} style={styles.avatarImage} resizeMode="cover" />
                    <Text style={[styles.avatarLabel, isSelected && styles.avatarLabelSelected]}>{avatar.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.inputLabel}>E-mail adresa</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="email@example.com"
              placeholderTextColor="#9aa6bd"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Promjena šifre</Text>
            <PasswordInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              isVisible={showCurrentPassword}
              onToggleVisibility={() => setShowCurrentPassword((isVisible) => !isVisible)}
              placeholder="Trenutna šifra"
            />
            <PasswordInput
              value={newPassword}
              onChangeText={setNewPassword}
              isVisible={showNewPassword}
              onToggleVisibility={() => setShowNewPassword((isVisible) => !isVisible)}
              placeholder="Nova šifra"
            />
            <PasswordInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              isVisible={showConfirmPassword}
              onToggleVisibility={() => setShowConfirmPassword((isVisible) => !isVisible)}
              placeholder="Ponovi novu šifru"
            />
            {passwordsDoNotMatch ? <Text style={styles.passwordMismatchText}>Nova šifra i ponovljena šifra nisu iste.</Text> : null}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {message ? <Text style={styles.successText}>{message}</Text> : null}

          <Pressable style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} onPress={handleSave} disabled={isSaving}>
            {isSaving ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.saveButtonText}>Sačuvaj promjene</Text>}
          </Pressable>

          <Pressable style={styles.logoutButton} onPress={onLogout}>
            <Text style={styles.logoutButtonText}>Odjavi se</Text>
          </Pressable>
        </ScrollView>

        <BottomNavigation
          onNavigateHome={onNavigateHome}
          onNavigateChildren={onNavigateToChildren}
          onNavigateRewards={onNavigateToRewards}
          onNavigateMessages={onNavigateToMessages}
        />
      </View>
    </SafeAreaView>
  );
}

function PasswordInput({ value, onChangeText, isVisible, onToggleVisibility, placeholder }) {
  return (
    <View style={styles.passwordInputRow}>
      <TextInput
        style={styles.passwordInput}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!isVisible}
        placeholder={placeholder}
        placeholderTextColor="#9aa6bd"
      />
      <Pressable style={styles.passwordToggle} onPress={onToggleVisibility}>
        <Text style={styles.passwordToggleText}>{isVisible ? 'Sakrij' : 'Prikaži'}</Text>
      </Pressable>
    </View>
  );
}

function BottomNavigation({ onNavigateHome, onNavigateChildren, onNavigateRewards, onNavigateMessages }) {
  const items = [
    { label: 'Pocetna', icon: icons.home, onPress: onNavigateHome },
    { label: 'Djeca', icon: icons.user, onPress: onNavigateChildren },
    { label: 'Nagrade', icon: icons.gift, onPress: onNavigateRewards },
    { label: 'Poruke', icon: icons.chat, onPress: onNavigateMessages },
    { label: 'Profil', icon: icons.profile, active: true },
  ];

  return (
    <View style={styles.bottomNav}>
      {items.map((item) => (
        <Pressable key={item.label} style={styles.navItem} onPress={() => item.onPress?.()}>
          <Icon source={item.icon} size={28} color={item.active ? '#0065ff' : '#46536c'} />
          <Text style={[styles.navLabel, item.active && styles.navLabelActive]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Icon({ source, size, color }) {
  return <Image source={source} style={{ width: size, height: size, tintColor: color }} resizeMode="contain" />;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#edf5ff' },
  screen: { flex: 1, backgroundColor: '#ffffff' },
  content: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 118 },
  header: { alignItems: 'center', marginBottom: 20 },
  heroAvatar: { width: 104, height: 104, borderRadius: 52, backgroundColor: '#dfe5ff', marginBottom: 14 },
  title: { color: '#071e60', fontSize: 29, fontWeight: '900' },
  subtitle: { color: '#52607b', fontSize: 16, fontWeight: '700', marginTop: 5 },
  card: { borderWidth: 1, borderColor: '#e0e8f4', borderRadius: 16, backgroundColor: '#ffffff', padding: 16, marginBottom: 16 },
  sectionTitle: { color: '#071e60', fontSize: 18, fontWeight: '900', marginBottom: 12 },
  avatarRow: { gap: 10, paddingRight: 2, paddingBottom: 2 },
  avatarOption: { width: 80, minHeight: 98, borderRadius: 14, borderWidth: 1, borderColor: '#dce3ef', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 6, backgroundColor: '#ffffff' },
  avatarOptionSelected: { borderColor: '#0065ff', backgroundColor: '#eef5ff' },
  avatarImage: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#dfe5ff' },
  avatarLabel: { color: '#536079', fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: 7 },
  avatarLabelSelected: { color: '#0065ff' },
  inputLabel: { color: '#052461', fontSize: 14, fontWeight: '800', marginBottom: 8, marginTop: 14 },
  input: { minHeight: 52, borderWidth: 1, borderColor: '#dce3ef', borderRadius: 13, paddingHorizontal: 15, color: '#071e60', fontSize: 16, fontWeight: '600', backgroundColor: '#fbfdff', marginBottom: 12 },
  passwordInputRow: { minHeight: 52, borderWidth: 1, borderColor: '#dce3ef', borderRadius: 13, backgroundColor: '#fbfdff', marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, minHeight: 52, paddingHorizontal: 15, color: '#071e60', fontSize: 16, fontWeight: '600' },
  passwordToggle: { minHeight: 52, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  passwordToggleText: { color: '#0065ff', fontSize: 13, fontWeight: '900' },
  passwordMismatchText: { color: '#d92d20', fontSize: 13, fontWeight: '800', marginTop: -4, marginBottom: 8 },
  errorText: { color: '#d92d20', fontSize: 14, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  successText: { color: '#079452', fontSize: 14, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  saveButton: { minHeight: 56, borderRadius: 15, backgroundColor: '#0065ff', alignItems: 'center', justifyContent: 'center', shadowColor: '#0065ff', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 18, elevation: 6 },
  saveButtonDisabled: { opacity: 0.72 },
  saveButtonText: { color: '#ffffff', fontSize: 17, fontWeight: '900' },
  logoutButton: { minHeight: 54, borderRadius: 15, borderWidth: 1.5, borderColor: '#d92d20', alignItems: 'center', justifyContent: 'center', marginTop: 14, backgroundColor: '#fff7f7' },
  logoutButtonText: { color: '#d92d20', fontSize: 17, fontWeight: '900' },
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 12, minHeight: 82, paddingTop: 10, paddingBottom: 12, borderTopWidth: 1, borderTopColor: '#e6edf7', backgroundColor: '#ffffff', flexDirection: 'row', justifyContent: 'space-around', shadowColor: '#0f2b5f', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.05, shadowRadius: 14, elevation: 8 },
  navItem: { alignItems: 'center', justifyContent: 'center', minWidth: 56 },
  navLabel: { color: '#46536c', fontSize: 12, marginTop: 4, fontWeight: '600' },
  navLabelActive: { color: '#0065ff' },
});
