const BASE_URL = 'http://localhost:8082/api'; // 🔁 Change environment

export { BASE_URL };

export const API = {
  AUTH: {
    LOGIN: `${BASE_URL}/auth/login`,
    SIGNUP: `${BASE_URL}/auth/signup`,
    USER_INFO: `${BASE_URL}/auth/userInfo`,
  },
  ORDERS: {
    CREATE: `${BASE_URL}/orders`,
    GET_BY_CUSTOMER: (id) => `${BASE_URL}/orders/customer/${id}`,
  },
  MENUS: {
    LIST_BY_BUSINESS: (businessId) =>
      `${BASE_URL}/menus/business/${businessId}`,
  },
};
