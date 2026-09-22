import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { deleteEmployee, fullName, getEmployee } from '../storage/employees';
import { colors } from '../theme';
import type { Employee } from '../types/employee';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Detail'>;
type Route = RouteProp<RootStackParamList, 'Detail'>;

export function DetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        const data = await getEmployee(route.params.id);
        if (active) {
          setEmployee(data);
          setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [route.params.id])
  );

  const onDelete = () => {
    if (!employee) return;
    Alert.alert('Удалить сотрудника?', fullName(employee), [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          await deleteEmployee(employee.id);
          navigation.navigate('List');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!employee) {
    return (
      <View style={styles.centered}>
        <Text style={styles.missing}>Сотрудник не найден</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {employee.photoUri ? (
        <Image source={{ uri: employee.photoUri }} style={styles.photo} contentFit="cover" />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Text style={styles.photoPlaceholderText}>Нет фото</Text>
        </View>
      )}

      <View style={styles.fields}>
        <Field label="Фамилия" value={employee.lastName} />
        <Field label="Имя" value={employee.firstName} />
        <Field label="Отчество" value={employee.middleName || '—'} />
      </View>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
          onPress={() => navigation.navigate('Form', { id: employee.id })}
        >
          <Text style={styles.primaryBtnText}>Редактировать</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.dangerBtn, pressed && styles.pressed]}
          onPress={onDelete}
        >
          <Text style={styles.dangerBtnText}>Удалить</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  missing: {
    fontSize: 16,
    color: colors.muted,
  },
  photo: {
    width: '100%',
    height: 320,
    backgroundColor: colors.accentSoft,
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    color: colors.muted,
    fontSize: 16,
  },
  fields: {
    marginTop: 8,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  field: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  fieldLabel: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 18,
    color: colors.ink,
    fontWeight: '600',
  },
  actions: {
    padding: 20,
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  dangerBtn: {
    backgroundColor: colors.dangerSoft,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  dangerBtnText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
});
