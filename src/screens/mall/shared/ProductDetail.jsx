import React from 'react';
import { View, Text } from 'react-native';
import Modal from 'react-native-modal';
import { COLOR } from '../../../constants/Color';
import ProductFoodDetail from '../food/ProductFoodDetail';
import ProductFashionDetail from '../fashion/ProductFashionDetail';
import ProductPharmacyDetail from '../pharmacy/ProductPharmacyDetail';
import ProductTechnologyDetail from '../technology/ProductTechnologyDetail';
import ProductHardwareDetail from '../hardware/ProductHardwareDetail';

const sectorComponents = {
  food: ProductFoodDetail,
  fashion: ProductFashionDetail,
  pharmacy: ProductPharmacyDetail,
  technology: ProductTechnologyDetail,
  hardware: ProductHardwareDetail,
};

const ProductDetail = ({ product, sector, onClose, onAddToCart, currentProductQuantity, ...props }) => {
  const SectorComponent = sectorComponents[sector];

  if (!SectorComponent) {
    return (
      <Modal isVisible={!!product} onBackdropPress={onClose} style={{ margin: 0 }}>
        <View
          style={{
            backgroundColor: COLOR.white,
            padding: 20,
            borderRadius: 12,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: 'Poppins-Regular',
              fontSize: 16,
              color: COLOR.darkGray,
            }}
          >
            Sector no soportado
          </Text>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      isVisible={!!product}
      onSwipeComplete={onClose}
      swipeDirection={['down']}
      onBackdropPress={onClose}
      style={{ margin: 0 }}
      propagateSwipe={true}
      backdropOpacity={0.6}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      useNativeDriverForBackdrop
      hideModalContentWhileAnimating={true}
    >
      <SectorComponent
        product={product}
        onClose={onClose}
        onAddToCart={onAddToCart}
        currentProductQuantity={currentProductQuantity}
        {...props}
      />
    </Modal>
  );
};

export default ProductDetail;
