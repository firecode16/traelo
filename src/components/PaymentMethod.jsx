import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { updatePaymentMethods } from '../services/BusinessService';

const PaymentMethod = ({ business, businessId, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cashEnabled, setCashEnabled] = useState(business?.acceptCash ?? true);
  const [transferEnabled, setTransferEnabled] = useState(
    business?.acceptTransfer ?? false,
  );
  const [bankAccount, setBankAccount] = useState(business?.bankCard ?? '');
  const [clabe, setClabe] = useState(business?.bankClabe ?? '');
  const [accountHolder, setAccountHolder] = useState(
    business?.accountHolder ?? '',
  );

  // Estados para modales
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('info');

  // Estados para guardar valores originales al cancelar
  const [originalCash, setOriginalCash] = useState(cashEnabled);
  const [originalTransfer, setOriginalTransfer] = useState(transferEnabled);
  const [originalBankAccount, setOriginalBankAccount] = useState(bankAccount);
  const [originalClabe, setOriginalClabe] = useState(clabe);
  const [originalAccountHolder, setOriginalAccountHolder] = useState(accountHolder);

  const validateClabe = (clabe) => {
    return /^\d{18}$/.test(clabe);
  };

  const validateBankAccount = (account) => {
    return account === '' || /^\d{16}$/.test(account);
  };

  const showModal = (title, message, type = 'info') => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
  };

  const handleEdit = () => {
    // Guardar estado actual antes de editar
    setOriginalCash(cashEnabled);
    setOriginalTransfer(transferEnabled);
    setOriginalBankAccount(bankAccount);
    setOriginalClabe(clabe);
    setOriginalAccountHolder(accountHolder);
    setEditing(true);
  };

  const handleSave = async () => {
    Keyboard.dismiss();

    if (transferEnabled) {
      if (!clabe) {
        showModal('CLABE requerida', 'La CLABE interbancaria es requerida cuando la transferencia está activada.', 'error');
        return;
      }

      if (!validateClabe(clabe)) {
        showModal('CLABE inválida', 'La CLABE interbancaria debe tener exactamente 18 dígitos.', 'error');
        return;
      }

      if (!validateBankAccount(bankAccount)) {
        showModal('Tarjeta inválida', 'El número de tarjeta debe tener exactamente 16 dígitos.', 'error');
        return;
      }
    }

    setLoading(true);
    try {
      const paymentData = {
        businessId: Number(businessId),
        acceptCash: cashEnabled,
        acceptTransfer: transferEnabled,
        bankCard: bankAccount,
        bankClabe: clabe,
        updatedAt: new Date().toISOString(),
      };

      console.log('🔄 Actualizando métodos de pago:', paymentData);
      await updatePaymentMethods(paymentData);
      console.log('✅ Métodos de pago actualizados.');

      // Notificar al componente padre
      await onUpdate?.(paymentData);

      setEditing(false);
      showModal('Éxito', 'Métodos de pago actualizados correctamente', 'info');
    } catch (error) {
      showModal('Error', 'No se pudieron guardar los métodos de pago', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Keyboard.dismiss();
    // Restaurar valores originales
    setCashEnabled(originalCash);
    setTransferEnabled(originalTransfer);
    setBankAccount(originalBankAccount);
    setClabe(originalClabe);
    setAccountHolder(originalAccountHolder);
    setEditing(false);
  };

  // Switches con useCallback para evitar re-renders innecesarios
  const handleCashToggle = useCallback((value) => {
    Keyboard.dismiss(); // Cerrar teclado antes del cambio
    setCashEnabled(value);
  }, []);

  const handleTransferToggle = useCallback((value) => {
    Keyboard.dismiss();
    // Delay para evitar conflicto con animaciones del teclado
    setTimeout(() => {
      setTransferEnabled(value);
    }, 50);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Métodos de pago</Text>
        {!editing ? (
          <TouchableOpacity onPress={handleEdit}>
            <Feather name="edit" size={20} color="#00CC86" />
          </TouchableOpacity>
        ) : (
          <View style={styles.editIconPlaceholder} />
        )}
      </View>

      <View style={styles.contentContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
              {!editing ? (
                // Vista de solo lectura
                <View>
                  <Text style={styles.mutedText}>
                    Métodos de pago disponibles
                  </Text>
                  <View style={styles.paymentMethodsList}>
                    <View style={styles.paymentMethodItem}>
                      <MaterialIcons
                        name="attach-money"
                        size={24}
                        color={cashEnabled ? '#2E7D32' : '#9CA3AF'}
                      />
                      <Text
                        style={[
                          styles.paymentMethodText, { color: cashEnabled ? '#2E7D32' : '#9CA3AF' },
                        ]}
                      >
                        Efectivo {cashEnabled ? '(Activo)' : '(Inactivo)'}
                      </Text>
                    </View>

                    <View style={styles.paymentMethodItem}>
                      <MaterialIcons
                        name="account-balance"
                        size={24}
                        color={transferEnabled ? '#2E7D32' : '#9CA3AF'}
                      />
                      <Text
                        style={[
                          styles.paymentMethodText, { color: transferEnabled ? '#2E7D32' : '#9CA3AF' },
                        ]}
                      >
                        Transferencia{' '}
                        {transferEnabled ? '(Activo)' : '(Inactivo)'}
                      </Text>
                    </View>

                    {transferEnabled && (
                      <View style={styles.bankInfoReadonly}>
                        <Text style={styles.bankInfoTitle}>
                          Información bancaria:
                        </Text>
                        {clabe && (
                          <Text style={styles.bankInfoText}>
                            CLABE: {clabe}
                          </Text>
                        )}
                        {bankAccount && (
                          <Text style={styles.bankInfoText}>
                            Tarjeta: {bankAccount}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              ) : (
                // Modo edición
                <>
                  <Text style={styles.mutedText}>
                    Métodos de pago disponibles
                  </Text>

                  <View style={styles.paymentSwitches}>
                    <View style={styles.switchRow}>
                      <View style={styles.switchLabelContainer}>
                        <Text style={styles.switchLabel}>Efectivo</Text>
                        <Text style={styles.switchDescription}>
                          Aceptar pagos en efectivo
                        </Text>
                      </View>
                      <Switch
                        value={cashEnabled}
                        onValueChange={handleCashToggle}
                        trackColor={{ false: '#D1D5DB', true: '#A7F3D0' }}
                        thumbColor={cashEnabled ? '#00CC86' : '#F3F4F6'}
                      />
                    </View>

                    <View style={styles.switchRow}>
                      <View style={styles.switchLabelContainer}>
                        <Text style={styles.switchLabel}>Transferencia</Text>
                        <Text style={styles.switchDescription}>
                          Aceptar transferencias bancarias
                        </Text>
                      </View>
                      <Switch
                        value={transferEnabled}
                        onValueChange={handleTransferToggle}
                        trackColor={{ false: '#D1D5DB', true: '#A7F3D0' }}
                        thumbColor={transferEnabled ? '#00CC86' : '#F3F4F6'}
                      />
                    </View>
                  </View>

                  {/* Sección bancaria */}
                  {transferEnabled && (
                    <View style={styles.bankInfo}>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>
                          CLABE Interbancaria (18 dígitos) *
                        </Text>
                        <TextInput
                          style={[
                            styles.input, clabe && !validateClabe(clabe) && styles.inputError
                          ]}
                          value={clabe}
                          onChangeText={setClabe}
                          placeholder="Ej: 123456789012345678"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="numeric"
                          maxLength={18}
                          returnKeyType="next"
                        />
                        {clabe && !validateClabe(clabe) && (
                          <Text style={styles.errorText}>
                            La CLABE debe tener 18 dígitos
                          </Text>
                        )}
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>
                          Número de tarjeta (16 dígitos)
                        </Text>
                        <TextInput
                          style={[
                            styles.input, bankAccount && !validateBankAccount(bankAccount) && styles.inputError
                          ]}
                          value={bankAccount}
                          onChangeText={setBankAccount}
                          placeholder="Ej: 1234567812345678"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="numeric"
                          maxLength={16}
                          returnKeyType="next"
                        />
                        {bankAccount && !validateBankAccount(bankAccount) && (
                          <Text style={styles.errorText}>
                            El número de tarjeta debe tener 16 dígitos
                          </Text>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Botones de Cancelar y Guardar */}
                  <View style={styles.editButtonsContainer}>
                    <View style={styles.buttonsWrapper}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleCancel}
                        disabled={loading}
                      >
                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                        disabled={loading}
                      >
                        {loading ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.saveButtonText}>Guardar</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Espacio fijo para evitar parpadeos */}
                  <View style={styles.keyboardSpacer} />
                </>
              )}
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </View>

      {/* Modal para mensajes */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View
              style={[
                styles.modalIconContainer,
                modalType === 'error' ? styles.modalIconError : styles.modalIconInfo
              ]}
            >
              <Feather
                name={modalType === 'error' ? 'alert-triangle' : 'check-circle'}
                size={32}
                color="#fff"
              />
            </View>

            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>

            <TouchableOpacity
              style={[
                styles.modalButton,
                modalType === 'error' ? styles.modalButtonError : styles.modalButtonInfo,
              ]}
              onPress={handleModalClose}
            >
              <Text style={styles.modalButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
    flex: 1,
  },
  editIconPlaceholder: {
    width: 20,
  },

  contentContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 0,
  },
  mutedText: {
    color: '#6B7280',
    fontSize: 14,
    fontFamily: 'Poppins-Light',
    marginBottom: 16,
  },
  paymentMethodsList: {
    marginTop: 8,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  paymentMethodText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  paymentSwitches: {
    gap: 20,
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins-Light',
  },
  bankInfo: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
    gap: 16,
    marginBottom: 16,
  },
  bankInfoReadonly: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  bankInfoTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  bankInfoText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
    marginBottom: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    color: '#000',
    marginBottom: 8,
    fontFamily: 'Poppins-Regular',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    color: '#000',
    fontFamily: 'Poppins-Regular',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  editButtonsContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  buttonsWrapper: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    color: '#374151',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#00CC86',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
  },
  keyboardSpacer: {
    height: 230,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconInfo: {
    backgroundColor: '#00CC86',
  },
  modalIconError: {
    backgroundColor: '#EF4444',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  modalButtonInfo: {
    backgroundColor: '#00CC86',
  },
  modalButtonError: {
    backgroundColor: '#EF4444',
  },
  modalButtonText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
  },
});

export default PaymentMethod;
