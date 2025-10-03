import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({});
  const STORAGE_KEY = '@traelo_cart';

  // 📥 Cargar carrito guardado al iniciar la app
  useEffect(() => {
    const loadCart = async () => {
      try {
        const storedCart = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedCart) {
          setCart(JSON.parse(storedCart));
        }
      } catch (error) {
        console.error('❌ Error cargando carrito de AsyncStorage:', error);
      }
    };
    loadCart();
  }, []);

  // 💾 Guardar carrito en cada cambio
  useEffect(() => {
    const saveCart = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
      } catch (error) {
        console.error('❌ Error guardando carrito en AsyncStorage:', error);
      }
    };
    if (Object.keys(cart).length > 0) {
      saveCart();
    } else {
      AsyncStorage.removeItem(STORAGE_KEY);
    }
  }, [cart]);

  // Agregar, actualizar o eliminar un producto del carrito
  const addToCart = (businessId, menuId, quantity, businessInfo = null) => {
    setCart((prevCart) => {
      const currentBusiness = prevCart[businessId] || {
        business: businessInfo,
        items: {},
      };

      // No sobreescribir la información del negocio si ya existe
      const updatedBusiness = {
        ...currentBusiness,
        business: prevCart[businessId]?.business || businessInfo,
      };

      const updatedItems = { ...currentBusiness.items };

      if (quantity > 0) {
        updatedItems[menuId] = quantity;
      } else {
        delete updatedItems[menuId];
      }

      return {
        ...prevCart,
        [businessId]: {
          ...updatedBusiness,
          items: updatedItems,
        },
      };
    });
  };

  // Eliminar un producto específico
  const removeFromCart = (businessId, menuId) => {
    setCart((prevCart) => {
      if (!prevCart[businessId]) return prevCart;

      const updatedItems = { ...prevCart[businessId].items };
      delete updatedItems[menuId];

      return {
        ...prevCart,
        [businessId]: {
          ...prevCart[businessId],
          items: updatedItems,
        },
      };
    });
  };

  // Vaciar carrito de un negocio
  const clearCartForBusiness = (businessId) => {
    setCart((prevCart) => {
      const updatedCart = { ...prevCart };
      delete updatedCart[businessId];
      return updatedCart;
    });
  };

  // Vaciar todos los carritos
  const clearCart = async () => {
    setCart({});
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  // Obtener total de items de un negocio
  const getTotalItems = (businessId) => {
    if (!cart[businessId]?.items) return 0;
    return Object.values(cart[businessId].items).reduce(
      (sum, qty) => sum + qty,
      0,
    );
  };

  return (
    <CartContext.Provider
      value={{cart, addToCart, removeFromCart, clearCart, clearCartForBusiness, getTotalItems}}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
