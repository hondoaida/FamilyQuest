import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const icons = {
  chevronRight: require('../../assets/home-icons/chevron-right.png'),
  clipboard: require('../../assets/home-icons/clipboard.png'),
  star: require('../../assets/home-icons/star.png'),
  bell: require('../../assets/home-icons/bell.png'),
};

const taskIconOptions = [
  { key: 'dishes', label: 'Suđe', source: require('../../assets/taskt-item/dishes.png'), color: '#dff4ff' },
  { key: 'bed', label: 'Soba', source: require('../../assets/taskt-item/bed.png'), color: '#efe5ff' },
  { key: 'laundry', label: 'Veš', source: require('../../assets/taskt-item/laundry.png'), color: '#e9f9e6' },
  { key: 'trash', label: 'Smeće', source: require('../../assets/taskt-item/trash.png'), color: '#e5f4ff' },
  { key: 'toys', label: 'Igračke', source: require('../../assets/taskt-item/toys.png'), color: '#fff1c8' },
  { key: 'notebook', label: 'Učenje', source: require('../../assets/taskt-item/notebook.png'), color: '#ffe5d3' },
  { key: 'vacum', label: 'Usisavanje', source: require('../../assets/taskt-item/vacum.png'), color: '#f0ecff' },
  { key: 'gardening', label: 'Bašta', source: require('../../assets/taskt-item/gardening.png'), color: '#e7f8d9' },
];

const timeOptions = [
  { label: 'Danas', offsetDays: 0 },
  { label: 'Sutra', offsetDays: 1 },
  { label: 'Za 3 dana', offsetDays: 3 },
  { label: 'Za 7 dana', offsetDays: 7 },
];

export function AddTaskModal({ visible, child, onClose, onSubmit }) {
  const [taskName, setTaskName] = useState('');
  const [points, setPoints] = useState('');
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedIcon, setSelectedIcon] = useState(taskIconOptions[0]);
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const titleCounter = useMemo(() => `${taskName.length} / 50`, [taskName]);

  const resetForm = () => {
    setTaskName('');
    setPoints('');
    setSelectedTime(null);
    setSelectedIcon(taskIconOptions[0]);
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
    const trimmedName = taskName.trim();
    const parsedPoints = Number(points);

    if (!child) {
      setErrorMessage('Prvo odaberite dijete kojem dodajete zadatak.');
      return;
    }

    if (!trimmedName) {
      setErrorMessage('Unesite naziv zadatka.');
      return;
    }

    if (trimmedName.length > 50) {
      setErrorMessage('Naziv zadatka može imati najviše 50 karaktera.');
      return;
    }

    if (!Number.isInteger(parsedPoints) || parsedPoints < 0 || parsedPoints > 500) {
      setErrorMessage('Bodovi moraju biti cijeli broj od 0 do 500.');
      return;
    }

    if (!selectedTime) {
      setErrorMessage('Odaberite vrijeme izvršenja.');
      return;
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + selectedTime.offsetDays);

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await onSubmit({
        childId: child.childId,
        name: trimmedName,
        points: parsedPoints,
        dueDate: dueDate.toISOString(),
        status: 1,
        taskIcon: selectedIcon.key,
      });

      resetForm();
      onClose();
    } catch (error) {
      setErrorMessage(error.message || 'Dodavanje zadatka nije uspjelo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Dodaj zadatak</Text>
            <Pressable style={styles.closeButton} onPress={handleClose} hitSlop={10} disabled={isSubmitting}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <FieldFrame label="Naziv zadatka">
            <Icon source={icons.clipboard} size={31} color="#536079" />
            <TextInput
              style={styles.input}
              value={taskName}
              editable={!isSubmitting}
              onChangeText={(value) => {
                if (value.length <= 50) {
                  setTaskName(value);
                }
              }}
              placeholder="Unesi naziv zadatka"
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
            <Text style={styles.counterText}>0 - 500</Text>
          </FieldFrame>

          <View style={styles.timeWrapper}>
            <FieldFrame label="Vrijeme izvršenja">
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
            <Text style={styles.iconPickerTitle}>Ikonica zadatka</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconOptionsRow}>
              {taskIconOptions.map((option) => {
                const isSelected = selectedIcon.key === option.key;
                return (
                  <Pressable
                    key={option.key}
                    style={[styles.taskIconOption, isSelected && styles.taskIconOptionSelected]}
                    onPress={() => setSelectedIcon(option)}
                    disabled={isSubmitting}
                  >
                    <View style={[styles.taskIconImageBox, { backgroundColor: option.color }]}>
                      <Image source={option.source} style={styles.taskIconImage} resizeMode="contain" />
                    </View>
                    <Text style={[styles.taskIconLabel, isSelected && styles.taskIconLabelSelected]}>{option.label}</Text>
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
  taskIconOption: { width: 72, minHeight: 86, borderWidth: 1, borderColor: '#e0e8f4', borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, backgroundColor: '#ffffff' },
  taskIconOptionSelected: { borderColor: '#0065ff', backgroundColor: '#f0f6ff' },
  taskIconImageBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  taskIconImage: { width: 36, height: 36 },
  taskIconLabel: { color: '#536079', fontSize: 11, fontWeight: '700', marginTop: 6, textAlign: 'center' },
  taskIconLabelSelected: { color: '#0065ff' },
  errorText: { color: '#a32929', fontSize: 13, lineHeight: 19, marginBottom: 14, textAlign: 'center' },
  actionsRow: { flexDirection: 'row', gap: 14, marginTop: 2 },
  secondaryButton: { flex: 1, height: 54, borderRadius: 10, borderWidth: 1.5, borderColor: '#0065ff', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' },
  secondaryButtonText: { color: '#0065ff', fontSize: 17, fontWeight: '800' },
  primaryButton: { flex: 1, height: 54, borderRadius: 10, backgroundColor: '#0065ff', alignItems: 'center', justifyContent: 'center', shadowColor: '#0065ff', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 5 },
  disabledButton: { opacity: 0.7 },
  primaryButtonText: { color: '#ffffff', fontSize: 17, fontWeight: '800' },
});
