import { API } from '../constants/ApiConfig';
import { decodeJWT } from '../util/JwtUtils';

export const registerUser = async (userPayload) => {
  try {
    const response = await fetch(API.AUTH.SIGNUP, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Error al registrar');
    }

    const result = await response.json();
    const claims = decodeJWT(result.token);

    return { ...result, claims };
  } catch (err) {
    console.error('registerUser error:', err);
    throw err;
  }
};
