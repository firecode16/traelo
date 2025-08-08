import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SearchBar = ({ value, onChangeText }) => {
  const colorScheme = useColorScheme();
  const [isFocused, setIsFocused] = useState(false);
  const animatedValue = useState(new Animated.Value(0))[0];

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [
      colorScheme === 'dark' ? '#d4d4d4ff' : '#c7c7c7ff',
      colorScheme === 'dark' ? '#c0bcbcff' : '#b6b6b6ff',
    ],
  });

  const textColor = colorScheme === 'dark' ? '#505050ff' : '#636363ff';
  const placeholderColor = colorScheme === 'dark' ? '#7f7f7fff' : '#999898ff';

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.inputContainer, { backgroundColor }]}>
        <Ionicons
          name="search"
          size={20}
          color={placeholderColor}
          style={styles.leftIcon}
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Buscar negocios, menús o categorías"
          placeholderTextColor={placeholderColor}
          style={[styles.input, { color: textColor }]}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={() => onChangeText('')}>
            <Ionicons
              name="close-circle"
              size={20}
              color={placeholderColor}
              style={styles.rightIcon}
            />
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 10,
    paddingHorizontal: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 42,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
    paddingHorizontal: 8,
    fontFamily: 'Poppins-Regular',
  },
  leftIcon: {
    marginRight: 4,
  },
  rightIcon: {
    marginLeft: 4,
  },
});

export default SearchBar;
