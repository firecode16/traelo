import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SessionLoaderScreen from '../screens/binding/SessionLoaderScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
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
        name="RoleRouter"
        component={RoleRouter}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigation;
