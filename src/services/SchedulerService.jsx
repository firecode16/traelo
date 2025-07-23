import { API } from '../constants/ApiConfig';

export const createScheduler = async (scheduleData) => {
  try {
    const response = await fetch(API.SCHEDULES.CREATE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessId: scheduleData.businessId,
        isActive: scheduleData.isActive,
        schedulerId: scheduleData.schedulerId,
      }),
    });

    if (!response.ok) {
      throw new Error('Error creating scheduler');
    }

    return await response.json();
  } catch (error) {
    console.error('createScheduler error:', error);
    throw error;
  }
};

export const getSchedulesByBusiness = async (businessId) => {
  try {
    const response = await fetch(API.SCHEDULES.GET_BY_BUSINESS(businessId), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 404) {
      return null; // <- muy importante
    }

    if (!response.ok) {
      throw new Error('Error fetching schedules');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getSchedulesByBusiness():', error);
    throw error;
  }
};

export const updateScheduler = async (schedulerId, scheduleData) => {
  try {
    const response = await fetch(API.SCHEDULES.UPDATE(schedulerId), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduleData),
    });

    if (!response.ok) {
      throw new Error('Error updating scheduler');
    }

    return await response.json();
  } catch (error) {
    console.error('updateScheduler error:', error);
    throw error;
  }
};
