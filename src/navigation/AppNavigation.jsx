import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SessionLoaderScreen from '../screens/binding/SessionLoaderScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import RecoveryPasswordScreen from '../screens/auth/RecoveryPasswordScreen';
import TermsScreen from '../screens/policy/TermsScreen';
import PrivacyScreen from '../screens/policy/PrivacyScreen';
import RoleRouter from './routes/RoleRouter';

const Stack = createNativeStackNavigator();

const AppNavigation = () => {
  return (
    <Stack.Navigator initialRouteName="SessionLoader">
      <Stack.Screen
        name="SessionLoader"
        component={SessionLoaderScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          headerTitle: 'Registrar',
          headerTitleStyle: { fontFamily: 'Poppins-SemiBold', fontSize: 20 },
        }}
      />
      <Stack.Screen
        name="RecoveryPassword"
        component={RecoveryPasswordScreen}
        options={{
          headerTitle: 'Recuperar Contraseña',
          headerTitleStyle: { fontFamily: 'Poppins-SemiBold', fontSize: 20 },
        }}
      />
      <Stack.Screen
        name="Terms"
        component={TermsScreen}
        options={{
          headerTitle: 'Terminos y Condiciones',
          headerTitleStyle: { fontFamily: 'Poppins-SemiBold', fontSize: 20 },
        }}
      />
      <Stack.Screen
        name="Privacy"
        component={PrivacyScreen}
        options={{
          headerTitle: 'Política de Privacidad',
          headerTitleStyle: { fontFamily: 'Poppins-SemiBold', fontSize: 20 },
        }}
      />
      <Stack.Screen
        name="RoleRouter"
        component={RoleRouter}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigation;
