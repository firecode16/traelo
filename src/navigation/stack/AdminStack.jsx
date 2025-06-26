import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminScreen from '../../screens/admin/AdminScreen';

const Stack = createNativeStackNavigator();

const AdminStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Admin"
      component={AdminScreen}
      options={{
        headerShown: true,
        headerBackVisible: false,
        title: 'Tu tablero',
        headerTitleStyle: { fontFamily: 'Poppins-SemiBold', fontSize: 20 },
      }}
    />
  </Stack.Navigator>
);

export default AdminStack;
