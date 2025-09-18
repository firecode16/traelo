import AsyncStorage from '@react-native-async-storage/async-storage';

import { getBusinessByUserId } from './BusinessService';
import { decodeJWT } from '../util/JwtUtils';
import { API } from '../constants/ApiConfig';

export const loginUser = async ({ identifier, password }) => {
  try {
    const response = await fetch(API.AUTH.LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });

    if (response.status === 403) {
      throw new Error('No tienes permisos para acceder');
    }

    if (!response.ok) {
      const err = await response.text();
      throw new Error(err || 'Credenciales incorrectas');
    }

    const result = await response.json();
    const claims = decodeJWT(result.token);
    console.log('Claims JWT:', claims);

    let business = { businessId: '', description: '', address: '', acceptCash: false, acceptTransfer: false, bankClabe: '', bankCard: '', pickUp: false, atHome: false };

    if (claims.role && claims.role[0] === 'ROLE_BUSINESS') {
      const res = await getBusinessByUserId(claims.userId);
      business.businessId = res.businessId || '';
      business.description = res.description || '';
      business.address = res.address || '';
      business.acceptCash = res.acceptCash || false;
      business.acceptTransfer = res.acceptTransfer || false;
      business.bankClabe = res.bankClabe || '';
      business.bankCard = res.bankCard || '';
      business.pickUp = res.pickUp || false;
      business.atHome = res.atHome || false;
    }

    const userData = {
      token: result.token,
      userId: claims.userId,
      username: claims.username,
      fullName: claims.fullName, // --> Use fullName as business name
      email: claims.email,
      phone: claims.phone,
      businessId: business.businessId || '',
      description: business.description || '',
      address: business.address || '',
      acceptCash: business.acceptCash || false,
      acceptTransfer: business.acceptTransfer || false,
      bankClabe: business.bankClabe || '',
      bankCard: business.bankCard || '',
      pickUp: business.pickUp || false,
      atHome: business.atHome || false,
      role: claims.role[0],
      createdAt: claims.date,
    };

    await AsyncStorage.setItem('userInfo', JSON.stringify(userData));
    return result.token || result.jwt;
  } catch (error) {
    console.log('Error de red o fetch:', error.message);
  }
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

export const updateUser = async (userId, userData) => {
  try {
    const response = await fetch(API.AUTH.UPDATE(userId), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error('Error al actualizar el usuario');
    }

    return await response.json();
  } catch (error) {
    console.error('updateUser error:', error);
    throw error;
  }
};

export const logoutUser = async (navigation) => {
  try {
    await AsyncStorage.removeItem('userInfo');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  } catch (err) {
    console.error('Error al cerrar sesión', err);
  }
};

export const resetPassword = async (identifier, newPassword) => {
  try {
    const response = await fetch(API.AUTH.RESET_PASSWORD, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: identifier.trim(),
        newPassword: newPassword,
      }),
    });

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text || 'Error desconocido' };
    }

    if (response.ok) {
      return {
        success: true,
        message: 'Tu contraseña ha sido restablecida correctamente',
      };
    } else if (response.status === 404) {
      return {
        success: false,
        message: 'El nombre del usuario no existe. Por favor verifica e intenta nuevamente.',
      };
    } else {
      return {
        success: false,
        message: data.message || 'Ocurrió un error al restablecer tu contraseña',
      };
    }
  } catch (error) {
    console.error('Error en resetPassword:', error);
    return {
      success: false,
      message: 'No se pudo conectar al servidor: ' + error.message,
    };
  }
};
