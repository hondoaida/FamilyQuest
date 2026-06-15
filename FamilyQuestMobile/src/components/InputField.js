import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export function InputField({ label, placeholder, icon, onRightActionPress, ...textInputProps }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <FieldIcon type={icon} />
        <TextInput style={styles.input} placeholder={placeholder} placeholderTextColor="#8b95a7" {...textInputProps} />
        {onRightActionPress ? (
          <Pressable onPress={onRightActionPress} hitSlop={8} style={styles.eyeButton}>
            <EyeIcon />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function FieldIcon({ type }) {
  if (type === 'mail') {
    return (
      <View style={styles.iconBox}>
        <View style={styles.mailIcon}>
          <View style={styles.mailFlapLeft} />
          <View style={styles.mailFlapRight} />
        </View>
      </View>
    );
  }

  if (type === 'lock') {
    return (
      <View style={styles.iconBox}>
        <View style={styles.lockShackle} />
        <View style={styles.lockBody}>
          <View style={styles.lockDot} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.iconBox}>
      <View style={styles.personHead} />
      <View style={styles.personBody} />
    </View>
  );
}

function EyeIcon() {
  return (
    <View style={styles.eyeIcon}>
      <View style={styles.eyePupil} />
    </View>
  );
}

const styles = StyleSheet.create({
  inputGroup: { marginBottom: 14 },
  inputLabel: { color: '#052461', fontSize: 15, fontWeight: '700', marginBottom: 8 },
  inputWrapper: {
    minHeight: 58,
    borderWidth: 1,
    borderColor: '#cfd6e2',
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    backgroundColor: '#ffffff',
  },
  iconBox: { width: 34, height: 30, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  personHead: { width: 10, height: 10, borderWidth: 2, borderColor: '#7b8494', borderRadius: 8, marginBottom: 2 },
  personBody: { width: 24, height: 12, borderWidth: 2, borderColor: '#7b8494', borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottomWidth: 0 },
  mailIcon: { width: 24, height: 17, borderWidth: 2, borderColor: '#7b8494', borderRadius: 3 },
  mailFlapLeft: { position: 'absolute', left: 2, top: 3, width: 13, height: 2, backgroundColor: '#7b8494', transform: [{ rotate: '32deg' }] },
  mailFlapRight: { position: 'absolute', right: 2, top: 3, width: 13, height: 2, backgroundColor: '#7b8494', transform: [{ rotate: '-32deg' }] },
  lockShackle: { width: 14, height: 13, borderWidth: 2, borderColor: '#7b8494', borderBottomWidth: 0, borderTopLeftRadius: 8, borderTopRightRadius: 8, marginBottom: -3 },
  lockBody: { width: 22, height: 17, borderWidth: 2, borderColor: '#7b8494', borderRadius: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' },
  lockDot: { width: 4, height: 4, borderRadius: 3, backgroundColor: '#7b8494' },
  input: { flex: 1, color: '#17233c', fontSize: 16, paddingVertical: 14 },
  eyeButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  eyeIcon: { width: 27, height: 18, borderWidth: 2, borderColor: '#7b8494', borderRadius: 14, alignItems: 'center', justifyContent: 'center', transform: [{ scaleY: 0.72 }] },
  eyePupil: { width: 8, height: 8, borderRadius: 5, backgroundColor: '#7b8494' },
});
