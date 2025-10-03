import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserInfo } from '../../services/AuthService';
import { COLOR } from '../../constants/Color';

const SessionLoaderScreen = ({ navigation }) => {
  useEffect(() => {
    const checkSession = async () => {
      try {
        const storedData = await AsyncStorage.getItem('userInfo');

        if (!storedData) {
          navigation.replace('Login');
          return;
        }

        const userInfo = JSON.parse(storedData);
        const token = userInfo?.token;

        if (!token) {
          await AsyncStorage.removeItem('userInfo');
          navigation.replace('Login');
          return;
        }

        const user = await getUserInfo(token);
        const role = user.roles?.[0]?.replace('ROLE_', '') || 'CUSTOMER';

        navigation.reset({
          index: 0,
          routes: [{ name: 'RoleRouter', params: { role } }],
        });
      } catch (err) {
        console.log('Error en checkSession:', err.message);
        await AsyncStorage.removeItem('userInfo'); // remove if corrupted
        navigation.replace('Login');
      }
    };

    checkSession();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLOR.green} />
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
