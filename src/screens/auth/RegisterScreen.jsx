import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { COLOR } from '../../constants/Color';
import { registerUser } from '../../services/RegisterService';
import MapboxPicker from '../../components/MapboxPicker';
import { MAP } from '../../constants/ApiMaps';

// Alternativa más segura
const getSafeSearchTypes = () => {
  // Tipos válidos según documentación de Mapbox
  return 'place,locality,neighborhood,address,district,poi,region';
};

const RegisterScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    role: '',
    fullName: '',
    description: '',
    sector: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    address: '',
  });

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalAction, setModalAction] = useState(null);

  // Estados para el modal de ubicación
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [addressQuery, setAddressQuery] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const searchTimeoutRef = useRef(null);

  // Estados temporales para la selección en el modal
  const [temporaryAddress, setTemporaryAddress] = useState('');
  const [temporaryLocationData, setTemporaryLocationData] = useState(null);

  const [locationData, setLocationData] = useState(null);

  const showModalFn = (title, message, action = null) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalAction(() => action);
    setModalVisible(true);
  };

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
    
    if (key === 'role') {
      if (value === 'ROLE_BUSINESS') {
        setErrors(prevErrors => ({ ...prevErrors, terms: null }));
        setAcceptedTerms(false);
      } else if (value === 'ROLE_CUSTOMER') {
        setErrors(prevErrors => ({ 
          ...prevErrors, 
          description: null, 
          sector: null, 
          address: null 
        }));
      }
    }
    
    setErrors(prevErrors => ({ ...prevErrors, [key]: null }));
  };

  const validateForm = () => {
    let newErrors = {};

    if (!form.role) newErrors.role = 'Selecciona un rol válido';
    if (!form.fullName || !form.fullName.trim())
      newErrors.fullName = 'Nombre requerido';
    
    if (form.role === 'ROLE_BUSINESS') {
      if (!form.description || !form.description.trim())
        newErrors.description = 'Descripción requerida';
      if (!form.sector)
        newErrors.sector = 'Selecciona un sector';
      if (!form.address || !form.address.trim())
        newErrors.address = 'La dirección es obligatoria';
    }
    
    if (!form.username || !form.username.trim())
      newErrors.username = 'Usuario requerido';
    if (!form.email || !form.email.trim()) newErrors.email = 'Email requerido';
    else if (!/^\S+@\S+\.\S+$/.test(form.email))
      newErrors.email = 'Email inválido';
    if (!form.phone || !form.phone.trim())
      newErrors.phone = 'Número de Celular requerido';
    else if (!/^\d{10,}$/.test(form.phone))
      newErrors.phone = 'Número inválido (mínimo 10 dígitos)';
    if (!form.password) newErrors.password = 'Contraseña requerida';
    else if (form.password.length < 6)
      newErrors.password = 'Mínimo 6 caracteres';
    
    if (form.role === 'ROLE_CUSTOMER' && !acceptedTerms) {
      newErrors.terms = 'Debes aceptar los términos y política de privacidad';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (validateForm()) {
      console.log('Formulario válido:', form);
      setIsLoading(true);

      try {
        const userData = {
          userId: Date.now(),
          roles: [form.role],
          fullName: form.fullName,
          username: form.username,
          email: form.email,
          phone: form.phone,
          password: form.password,
          createdAt: new Date().toISOString(),
        };

        const result = await registerUser(userData);
        showModalFn('Éxito', 'Usuario registrado. Inicia sesión.', () => navigation.navigate('Login'),);
      } catch (err) {
        showModalFn('Error', err?.message || 'Ocurrió un error al registrar');
      } finally {
        setIsLoading(false);
      }
    } else {
      console.log('Formulario inválido');
    }
  };

  const handleNext = () => {
    if (validateForm()) {
      console.log('Navegando a CoverageScreen:', form);
      navigation.navigate('Coverage', {
        form,
        locationData
      });
    } else {
      console.log('Formulario inválido');
    }
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);

  // Abre el modal de ubicación
  const openLocationModal = () => {
    setLocationModalVisible(true);
    setTemporaryAddress(form.address || '');
    setAddressQuery(form.address || '');
    setTemporaryLocationData(locationData);
    setAddressSuggestions([]);
    setShowSuggestions(false);
    setSearchError(null);
  };

  const handleAddressSearchChange = (text) => {
    setAddressQuery(text);
    setTemporaryAddress(text);
    setSearchError(null);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!text || text.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    setShowSuggestions(true);
    
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // Tipos válidos de Mapbox
        const searchTypes = getSafeSearchTypes(); // Función segura
        
        const optimizedUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text
        )}.json?access_token=${MAP.MAPBOX_ACCESS_TOKEN}&limit=10&language=es&country=mx&types=${searchTypes}&autocomplete=true&proximity=-99.1332,19.4326`;

        const response = await fetch(optimizedUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Filtrar y enriquecer resultados
        const enrichedSuggestions = (data.features || []).map((feature) => ({
          ...feature,
          isBusiness: feature.place_type?.includes('poi') || feature.properties?.category?.includes('commercial'),
        }));
        
        setAddressSuggestions(enrichedSuggestions);
        setSearchError(null);
      } catch (error) {
        console.error('Mapbox search error', error);
        if (error.message.includes('422')) {
          setSearchError('Error en los parámetros de búsqueda. Intenta con otros términos.');
        } else {
          setSearchError('Error al buscar ubicaciones. Verifica tu conexión e intenta de nuevo.');
        }
        setAddressSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 400);
  };

  const handleAddressSuggestionSelect = (suggestion) => {
    const displayName = suggestion.place_name;
    setAddressQuery(displayName);
    setTemporaryAddress(displayName);
    setShowSuggestions(false);
    setAddressSuggestions([]);
    setTemporaryLocationData({
      lat: suggestion.center[1],
      lng: suggestion.center[0],
      display_name: displayName,
    });
  };

  // Maneja el cambio de ubicación desde el mapa
  const handleMapboxLocationChange = (location) => {
    if (location.display_name) {
      setAddressQuery(location.display_name);
      setTemporaryAddress(location.display_name);
      setTemporaryLocationData({
        lat: location.lat,
        lng: location.lng,
        display_name: location.display_name,
      });
    }
  };

  // Confirmar la ubicación seleccionada
  const confirmLocationSelection = () => {
    if (temporaryAddress.trim()) {
      handleChange('address', temporaryAddress);
      setLocationData(temporaryLocationData);
    }
    setLocationModalVisible(false);
  };

  // Cancelar la selección de ubicación
  const cancelLocationSelection = () => {
    setLocationModalVisible(false);
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLOR.lightGray }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentWrapper}>
            
            {/* Badge para ROLE_BUSINESS */}
            {form.role === 'ROLE_BUSINESS' && (
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>Paso 1 de 3</Text>
              </View>
            )}

            <Text style={styles.title}>Crea tu cuenta</Text>
            <Text style={styles.subtitle}>
              Completa la información para comenzar
            </Text>

            <Text style={styles.label}>Registrarme como:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={form.role}
                onValueChange={(value) => handleChange('role', value)}
                style={styles.picker}
              >
                <Picker.Item
                  label="Registrarme como..."
                  value=""
                  enabled={false}
                  color="#9e9e9eff"
                />
                <Picker.Item label="Cliente" value="ROLE_CUSTOMER" />
                <Picker.Item label="Negocio" value="ROLE_BUSINESS" />
              </Picker>
              <Ionicons
                name="chevron-down"
                size={20}
                color="#555"
                style={styles.pickerIcon}
              />
            </View>
            {errors.role && <Text style={styles.errorText}>{errors.role}</Text>}

            {form.role === 'ROLE_BUSINESS' && (
              <>
                <Text style={styles.label}>Sector del negocio:</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={form.sector}
                    onValueChange={(value) => handleChange('sector', value)}
                    style={styles.picker}
                  >
                    <Picker.Item
                      label="Selecciona un sector..."
                      value=""
                      enabled={false}
                      color="#9e9e9eff"
                    />
                    <Picker.Item label="Alimentos y Bebidas" value="food" />
                    <Picker.Item label="Tecnología" value="technology" />
                    <Picker.Item label="Moda y Calzado" value="fashion" />
                    <Picker.Item label="Ferreteria" value="hardware" />
                    <Picker.Item label="Farmacia" value="pharmacy" />
                  </Picker>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color="#555"
                    style={styles.pickerIcon}
                  />
                </View>
                {errors.sector && (
                  <Text style={styles.errorText}>{errors.sector}</Text>
                )}
              </>
            )}

            <TextInput
              style={[styles.input, { color: '#000' }]}
              placeholder={
                form.role === 'ROLE_BUSINESS' ? 'Nombre del negocio' : 'Nombre completo'
              }
              placeholderTextColor="#9e9e9eff"
              value={form.fullName}
              onChangeText={(text) => handleChange('fullName', text)}
            />
            {errors.fullName && (
              <Text style={styles.errorText}>{errors.fullName}</Text>
            )}

            {form.role === 'ROLE_BUSINESS' && (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.label}>Descripción del negocio</Text>
                <TextInput
                  placeholder="Eje. Somos un negocio familiar..."
                  placeholderTextColor="#9e9e9eff"
                  value={form.description}
                  onChangeText={(text) => handleChange('description', text)}
                  style={[
                    styles.input, { color: '#000', height: 70, textAlignVertical: 'top' },
                  ]}
                  multiline
                />
                {errors.description && (
                  <Text style={styles.errorText}>{errors.description}</Text>
                )}
              </View>
            )}

            <TextInput
              style={[styles.input, { color: '#000' }]}
              placeholder="Usuario"
              placeholderTextColor="#9e9e9eff"
              value={form.username}
              onChangeText={(text) => handleChange('username', text)}
            />
            {errors.username && (
              <Text style={styles.errorText}>{errors.username}</Text>
            )}

            <TextInput
              style={[styles.input, { color: '#000' }]}
              placeholder="Correo electrónico"
              placeholderTextColor="#9e9e9eff"
              value={form.email}
              keyboardType="email-address"
              onChangeText={(text) => handleChange('email', text)}
              autoCapitalize="none"
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}

            <TextInput
              style={[styles.input, { color: '#000' }]}
              placeholder="Número de Celular"
              placeholderTextColor="#9e9e9eff"
              value={form.phone}
              keyboardType="phone-pad"
              onChangeText={(text) => handleChange('phone', text)}
            />
            {errors.phone && (
              <Text style={styles.errorText}>{errors.phone}</Text>
            )}

            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.passwordInput, { color: '#000' }]}
                placeholder="Contraseña"
                placeholderTextColor="#9e9e9eff"
                secureTextEntry={!showPassword}
                value={form.password}
                onChangeText={(text) => handleChange('password', text)}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={toggleShowPassword}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}

            {form.role === 'ROLE_BUSINESS' && (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.label}>Dirección del negocio</Text>
                
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={openLocationModal}
                >
                  <Feather name="map-pin" size={16} color={COLOR.green} />
                  <Text style={styles.locationButtonText} numberOfLines={1}>
                    {form.address || 'Selecciona la ubicación de tu negocio...'}
                  </Text>
                </TouchableOpacity>

                {errors.address && (
                  <Text style={styles.errorText}>{errors.address}</Text>
                )}
              </View>
            )}

            {/* Términos y Condiciones solo para ROLE_CUSTOMER */}
            {form.role === 'ROLE_CUSTOMER' && (
              <View style={styles.termsContainer}>
                <TouchableOpacity
                  onPress={() => setAcceptedTerms(!acceptedTerms)}
                  style={styles.checkboxContainer}
                >
                  <View
                    style={[styles.checkbox, acceptedTerms && styles.checked]}
                  >
                    {acceptedTerms && (
                      <Ionicons name="checkmark" size={18} color="white" />
                    )}
                  </View>
                </TouchableOpacity>
                <Text style={styles.termsText}>
                  Acepto los{' '}
                  <Text
                    style={styles.link}
                    onPress={() => navigation.navigate('Terms')}
                  >
                    Términos y Condiciones
                  </Text>{' '}
                  y la{' '}
                  <Text
                    style={styles.link}
                    onPress={() => navigation.navigate('Privacy')}
                  >
                    Política de Privacidad
                  </Text>
                </Text>
              </View>
            )}
            
            {form.role === 'ROLE_CUSTOMER' && errors.terms && (
              <Text style={styles.errorText}>{errors.terms}</Text>
            )}

            {isLoading ? (
              <ActivityIndicator
                size="large"
                color={COLOR.green}
                style={{ marginTop: 20, marginBottom: 30 }}
              />
            ) : (
              <TouchableOpacity
                style={styles.registerButton}
                onPress={form.role === 'ROLE_BUSINESS' ? handleNext : handleRegister}
              >
                <Text style={styles.registerButtonText}>
                  {form.role === 'ROLE_BUSINESS' ? 'Siguiente' : 'Registrarme'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>

      {/* Modal de éxito/error */}
      <Modal
        transparent
        animationType="fade"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setModalVisible(false);
                if (modalAction) modalAction();
              }}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de selección de ubicación */}
      <Modal
        visible={locationModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={cancelLocationSelection}
      >
        <View style={styles.locationModalContainer}>
          <View style={styles.locationModalContent}>
            <View style={styles.locationModalHeader}>
              <Text style={styles.locationModalTitle}>Seleccionar ubicación del negocio</Text>
              <TouchableOpacity
                onPress={cancelLocationSelection}
                style={styles.locationCloseButton}
              >
                <Feather name="x" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.locationModalBody}>
              <Text style={styles.locationModalLabel}>Buscar dirección:</Text>
              <View style={styles.locationSearchContainer}>
                <TextInput
                  style={styles.locationModalInput}
                  placeholder="Buscar colonia o municipio..."
                  placeholderTextColor="#9e9e9e"
                  value={addressQuery}
                  onChangeText={handleAddressSearchChange}
                />
                {addressQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setAddressQuery('');
                      setTemporaryAddress('');
                      setAddressSuggestions([]);
                      setShowSuggestions(false);
                    }}
                    style={styles.clearSearchButton}
                  >
                    <Feather name="x" size={18} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>

              {searchError && (
                <View style={styles.locationErrorContainer}>
                  <Feather name="alert-circle" size={16} color="#EF4444" />
                  <Text style={styles.locationErrorText}>{searchError}</Text>
                </View>
              )}

              {showSuggestions && (
                <View style={styles.locationSuggestionsContainer}>
                  {isLoadingSuggestions ? (
                    <View style={styles.locationLoadingContainer}>
                      <ActivityIndicator size="small" color={COLOR.green} />
                      <Text style={styles.locationLoadingText}>
                        {addressQuery.length < 3 ? 'Escribe al menos 3 caracteres...' : 'Buscando ubicaciones en tu área...'}
                      </Text>
                    </View>
                  ) : addressSuggestions.length > 0 ? (
                    addressSuggestions.map((suggestion, index) => (
                      <TouchableOpacity
                        key={suggestion.id || index}
                        style={styles.locationSuggestionItem}
                        onPress={() => handleAddressSuggestionSelect(suggestion)}
                      >
                        <Feather
                          name={suggestion.isBusiness ? 'shopping-bag' : 'map-pin'}
                          size={14}
                          color={suggestion.isBusiness ? '#FF6B35' : COLOR.green}
                        />
                        <View style={styles.locationSuggestionTextContainer}>
                          <Text style={styles.locationSuggestionText} numberOfLines={1}>
                            {suggestion.text}
                          </Text>
                          <Text style={styles.locationSuggestionAddress} numberOfLines={1}>
                            {suggestion.place_name}
                          </Text>
                          {suggestion.isBusiness && (
                            <View style={styles.businessBadge}>
                              <Text style={styles.businessBadgeText}>Negocio</Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.locationNoResultsContainer}>
                      <Feather name="search" size={20} color="#9CA3AF" />
                      <Text style={styles.locationNoResultsText}>
                        {addressQuery.length >= 3 ? 'No se encontraron resultados para tu búsqueda' : 'Escribe al menos 3 caracteres para buscar'}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.locationMapContainer}>
                <Text style={styles.locationModalLabel}>Selecciona en el mapa:</Text>
                <MapboxPicker
                  style={styles.locationModalMap}
                  onLocationChange={handleMapboxLocationChange}
                  latitude={temporaryLocationData?.lat}
                  longitude={temporaryLocationData?.lng}
                />
              </View>

              <View style={styles.locationModalFooter}>
                <TouchableOpacity
                  style={styles.locationCancelButton}
                  onPress={cancelLocationSelection}
                >
                  <Text style={styles.locationCancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.locationConfirmButton,
                    !temporaryAddress.trim() && styles.locationConfirmButtonDisabled,
                  ]}
                  disabled={!temporaryAddress.trim()}
                  onPress={confirmLocationSelection}
                >
                  <Text style={styles.locationConfirmButtonText}>
                    Confirmar ubicación
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40
  },
  contentWrapper: {
    padding: 20,
    backgroundColor: COLOR.lightGray
  },
  title: {
    fontSize: 22,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 6,
    color: COLOR.black,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 18,
    textAlign: 'center',
  },
  stepBadge: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0, 204, 134, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  stepBadgeText: {
    color: '#00CC86',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
  },
  input: {
    backgroundColor: COLOR.white,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    elevation: 1,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLOR.white,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 1,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  eyeIcon: { padding: 10 },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 8,
    fontFamily: 'Poppins-Regular',
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 5,
    color: '#3d3c3cff',
  },
  pickerContainer: {
    position: 'relative',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#fff',
    elevation: 1,
  },
  picker: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    height: 56,
    width: '100%',
    color: '#000',
    paddingLeft: 10,
  },
  pickerIcon: {
    position: 'absolute',
    right: 12,
    top: 15,
    pointerEvents: 'none',
  },
  registerButton: {
    backgroundColor: COLOR.green,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  registerButtonText: {
    fontFamily: 'Poppins-SemiBold',
    color: COLOR.white,
    fontSize: 16,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    marginBottom: 8,
  },
  checkboxContainer: {
    marginRight: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: {
    backgroundColor: COLOR.green,
    borderColor: COLOR.green,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#3d3c3cff',
    lineHeight: 20,
  },
  link: {
    color: COLOR.green,
    fontFamily: 'Poppins-SemiBold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
  },
  modalButton: {
    backgroundColor: COLOR.green,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    gap: 8,
  },
  locationButtonText: {
    flex: 1,
    color: '#2E7D32',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  locationModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  locationModalContent: {
    backgroundColor: '#fff',
    marginTop: 50,
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  locationModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
  },
  locationModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  locationCloseButton: {
    padding: 4,
  },
  locationModalBody: {
    flex: 1,
    padding: 20,
  },
  locationModalLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    fontWeight: '500',
  },
  locationModalInput: {
    backgroundColor: '#F3F3F5',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#111827',
    marginBottom: 12,
  },
  locationErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  locationErrorText: {
    color: '#DC2626',
    fontSize: 14,
    flex: 1,
  },
  locationSuggestionsContainer: {
    backgroundColor: '#fff',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    maxHeight: 150,
    elevation: 2,
  },
  locationSuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomColor: '#F3F4F6',
    borderBottomWidth: 1,
    gap: 8,
  },
  locationSuggestionTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  locationSuggestionText: {
    fontSize: 14,
    color: '#111827',
  },
  locationSuggestionAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  businessBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  businessBadgeText: {
    fontSize: 10,
    color: '#FF6B35',
    fontWeight: '600',
  },
  locationLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  locationLoadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  locationNoResultsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  locationNoResultsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  locationMapContainer: {
    flex: 1,
    marginBottom: 20,
  },
  locationModalMap: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 300,
  },
  locationModalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  locationCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  locationCancelButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
  locationConfirmButton: {
    flex: 1,
    backgroundColor: COLOR.green,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  locationConfirmButtonDisabled: {
    backgroundColor: '#A7F3D0',
  },
  locationConfirmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

  locationSearchContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationModalInput: {
    flex: 1,
    backgroundColor: '#F3F3F5',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#111827',
    paddingRight: 45,
  },
  clearSearchButton: {
    position: 'absolute',
    right: 12,
    backgroundColor: '#E5E7EB',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RegisterScreen;
