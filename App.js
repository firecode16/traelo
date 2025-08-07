import React from 'react';
import { useFonts } from 'expo-font';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigation from './src/navigation/AppNavigation';

export default function App() {
  const [fontsLoaded] = useFonts({
    'Roboto-Medium': require('./src/assets/fonts/roboto/Roboto-Medium.ttf'),
    'Roboto-Regular': require('./src/assets/fonts/roboto/Roboto-Regular.ttf'),
    'Poppins-Regular': require('./src/assets/fonts/poppins/Poppins-Regular.ttf'),
    'Poppins-Light': require('./src/assets/fonts/poppins/Poppins-Light.ttf'),
    'Poppins-SemiBold': require('./src/assets/fonts/poppins/Poppins-SemiBold.ttf'),
  });

  React.useEffect(() => {}, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigation />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
