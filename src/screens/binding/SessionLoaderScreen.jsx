import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserInfo } from '../../services/AuthService';
import { COLOR } from '../../constants/Color';

const SessionLoaderScreen = ({ navigation }) => {
  useEffect(() => {
    const checkSession = async () => {
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        navigation.replace('Login');
        return;
      }

      try {
        const user = await getUserInfo(token);
        const role = user.roles?.[0]?.replace('ROLE_', '') || 'CUSTOMER';

        navigation.reset({
          index: 0,
          routes: [{ name: 'RoleRouter', params: { role } }],
        });
      } catch (err) {
        await AsyncStorage.removeItem('authToken'); // invalid token
        navigation.replace('Login');
      }
    };

    checkSession();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLOR.orange} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLOR.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SessionLoaderScreen;
