import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useCallback } from 'react';

import DashboardScreen from './src/screens/DashboardScreen';
import BlogsListScreen from './src/screens/BlogsListScreen';
import HomeScreen from './src/screens/HomeScreen'; // Keep for reference if needed, but not primary

import ProgramsScreen from './src/screens/ProgramsScreen';
import FAQScreen from './src/screens/FAQScreen';
import TestimonialsScreen from './src/screens/TestimonialsScreen';
import BasicDetailsScreen from './src/screens/BasicDetailsScreen';
import TrainersScreen from './src/screens/TrainersScreen';
import TransformationScreen from './src/screens/TransformationScreen';
import UserDataScreen from './src/screens/UserDataScreen';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <View style={styles.container} onLayout={onLayoutRootView}>
        <StatusBar style="auto" />
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Dashboard"
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right'
            }}
          >
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="BlogsList" component={BlogsListScreen} />
            <Stack.Screen name="Components" component={HomeScreen} />

            <Stack.Screen name="Programs" component={ProgramsScreen} />
            <Stack.Screen name="FAQ" component={FAQScreen} />
            <Stack.Screen name="Testimonials" component={TestimonialsScreen} />
            <Stack.Screen name="BasicDetails" component={BasicDetailsScreen} />
            <Stack.Screen name="Trainers" component={TrainersScreen} />
            <Stack.Screen name="Transformation" component={TransformationScreen} />
            <Stack.Screen name="UserData" component={UserDataScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
