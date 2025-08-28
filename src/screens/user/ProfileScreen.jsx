import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateUser } from '../../services/AuthService';

const ProfileScreen = () => {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    updatedAt: '',
  });
  const [editable, setEditable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const stored = await AsyncStorage.getItem('userInfo');
        if (stored) {
          const user = JSON.parse(stored);
          console.log('user ID:', user.userId);

          setProfile(user);
          setForm({
            fullName: user.fullName || '',
            email: user.email || '',
            phone: user.phone || '',
            updatedAt: new Date().toISOString(),
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

  const showErrorModal = (message) => {
    setErrorMessage(message);
    setErrorModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const updated = { ...profile, ...form };
      await AsyncStorage.setItem('userInfo', JSON.stringify(updated));
      setProfile(updated);

      await updateUser(profile.userId, {
        fullName: updated.fullName,
        email: updated.email,
        phone: updated.phone,
      });

      setEditable(false);
      Alert.alert('Actualizado', 'Los cambios han sido guardados.');
    } catch (err) {
      showErrorModal('No se pudieron guardar los cambios. Por favor, intenta nuevamente.');
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>👤 Perfil del usuario</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Nombre del usuario</Text>
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
            <TouchableOpacity
              style={styles.buttonEdit}
              onPress={handleEditToggle}
            >
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
      </TouchableWithoutFeedback>

      <Modal
        animationType="fade"
        transparent={true}
        visible={errorModalVisible}
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="close-circle" size={24} color="#ef4444" />
              <Text style={styles.modalTitle}>Error</Text>
            </View>
            <Text style={styles.modalMessage}>{errorMessage}</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.errorButton]}
              onPress={() => setErrorModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  errorButton: {
    backgroundColor: '#ef4444',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ProfileScreen;
