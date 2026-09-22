import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fullName } from '../storage/employees';
import { colors } from '../theme';
import type { Employee } from '../types/employee';

type Props = {
  employee: Employee;
  onPress: () => void;
};

export function EmployeeCard({ employee, onPress }: Props) {
  const name = fullName(employee);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={name}
    >
      {employee.photoUri ? (
        <Image source={{ uri: employee.photoUri }} style={styles.photo} contentFit="cover" />
      ) : (
        <View style={[styles.photo, styles.placeholder]}>
          <Text style={styles.initials}>
            {(employee.lastName[0] || '?') + (employee.firstName[0] || '')}
          </Text>
        </View>
      )}
      <View style={styles.textBlock}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        <Text style={styles.hint}>Карточка сотрудника</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.accentSoft,
  },
  photo: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: colors.accentSoft,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.accent,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.ink,
  },
  hint: {
    fontSize: 13,
    color: colors.muted,
  },
});
