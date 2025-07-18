const BASE_URL_AUTH = 'http://localhost:8082/api'; // 🔁 Change environment
const BASE_URL_BUSINESS = 'http://localhost:8083/api'; // 🔁 Change environment

export const API = {
  AUTH: {
    LOGIN: `${BASE_URL_AUTH}/auth/login`,
    SIGNUP: `${BASE_URL_AUTH}/auth/signup`,
    USER_INFO: `${BASE_URL_AUTH}/auth/userInfo`,
    UPDATE: (userId) => `${BASE_URL_AUTH}/auth/update/${userId}`,
  },
  BUSINESS: {
    CREATE: `${BASE_URL_BUSINESS}/business/create`,
    GET_BY_USER: (userId) => `${BASE_URL_BUSINESS}/business/getByUser/${userId}`,
    UPDATE: (userId) => `${BASE_URL_BUSINESS}/business/update/${userId}`,
    GET_ALL: `${BASE_URL_BUSINESS}/business/getAll`,
  },
  ORDERS: {
    CREATE: `${BASE_URL_BUSINESS}/orders`,
    GET_BY_CUSTOMER: (id) => `${BASE_URL_BUSINESS}/orders/customer/${id}`,
  },
  MENU: {
    CREATE: `${BASE_URL_BUSINESS}/menu/create`,
    UPDATE: (menuId) => `${BASE_URL_BUSINESS}/menu/update/${menuId}`,
    DELETE: (menuId) => `${BASE_URL_BUSINESS}/menu/delete/${menuId}`,
    GET_BY_BUSINESS: (businessId) => `${BASE_URL_BUSINESS}/menu/getMenusByBusiness/${businessId}`,
  },
};
