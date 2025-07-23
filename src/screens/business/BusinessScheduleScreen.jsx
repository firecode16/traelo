import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { COLOR } from '../../constants/Color';
import {
  getSchedulesByBusiness,
  createScheduler,
  updateScheduler,
} from '../../services/SchedulerService';

const BusinessScheduleScreen = () => {
  const [isActive, setIsActive] = useState(false);
  const [schedulerId, setSchedulerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [businessId, setBusinessId] = useState(null);

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const stored = await AsyncStorage.getItem('userInfo');
        if (stored) {
          const user = JSON.parse(stored);
          const id = user.businessId;
          setBusinessId(id);

          const data = await getSchedulesByBusiness(id);
          console.log('Datos del scheduler:', data);

          if (!data) {
            // No existe aún, crearlo
            const newSchedule = {
              businessId: id,
              isActive: false,
              schedulerId: Date.now(),
            };
            const response = await createScheduler(newSchedule);
            setIsActive(response.isActive);
            setSchedulerId(response.schedulerId);
          } else {
            setIsActive(data.isActive);
            setSchedulerId(data.schedulerId);
          }

          setLoading(false);
        }
      } catch (error) {
        console.error('Error cargando el perfil:', error);
      }
    };

    loadSchedule();
  }, []);

  const handleToggle = async () => {
    const newStatus = !isActive;
    setIsActive(newStatus);
    try {
      const updatedData = {
        businessId,
        schedulerId,
        isActive: newStatus,
      };

      await updateScheduler(schedulerId, updatedData);
    } catch (error) {
      setIsActive(!newStatus); // Revertir el cambio si hay error
      console.error('Error actualizando el estado del negocio:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Estado del Negocio</Text>

      <View style={styles.statusContainer}>
        <FontAwesome
          name={isActive ? 'check-circle' : 'times-circle'}
          size={64}
          color={isActive ? '#2ecc71' : '#e74c3c'}
          style={styles.icon}
        />
        <Text
          style={[
            styles.statusText,
            { color: isActive ? '#2ecc71' : '#e74c3c' },
          ]}
        >
          {isActive ? 'Negocio Abierto' : 'Negocio Cerrado'}
        </Text>
        <Switch
          value={isActive}
          onValueChange={handleToggle}
          trackColor={{ false: '#ccc', true: '#4cd137' }}
          thumbColor="#fff"
          style={styles.switch}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLOR.lightGray,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 22,
    marginBottom: 15,
  },
  statusContainer: {
    alignItems: 'center',
  },
  icon: {
    marginBottom: 5,
  },
  statusText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    marginBottom: 10,
  },
  switch: {
    transform: [{ scaleX: 1.5 }, { scaleY: 1.5 }],
    marginTop: 16,
  },
});

export default BusinessScheduleScreen;
