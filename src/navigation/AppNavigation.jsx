import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/auth/LoginScreen';
import TabNavigation from './TabNavigation';
import BusinessDetailScreen from '../screens/user/BusinessDetailScreen';
import CartScreen from '../screens/user/CartScreen';

const Stack = createNativeStackNavigator();

const AppNavigation = () => {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Home"
        component={TabNavigation}
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
};

export default AppNavigation;
