import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';

const BusinessProfileScreen = () => {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '' });
  const [editable, setEditable] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const stored = await AsyncStorage.getItem('userInfo');
        if (stored) {
          const data = JSON.parse(stored);
          setProfile(data);
          setForm({
            fullName: data.fullName || '',
            email: data.email || '',
            phone: data.phone || '',
          });
        }
      } catch (error) {
        console.error('Error cargando perfil:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleEditToggle = () => {
    setEditable(!editable);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      const updated = { ...profile, ...form };
      await AsyncStorage.setItem('userInfo', JSON.stringify(updated));
      setProfile(updated);
      setEditable(false);
      Alert.alert('Actualizado', 'Los cambios han sido guardados.');
    } catch (err) {
      Alert.alert('Error', 'No se pudieron guardar los cambios.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={{ marginTop: 10 }}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>👤 Perfil del Negocio</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Nombre del negocio</Text>
        <TextInput
          style={[styles.input, !editable && styles.disabled]}
          editable={editable}
          value={form.fullName}
          onChangeText={(text) => handleChange('fullName', text)}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Correo electrónico</Text>
        <TextInput
          style={[styles.input, !editable && styles.disabled]}
          editable={editable}
          keyboardType="email-address"
          value={form.email}
          onChangeText={(text) => handleChange('email', text)}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Teléfono</Text>
        <TextInput
          style={[styles.input, !editable && styles.disabled]}
          editable={editable}
          keyboardType="phone-pad"
          value={form.phone}
          onChangeText={(text) => handleChange('phone', text)}
        />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.buttonEdit} onPress={handleEditToggle}>
          <Ionicons
            name={editable ? 'close' : 'create-outline'}
            size={20}
            color="#fff"
          />
          <Text style={styles.buttonText}>
            {editable ? 'Cancelar' : 'Editar'}
          </Text>
        </TouchableOpacity>

        {editable && (
          <TouchableOpacity style={styles.buttonSave} onPress={handleSave}>
            <Ionicons name="save-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Guardar</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f97316',
    marginBottom: 30,
    textAlign: 'center',
  },
  field: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    color: '#333',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  disabled: {
    backgroundColor: '#f4f4f4',
    color: '#888',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
  },
  buttonEdit: {
    flexDirection: 'row',
    backgroundColor: '#f59e0b',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonSave: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BusinessProfileScreen;
