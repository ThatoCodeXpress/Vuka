import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS } from '@/constants/colors';

import HomeScreen from '@/screens/HomeScreen';
import HistoryScreen from '@/screens/HistoryScreen';
import LibraryScreen from '@/screens/LibraryScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import AddAlarmScreen from '@/screens/AddAlarmScreen';
import EditAlarmScreen from '@/screens/EditAlarmScreen';
import { Alarm } from '@/context/AlarmContext';

export type RootStackParamList = {
  MainTabs: undefined;
  AddAlarm: undefined;
  EditAlarm: { alarm: Alarm };
};

export type TabParamList = {
  Alarms: undefined;
  History: undefined;
  Library: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.mutedForeground,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            Alarms: 'bell',
            History: 'trending-up',
            Library: 'grid',
            Settings: 'settings',
          };
          return <Icon name={icons[route.name] ?? 'circle'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Alarms" component={HomeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="AddAlarm" component={AddAlarmScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="EditAlarm" component={EditAlarmScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
