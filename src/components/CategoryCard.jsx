import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function CategoryCard({ emoji, title, onClick }) {
  return (
    <TouchableOpacity style={[styles.card, { flex: 0.48 }]} onPress={onClick} activeOpacity={0.8}>
      <View style={styles.innerContainer}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 36,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginHorizontal: 8,
  },
  innerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Roboto-Medium',
    fontSize: 16,
    color: '#111827',
    textAlign: 'center',
  },
});
