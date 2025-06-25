import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { COLOR } from '../../constants/Color';

const BusinessDetailScreen = ({ route, navigation }) => {
  const { item } = route.params; // negocio elegido
  const [cart, setCart] = useState([]);

  const [cartQuantities, setCartQuantities] = useState({});

  const increaseQuantity = (product) => {
    setCartQuantities((prev) => {
      const newQty = (prev[product.menuId] || 0) + 1;

      // actualizar cart real (solo si quieres que exista)
      const updatedCart = [...cart];
      const index = updatedCart.findIndex((p) => p.menuId === product.menuId);

      if (index !== -1) {
        updatedCart[index].quantity = newQty;
      } else {
        updatedCart.push({ ...product, quantity: newQty });
      }

      setCart(updatedCart);

      return { ...prev, [product.menuId]: newQty };
    });
  };

  const decreaseQuantity = (product) => {
    setCartQuantities((prev) => {
      const currentQty = prev[product.menuId] || 0;

      if (currentQty <= 1) {
        // eliminar del cart y cantidades
        const updatedCart = cart.filter((p) => p.menuId !== product.menuId);
        setCart(updatedCart);

        const copy = { ...prev };
        delete copy[product.menuId];
        return copy;
      }

      // reducir cantidad
      const newQty = currentQty - 1;
      const updatedCart = [...cart];
      const index = updatedCart.findIndex((p) => p.menuId === product.menuId);

      if (index !== -1) {
        updatedCart[index].quantity = newQty;
        setCart(updatedCart);
      }

      return { ...prev, [product.menuId]: newQty };
    });
  };

  /* --- Header con la info fija del negocio --- */
  const renderHeader = () => (
    <View>
      <Image source={item.photo} style={styles.image} />

      <Text style={styles.title}>{item.name}</Text>
      <View style={{ flexDirection: 'row' }}>
        <Ionicons name="storefront-outline" size={21} color="black" />
        <Text style={styles.subtitle}>{item.businessName}</Text>
      </View>
      <View style={{ flexDirection: 'row' }}>
        <AntDesign name="clockcircleo" size={20} color="black" />
        <Text style={styles.subtitle}>Abierto: {item.schedule}</Text>
      </View>
      <Text style={styles.sectionTitle}>Menú</Text>
    </View>
  );

  /* --- cada producto --- */
  const renderProduct = ({ item: product }) => (
    <View style={styles.productCard}>
      {/* imagen del producto */}
      <Image source={product.photo} style={styles.productImage} />

      {/* info del producto */}
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productPrice}>${product.price}</Text>
      </View>

      {/* botón mas/menos */}
      <View style={styles.quantityContainer}>
        <TouchableOpacity
          onPress={() => decreaseQuantity(product)}
          style={styles.qtyButton}
        >
          <Text style={styles.qtyButtonText}>−</Text>
        </TouchableOpacity>

        <Text style={styles.qtyText}>
          {cartQuantities[product.menuId] || 0}
        </Text>

        <TouchableOpacity
          onPress={() => increaseQuantity(product)}
          style={styles.qtyButton}
        >
          <Text style={styles.qtyButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  /* --- footer con botón de carrito (solo si hay productos) --- */
  const renderFooter = () =>
    cart.length > 0 && (
      <TouchableOpacity
        style={styles.cartButton}
        onPress={() => navigation.navigate('Cart', { cart, item })}
      >
        <View style={{ flexDirection: 'row' }}>
          <Ionicons
            name="cart-outline"
            size={24}
            color={COLOR.white}
            style={{ right: 5 }}
          />
          <Text style={styles.cartButtonText}>Ver Carrito ({cart.length})</Text>
        </View>
      </TouchableOpacity>
    );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={item.menu}
        keyExtractor={(product) => product.menuId.toString()}
        renderItem={renderProduct}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingTop: 10,
          paddingBottom: 10,
        }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLOR.lightGray,
  },

  /* header */
  image: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 10,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Poppins-Light',
    marginLeft: 5,
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
    lineHeight: 25,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    marginVertical: 12,
  },

  /* product card */
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: COLOR.white,
    marginBottom: 10,
    borderRadius: 12,
    gap: 10,
    elevation: 2,
  },

  productImage: {
    width: 75,
    height: 70,
    borderRadius: 8,
    backgroundColor: COLOR.lightGray,
  },

  productInfo: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 5,
  },

  productName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: '#6e6e6e',
  },

  productPrice: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#383838',
    marginTop: 4,
  },

  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#eee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 8,
  },

  qtyButton: {
    backgroundColor: '#E63946',
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },

  qtyButtonText: {
    fontFamily: 'Poppins-SemiBold',
    color: '#fff',
    fontSize: 18,
  },

  qtyText: {
    minWidth: 20,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },

  /* footer */
  cartButton: {
    backgroundColor: '#F97316',
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
    margin: 20,
  },
  cartButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: COLOR.white,
  },
});

export default BusinessDetailScreen;
