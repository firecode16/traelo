import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';

import BusinessHomeScreen from '../screens/business/BusinessHomeScreen';
import BusinessOrdersScreen from '../screens/business/BusinessOrdersScreen';
import BusinessScheduleScreen from '../screens/business/BusinessScheduleScreen';
import BusinessProfileScreen from '../screens/business/BusinessProfileScreen';
import PaymentPlanScreen from '../screens/business/payments/PaymentPlanScreen';
import SectorOrchestrator from '../orchestrator/SectorOrchestrator';
import { COLOR } from '../constants/Color';
import { getSectorByBusinessId } from '../services/SectorService';

const Tab = createBottomTabNavigator();

const BusinessTabsNavigation = () => {
  const [productTabName, setProductTabName] = useState('Menú');
  const [sectorData, setSectorData] = useState(null);
  const [sectorLoading, setSectorLoading] = useState(true);

  useEffect(() => {
    const fetchSectorData = async () => {
      try {
        setSectorLoading(true);
        const stored = await AsyncStorage.getItem('userInfo');

        if (stored) {
          const user = JSON.parse(stored);
          const businessId = user.businessId;

          if (businessId) {
            const sectorInfo = await getSectorByBusinessId(businessId);
            setSectorData(sectorInfo);
            console.log('Sector Info:', sectorInfo);

            if (sectorInfo && sectorInfo.displayNameProductTab) {
              setProductTabName(sectorInfo.displayNameProductTab);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching sector data:', error);
      } finally {
        setSectorLoading(false);
      }
    };

    fetchSectorData();
  }, []);

  if (sectorLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLOR.green} />
        <Text style={styles.loadingText}>Cargando configuración...</Text>
      </View>
    );
  }

  const getProductTabIcon = (focused) => {
    if (productTabName === 'Catálogo') {
      return focused ? 'list' : 'list-outline';
    }
    return focused ? 'restaurant' : 'restaurant-outline';
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;

          switch (route.name) {
            case 'Inicio':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Pedidos':
              iconName = focused ? 'receipt' : 'receipt-outline';
              break;
            case 'Productos':
              iconName = getProductTabIcon(focused);
              break;
            case 'Horarios':
              iconName = focused ? 'time' : 'time-outline';
              break;
            case 'PaymentPlan':
              iconName = focused ? 'card' : 'card-outline';
              break;
            case 'Perfil':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLOR.green,
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerShown: true,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerTintColor: COLOR.green,
      })}
    >
      <Tab.Screen
        name="Inicio"
        component={BusinessHomeScreen}
        options={{ title: 'Inicio' }}
      />
      <Tab.Screen
        name="Pedidos"
        component={BusinessOrdersScreen}
        options={{ title: 'Pedidos' }}
      />
      <Tab.Screen
        name="Productos"
        component={SectorOrchestrator}
        initialParams={{ sector: sectorData }}
        options={{ title: productTabName }}
      />
      <Tab.Screen
        name="Horarios"
        component={BusinessScheduleScreen}
        options={{ title: 'Horarios' }}
      />
      <Tab.Screen
        name="PaymentPlan"
        component={PaymentPlanScreen}
        options={{ title: 'Pagos' }}
      />
      <Tab.Screen
        name="Perfil"
        component={BusinessProfileScreen}
        options={({ navigation }) => ({
          title: 'Perfil',
          headerRight: () => (
            <TouchableOpacity
              onPress={async () => {
                await AsyncStorage.removeItem('userInfo');
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }}
              style={styles.logoutButton}
            >
              <Ionicons name="log-out-outline" size={24} color="#EF4444" />
            </TouchableOpacity>
          ),
        })}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: COLOR.green,
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    height: 65,
    paddingBottom: 0,
    paddingTop: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabBarLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    marginTop: 2,
  },
  logoutButton: {
    marginRight: 16,
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
});

export default BusinessTabsNavigation;
