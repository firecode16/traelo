const BASE_URL_AUTH = 'http://localhost:8082/api'; // 🔁 Change environment
const BASE_URL_BUSINESS = 'http://localhost:8083/api'; // 🔁 Change environment

export { BASE_URL_AUTH, BASE_URL_BUSINESS };

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
    UPDATE_BUSINESS_BY_USER: (userId) => `${BASE_URL_BUSINESS}/business/updateBusiness/${userId}`,
    UPDATE_LOGO_BUSINESS_BY_ID: (businessId) => `${BASE_URL_BUSINESS}/business/updateLogo/${businessId}`,
    GET_BUSINESS_LOGO_BY_ID: (businessId) => `${BASE_URL_BUSINESS}/business/getLogo/${businessId}`,
  },
  MENU: {
    CREATE: `${BASE_URL_BUSINESS}/menu/create`,
    UPDATE: (menuId) => `${BASE_URL_BUSINESS}/menu/update/${menuId}`,
    DELETE: (menuId) => `${BASE_URL_BUSINESS}/menu/delete/${menuId}`,
    GET_BY_BUSINESS: (businessId) => `${BASE_URL_BUSINESS}/menu/getMenusByBusiness/${businessId}`,
  },
  SCHEDULES: {
    CREATE: `${BASE_URL_BUSINESS}/schedules/create`,
    UPDATE: (schedulerId) => `${BASE_URL_BUSINESS}/schedules/update/${schedulerId}`,
    GET_BY_BUSINESS: (businessId) => `${BASE_URL_BUSINESS}/schedules/getSchedulesByBusiness/${businessId}`,
  },
};
