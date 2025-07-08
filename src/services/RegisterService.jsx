import { API } from '../constants/ApiConfig';
import { decodeJWT } from '../util/JwtUtils';
import { registerBusiness } from './BusinessService';

export const registerUser = async (userData) => {
  try {
    console.log('userData enviado:', userData);
    const response = await fetch(API.AUTH.SIGNUP, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Error al registrar');
    }

    const result = await response.json();
    const claims = decodeJWT(result.token);

    if (userData.roles.includes('ROLE_BUSINESS')) {
      await registerBusiness(claims, userData.address);
    }
    return result;
  } catch (err) {
    throw err;
  }
};
