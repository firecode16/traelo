import axios from 'axios';
import { API } from '../constants/ApiConfig';

export const registerDeliveryZone = async (deliveryZoneData) => {
  try {
    const response = await axios.post(API.ZONES.CREATE, deliveryZoneData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    console.error('❌ registerDeliveryZone error:', error);
    throw error;
  }
};

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

export const updateDeliveryZoneOptions = async (businessId, updatedOptions) => {
  try {
    const url = API.ZONES.UPDATE_OPTIONS(businessId);

    const response = await axios.put(url, updatedOptions, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    return response.data;
  } catch (error) {
    console.error('❌ Error updating delivery zone options:', error);
    console.error('❌ Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
    });
    throw error;
  }
};
