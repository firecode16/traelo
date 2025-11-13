import axios from 'axios';
import { API } from '../constants/ApiConfig';

// Registrar múltiples comisiones en una sola petición (batch)
export const registerZoneCommissionsBatch = async (zoneCommissionsPayload) => {
  try {
    const response = await axios.post(API.COMMISSIONS.CREATE_BATCH, zoneCommissionsPayload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error registering zone commissions batch:', error);
    throw error;
  }
};

// Registrar una sola comisión
export const registerZoneCommission = async (commissionData) => {
  try {
    const backendPayload = {
      zoneCommissionId: commissionData.zoneCommissionId,
      shippingType: commissionData.shippingType,
      selectedOption: commissionData.selectedOption,
      commissionAmount: commissionData.commissionAmount,
      address: commissionData.address,
      coordinates: commissionData.coordinates,
      deliveryZone: {
        deliveryZoneId: commissionData.deliveryZoneId,
      },
      business: {
        businessId: commissionData.businessId,
      },
      createdAt: commissionData.createdAt,
      updatedAt: commissionData.updatedAt,
    };

    const response = await axios.post(API.COMMISSIONS.CREATE, backendPayload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    return response.data;
  } catch (error) {
    console.error('❌ Error registering zone commission:', error);
    throw error;
  }
};

// Obtener comisiones por negocio
export const getCommissionsByBusiness = async (businessId) => {
  try {
    const response = await axios.get(API.COMMISSIONS.GET_BY_BUSINESS(businessId), {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching commissions:', error);
    throw error;
  }
};

export const updateZoneCommissionOptions = async (commissionPayload) => {
  try {
    const url = API.COMMISSIONS.UPDATE_ZONE_COMMISSION_OPTIONS;

    const response = await axios.put(url, commissionPayload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    return response.data;
  } catch (error) {
    console.error('❌ Error updating zone commission options:', error);
    throw error;
  }
};
