import React from 'react';
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
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Menú"
        component={BusinessMenuScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Horarios"
        component={BusinessScheduleScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Perfil"
        component={BusinessProfileScreen}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
};

export default BusinessTabsNavigation;
