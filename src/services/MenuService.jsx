import { API } from '../constants/ApiConfig';

export const getMenusByBusiness = async (businessId) => {
  try {
    const response = await fetch(API.MENU.GET_BY_BUSINESS(businessId));
    if (!response.ok) throw new Error('Error al obtener menús');
    return await response.json();
  } catch (error) {
    console.error('getMenusByBusiness error:', error);
    throw error;
  }
};

export const createMenu = async (menuData) => {
  try {
    const response = await fetch(API.MENU.CREATE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(menuData),
    });
    if (!response.ok) throw new Error('Error al crear menú');
    return await response.json();
  } catch (error) {
    console.error('createMenu error:', error);
    throw error;
  }
};

export const updateMenu = async (menuId, menuData) => {
  try {
    const response = await fetch(API.MENU.UPDATE(menuId), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(menuData),
    });
    if (!response.ok) throw new Error('Error al actualizar menú');
    return await response.json();
  } catch (error) {
    console.error('updateMenu error:', error);
    throw error;
  }
};

export const deleteMenu = async (menuId) => {
  try {
    const response = await fetch(API.MENU.DELETE(menuId), {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar menú');
    return await response.text();
  } catch (error) {
    console.error('deleteMenu error:', error);
    throw error;
  }
};
