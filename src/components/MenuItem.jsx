import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLOR } from '../constants/Color';
import ImageWithFallback from '../components/ImageWithFallback';
import { getImageByMenuId } from '../services/MenuService';

export const MenuItem = React.memo(({ item, onView, onEdit, onDelete, onImageError }) => {
    const imageUri = getImageByMenuId(item.menuId);
    const [localImageUri, setLocalImageUri] = useState(imageUri);
    const [imageError, setImageError] = useState(false);

    const handleImageError = () => {
      setImageError(true);
      setLocalImageUri(null);
      onImageError(item.menuId);
    };

    return (
      <View style={styles.card}>
        <TouchableOpacity
          onPress={() => onView(item, localImageUri)}
          style={styles.imageContainer}
        >
          <ImageWithFallback
            src={localImageUri}
            style={styles.menuImage}
            onError={handleImageError}
          />
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <Text style={styles.menuName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.menuDesc} numberOfLines={2}>
            {item.description}
          </Text>
          <Text style={styles.menuPrice}>${item.price}</Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            onPress={() => onEdit(item)}
            style={styles.actionButton}
          >
            <Ionicons name="create-outline" size={20} color={COLOR.orange} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(item.menuId)}
            style={styles.actionButton}
          >
            <Ionicons name="trash-outline" size={20} color={COLOR.red} />
          </TouchableOpacity>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 11,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    elevation: 2,
  },
  imageContainer: {
    marginRight: 11,
  },
  menuImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  infoContainer: {
    flex: 1,
  },
  menuName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  menuDesc: {
    color: '#555',
    fontSize: 14,
    marginBottom: 4,
  },
  menuPrice: {
    color: COLOR.orange,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
});
