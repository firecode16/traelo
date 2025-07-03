import { API } from '../constants/ApiConfig';

export const registerUser = async (userData) => {
  try {
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
    return result;
  } catch (err) {
    throw err;
  }
};
