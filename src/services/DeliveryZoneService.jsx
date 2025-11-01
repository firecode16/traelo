import axios from 'axios';
import { API } from '../constants/ApiConfig';

export const registerDeliveryZone = async (deliveryZoneData) => {
  try {
    const response = await axios.post(API.ZONES.CREATE, deliveryZoneData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10Sec de espera
    });
    return response.data;
  } catch (error) {
    console.error('❌ registerDeliveryZone error:', error);
    throw error;
  }
};

// Obtener todas las zonas de entrega asociadas a un negocio
export const getDeliveryZonesByBusiness = async (businessId) => {
  try {
    const response = await axios.get(API.ZONES.GET_BY_BUSINESS(businessId), {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching delivery zones:', error);
    throw error;
  }
};
