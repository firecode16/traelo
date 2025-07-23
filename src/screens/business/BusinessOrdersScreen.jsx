import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { COLOR } from '../../constants/Color';

const BusinessOrdersScreen = () => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const stored = await AsyncStorage.getItem('userInfo');
        if (stored) {
          const user = JSON.parse(stored);
          setProfile(user);
        }
      } catch (error) {
        console.error('Error cargando el perfil:', error);
      }
    };

    loadProfile();
  }, []);

  const openWhatsApp = () => {
    const whatsappUrl = `https://wa.me/${profile.phone}`;
    Linking.openURL(whatsappUrl);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestión de Pedidos</Text>
      <Text style={styles.message}>
        Los pedidos están siendo gestionados a través de WhatsApp por el
        momento. Revisa tus mensajes para atender a tus clientes directamente.
      </Text>

      <TouchableOpacity style={styles.whatsappButton} onPress={openWhatsApp}>
        <FontAwesome name="whatsapp" size={48} color="#25D366" />
        <Text style={styles.whatsappText}>Ir a WhatsApp</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLOR.lightGray,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 22,
    marginBottom: 5,
  },
  message: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    textAlign: 'justify',
    marginBottom: 25,
    color: '#333',
  },
  whatsappButton: {
    alignItems: 'center',
    gap: 8,
  },
  whatsappText: {
    marginTop: 8,
    fontSize: 16,
    color: '#25D366',
    fontWeight: '600',
  },
});

export default BusinessOrdersScreen;
