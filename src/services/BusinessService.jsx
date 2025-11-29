import { API } from '../constants/ApiConfig';

export const registerBusiness = async (businessPayload) => {
  try {
    const response = await fetch(API.BUSINESS.CREATE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(businessPayload),
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

export const getAllBusinesses = async (sector, page = 0, size = 10, filters = {}) => {
  const params = new URLSearchParams({
    sector: sector,
    page: page.toString(),
    size: size.toString(),
  });

  // 🎯 Solo enviar coordenadas GPS
  if (filters.lat && filters.lng) {
    params.append('lat', filters.lat.toString());
    params.append('lng', filters.lng.toString());
  }

  const url = `${API.BUSINESS.GET_ALL_BUSINESSES_BY_SECTOR}?${params.toString()}`;
  console.log('📍 URL de búsqueda:', url);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('getAllBusinesses error:', error);
    throw error;
  }
};

export const updateBusinessByUser = async (userId, businessData) => {
  try {
    const response = await fetch(API.BUSINESS.UPDATE_BUSINESS_BY_USER(userId), {
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

export const updateLogoBusinessById = async (businessId, logoData) => {
  try {
    const response = await fetch(API.BUSINESS.UPDATE_LOGO_BUSINESS_BY_ID(businessId), {
      method: 'PUT',
      body: logoData,
    });

    if (!response.ok) {
      throw new Error('Error al actualizar el logo del negocio');
    }

    return await response.json();
  } catch (error) {
    console.error('updateLogoBusiness error:', error);
    throw error;
  }
};

export const generateLogoUri = (businessId) => {
  return `${API.BUSINESS.GET_BUSINESS_LOGO_BY_ID(businessId)}?ts=${Date.now()}`;
};

export const getDashboardByBusinessId = async (businessId) => {
  try {
    const response = await fetch(API.BUSINESS.GET_DASHBOARD(businessId), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener el dashboard del negocio');
    }

    return await response.json();
  } catch (error) {
    console.error('getDashboardByBusinessId error:', error);
    throw error;
  }
};

export const updatePaymentMethods = async (paymentData) => {
  try {
    const response = await fetch(API.BUSINESS.UPDATE_PAYMENT_METHODS, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      throw new Error('❌ Error al actualizar los métodos de pago');
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && contentLength !== '0') {
      return await response.json();
    } else {
      return null;
    }
  } catch (error) {
    console.error('❌ Error updating payment method:', error);
    throw error;
  }
};

export const findNearbyZones = async (lat, lng, maxDistanceKm = 50) => {
  try {
    if (!lat || !lng || typeof lat !== 'number' || typeof lng !== 'number') {
      console.error('❌ Coordenadas inválidas:', { lat, lng });
      return [];
    }
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      maxDistanceKm: maxDistanceKm.toString(),
    });

    const url = `${API.BUSINESS.GET_NEARBY_ZONES}?${params.toString()}`;

    console.log('📍 Buscando zonas en URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`❌ Error ${response.status} buscando zonas:`, await response.text());
      return [];
    }

    const zones = await response.json();
    console.log(`✅ Zonas encontradas: ${zones.length}`);
    return zones;
  } catch (error) {
    console.error('❌ Error en findNearbyZones:', error.message);
    return [];
  }
};
