import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import type { Employee, EmployeeInput } from '../types/employee';

const STORAGE_KEY = 'staffphoto.employees';
const PHOTOS_DIR = `${FileSystem.documentDirectory}employee-photos/`;

async function ensurePhotosDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PHOTOS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
  }
}

async function readAll(): Promise<Employee[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Employee[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(employees: Employee[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
}

export async function getEmployees(): Promise<Employee[]> {
  const employees = await readAll();
  return employees.sort((a, b) =>
    a.lastName.localeCompare(b.lastName, 'ru', { sensitivity: 'base' })
  );
}

export async function getEmployee(id: string): Promise<Employee | null> {
  const employees = await readAll();
  return employees.find((e) => e.id === id) ?? null;
}

async function persistPhoto(sourceUri: string | null, employeeId: string): Promise<string | null> {
  if (!sourceUri) return null;
  if (sourceUri.startsWith(PHOTOS_DIR)) return sourceUri;

  await ensurePhotosDir();
  const extension = sourceUri.split('.').pop()?.split('?')[0] || 'jpg';
  const dest = `${PHOTOS_DIR}${employeeId}.${extension}`;
  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  return dest;
}

export async function createEmployee(input: EmployeeInput): Promise<Employee> {
  const employees = await readAll();
  const now = new Date().toISOString();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const photoUri = await persistPhoto(input.photoUri, id);

  const employee: Employee = {
    id,
    lastName: input.lastName.trim(),
    firstName: input.firstName.trim(),
    middleName: input.middleName.trim(),
    photoUri,
    createdAt: now,
    updatedAt: now,
  };

  employees.push(employee);
  await writeAll(employees);
  return employee;
}

export async function updateEmployee(id: string, input: EmployeeInput): Promise<Employee | null> {
  const employees = await readAll();
  const index = employees.findIndex((e) => e.id === id);
  if (index < 0) return null;

  const existing = employees[index];
  const photoUri = await persistPhoto(input.photoUri, id);

  if (existing.photoUri && existing.photoUri !== photoUri) {
    try {
      await FileSystem.deleteAsync(existing.photoUri, { idempotent: true });
    } catch {
      // ignore missing file
    }
  }

  const updated: Employee = {
    ...existing,
    lastName: input.lastName.trim(),
    firstName: input.firstName.trim(),
    middleName: input.middleName.trim(),
    photoUri,
    updatedAt: new Date().toISOString(),
  };

  employees[index] = updated;
  await writeAll(employees);
  return updated;
}

export async function deleteEmployee(id: string): Promise<void> {
  const employees = await readAll();
  const existing = employees.find((e) => e.id === id);
  if (existing?.photoUri) {
    try {
      await FileSystem.deleteAsync(existing.photoUri, { idempotent: true });
    } catch {
      // ignore missing file
    }
  }
  await writeAll(employees.filter((e) => e.id !== id));
}

export function fullName(employee: Pick<Employee, 'lastName' | 'firstName' | 'middleName'>): string {
  return [employee.lastName, employee.firstName, employee.middleName]
    .filter(Boolean)
    .join(' ');
}
