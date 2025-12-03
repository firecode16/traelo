import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const HardwareStoreScreen = ({ navigation, route }) => {
  const { sector } = route.params || {};
  
  useEffect(() => {
    console.log('🚀 mounted - sector:', sector);
  }, [sector]);

  return (
    <View style={styles.container}>
      <StatusBar animated={true} style="light" />
      
      <View style={styles.emojiContainer}>
        <Text style={styles.emoji}>🧱🛠️</Text>
      </View>
      
      <View style={styles.textContainer}>
        <Text style={styles.mainTitle}>Próximamente</Text>
        <Text style={styles.description}>
          Podrás ver los negocios de Ferretería{'\n'}
          (Materiales de construcción, herramientas,{'\n'}fontanería, electricidad, etc...)
        </Text>
        <Text style={styles.subtitle}>
          Estamos trabajando para liberar este sector{'\n'}
          ¡Muy pronto tendrás acceso!
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 24,
  },
  emojiContainer: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: width * 0.2,
    lineHeight: width * 0.2,
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 320,
  },
  mainTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 32,
    color: '#00CC86',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 38,
  },
  description: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 24,
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default HardwareStoreScreen;
