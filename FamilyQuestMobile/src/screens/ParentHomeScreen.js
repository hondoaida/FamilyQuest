import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getMyChildren } from '../services/childrenService';
import { getParentAvatarSource } from '../utils/parentAvatars';

const icons = {
  bell: require('../../assets/home-icons/bell.png'),
  user: require('../../assets/home-icons/user.png'),
  clipboard: require('../../assets/home-icons/clipboard.png'),
  checkCircle: require('../../assets/home-icons/check-circle.png'),
  chart: require('../../assets/home-icons/chart.png'),
  gift: require('../../assets/home-icons/gift.png'),
  trophy: require('../../assets/home-icons/trophy.png'),
  star: require('../../assets/home-icons/star.png'),
  medal: require('../../assets/home-icons/medal.png'),
  chat: require('../../assets/home-icons/chat.png'),
  send: require('../../assets/home-icons/send.png'),
  plusCircle: require('../../assets/home-icons/plus-circle.png'),
  home: require('../../assets/home-icons/home.png'),
  profile: require('../../assets/home-icons/profile.png'),
  chevronRight: require('../../assets/home-icons/chevron-right.png'),
};

const childAvatars = [
  require('../../assets/boy-one.png'),
  require('../../assets/boy-two.png'),
  require('../../assets/girl-one.png'),
  require('../../assets/girl-two.png'),
];

const messages = [
  { id: 1, sender: 'Sistem', text: 'Novi zadaci su dodijeljeni za ovu sedmicu.', time: '10:30', color: '#0b74ff', initial: 'i' },
  { id: 2, sender: 'Amar Hondo', text: 'Mama, pogledaj moj današnji rezultat! 😀', time: '09:15', color: '#24c2a0', initial: 'A' },
  { id: 3, sender: 'Emin Hondo', text: 'Završio sam zadatak iz matematike!', time: '08:40', color: '#9b64ea', initial: 'E' },
];

export function ParentHomeScreen({ token, user, onNavigateToAddChild, onNavigateToChildren }) {
  const [children, setChildren] = useState([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);
  const [childrenError, setChildrenError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadChildren = async () => {
      if (!token) {
        setChildrenError('Niste prijavljeni. Molimo prijavite se ponovo.');
        return;
      }

      setIsLoadingChildren(true);
      setChildrenError('');

      try {
        const response = await getMyChildren({ token });
        if (isMounted) {
          setChildren(response);
        }
      } catch (error) {
        if (isMounted) {
          setChildrenError(error.message || 'Učitavanje djece nije uspjelo.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingChildren(false);
        }
      }
    };

    loadChildren();

    return () => {
      isMounted = false;
    };
  }, [token]);


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerTextBox}>
              <Text style={styles.welcomeText}>Dobrodošla nazad,</Text>
              <Text style={styles.userName}>{user?.name || 'Roditelj'} 👋</Text>
              <Text style={styles.subText}>Drago nam je što ste tu!</Text>
            </View>

            <View style={styles.headerActions}>
              <Pressable style={styles.bellButton}>
                <Icon source={icons.bell} size={32} color="#44506a" />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>3</Text>
                </View>
              </Pressable>
              <Image source={getParentAvatarSource(user?.avatarKey)} style={styles.parentAvatar} />
            </View>
          </View>

          <SectionCard title="Dijete" icon={icons.user} actionText="Upravljaj djecom" actionColor="#0065ff" onActionPress={onNavigateToChildren}>
            <ChildrenContent
              children={children}
              error={childrenError}
              isLoading={isLoadingChildren}
              onChildPress={onNavigateToChildren}
            />
            <DashedButton label="Dodaj dijete" icon={icons.plusCircle} color="#0065ff" onPress={onNavigateToAddChild} />
          </SectionCard>

          <SectionCard title="Zadaci" icon={icons.clipboard} actionText="Pogledaj sve" actionColor="#0065ff">
            <StatsPanel>
              <StatItem icon={icons.clipboard} value="8" label="Aktivnih zadataka" color="#0065ff" />
              <StatItem icon={icons.checkCircle} value="5" label="Završenih danas" color="#0065ff" />
              <StatItem icon={icons.chart} value="73%" label="Ukupni napredak" color="#0065ff" />
            </StatsPanel>

          </SectionCard>

          <SectionCard title="Nagrade" icon={icons.gift} actionText="Pogledaj sve" actionColor="#079452" accentColor="#10a96b">
            <StatsPanel tinted>
              <StatItem icon={icons.trophy} value="6" label="Dostupne nagrade" color="#10a96b" />
              <StatItem icon={icons.star} value="2" label="Osvojene danas" color="#10a96b" />
              <StatItem icon={icons.medal} value="14" label="Ukupno osvojeno" color="#10a96b" />
            </StatsPanel>

          </SectionCard>

          <SectionCard title="Poruke" icon={icons.chat} actionText="Pogledaj sve" actionColor="#0065ff">
            <View style={styles.messageList}>
              {messages.map((message) => (
                <View key={message.id} style={styles.messageRow}>
                  <View style={[styles.messageAvatar, { backgroundColor: message.color }]}>
                    <Text style={styles.messageInitial}>{message.initial}</Text>
                  </View>
                  <View style={styles.messageBody}>
                    <Text style={styles.messageSender}>{message.sender}</Text>
                    <Text style={styles.messageText}>{message.text}</Text>
                  </View>
                  <View style={styles.messageMeta}>
                    <Text style={styles.messageTime}>{message.time}</Text>
                    <View style={styles.unreadDot} />
                  </View>
                </View>
              ))}
            </View>
            <DashedButton label="Nova poruka" icon={icons.send} color="#0065ff" />
          </SectionCard>
        </ScrollView>

        <BottomNavigation />

      </View>
    </SafeAreaView>
  );
}

function ChildrenContent({ children, error, isLoading, onChildPress }) {
  if (isLoading) {
    return (
      <View style={styles.childrenStateBox}>
        <ActivityIndicator color="#0065ff" />
        <Text style={styles.childrenStateText}>Učitavanje djece...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.childrenStateBox}>
        <Text style={styles.childrenErrorText}>{error}</Text>
      </View>
    );
  }

  if (children.length === 0) {
    return (
      <View style={styles.childrenStateBox}>
        <Text style={styles.childrenStateTitle}>Još nema dodane djece.</Text>
        <Text style={styles.childrenStateText}>Dodajte prvo dijete kako biste mu mogli dodijeliti zadatke i nagrade.</Text>
      </View>
    );
  }

  return (
    <View style={styles.childrenList}>
      {children.map((child, index) => (
        <Pressable key={child.id} style={styles.childRow} onPress={() => onChildPress?.(child.id)}>
          <Image source={childAvatars[index % childAvatars.length]} style={styles.childAvatar} />
          <View style={styles.childTextBox}>
            <Text style={styles.childName}>{child.childName}</Text>
            {child.childEmail ? <Text style={styles.childEmail}>{child.childEmail}</Text> : null}
          </View>
          <Icon source={icons.chevronRight} size={22} color="#44506a" />
        </Pressable>
      ))}
    </View>
  );
}

function SectionCard({ title, icon, actionText, actionColor, accentColor = '#0065ff', onActionPress, children }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Icon source={icon} size={34} color={accentColor} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <Pressable style={styles.sectionAction} onPress={onActionPress}>
          <Text style={[styles.sectionActionText, { color: actionColor }]}>{actionText}</Text>
          <Icon source={icons.chevronRight} size={18} color={actionColor} />
        </Pressable>
      </View>
      {children}
    </View>
  );
}

function StatsPanel({ children, tinted }) {
  return <View style={[styles.statsPanel, tinted && styles.greenStatsPanel]}>{children}</View>;
}

function StatItem({ icon, value, label, color }) {
  return (
    <View style={styles.statItem}>
      <Icon source={icon} size={42} color={color} />
      <View style={styles.statTextBox}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

function DashedButton({ label, icon, color, onPress }) {
  return (
    <Pressable style={[styles.dashedButton, { borderColor: color }]} onPress={onPress}>
      <Icon source={icon} size={25} color={color} />
      <Text style={[styles.dashedButtonText, { color }]}>{label}</Text>
    </Pressable>
  );
}

function BottomNavigation() {
  const items = [
    { label: 'Početna', icon: icons.home, active: true },
    { label: 'Zadaci', icon: icons.clipboard },
    { label: 'Nagrade', icon: icons.gift },
    { label: 'Poruke', icon: icons.chat },
    { label: 'Profil', icon: icons.profile },
  ];

  return (
    <View style={styles.bottomNav}>
      {items.map((item) => (
        <Pressable key={item.label} style={styles.navItem}>
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
  scrollContent: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 110 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  headerTextBox: { flex: 1, paddingRight: 12 },
  welcomeText: { color: '#4c5877', fontSize: 18, marginBottom: 6 },
  userName: { color: '#061e60', fontSize: 32, fontWeight: '800', lineHeight: 38 },
  subText: { color: '#4c5877', fontSize: 17, marginTop: 8 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  bellButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', right: 1, top: 2, minWidth: 24, height: 24, borderRadius: 12, backgroundColor: '#ff3d32', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#ffffff' },
  badgeText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  parentAvatar: { width: 78, height: 78, borderRadius: 39, backgroundColor: '#dfe5ff' },
  sectionCard: { backgroundColor: '#ffffff', borderRadius: 15, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#e4ebf6', shadowColor: '#0f2b5f', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 18, elevation: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionTitle: { color: '#071e60', fontSize: 21, fontWeight: '800' },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sectionActionText: { fontSize: 14, fontWeight: '600' },
  childrenList: { borderWidth: 1, borderColor: '#e0e8f4', borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  childRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#e8eef7' },
  childAvatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#dcecff' },
  childTextBox: { flex: 1, marginLeft: 16 },
  childName: { color: '#071e60', fontSize: 18, fontWeight: '700' },
  childEmail: { color: '#6a748c', fontSize: 12, marginTop: 3 },
  childrenStateBox: { borderWidth: 1, borderColor: '#e0e8f4', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 18, marginBottom: 12, alignItems: 'center' },
  childrenStateTitle: { color: '#071e60', fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  childrenStateText: { color: '#4c5877', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8 },
  childrenErrorText: { color: '#a32929', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  dashedButton: { height: 48, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  dashedButtonText: { fontSize: 17, fontWeight: '700' },
  statsPanel: { minHeight: 88, borderWidth: 1, borderColor: '#e0e8f4', borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, backgroundColor: '#ffffff' },
  greenStatsPanel: { backgroundColor: '#fbfffd', borderColor: '#d7f1e5' },
  statItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderRightWidth: 1, borderRightColor: '#e0e8f4' },
  statTextBox: { alignItems: 'center', marginTop: 4 },
  statValue: { color: '#071e60', fontSize: 23, fontWeight: '800', lineHeight: 28 },
  statLabel: { color: '#4c5877', fontSize: 12, textAlign: 'center', marginTop: 3 },
  messageList: { borderWidth: 1, borderColor: '#e0e8f4', borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  messageRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#e8eef7' },
  messageAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  messageInitial: { color: '#ffffff', fontSize: 20, fontWeight: '800' },
  messageBody: { flex: 1, paddingRight: 8 },
  messageSender: { color: '#071e60', fontSize: 14, fontWeight: '800', marginBottom: 3 },
  messageText: { color: '#4c5877', fontSize: 13, lineHeight: 18 },
  messageMeta: { alignItems: 'flex-end', gap: 8 },
  messageTime: { color: '#8790a7', fontSize: 12 },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#0065ff' },
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 82, paddingTop: 10, paddingBottom: 12, borderTopWidth: 1, borderTopColor: '#e6edf7', backgroundColor: '#ffffff', flexDirection: 'row', justifyContent: 'space-around', shadowColor: '#0f2b5f', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.05, shadowRadius: 14, elevation: 8 },
  navItem: { alignItems: 'center', justifyContent: 'center', minWidth: 56 },
  navLabel: { color: '#46536c', fontSize: 12, marginTop: 4, fontWeight: '600' },
  navLabelActive: { color: '#0065ff' },
});











