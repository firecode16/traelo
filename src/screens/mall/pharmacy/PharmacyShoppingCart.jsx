import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLOR } from '../../../constants/Color';

const PharmacyShoppingCart = ({ item, actions }) => {
  return (
    <View style={styles.itemRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName}>{item.name}</Text>
        <View style={styles.pharmacyDetails}>
          {item.presentation && <Text style={styles.itemAttribute}>Presentación: {item.presentation}</Text>}
          {item.dosage && <Text style={styles.itemAttribute}>Dosis: {item.dosage}</Text>}
          {item.medicineType && <Text style={styles.itemAttribute}>Tipo: {item.medicineType}</Text>}
        </View>
        <Text style={styles.itemDetails}>
          {item.quantity} × ${item.price.toFixed(2)} = ${(item.price * item.quantity).toFixed(2)}
        </Text>
      </View>
      {actions}
    </View>
  );
};

const styles = StyleSheet.create({
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLOR.white,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  itemName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: COLOR.black,
    marginBottom: 4,
  },
  pharmacyDetails: {
    marginVertical: 4,
  },
  itemAttribute: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: COLOR.gray,
    marginBottom: 2,
  },
  itemDetails: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: COLOR.orange,
    marginTop: 4,
  },
});

export default PharmacyShoppingCart;