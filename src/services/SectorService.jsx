import axios from 'axios';
import { API } from '../constants/ApiConfig';

export const registerSector = async (sectorData) => {
  try {
    const response = await axios.post(API.SECTORS.CREATE, sectorData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10sec de espera máxima
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error registering sector:', error);
    throw error;
  }
};

export const getSectorBySectorId = async (sectorId) => {
  try {
    const response = await axios.get(API.SECTORS.GET_BY_SECTOR(sectorId), {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching sector:', error);
    throw error;
  }
};
