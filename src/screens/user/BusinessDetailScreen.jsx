import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableHighlight,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLOR } from '../../constants/Color';
import ImageWithFallback from '../../components/ImageWithFallback';
import { preloadImage } from '../../components/ImageCache';
import useScrollHandler from '../../components/HandleScroll';
import { MenuItemDetail as MenuItem } from '../../components/MenuItemDetail';

const BusinessDetailScreen = ({ route, navigation }) => {
  const { business } = route.params;
  const [cartItems, setCartItems] = useState({});
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [visibleItems, setVisibleItems] = useState(new Set());
  const { handleScroll, isScrolling, cleanup } = useScrollHandler();

  useEffect(() => {
    return cleanup; // Cleanup on unmount
  }, []);

  useEffect(() => {
    if (!isScrolling && visibleItems.size > 0) {
      const preloadImages = async () => {
        for (const menuId of visibleItems) {
          const item = business.menus.find((menu) => menu.menuId === menuId);
          if (item && item.imageUrl) {
            await preloadImage(item.imageUrl);
          }
        }
      };
      preloadImages();
    }
  }, [visibleItems, isScrolling, business.menus]);

  // Handle scroll to track visible items
  const handleViewableItemsChanged = useCallback(({ viewableItems }) => {
    const newVisibleItems = new Set();
    viewableItems.forEach(({ item }) => {
      newVisibleItems.add(item.menuId);
    });
    setVisibleItems(newVisibleItems);
  }, []);

  const handleAddToCart = useCallback((menuId) => {
    setCartItems((prev) => ({
      ...prev,
      [menuId]: (prev[menuId] || 0) + 1,
    }));
  }, []);

  const handleRemoveFromCart = useCallback((menuId) => {
    setCartItems((prev) => {
      if (!prev[menuId]) return prev;
      const updated = { ...prev };
      updated[menuId]--;
      if (updated[menuId] <= 0) delete updated[menuId];
      return updated;
    });
  }, []);

  const getTotalItems = useCallback((items) => {
    if (!items) return 0;
    return Object.values(items).reduce(
      (total, quantity) => total + quantity, 0,
    );
  }, []);

  const openViewModal = useCallback((item) => {
    setSelectedMenuItem(item);
    setModalVisible(true);
  }, []);

  const renderMenuItem = useCallback(
    ({ item }) => (
      <MenuItem
        item={item}
        onView={openViewModal}
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
        cartItems={cartItems}
        isBusinessActive={business.scheduler?.isActive}
      />
    ),
    [
      cartItems,
      business.scheduler?.isActive,
      openViewModal,
      handleAddToCart,
      handleRemoveFromCart,
    ],
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.imageContainer}>
          <ImageWithFallback
            src={business.logoUrl}
            style={styles.coverImage}
            resizeMode="cover"
          />
        </View>
        <View style={styles.infoContainer}>
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons
                name="business-outline"
                size={20}
                color="#555"
                style={styles.icon}
              />
              <Text style={styles.businessName}>{business.fullName}</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons
                name={
                  business.scheduler?.isActive ? 'checkmark-circle' : 'close-circle'
                }
                size={20}
                color={business.scheduler?.isActive ? '#4CAF50' : '#f44336'}
              />
              <Text style={styles.statusText}>
                {business.scheduler?.isActive ? ' Abierto' : ' Cerrado'}
              </Text>
            </View>
          </View>

          <View style={styles.rowInfo}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#555"
              style={styles.icon}
            />
            <Text style={styles.businessDescription}>
              {business.description}
            </Text>
          </View>

          {business.address && (
            <View style={styles.rowInfo}>
              <Ionicons name="location-outline" size={20} color="#555" />
              <Text style={styles.addressText}> {business.address}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Sección scrollable sólo para menú */}
      <View style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>Menú</Text>
        <FlatList
          data={business.menus}
          renderItem={renderMenuItem}
          keyExtractor={(item) => item.menuId.toString()}
          contentContainerStyle={{ paddingBottom: 45, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={{
            itemVisiblePercentThreshold: 50,
            waitForInteraction: true,
          }}
          maxToRenderPerBatch={5}
          windowSize={5}
          removeClippedSubviews={true}
          initialNumToRender={10}
        />
      </View>

      {getTotalItems(cartItems) > 0 && (
        <TouchableHighlight
          underlayColor="#e0e0e0"
          style={styles.floatingCartButton}
          onPress={() =>
            navigation.navigate('Cart', {
              cartItems,
              business,
              onGoBack: (updatedCartItems) => {
                setCartItems(updatedCartItems); // actualiza el estado local
              },
            })
          }
        >
          <View>
            <Ionicons name="cart-outline" size={28} color="#fff" />
            <View style={styles.fabBadge}>
              <Text style={styles.fabBadgeText}>
                {getTotalItems(cartItems)}
              </Text>
            </View>
          </View>
        </TouchableHighlight>
      )}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedMenuItem && (
              <>
                <ImageWithFallback
                  src={selectedMenuItem.imageUrl}
                  style={styles.modalImage}
                  resizeMode="cover"
                />
                <Text style={styles.modalTitle}>{selectedMenuItem.name}</Text>
                <Text style={styles.modalDescription}>
                  {selectedMenuItem.description}
                </Text>
                <Text style={styles.modalPrice}>
                  💲{selectedMenuItem.price}
                </Text>

                <TouchableHighlight
                  style={styles.okButton}
                  underlayColor="#c5c6c5ff"
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.okButtonText}>OK</Text>
                </TouchableHighlight>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLOR.lightGray,
  },
  headerContainer: {
    marginBottom: 0,
  },
  imageContainer: {
    paddingHorizontal: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  coverImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLOR.lightGray,
    elevation: 2,
  },

  infoContainer: {
    paddingHorizontal: 12,
    marginBottom: 3,
  },
  businessName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  businessDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  rowInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  addressText: {
    fontSize: 13,
    color: '#555',
  },
  sectionTitle: {
    fontSize: 18,
    marginLeft: 10,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },

  menuContainer: {
    flex: 1,
    paddingHorizontal: 0,
  },

  floatingCartButton: {
    position: 'absolute',
    top: 297,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLOR.orange,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 99,
  },
  fabBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  icon: {
    marginRight: 6,
    bottom: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  modalContent: {
    width: '95%',
    maxHeight: '85%',
    backgroundColor: '#f0f1f1ff',
    borderRadius: 16,
    padding: 15,
    alignItems: 'center',
    elevation: 4,
  },
  modalImage: {
    width: '100%',
    height: 330,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 16,
    color: '#555',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2e7d32',
  },
  okButton: {
    marginTop: 10,
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  okButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BusinessDetailScreen;
