import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableHighlight, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ImageWithFallback from '../components/ImageWithFallback';

export const MenuItemDetail = React.memo(({item, onView, onAddToCart, onRemoveFromCart, cartItems, isBusinessActive}) => {
    const quantity = cartItems[item.menuId] || 0;
    return (
      <View style={styles.menuItem}>
        <TouchableHighlight
          onPress={() => onView(item)}
          underlayColor="#ececec"
        >
          <ImageWithFallback
            src={item.imageUrl}
            style={styles.menuImage}
            resizeMode="cover"
          />
        </TouchableHighlight>
        <View style={styles.menuInfo}>
          <Text style={styles.menuName}>{item.name}</Text>
          <Text
            style={styles.menuDescription}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.description}
          </Text>
          <Text style={styles.menuPrice}>${item.price.toFixed(2)}</Text>
        </View>
        <View style={styles.quantityControls}>
          <TouchableHighlight
            style={styles.quantityButton}
            underlayColor="#ecececff"
            onPress={() => {
              if (isBusinessActive) {
                onRemoveFromCart(item.menuId);
              }
            }}
            disabled={!isBusinessActive}
          >
            <Ionicons
              name="remove-circle-outline"
              size={32}
              color={isBusinessActive ? '#f44336' : '#9e9e9e'}
            />
          </TouchableHighlight>
          <View style={styles.quantityCircle}>
            <Text style={styles.quantityText}>{quantity}</Text>
          </View>
          <TouchableHighlight
            style={styles.quantityButton}
            underlayColor="#ecececff"
            onPress={() => {
              if (isBusinessActive) {
                onAddToCart(item.menuId);
              }
            }}
            disabled={!isBusinessActive}
          >
            <Ionicons
              name="add-circle-outline"
              size={32}
              color={isBusinessActive ? '#4CAF50' : '#9e9e9e'}
            />
          </TouchableHighlight>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: 'row',
    marginHorizontal: 10,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
  },
  menuImage: {
    width: 84,
    height: 92,
  },
  menuInfo: {
    flex: 1,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  menuName: {
    fontSize: 14,
    color: '#444444ff',
    fontWeight: 'bold',
  },
  menuDescription: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    lineHeight: 14,
    maxHeight: 50,
  },
  menuPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3b3b3bff',
    marginTop: 4,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
  },
  quantityButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
    borderRadius: 20,
  },
  quantityCircle: {
    marginHorizontal: 5,
    backgroundColor: '#51b454ff',
    borderRadius: 20,
    minWidth: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  quantityText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
});
