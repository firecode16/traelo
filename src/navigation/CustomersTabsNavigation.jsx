import { TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

import HomeScreen from '../screens/user/HomeScreen';
import ProfileScreen from '../screens/user/ProfileScreen';
import SearchBar from '../components/SearchBar';

const Tab = createBottomTabNavigator();

const CustomersTabsNavigation = ({ navigation }) => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Inicio':
              iconName = 'home-outline';
              break;
            case 'Perfil':
              iconName = 'person-outline';
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#F97316',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
        options={{
          headerShown: true,
          title: 'Inicio',
          headerTitle: () => <SearchBar />,
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontFamily: 'Poppins-SemiBold',
            fontSize: 20,
            color: '#f97316',
          },
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={({ navigation }) => ({
          headerShown: true,
          title: 'Perfil',
          headerTitleStyle: {
            fontFamily: 'Poppins-SemiBold',
            fontSize: 20,
            color: '#f97316',
          },
          headerRight: () => (
            <TouchableOpacity
              onPress={async () => {
                await AsyncStorage.removeItem('userInfo');
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }}
              style={{ marginRight: 16 }}
            >
              <Ionicons name="log-out-outline" size={25} color="#ef4444" />
            </TouchableOpacity>
          ),
        })}
      />
    </Tab.Navigator>
  );
};

export default CustomersTabsNavigation;
