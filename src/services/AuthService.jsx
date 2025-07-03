import AsyncStorage from '@react-native-async-storage/async-storage';

import { API } from '../constants/ApiConfig';

export const loginUser = async ({ username, password }) => {
  const response = await fetch(API.AUTH.LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (response.status === 403) {
    throw new Error('No tienes permisos para acceder');
  }

  if (!response.ok) {
    const err = await response.text();
    throw new Error(err || 'Credenciales incorrectas');
  }

  const result = await response.json();
  return result.token || result.jwt;
};

export const getUserInfo = async (token) => {
  const response = await fetch(API.AUTH.USER_INFO, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('No se pudo obtener el perfil');
  }

  return await response.json();
};

export const logoutUser = async (navigation) => {
  try {
    await AsyncStorage.removeItem('authToken');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  } catch (err) {
    console.error('Error al cerrar sesión', err);
  }
};
