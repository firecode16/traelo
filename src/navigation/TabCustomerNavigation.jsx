import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from '@expo/vector-icons/AntDesign';

import HomeScreen from '../screens/user/HomeScreen';
import ProfileScreen from '../screens/user/ProfileScreen';

import SearchBar from '../components/SearchBar';
import { COLOR } from '../constants/Color';

const Tab = createBottomTabNavigator();

const TabCustomerNavigation = ({ navigation }) => {
  return (
    <Tab.Navigator
      initialRouteName="Inicio"
      screenOptions={{
        tabBarActiveTintColor: COLOR.red,
        tabBarInactiveTintColor: COLOR.gray,
        tabBarOptions: {
          showLabel: false,
          style: { borderTopColor: 'transparent' },
        },
        tabBarLabelStyle: {
          fontFamily: 'Poppins-SemiBold',
          fontSize: 12,
          lineHeight: 22,
        },
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
        options={{
          headerShown: true,
          title: 'Inicio',
          headerBackVisible: false, // automatic hidde if exist
          headerTitle: () => <SearchBar />,
          headerTitleAlign: 'center',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={25}
              color={focused ? COLOR.red : COLOR.gray}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <AntDesign
              name={focused ? 'user' : 'user'}
              size={25}
              color={focused ? COLOR.red : COLOR.gray}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabCustomerNavigation;
