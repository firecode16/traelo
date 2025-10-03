import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLOR } from '../constants/Color';

import HomeScreen from '../screens/mall/HomeScreen';
import MallOrchestrator from '../orchestrator/MallOrchestrator';
import ShoppingCart from '../screens/mall/shared/ShoppingCart';
import ProfileScreen from '../screens/user/ProfileScreen';
import LogoTraeloHeaderTitle from '../util/TraeloHeaderTitle';
import { useCart } from '../contexts/CartContext';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();

// Stack del tab Inicio
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={({ navigation }) => ({
        headerShown: false,
        mallScreenOptions: {
          headerShown: true,
          headerTitle: '',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerLeft: () => (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', height: 85 }}
            >
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ paddingRight: 12 }}
              >
                <Ionicons name="arrow-back" size={24} color="black" />
              </TouchableOpacity>
              <LogoTraeloHeaderTitle />
            </View>
          ),
        },
      })}
    >
      <HomeStack.Screen name="HomeScreen" component={HomeScreen} />
      <HomeStack.Screen
        name="MallOrchestrator"
        component={MallOrchestrator}
        options={({ navigation }) => ({
          headerShown: true,
          headerTitle: '',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerLeft: () => (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', height: 85 }}
            >
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ paddingRight: 12 }}
              >
                <Ionicons name="arrow-back" size={24} color="black" />
              </TouchableOpacity>
              <LogoTraeloHeaderTitle />
            </View>
          ),
        })}
      />
    </HomeStack.Navigator>
  );
}

const MallTabsNavigation = () => {
  const { clearCart } = useCart();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 70,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 10,
        },
      }}
    >
      {/* Inicio en HomeStackNavigator */}
      <Tab.Screen
        name="Inicio"
        component={HomeStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="home-outline"
              size={24}
              color={focused ? COLOR.green : '#9CA3AF'}
            />
          ),
        }}
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            const state = navigation.getState();
            const tabRoute = state.routes.find((r) => r.name === route.name);
            const nestedState = tabRoute?.state;
            const currentRoute = nestedState?.routes?.[nestedState.index]?.name;

            //⚡️Cancela el reset si YA estás en Inicio y la pantalla actual NO es HomeScreen
            if (navigation.isFocused() && currentRoute !== 'HomeScreen') {
              e.preventDefault();
            }
          },
        })}
      />

      <Tab.Screen
        name="Carrito"
        component={ShoppingCart}
        options={{
          tabBarButton: (props) => (
            <TouchableOpacity {...props} style={styles.cartButton} disabled={true}>
              <View style={styles.cartCircle}>
                <Ionicons name="cart-outline" size={24} color="#fff" />
              </View>
            </TouchableOpacity>
          ),
        }}
      />

      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={({ navigation }) => ({
          headerShown: true,
          headerTitle: 'Perfil del usuario',
          headerTitleStyle: {
            fontFamily: 'Roboto-Medium',
            fontSize: 20,
            color: COLOR.green,
          },
          headerRight: () => (
            <TouchableOpacity
              onPress={async () => {
                clearCart();
                await AsyncStorage.removeItem('userInfo');
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }}
              style={{ marginRight: 20 }}
            >
              <Ionicons name="log-out-outline" size={25} color="#ef4444" />
            </TouchableOpacity>
          ),
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="person-outline"
              size={24}
              color={focused ? COLOR.green : '#9CA3AF'}
            />
          ),
        })}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  cartButton: {
    top: -20, // Eleva el círculo
    alignItems: 'center',
    justifyContent: 'center',
    display: 'none',
  },
  cartCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLOR.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLOR.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default MallTabsNavigation;
