import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BusinessScreen from '../../screens/business/BusinessScreen';

const Stack = createNativeStackNavigator();

const BusinessStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Business"
      component={BusinessScreen}
      options={{
        headerShown: true,
        headerBackVisible: false,
        title: 'Tu tablero',
        headerTitleStyle: { fontFamily: 'Poppins-SemiBold', fontSize: 20 },
      }}
    />
  </Stack.Navigator>
);

export default BusinessStack;
