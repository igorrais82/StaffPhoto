import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EmployeeCard } from '../components/EmployeeCard';
import { fullName, getEmployees } from '../storage/employees';
import { colors } from '../theme';
import type { Employee } from '../types/employee';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'List'>;

export function ListScreen() {
  const navigation = useNavigation<Nav>();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        const data = await getEmployees();
        if (active) {
          setEmployees(data);
          setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  const filtered = employees.filter((e) =>
    fullName(e).toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Поиск по ФИО"
          placeholderTextColor={colors.placeholder}
          style={styles.search}
          clearButtonMode="while-editing"
        />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.accent} />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            {employees.length === 0 ? 'Пока нет сотрудников' : 'Ничего не найдено'}
          </Text>
          <Text style={styles.emptyText}>
            {employees.length === 0
              ? 'Нажмите «Добавить», чтобы создать первую карточку с фото.'
              : 'Попробуйте изменить запрос поиска.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EmployeeCard
              employee={item}
              onPress={() => navigation.navigate('Detail', { id: item.id })}
            />
          )}
          contentContainerStyle={styles.list}
        />
      )}

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => navigation.navigate('Form', {})}
        accessibilityRole="button"
        accessibilityLabel="Добавить сотрудника"
      >
        <Text style={styles.fabText}>+ Добавить</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.bg,
  },
  search: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
  },
  list: {
    paddingBottom: 100,
  },
  loader: {
    marginTop: 40,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabPressed: {
    opacity: 0.9,
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
