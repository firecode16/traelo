import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MallTabsNavigation from '../MallTabsNavigation';
import BusinessDetail from '../../screens/mall/shared/BusinessDetail';
import ShoppingCart from '../../screens/mall/shared/ShoppingCart';

const Stack = createNativeStackNavigator();

const MallStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Home"
      component={MallTabsNavigation}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="BusinessDetail"
      component={BusinessDetail}
      options={{
        headerTitle: 'Detalle del negocio',
        headerTitleStyle: {
          fontFamily: 'Roboto-Medium',
          fontSize: 20,
          color: '#121212ff',
        },
      }}
    />
    <Stack.Screen
      name="ShoppingCart"
      component={ShoppingCart}
      options={{
        headerTitle: 'Tu carrito',
        headerTitleStyle: {
          fontFamily: 'Roboto-Medium',
          fontSize: 20,
          color: '#121212ff',
        },
      }}
    />
  </Stack.Navigator>
);

export default MallStack;
