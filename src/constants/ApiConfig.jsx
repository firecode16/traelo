const BASE_URL = 'https://traelo-gateway-production.up.railway.app/api'; // 🔁 Change environment

export { BASE_URL };

export const API = {
  AUTH: {
    LOGIN: `${BASE_URL}/auth/login`,
    SIGNUP: `${BASE_URL}/auth/signup`,
    USER_INFO: `${BASE_URL}/auth/userInfo`,
    UPDATE: (userId) => `${BASE_URL}/auth/update/${userId}`,
  },
  BUSINESS: {
    CREATE: `${BASE_URL}/business/create`,
    GET_BY_USER: (userId) => `${BASE_URL}/business/getByUser/${userId}`,
    UPDATE_BUSINESS_BY_USER: (userId) => `${BASE_URL}/business/updateBusiness/${userId}`,
    UPDATE_LOGO_BUSINESS_BY_ID: (businessId) => `${BASE_URL}/business/updateLogo/${businessId}`,
    GET_BUSINESS_LOGO_BY_ID: (businessId) => `${BASE_URL}/business/getLogo/${businessId}`,
    GET_ALL: `${BASE_URL}/business/getAll`
  },
  MENU: {
    CREATE: `${BASE_URL}/menu/create`,
    UPDATE: (menuId) => `${BASE_URL}/menu/update/${menuId}`,
    DELETE: (menuId) => `${BASE_URL}/menu/delete/${menuId}`,
    GET_BY_BUSINESS: (businessId) => `${BASE_URL}/menu/getMenusByBusiness/${businessId}`,
    GET_IMAGE_BY_MENU_ID: (menuId) => `${BASE_URL}/menu/getImage/${menuId}`,
  },
  SCHEDULES: {
    CREATE: `${BASE_URL}/schedules/create`,
    UPDATE: (schedulerId) => `${BASE_URL}/schedules/update/${schedulerId}`,
    GET_BY_BUSINESS: (businessId) => `${BASE_URL}/schedules/getSchedulesByBusiness/${businessId}`,
  },
  ORDERS: {
    CREATE: `${BASE_URL}/orders/createWithItems`,
  },
};
