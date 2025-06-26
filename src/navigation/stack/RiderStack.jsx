import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RiderScreen from '../../screens/rider/RiderScreen';

const Stack = createNativeStackNavigator();

const RiderStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Rider"
      component={RiderScreen}
      options={{
        headerShown: true,
        headerBackVisible: false,
        title: 'Tu tablero',
        headerTitleStyle: { fontFamily: 'Poppins-SemiBold', fontSize: 20 },
      }}
    />
  </Stack.Navigator>
);

export default RiderStack;
