import { API } from '../constants/ApiConfig';

export const createOrder = async (orderPayload) => {
  try {
    const response = await fetch(API.ORDERS.CREATE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    });

    if (!response.ok) {
      throw new Error('Error creating order');
    }

    return await response.json();
  } catch (error) {
    console.error('createOrdes error:', error);
    throw error;
  }
};
