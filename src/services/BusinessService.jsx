import { API } from '../constants/ApiConfig';

export const registerBusiness = async (claims, userData) => {
  try {
    const response = await fetch(API.BUSINESS.CREATE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessId: Date.now(), // Generar un ID único para el negocio
        userId: claims.userId,
        username: claims.username,
        fullName: claims.fullName, // --> Use fullName as business name
        email: claims.email,
        phone: claims.phone,
        address: userData.address,
        createdAt: userData.createdAt,
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

export const getBusinessByUserId = async (userId) => {
  try {
    const response = await fetch(API.BUSINESS.GET_BY_USER(userId), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Error al obtener el negocio');
    }
    return await response.json();
  } catch (error) {
    console.error('getBusinessByUserId error:', error);
    throw error;
  }
};

export const updateBusiness = async (userId, businessData) => {
  try {
    const response = await fetch(API.BUSINESS.UPDATE(userId), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(businessData),
    });

    if (!response.ok) {
      throw new Error('Error al actualizar el negocio');
    }

    return await response.json();
  } catch (error) {
    console.error('updateBusiness error:', error);
    throw error;
  }
};
