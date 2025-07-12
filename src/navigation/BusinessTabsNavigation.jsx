import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';

import BusinessOrdersScreen from '../screens/business/BusinessOrdersScreen';
import BusinessMenuScreen from '../screens/business/BusinessMenuScreen';
import BusinessScheduleScreen from '../screens/business/BusinessScheduleScreen';
import BusinessProfileScreen from '../screens/business/BusinessProfileScreen';

const Tab = createBottomTabNavigator();

const BusinessTabsNavigation = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Pedidos':
              iconName = 'receipt-outline';
              break;
            case 'Menú':
              iconName = 'restaurant-outline';
              break;
            case 'Horarios':
              iconName = 'time-outline';
              break;
            case 'Perfil':
              iconName = 'person-outline';
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#F97316',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Pedidos"
        component={BusinessOrdersScreen}
        options={{
          headerShown: true,
          title: 'Pedidos',
          headerTitleStyle: {
            fontFamily: 'Poppins-SemiBold',
            fontSize: 20,
            color: '#f97316',
          },
        }}
      />
      <Tab.Screen
        name="Menú"
        component={BusinessMenuScreen}
        options={{
          headerShown: true,
          title: 'Menú',
          headerTitleStyle: {
            fontFamily: 'Poppins-SemiBold',
            fontSize: 20,
            color: '#f97316',
          },
        }}
      />
      <Tab.Screen
        name="Horarios"
        component={BusinessScheduleScreen}
        options={{
          headerShown: true,
          title: 'Horarios',
          headerTitleStyle: {
            fontFamily: 'Poppins-SemiBold',
            fontSize: 20,
            color: '#f97316',
          },
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={BusinessProfileScreen}
        options={({ navigation }) => ({
          headerShown: true,
          title: 'Perfil',
          headerTitleStyle: {
            fontFamily: 'Poppins-SemiBold',
            fontSize: 20,
            color: '#f97316',
          },
          headerRight: () => (
            <TouchableOpacity
              onPress={async () => {
                await AsyncStorage.removeItem('userInfo');
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }}
              style={{ marginRight: 16 }}
            >
              <Ionicons name="log-out-outline" size={25} color="#ef4444" />
            </TouchableOpacity>
          ),
        })}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: '#f97316',
  },
});
export default BusinessTabsNavigation;
