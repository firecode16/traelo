const BASE_URL = 'https://traelo-gateway-production.up.railway.app/api'; // 🔁 Change environment

export { BASE_URL };

export const API = {
  AUTH: {
    LOGIN: `${BASE_URL}/auth/login`,
    SIGNUP: `${BASE_URL}/auth/signup`,
    USER_INFO: `${BASE_URL}/auth/userInfo`,
    UPDATE: (userId) => `${BASE_URL}/auth/update/${userId}`,
    RESET_PASSWORD: `${BASE_URL}/auth/resetPassword`,
    REFRESH_TOKEN: `${BASE_URL}/auth/refreshToken`,
  },
  BUSINESS: {
    CREATE: `${BASE_URL}/business/create`,
    GET_BY_USER: (userId) => `${BASE_URL}/business/getByUser/${userId}`,
    UPDATE_BUSINESS_BY_USER: (userId) => `${BASE_URL}/business/updateBusiness/${userId}`,
    UPDATE_LOGO_BUSINESS_BY_ID: (businessId) => `${BASE_URL}/business/updateLogo/${businessId}`,
    GET_BUSINESS_LOGO_BY_ID: (businessId) => `${BASE_URL}/business/getLogo/${businessId}`,
    GET_ALL: `${BASE_URL}/business/getAll`,
    GET_DASHBOARD: (businessId) => `${BASE_URL}/business/${businessId}/dashboard`,
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
  SECTORS: {
    CREATE: `${BASE_URL}/sectors/create`,
    GET_BY_SECTOR: (sectorId) => `${BASE_URL}/sectors/getSectorById/${sectorId}`,
    GET_BY_BUSINESS: (businessId) => `${BASE_URL}/sectors/getSectorByBusinessId/${businessId}`,
  },
  ZONES: {
    CREATE: `${BASE_URL}/zones-coverage/create`,
    GET_BY_BUSINESS: (businessId) => `${BASE_URL}/zones-coverage/getDeliveryZonesByBusiness/${businessId}`,
    UPDATE_OPTIONS: (businessId) => `${BASE_URL}/zones-coverage/${businessId}/update-options`,
  },
  COMMISSIONS: {
    CREATE_BATCH: `${BASE_URL}/zone-commissions/batch`,
    CREATE: `${BASE_URL}/zone-commissions/create`,
    GET_BY_BUSINESS: (businessId) => `${BASE_URL}/zone-commissions/getZoneCommissionByBusiness/${businessId}`,
  },
};
