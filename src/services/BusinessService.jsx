import { API } from '../constants/ApiConfig';

export const registerBusiness = async (claims, address) => {
  try {
    const response = await fetch(API.BUSINESS.CREATE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: claims.userId,
        username: claims.username,
        name: claims.fullName,
        email: claims.email,
        phone: claims.phone,
        address: address,
        isActive: true,
      }),
    });

    if (!response.ok) {
      throw new Error('Error al registrar el negocio');
    }

    return await response.json();
  } catch (error) {
    console.error('registerBusiness error:', error);
    throw error;
  }
};
