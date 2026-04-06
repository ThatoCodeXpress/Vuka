import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AlarmProvider } from '@/context/AlarmContext';
import { AppNavigator } from '@/navigation';
import { ActiveAlarmModal } from '@/components/ActiveAlarmModal';
import { StyleSheet } from 'react-native';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AlarmProvider>
          <NavigationContainer>
            <AppNavigator />
            <ActiveAlarmModal />
          </NavigationContainer>
        </AlarmProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
