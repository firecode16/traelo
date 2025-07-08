import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BusinessTabsNavigation from '../BusinessTabsNavigation';

const Stack = createNativeStackNavigator();

const BusinessStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Business"
      component={BusinessTabsNavigation}
      options={{
        headerShown: false,
        headerBackVisible: false,
        title: 'Tu tablero',
        headerTitleStyle: { fontFamily: 'Poppins-SemiBold', fontSize: 20 },
      }}
    />
  </Stack.Navigator>
);

export default BusinessStack;
