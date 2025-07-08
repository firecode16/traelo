import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CustomersTabsNavigation from '../CustomersTabsNavigation';
import BusinessDetailScreen from '../../screens/user/BusinessDetailScreen';
import CartScreen from '../../screens/user/CartScreen';

const Stack = createNativeStackNavigator();

const CustomerStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Home"
      component={CustomersTabsNavigation}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="BusinessDetail"
      component={BusinessDetailScreen}
      options={{
        headerTitle: 'Menú',
        headerTitleStyle: { fontFamily: 'Poppins-SemiBold', fontSize: 20 },
      }}
    />
    <Stack.Screen
      name="Cart"
      component={CartScreen}
      options={{
        headerTitle: 'Tu carrito',
        headerTitleStyle: { fontFamily: 'Poppins-SemiBold', fontSize: 20 },
      }}
    />
  </Stack.Navigator>
);

export default CustomerStack;
