import { API } from '../constants/ApiConfig';

export const getProductsByBusiness = async (businessId) => {
  try {
    const response = await fetch(API.PRODUCTS.GET_BY_PRODUCTS(businessId), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ getProductsByBusiness error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      url: API.PRODUCTS.GET_BY_PRODUCTS(businessId),
    });
    throw error;
  }
};

export const upsertProduct = async (formData) => {
  console.log('🚀 upsertProduct called with formData');

  try {
    const response = await fetch(API.PRODUCTS.UPSERT, {
      method: 'POST',
      body: formData,
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('✅ upsertProduct success:', data);
    return data;
  } catch (error) {
    console.error('❌ upsertProduct error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      url: API.PRODUCTS.UPSERT,
    });
    throw error;
  }
};

export const deleteProduct = async (productId) => {
  try {
    const response = await fetch(API.PRODUCTS.DELETE(productId), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
      console.log('📝 Respuesta de eliminación (texto):', text);
    }

    console.log('✅ deleteProduct success:', data);
    return data;
  } catch (error) {
    console.error('❌ deleteProduct error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      url: API.PRODUCTS.DELETE(productId),
    });
    throw error;
  }
};

export const getProductByProductId = async (productId) => {
  try {
    const response = await fetch(API.PRODUCTS.GET_BY_PRODUCT(productId), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ getProductByProductId error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      url: API.PRODUCTS.GET_BY_PRODUCT(productId),
    });
    throw error;
  }
};

export const getProductImage = (productId) => {
  return `${API.PRODUCTS.GET_IMAGE_BY_PRODUCT(productId)}?ts=${Date.now()}`;
};
