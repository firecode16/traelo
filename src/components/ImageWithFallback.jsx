import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

const ImageWithFallback = React.memo(({ src, style, ...props }) => {
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  if (error || !src) {
    return (
      <View style={[style, styles.imagePlaceholder]}>
        <Ionicons name="image-outline" size={24} color="#ccc" />
      </View>
    );
  }

  return (
    <View style={[style, { overflow: 'hidden' }]}>
      {isLoading && (
        <View style={[StyleSheet.absoluteFill, styles.loadingContainer]}>
          <ActivityIndicator size="small" color="#ccc" />
        </View>
      )}
      <Image
        source={{ uri: src }}
        style={[style, { opacity: isLoading ? 0 : 1 }]}
        onError={() => setError(true)}
        onLoadEnd={handleLoadEnd}
        resizeMode="cover"
        {...props}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
});

export default ImageWithFallback;
