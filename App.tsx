import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { DetailScreen } from './src/screens/DetailScreen';
import { FormScreen } from './src/screens/FormScreen';
import { ListScreen } from './src/screens/ListScreen';
import { colors } from './src/theme';
import type { RootStackParamList } from './src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.ink,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen
          name="List"
          component={ListScreen}
          options={{ title: 'Сотрудники' }}
        />
        <Stack.Screen
          name="Detail"
          component={DetailScreen}
          options={{ title: 'Карточка' }}
        />
        <Stack.Screen
          name="Form"
          component={FormScreen}
          options={({ route }) => ({
            title: route.params?.id ? 'Редактирование' : 'Новый сотрудник',
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
