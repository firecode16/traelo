import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLOR } from '../../../constants/Color';

const FoodShoppingCart = ({ item, actions }) => {
  return (
    <View style={styles.itemRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.itemSpecs}>{item.description}</Text>
        )}
        {item.ingredients && (
          <Text style={styles.itemIngredients}>Ingredientes: {item.ingredients}</Text>
        )}
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
  itemSpecs: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: COLOR.gray,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  itemIngredients: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: COLOR.gray,
    marginBottom: 4,
  },
  itemDetails: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: COLOR.orange,
    marginTop: 4,
  },
});

export default FoodShoppingCart;
