import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { createEmployee, getEmployee, updateEmployee } from '../storage/employees';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Form'>;
type Route = RouteProp<RootStackParamList, 'Form'>;

export function FormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const editId = route.params?.id;
  const isEdit = Boolean(editId);

  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editId) return;
    let active = true;
    (async () => {
      const employee = await getEmployee(editId);
      if (!active) return;
      if (!employee) {
        Alert.alert('Ошибка', 'Сотрудник не найден');
        navigation.goBack();
        return;
      }
      setLastName(employee.lastName);
      setFirstName(employee.firstName);
      setMiddleName(employee.middleName);
      setPhotoUri(employee.photoUri);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [editId, navigation]);

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Нет доступа', 'Разрешите доступ к галерее, чтобы выбрать фото.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
      aspect: [3, 4],
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Нет доступа', 'Разрешите доступ к камере, чтобы сделать фото.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      allowsEditing: true,
      aspect: [3, 4],
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const onSave = async () => {
    if (!lastName.trim() || !firstName.trim()) {
      Alert.alert('Проверьте данные', 'Укажите фамилию и имя.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        lastName,
        firstName,
        middleName,
        photoUri,
      };
      if (isEdit && editId) {
        const updated = await updateEmployee(editId, payload);
        if (updated) {
          navigation.navigate('Detail', { id: updated.id });
        }
      } else {
        const created = await createEmployee(payload);
        navigation.replace('Detail', { id: created.id });
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить сотрудника.');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={styles.photoBox} onPress={pickPhoto}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />
          ) : (
            <View style={styles.photoEmpty}>
              <Text style={styles.photoEmptyTitle}>Добавить фото</Text>
              <Text style={styles.photoEmptyHint}>Нажмите, чтобы выбрать из галереи</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.photoActions}>
          <Pressable style={styles.secondaryBtn} onPress={pickPhoto}>
            <Text style={styles.secondaryBtnText}>Галерея</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={takePhoto}>
            <Text style={styles.secondaryBtnText}>Камера</Text>
          </Pressable>
          {photoUri ? (
            <Pressable style={styles.secondaryBtn} onPress={() => setPhotoUri(null)}>
              <Text style={[styles.secondaryBtnText, styles.dangerText]}>Убрать</Text>
            </Pressable>
          ) : null}
        </View>

        <LabeledInput label="Фамилия *" value={lastName} onChangeText={setLastName} />
        <LabeledInput label="Имя *" value={firstName} onChangeText={setFirstName} />
        <LabeledInput label="Отчество" value={middleName} onChangeText={setMiddleName} />

        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            (saving || pressed) && styles.saveBtnPressed,
          ]}
          onPress={onSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>{isEdit ? 'Сохранить' : 'Создать'}</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function LabeledInput({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        placeholderTextColor={colors.placeholder}
        autoCapitalize="words"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  photoBox: {
    height: 280,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  photoEmptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 6,
  },
  photoEmptyHint: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  photoActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  secondaryBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  secondaryBtnText: {
    color: colors.ink,
    fontWeight: '600',
  },
  dangerText: {
    color: colors.danger,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
  },
  saveBtn: {
    marginTop: 8,
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnPressed: {
    opacity: 0.9,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
