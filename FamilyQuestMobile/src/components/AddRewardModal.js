import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const icons = {
  chevronRight: require('../../assets/home-icons/chevron-right.png'),
  star: require('../../assets/child-home/star.png'),
  bell: require('../../assets/home-icons/bell.png'),
};

const rewardIconOptions = [
  { key: 'gamepad', label: 'Igra', source: require('../../assets/reward-items/gamepad.png'), color: '#eee4ff' },
  { key: 'ice-cream', label: 'Sladoled', source: require('../../assets/reward-items/ice-cream.png'), color: '#ffdce8' },
  { key: 'travel-car', label: 'Izlet', source: require('../../assets/reward-items/travel-car.png'), color: '#e7f8d9' },
  { key: 'picnic', label: 'Piknik', source: require('../../assets/reward-items/picnic.png'), color: '#fff0ba' },
  { key: 'shopping-bag', label: 'Kupovina', source: require('../../assets/reward-items/shopping-bag.png'), color: '#e8f2ff' },
  { key: 'suitcase', label: 'Putovanje', source: require('../../assets/reward-items/suitcase.png'), color: '#f0ecff' },
];

const timeOptions = [
  { label: 'Danas', offsetDays: 0 },
  { label: 'Sutra', offsetDays: 1 },
  { label: 'Za 3 dana', offsetDays: 3 },
  { label: 'Za 7 dana', offsetDays: 7 },
];

export function AddRewardModal({ visible, child, onClose, onSubmit }) {
  const [rewardName, setRewardName] = useState('');
  const [points, setPoints] = useState('');
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedIcon, setSelectedIcon] = useState(rewardIconOptions[0]);
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const titleCounter = useMemo(() => `${rewardName.length} / 50`, [rewardName]);

  const resetForm = () => {
    setRewardName('');
    setPoints('');
    setSelectedTime(null);
    setSelectedIcon(rewardIconOptions[0]);
    setIsTimeOpen(false);
    setErrorMessage('');
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    const trimmedName = rewardName.trim();
    const parsedPoints = Number(points);

    if (!child) {
      setErrorMessage('Prvo odaberite dijete kojem dodajete nagradu.');
      return;
    }

    if (!trimmedName) {
      setErrorMessage('Unesite naziv nagrade.');
      return;
    }

    if (trimmedName.length > 50) {
      setErrorMessage('Naziv nagrade može imati najviše 50 karaktera.');
      return;
    }

    if (!Number.isInteger(parsedPoints) || parsedPoints < 0 || parsedPoints > 5000) {
      setErrorMessage('Bodovi moraju biti cijeli broj od 0 do 5000.');
      return;
    }

    if (!selectedTime) {
      setErrorMessage('Odaberite vrijeme za ostvarenje.');
      return;
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + selectedTime.offsetDays);

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await onSubmit({
        childId: child.childId ?? child.userId ?? child.id,
        name: trimmedName,
        requiredPoints: parsedPoints,
        dueDate: dueDate.toISOString(),
        rewardIcon: selectedIcon.key,
      });

      resetForm();
      onClose();
    } catch (error) {
      setErrorMessage(error.message || 'Dodavanje nagrade nije uspjelo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Dodaj nagradu</Text>
            <Pressable style={styles.closeButton} onPress={handleClose} hitSlop={10} disabled={isSubmitting}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <FieldFrame label="Naziv nagrade">
            <GiftIcon size={31} color="#536079" />
            <TextInput
              style={styles.input}
              value={rewardName}
              editable={!isSubmitting}
              onChangeText={(value) => {
                if (value.length <= 50) {
                  setRewardName(value);
                }
              }}
              placeholder="Unesi naziv nagrade"
              placeholderTextColor="#9aa3b5"
            />
            <Text style={styles.counterText}>{titleCounter}</Text>
          </FieldFrame>

          <FieldFrame label="Bodovi">
            <Icon source={icons.star} size={32} color="#ffc20e" />
            <TextInput
              style={styles.input}
              value={points}
              editable={!isSubmitting}
              onChangeText={(value) => setPoints(value.replace(/[^0-9]/g, ''))}
              placeholder="Unesi broj bodova"
              placeholderTextColor="#9aa3b5"
              keyboardType="number-pad"
            />
            <Text style={styles.counterText}>0 - 5000</Text>
          </FieldFrame>

          <View style={styles.timeWrapper}>
            <FieldFrame label="Vrijeme za ostvarenje">
              <Icon source={icons.bell} size={31} color="#536079" />
              <Pressable
                style={styles.timePressable}
                onPress={() => setIsTimeOpen((current) => !current)}
                disabled={isSubmitting}
              >
                <Text style={[styles.timeText, selectedTime && styles.timeTextSelected]}>
                  {selectedTime?.label || 'Odaberi vrijeme'}
                </Text>
              </Pressable>
              <Image source={icons.chevronRight} style={styles.downIcon} resizeMode="contain" />
            </FieldFrame>

            {isTimeOpen ? (
              <View style={styles.optionsBox}>
                {timeOptions.map((option) => (
                  <Pressable
                    key={option.label}
                    style={styles.optionRow}
                    onPress={() => {
                      setSelectedTime(option);
                      setIsTimeOpen(false);
                    }}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.optionText}>{option.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.iconPickerBlock}>
            <Text style={styles.iconPickerTitle}>Ikonica nagrade</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconOptionsRow}>
              {rewardIconOptions.map((option) => {
                const isSelected = selectedIcon.key === option.key;
                return (
                  <Pressable
                    key={option.key}
                    style={[styles.rewardIconOption, isSelected && styles.rewardIconOptionSelected]}
                    onPress={() => setSelectedIcon(option)}
                    disabled={isSubmitting}
                  >
                    <View style={[styles.rewardIconImageBox, { backgroundColor: option.color }]}>
                      <Image source={option.source} style={styles.rewardIconImage} resizeMode="contain" />
                    </View>
                    <Text style={[styles.rewardIconLabel, isSelected && styles.rewardIconLabelSelected]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <View style={styles.actionsRow}>
            <Pressable style={[styles.secondaryButton, isSubmitting && styles.disabledButton]} onPress={handleClose} disabled={isSubmitting}>
              <Text style={styles.secondaryButtonText}>Odustani</Text>
            </Pressable>
            <Pressable style={[styles.primaryButton, isSubmitting && styles.disabledButton]} onPress={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>Dodaj</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function FieldFrame({ label, children }) {
  return (
    <View style={styles.fieldFrame}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldContent}>{children}</View>
    </View>
  );
}

function Icon({ source, size, color }) {
  return <Image source={source} style={{ width: size, height: size, tintColor: color }} resizeMode="contain" />;
}

function GiftIcon({ size, color }) {
  const scale = size / 31;

  return (
    <View style={[styles.giftIcon, { width: size, height: size }]}>
      <View style={[styles.giftLid, { width: 27 * scale, height: 8 * scale, borderColor: color, borderRadius: 3 * scale }]} />
      <View style={[styles.giftBox, { width: 23 * scale, height: 18 * scale, borderColor: color, borderRadius: 3 * scale }]} />
      <View style={[styles.giftRibbonVertical, { width: 3 * scale, backgroundColor: color }]} />
      <View style={[styles.giftRibbonHorizontal, { height: 3 * scale, backgroundColor: color, top: 10 * scale }]} />
      <View style={[styles.giftBowLeft, { width: 8 * scale, height: 7 * scale, borderColor: color, borderRadius: 7 * scale, left: 6 * scale }]} />
      <View style={[styles.giftBowRight, { width: 8 * scale, height: 7 * scale, borderColor: color, borderRadius: 7 * scale, right: 6 * scale }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.42)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  modalCard: { width: '100%', maxWidth: 390, borderRadius: 18, backgroundColor: '#ffffff', paddingHorizontal: 22, paddingTop: 22, paddingBottom: 22, shadowColor: '#0f2b5f', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.16, shadowRadius: 24, elevation: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  title: { color: '#071e60', fontSize: 27, fontWeight: '800' },
  closeButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#536079', fontSize: 39, lineHeight: 39, fontWeight: '300' },
  fieldFrame: { minHeight: 66, borderWidth: 1, borderColor: '#dce3ef', borderRadius: 12, marginBottom: 18, justifyContent: 'center' },
  fieldLabel: { position: 'absolute', left: 72, top: -11, backgroundColor: '#ffffff', paddingHorizontal: 10, color: '#4c5877', fontSize: 13, fontWeight: '700' },
  fieldContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, minHeight: 66 },
  input: { flex: 1, color: '#17233c', fontSize: 17, paddingVertical: 13, marginLeft: 14 },
  counterText: { color: '#7b8499', fontSize: 12, marginLeft: 8 },
  timeWrapper: { zIndex: 2 },
  timePressable: { flex: 1, minHeight: 54, justifyContent: 'center', marginLeft: 14 },
  timeText: { color: '#9aa3b5', fontSize: 17 },
  timeTextSelected: { color: '#17233c' },
  downIcon: { width: 22, height: 22, tintColor: '#536079', transform: [{ rotate: '90deg' }] },
  optionsBox: { marginTop: -12, marginBottom: 14, borderWidth: 1, borderColor: '#dce3ef', borderRadius: 12, backgroundColor: '#ffffff', overflow: 'hidden' },
  optionRow: { height: 44, justifyContent: 'center', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#edf1f7' },
  optionText: { color: '#071e60', fontSize: 15, fontWeight: '700' },
  iconPickerBlock: { marginTop: -2, marginBottom: 18 },
  iconPickerTitle: { color: '#4c5877', fontSize: 13, fontWeight: '800', marginBottom: 10 },
  iconOptionsRow: { gap: 10, paddingRight: 2 },
  rewardIconOption: { width: 78, minHeight: 86, borderWidth: 1, borderColor: '#e0e8f4', borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, backgroundColor: '#ffffff' },
  rewardIconOptionSelected: { borderColor: '#0ca85d', backgroundColor: '#effced' },
  rewardIconImageBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rewardIconImage: { width: 36, height: 36 },
  rewardIconLabel: { color: '#536079', fontSize: 11, fontWeight: '700', marginTop: 6, textAlign: 'center' },
  rewardIconLabelSelected: { color: '#0ca85d' },
  errorText: { color: '#a32929', fontSize: 13, lineHeight: 19, marginBottom: 14, textAlign: 'center' },
  actionsRow: { flexDirection: 'row', gap: 14, marginTop: 2 },
  secondaryButton: { flex: 1, height: 54, borderRadius: 10, borderWidth: 1.5, borderColor: '#0ca85d', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' },
  secondaryButtonText: { color: '#0ca85d', fontSize: 17, fontWeight: '800' },
  primaryButton: { flex: 1, height: 54, borderRadius: 10, backgroundColor: '#0ca85d', alignItems: 'center', justifyContent: 'center', shadowColor: '#0ca85d', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 5 },
  disabledButton: { opacity: 0.7 },
  primaryButtonText: { color: '#ffffff', fontSize: 17, fontWeight: '800' },
  giftIcon: { alignItems: 'center', justifyContent: 'flex-end' },
  giftLid: { borderWidth: 2 },
  giftBox: { borderWidth: 2, marginTop: 2 },
  giftRibbonVertical: { bottom: 0, height: 19, position: 'absolute' },
  giftRibbonHorizontal: { left: 3, position: 'absolute', right: 3 },
  giftBowLeft: { borderWidth: 2, position: 'absolute', top: 0, transform: [{ rotate: '-28deg' }] },
  giftBowRight: { borderWidth: 2, position: 'absolute', top: 0, transform: [{ rotate: '28deg' }] },
});
