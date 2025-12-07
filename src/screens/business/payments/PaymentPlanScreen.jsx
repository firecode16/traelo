import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PaymentPlanService from '../../../services/PaymentPlanService';

const { width, height } = Dimensions.get('window');

// ==================== CONSTANTES ====================
const MERCADO_PAGO_URL = 'https://www.mercadopago.com.mx/subscriptions/checkout/v2?preapproval_plan_id=ea7d51d0517a479295a988be36d478bd';

// ==================== COMPONENTES REUTILIZABLES ====================
const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

const Button = ({ children, onPress, style, textStyle, disabled = false, icon = null, loading = false, }) => (
  <TouchableOpacity
    style={[styles.button, style, disabled && styles.buttonDisabled]}
    onPress={onPress}
    disabled={disabled || loading}
    activeOpacity={0.7}
  >
    {loading ? (
      <ActivityIndicator size="small" color="#FFFFFF" />
    ) : (
      <>
        {icon}
        <Text style={[styles.buttonText, textStyle]}>{children}</Text>
      </>
    )}
  </TouchableOpacity>
);

const CustomModal = React.memo(
({
    visible,
    title,
    message,
    type = 'info',
    onConfirm,
    onCancel,
    confirmText = 'Aceptar',
    cancelText = 'Cancelar',
    showCancel = true,
  }) => {
    const handleConfirm = () => {
      console.log('🔘 Modal - Botón confirmar presionado');
      if (onConfirm && typeof onConfirm === 'function') {
        onConfirm();
      }
    };

    const handleCancel = () => {
      console.log('🔘 Modal - Botón cancelar presionado');
      if (onCancel && typeof onCancel === 'function') {
        onCancel();
      }
    };

    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Icono según tipo */}
            <View
              style={[
                styles.modalIcon,
                type === 'success'
                  ? styles.modalIconSuccess
                  : type === 'error'
                    ? styles.modalIconError
                    : type === 'warning'
                      ? styles.modalIconWarning
                      : styles.modalIconInfo,
              ]}
            >
              <Feather
                name={
                  type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : type === 'warning' ? 'alert-triangle' : 'info'
                }
                size={32}
                color="#fff"
              />
            </View>

            {/* Título */}
            <Text style={styles.modalTitle}>{title}</Text>

            {/* Mensaje */}
            <Text style={styles.modalMessage}>{message}</Text>

            {/* Botones */}
            <View style={styles.modalButtons}>
              {showCancel && (
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={handleCancel}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelButtonText}>{cancelText}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.modalConfirmButton,
                  type === 'success'
                    ? styles.modalConfirmButtonSuccess
                    : type === 'error'
                      ? styles.modalConfirmButtonError
                      : type === 'warning'
                        ? styles.modalConfirmButtonWarning
                        : styles.modalConfirmButtonInfo,
                ]}
                onPress={handleConfirm}
                activeOpacity={0.7}
              >
                <Text style={styles.modalConfirmButtonText}>{confirmText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  },
);

// ==================== MODAL DE MERCADO PAGO ====================
const MercadoPagoModal = ({ visible, title, message, mercadoPagoUrl, onClose, onPaymentSuccess, onPaymentError, showModal, }) => {
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);
  const loadingTimerRef = useRef(null);

  // Efecto para manejar el timeout del loading
  useEffect(() => {
    if (loading && visible) {
      // Iniciar contador de tiempo
      loadingTimerRef.current = setInterval(() => {
        setLoadingTime((prev) => prev + 1);
      }, 1000);

      // Timeout automático después de 60 segundos (1 minuto)
      const timeout = setTimeout(() => {
        if (loading) {
          console.warn('⚠️ Timeout de carga después de 60 segundos');
          setLoading(false);
          showModal(
            'Tiempo de carga excedido',
            'La página de pago está tardando más de lo normal. Por favor, verifica tu conexión a internet e intenta nuevamente.',
            'warning',
            () => {
              // Reintentar
              if (webViewRef.current) {
                webViewRef.current.reload();
                setLoading(true);
                setLoadingTime(0);
              }
            },
            onClose,
          );
        }
      }, 60000); // 60 segundos

      return () => {
        clearTimeout(timeout);
        if (loadingTimerRef.current) {
          clearInterval(loadingTimerRef.current);
        }
      };
    } else {
      // Resetear contador cuando no está loading
      setLoadingTime(0);
      if (loadingTimerRef.current) {
        clearInterval(loadingTimerRef.current);
      }
    }
  }, [loading, visible]);

  const handleNavigationStateChange = (navState) => {
    setCanGoBack(navState.canGoBack);
    const currentUrl = navState.url.toLowerCase();

    // Detectar pago exitoso usando patrones mejorados
    if (
      currentUrl.includes('approved') ||
      currentUrl.includes('success') ||
      currentUrl.includes('exito') ||
      currentUrl.includes('pago-exitoso') ||
      currentUrl.includes('payment_success') ||
      currentUrl.includes('approved_payment')
    ) {
      console.log('✅ Pago detectado como exitoso');
      setLoading(false);
      setTimeout(() => {
        onClose();
        if (onPaymentSuccess) onPaymentSuccess();
      }, 1500);
    }

    // Detectar error o rechazo
    if (
      currentUrl.includes('rejected') ||
      currentUrl.includes('failure') ||
      currentUrl.includes('error') ||
      currentUrl.includes('payment_error') ||
      currentUrl.includes('payment_failed')
    ) {
      console.log('❌ Pago detectado como fallido');
      setLoading(false);
      onClose();
      showModal('❌ Pago Fallido', 'Hubo un problema con el pago. Intenta con otro método.', 'error',
        () => {
          // Reabrir modal para reintentar
          setTimeout(() => {
            if (webViewRef.current) {
              webViewRef.current.reload();
              setLoading(true);
            }
          }, 300);
        },
        onClose,
      );
    }
  };

  const handleGoBack = () => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
    } else {
      onClose();
    }
  };

  const handleReload = () => {
    if (webViewRef.current) {
      webViewRef.current.reload();
      setLoading(true);
      setLoadingTime(0);
    }
  };

  // Función para forzar el cierre del loading
  const handleForceCloseLoading = () => {
    console.log('🔄 Loading cerrado manualmente');
    setLoading(false);
    if (loadingTimerRef.current) {
      clearInterval(loadingTimerRef.current);
    }
  };

  // Limpiar intervalos al desmontar
  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) {
        clearInterval(loadingTimerRef.current);
      }
    };
  }, []);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.paymentModalOverlay}>
        <View style={styles.paymentModalContent}>
          {/* Header del Modal */}
          <View style={styles.paymentModalHeader}>
            <TouchableOpacity
              style={styles.paymentModalBackButton}
              onPress={handleGoBack}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Feather
                name={canGoBack ? 'arrow-left' : 'x'}
                size={28}
                color="#111827"
              />
            </TouchableOpacity>

            <View style={styles.paymentModalTitleContainer}>
              <Text
                style={styles.paymentModalTitle}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {title || 'Activar Suscripción'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.paymentModalReloadButton}
              onPress={handleReload}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Feather name="refresh-cw" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* WebView */}
          <View style={styles.webviewContainer}>
            <WebView
              ref={webViewRef}
              source={{
                uri: mercadoPagoUrl,
                headers: { 'Cache-Control': 'no-cache', },
              }}
              style={styles.webview}
              onLoadStart={() => {
                console.log('🌐 Iniciando carga de WebView...');
                setLoading(true);
                setLoadingTime(0);
              }}
              onLoadEnd={() => {
                console.log('✅ WebView cargado exitosamente');
                setLoading(false);
                if (loadingTimerRef.current) {
                  clearInterval(loadingTimerRef.current);
                }
              }}
              onLoadProgress={({ nativeEvent }) => { }}
              onNavigationStateChange={handleNavigationStateChange}
              startInLoadingState={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsBackForwardNavigationGestures={true}
              sharedCookiesEnabled={true}
              cacheEnabled={false} // Deshabilitar cache para forzar recarga
              renderLoading={() => (
                <View style={styles.webviewLoadingContainer}>
                  <ActivityIndicator size="large" color="#00CC86" />
                  <Text style={styles.webviewLoadingText}>
                    Cargando pago seguro...
                  </Text>
                </View>
              )}
              onError={(error) => {
                console.error('❌ Error en WebView:', error.nativeEvent);
                setLoading(false);
                onClose();
                showModal(
                  'Error de conexión',
                  'Verifica tu conexión a internet e intenta de nuevo.',
                  'error',
                  () => {
                    setTimeout(() => {
                      if (webViewRef.current) {
                        webViewRef.current.reload();
                        setLoading(true);
                      }
                    }, 300);
                  },
                );
              }}
              onHttpError={(error) => {
                console.error('❌ Error HTTP en WebView:', error.nativeEvent);
                setLoading(false);
                showModal(
                  'Error al cargar la página',
                  'Hubo un problema técnico. Por favor, intenta nuevamente.',
                  'error',
                  () => {
                    if (webViewRef.current) {
                      webViewRef.current.reload();
                      setLoading(true);
                    }
                  },
                );
              }}
              onContentProcessDidTerminate={() => {
                console.warn('⚠️ WebView se cerró inesperadamente');
                setLoading(false);
                showModal(
                  'Página recargada',
                  'La página se cerró inesperadamente. Hemos recargado el contenido.',
                  'info',
                  () => {
                    if (webViewRef.current) {
                      webViewRef.current.reload();
                      setLoading(true);
                    }
                  },
                );
              }}
            />
          </View>

          {/* Loading Overlay con timeout y botón de cancelar */}
          {loading && (
            <View style={styles.webviewOverlay}>
              <View style={styles.webviewLoadingCard}>
                <ActivityIndicator size="large" color="#00CC86" />
                <Text style={styles.webviewOverlayTitle}>
                  Procesando pago seguro...
                </Text>
                <Text style={styles.webviewOverlaySubtitle}>
                  {loadingTime < 30
                    ? 'No cierres esta ventana hasta completar el pago'
                    : `Cargando... (${loadingTime}s)`}
                </Text>

                {/* Mostrar advertencia después de 30 segundos */}
                {loadingTime >= 30 && loadingTime < 60 && (
                  <View style={styles.timeoutWarning}>
                    <Feather name="alert-triangle" size={18} color="#F59E0B" />
                    <Text style={styles.timeoutWarningText}>
                      La carga está tardando más de lo normal
                    </Text>
                  </View>
                )}

                {/* Mostrar opción de cancelar después de 10 segundos */}
                {loadingTime >= 10 && (
                  <View style={styles.loadingActions}>
                    <TouchableOpacity
                      style={styles.secondaryActionButton}
                      onPress={handleReload}
                    >
                      <Feather name="refresh-cw" size={16} color="#3B82F6" />
                      <Text style={styles.secondaryActionText}>Reintentar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.primaryActionButton}
                      onPress={handleForceCloseLoading}
                    >
                      <Feather name="x" size={16} color="#FFFFFF" />
                      <Text style={styles.primaryActionText}>Cerrar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Footer */}
          <View style={styles.paymentModalFooter}>
            <Feather name="lock" size={16} color="#10B981" />
            <Text style={styles.paymentModalFooterText}>
              Pago 100% seguro con
            </Text>
            <Text style={styles.mercadoPagoBrand}>Mercado Pago</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function PaymentPlanScreen() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Estados para modales
  const [customModal, setCustomModal] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    onCancel: null,
    confirmText: 'Aceptar',
    cancelText: 'Cancelar',
    showCancel: true,
  });

  const [businessId, setBusinessId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [businessName, setBusinessName] = useState('');

  const [subscription, setSubscription] = useState({
    id: null,
    status: 'NO_SUBSCRIPTION',
    planType: 'BUSINESS_PLAN',
    isTrial: true,
    daysRemaining: 14,
    mercadoPagoUrl: null,
    trialStart: null,
    trialEnd: null,
    nextBillingDate: null,
    amountMxn: 369.0,
    createdAt: null,
  });

  const [mercadoPagoUrl, setMercadoPagoUrl] = useState(MERCADO_PAGO_URL);

  // ==================== FUNCIONES DE MODALES ====================
  const closeModal = useCallback(() => {
    console.log('🗂️ Cerrando modal personalizado');
    setCustomModal((prev) => ({ ...prev, visible: false }));
  }, []);

  const showModal = useCallback((title, message, type = 'info', onConfirm = null, onCancel = null, confirmText = 'Aceptar', cancelText = 'Cancelar', showCancel = true,) => {
      console.log('🗂️ Mostrando modal:', title);

      const modalConfig = {
        visible: true,
        title,
        message,
        type,
        confirmText,
        cancelText,
        showCancel,
      };

      // Configurar onConfirm
      if (onConfirm && typeof onConfirm === 'function') {
        modalConfig.onConfirm = () => {
          console.log('✅ Ejecutando onConfirm personalizado');
          onConfirm();
          closeModal();
        };
      } else {
        modalConfig.onConfirm = closeModal;
      }

      // Configurar onCancel
      if (onCancel && typeof onCancel === 'function') {
        modalConfig.onCancel = () => {
          console.log('❌ Ejecutando onCancel personalizado');
          onCancel();
          closeModal();
        };
      } else {
        modalConfig.onCancel = closeModal;
      }

      setCustomModal(modalConfig);
    },
    [closeModal],
  );

  const showSuccessModal = useCallback(
    (title, message, onConfirm = null) => {
      console.log('✅ Mostrando modal de éxito');
      showModal(title, message, 'success', onConfirm);
    },
    [showModal],
  );

  const showErrorModal = useCallback(
    (title, message, onConfirm = null) => {
      console.log('❌ Mostrando modal de error');
      showModal(title, message, 'error', onConfirm);
    },
    [showModal],
  );

  const showWarningModal = useCallback(
    (title, message, onConfirm = null, onCancel = null) => {
      console.log('⚠️ Mostrando modal de advertencia');
      showModal(title, message, 'warning', onConfirm, onCancel);
    },
    [showModal],
  );

  const showInfoModal = useCallback(
    (title, message, onConfirm = null) => {
      console.log('ℹ️ Mostrando modal de información');
      showModal(title, message, 'info', onConfirm);
    },
    [showModal],
  );

  // ==================== EFFECTS ====================
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem('userInfo');
      if (stored) {
        const user = JSON.parse(stored);
        setBusinessId(user.businessId);
        setUserId(user.userId || user.id);
        setBusinessName(user.businessName || user.fullName || 'Mi Negocio');

        if (user.businessId) {
          await loadSubscription(user.businessId);
        } else {
          showErrorModal('Error', 'No se encontró businessId en el perfil');
        }
      } else {
        showErrorModal('Error', 'No se encontró información del usuario');
      }
    } catch (error) {
      console.error('❌ Error cargando perfil:', error);
      showErrorModal('Error', 'No se pudo cargar la información del perfil');
    } finally {
      setLoading(false);
    }
  };

  const loadSubscription = async (id) => {
    try {
      const result = await PaymentPlanService.getSubscriptionStatus(id);

      if (result.success && result.data) {
        // Mapeo de datos del servicio a nuestro estado local
        const planData = result.data;
        setSubscription({
          id: planData.id || null,
          status: planData.status || 'NO_SUBSCRIPTION',
          planType: planData.planType || 'BUSINESS_PLAN',
          isTrial: planData.isTrial || planData.status === 'TRIAL',
          daysRemaining: planData.daysRemaining || 14,
          mercadoPagoUrl: planData.mercadoPagoUrl,
          trialStart: planData.trialStart,
          trialEnd: planData.trialEnd,
          nextBillingDate: planData.nextBillingDate,
          amountMxn: planData.amountMxn || 369.0,
          createdAt: planData.createdAt,
        });

        if (planData.mercadoPagoUrl) {
          setMercadoPagoUrl(planData.mercadoPagoUrl);
        } else {
          // Usar la constante local si no viene del backend
          setMercadoPagoUrl(MERCADO_PAGO_URL);
        }
      } else {
        // Usar estado por defecto si el servicio falla
        const urlResult = await PaymentPlanService.getMercadoPagoUrl();
        const defaultSubscription = {
          ...subscription,
          mercadoPagoUrl: urlResult.url || MERCADO_PAGO_URL,
          businessId: id,
        };
        setSubscription(defaultSubscription);
        setMercadoPagoUrl(urlResult.url || MERCADO_PAGO_URL);
      }
    } catch (error) {
      console.error('❌ Error cargando suscripción:', error);
      // Fallback a valores por defecto
      const urlResult = await PaymentPlanService.getMercadoPagoUrl();
      const fallbackSubscription = {
        ...subscription,
        status: 'NO_SUBSCRIPTION',
        isTrial: true,
        daysRemaining: 14,
        mercadoPagoUrl: urlResult.url || MERCADO_PAGO_URL,
        businessId: id,
      };
      setSubscription(fallbackSubscription);
      setMercadoPagoUrl(urlResult.url || MERCADO_PAGO_URL);
    }
  };

  // ==================== HANDLERS ====================
  const handleActivateSubscription = async () => {
    if (!businessId || !userId) {
      showErrorModal('Error', 'No se encontró información del negocio/usuario');
      return;
    }

    setProcessing(true);

    try {
      // Usar la función unificada del servicio corregido
      const result = await PaymentPlanService.handleSubscription(
        businessId,
        userId,
        businessName,
      );

      if (result.success && result.data) {
        // Verificar si ya existe una suscripción
        if (result.alreadyExists) {
          showInfoModal(
            'Suscripción Existente',
            'Ya tienes una suscripción activa. Redirigiendo al portal de pagos...',
            () => {
              // Abrir modal con la URL existente
              if (result.data.mercadoPagoUrl) {
                setMercadoPagoUrl(result.data.mercadoPagoUrl);
              } else {
                setMercadoPagoUrl(MERCADO_PAGO_URL);
              }
              setTimeout(() => setShowPaymentModal(true), 500);
            },
          );
          return;
        }

        // Actualizar estado local con los datos del servicio
        const planData = result.data;
        const updatedSubscription = {
          id: planData.id || null,
          status: planData.status || 'PENDING',
          planType: planData.planType || 'BUSINESS_PLAN',
          isTrial: planData.isTrial || true,
          daysRemaining: planData.daysRemaining || 14,
          mercadoPagoUrl: planData.mercadoPagoUrl,
          trialStart: planData.trialStart,
          trialEnd: planData.trialEnd,
          amountMxn: planData.amountMxn || 369.0,
          createdAt: planData.createdAt,
        };

        setSubscription(updatedSubscription);

        // Configurar URL de Mercado Pago
        let finalUrl = null;

        if (planData.mercadoPagoUrl) {
          finalUrl = planData.mercadoPagoUrl;
        } else if (result.mercadoPagoUrl) {
          finalUrl = result.mercadoPagoUrl;
        } else {
          // Obtener URL por defecto si no viene en la respuesta
          const urlResult = await PaymentPlanService.getMercadoPagoUrl();
          if (urlResult.success && urlResult.url) {
            finalUrl = urlResult.url;
          } else {
            finalUrl = MERCADO_PAGO_URL;
          }
        }

        if (finalUrl) {
          setMercadoPagoUrl(finalUrl);
          setTimeout(() => setShowPaymentModal(true), 500);
        } else {
          showErrorModal('Error', 'No se pudo generar el enlace de pago');
        }
      } else {
        showErrorModal('Error', result.message || 'No se pudo crear la suscripción',);
      }
    } catch (error) {
      console.error('❌ Error activando suscripción:', error);
      showErrorModal('Error', 'Ocurrió un error al activar la suscripción');
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      if (!subscription.id && businessId) {
        // Si no tenemos ID de suscripción, recargar desde el backend
        await loadSubscription(businessId);

        showSuccessModal(
          '🎉 ¡Pago Exitoso!',
          'Tu pago ha sido procesado correctamente. Estamos activando tu suscripción...',
          () => {
            // Recargar datos después de unos segundos
            setTimeout(() => loadSubscription(businessId), 2000);
          },
        );
        return;
      }

      // Actualizar suscripción en backend
      const result = await PaymentPlanService.activatePaymentPlan(
        subscription.id,
        'MERCADO_PAGO', // Método de pago
        null, // URL de comprobante (Mercado Pago lo maneja internamente)
        'Pago procesado a través de Mercado Pago',
      );

      if (result.success) {
        // Actualizar estado local
        const updatedPlan = result.data;
        setSubscription((prev) => ({
          ...prev,
          status: updatedPlan.status || 'ACTIVE',
          isTrial: false,
          nextBillingDate: updatedPlan.nextBillingDate,
          lastPaymentDate: updatedPlan.lastPaymentDate,
        }));

        // Actualizar AsyncStorage con información del plan
        try {
          const stored = await AsyncStorage.getItem('userInfo');
          
          if (stored) {
            const user = JSON.parse(stored);
            user.hasActiveSubscription = true;
            user.currentPlan = {
              planId: subscription.id,
              planType: subscription.planType,
              status: 'ACTIVE',
              nextBillingDate: updatedPlan.nextBillingDate,
            };
            await AsyncStorage.setItem('userInfo', JSON.stringify(user));
          }
        } catch (storageError) {
          console.error('❌ Error actualizando AsyncStorage:', storageError);
        }

        showSuccessModal(
          '🎉 ¡Suscripción Activada!',
          'Ahora tienes acceso completo a todas las funciones de Traelo App.',
          () => {
            // Recargar datos de suscripción
            loadSubscription(businessId);
          },
        );
      } else {
        showErrorModal('Error', result.message || 'No se pudo actualizar el estado de la suscripción',);
      }
    } catch (error) {
      console.error('❌ Error procesando pago exitoso:', error);
      showErrorModal('Error', 'No se pudo actualizar el estado de la suscripción',);
    }
  };

  const handlePaymentError = () => {
    showWarningModal(
      'Pago no completado',
      'Puedes intentar nuevamente cuando lo desees.',
      () => {
        // Reabrir modal de pago
        setTimeout(() => setShowPaymentModal(true), 300);
      },
    );
  };

  const handleCancelSubscription = async () => {
    if (!subscription.id) {
      showErrorModal('Error', 'No se encontró información de la suscripción');
      return;
    }

    showWarningModal(
      '¿Cancelar suscripción?',
      'Si cancelas, tu acceso terminará al final del período actual.',
      async () => {
        try {
          const result = await PaymentPlanService.cancelPaymentPlan(subscription.id,);

          if (result.success) {
            // Actualizar estado local
            const updatedPlan = result.data;
            
            setSubscription((prev) => ({
              ...prev,
              status: updatedPlan.status || 'CANCELLED',
              isTrial: false,
            }));

            // Actualizar AsyncStorage
            try {
              const stored = await AsyncStorage.getItem('userInfo');
              
              if (stored) {
                const user = JSON.parse(stored);
                user.hasActiveSubscription = false;
                
                if (user.currentPlan) {
                  user.currentPlan.status = 'CANCELLED';
                }
                await AsyncStorage.setItem('userInfo', JSON.stringify(user));
              }
            } catch (storageError) {
              console.error('❌ Error actualizando AsyncStorage:', storageError,);
            }

            showSuccessModal('Suscripción cancelada', 'Tu suscripción se cancelará al final del período actual.',);
          } else {
            showErrorModal('Error', result.message || 'No se pudo cancelar la suscripción',);
          }
        } catch (error) {
          console.error('❌ Error cancelando suscripción:', error);
          showErrorModal('Error', 'No se pudo cancelar la suscripción');
        }
      },
      null,
      'Sí, cancelar',
      'No, mantener',
    );
  };

  const handleManualPayment = async () => {
    showInfoModal(
      'Pago Manual',
      '¿Deseas realizar el pago mediante OXXO, transferencia bancaria u otro método?',
      async () => {
        try {
          if (!subscription.id) {
            showErrorModal('Error', 'Primero debes crear una suscripción');
            return;
          }

          // Marcar pago como pendiente...
          const result = await PaymentPlanService.markPaymentAsPending(subscription.id, 'MANUAL',);

          if (result.success) {
            showSuccessModal(
              'Pago marcado como pendiente',
              'Hemos registrado tu intención de pago. Un administrador verificará el comprobante y activará tu suscripción manualmente.',
              () => {
                // Recargar estado
                loadSubscription(businessId);
              },
            );
          } else {
            showErrorModal('Error', result.message || 'No se pudo marcar el pago como pendiente',);
          }
        } catch (error) {
          console.error('❌ Error en pago manual:', error);
          showErrorModal('Error', 'No se pudo marcar el pago como pendiente');
        }
      },
    );
  };

  // ==================== RENDER HELPERS ====================
  const getStatusColor = (status) => {
    return PaymentPlanService.getStatusColor(status);
  };

  const getStatusText = (status) => {
    return PaymentPlanService.getStatusText(status);
  };

  const formatDate = (dateString) => {
    return PaymentPlanService.formatDate(dateString);
  };

  // ==================== RENDER ====================
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#00CC86" />
        <Text style={styles.loadingText}>Cargando información...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Plan de Suscripción</Text>
            <Text style={styles.headerSubtitle}>
              Gestión de pagos mensuales
            </Text>
          </View>

          {/* Estado */}
          <Card style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusTitle}>Estado Actual</Text>
              <View
                style={[
                  styles.statusBadge, { backgroundColor: getStatusColor(subscription.status) },
                ]}
              >
                <Text style={styles.statusBadgeText}>
                  {getStatusText(subscription.status)}
                </Text>
              </View>
            </View>

            {subscription.status !== 'NO_SUBSCRIPTION' && (
              <>
                {subscription.planType && (
                  <View style={styles.statusDetail}>
                    <Feather name="package" size={18} color="#6B7280" />
                    <Text style={styles.statusDetailText}>Plan:</Text>
                    <Text style={styles.statusDate}>
                      {subscription.planType === 'BUSINESS_PLAN' ? 'Negocio' : 'Personal'}
                    </Text>
                  </View>
                )}

                <View style={styles.statusDetail}>
                  <Feather name="calendar" size={18} color="#6B7280" />
                  <Text style={styles.statusDetailText}>
                    {subscription.isTrial ? 'Prueba hasta:' : 'Próximo cobro:'}
                  </Text>
                  <Text style={styles.statusDate}>
                    {formatDate(subscription.isTrial ? subscription.trialEnd : subscription.nextBillingDate,)}
                  </Text>
                </View>

                {subscription.isTrial && subscription.daysRemaining > 0 && (
                  <View style={styles.statusDetail}>
                    <Feather name="clock" size={18} color="#6B7280" />
                    <Text style={styles.statusDetailText}>Días restantes:</Text>
                    <Text style={[styles.statusDate, styles.daysRemaining]}>
                      {subscription.daysRemaining} días
                    </Text>
                  </View>
                )}

                {subscription.amountMxn && (
                  <View style={styles.statusDetail}>
                    <Feather name="dollar-sign" size={18} color="#6B7280" />
                    <Text style={styles.statusDetailText}>Monto mensual:</Text>
                    <Text style={styles.statusDate}>
                      ${subscription.amountMxn} MXN
                    </Text>
                  </View>
                )}
              </>
            )}

            {subscription.status === 'NO_SUBSCRIPTION' && (
              <View style={styles.statusDetail}>
                <Feather name="info" size={18} color="#3B82F6" />
                <Text style={[styles.statusDetailText, { color: '#3B82F6' }]}>
                  No tienes una suscripción activa. ¡Comienza tu prueba gratuita!
                </Text>
              </View>
            )}
          </Card>

          {/* Plan */}
          <Card style={styles.planCard}>
            <View style={styles.planHeader}>
              <View style={styles.planIcon}>
                <MaterialIcons name="stars" size={28} color="#F59E0B" />
              </View>
              <View>
                <Text style={styles.planTitle}>🔵 PLAN NEGOCIO</Text>
                <Text style={styles.planPrice}>$369 / mensual</Text>
              </View>
            </View>

            <Text style={styles.planIncludes}>Todo incluido:</Text>

            <View style={styles.featuresList}>
              {[
                'Para recoger',
                'A Domicilio',
                'Puntos de entrega',
                'Auto-expansión controlada',
                'Dashboard completo',
                'Gastos de envío configurables',
                'Logística propia',
              ].map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <MaterialIcons name="check-circle" size={20} color="#10B981" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </Card>

          {/* Acciones */}
          <Card style={styles.actionsCard}>
            {subscription.status === 'NO_SUBSCRIPTION' || subscription.isTrial ? (
              <>
                <Text style={styles.actionTitle}>
                  {subscription.isTrial ? '¡No pierdas acceso!' : 'Comienza ahora'}
                </Text>
                <Text style={styles.actionDescription}>
                  {subscription.isTrial
                    ? `Activa tu suscripción antes de que terminen los ${subscription.daysRemaining} días de prueba.`
                    : '14 días de prueba gratuita con todas las funcionalidades.'}
                </Text>

                <View style={styles.actionButtonsContainer}>
                  {/* Botón Activar Suscripción */}
                  <Button
                    style={[styles.primaryButton, styles.fullWidthButton]}
                    textStyle={styles.primaryButtonText}
                    onPress={handleActivateSubscription}
                    disabled={processing}
                    loading={processing}
                    icon={
                      !processing && (
                        <MaterialIcons name="lock-open" size={20} color="#FFFFFF" />
                      )
                    }
                  >
                    {subscription.isTrial ? 'Activar Suscripción' : 'Comenzar Prueba'}
                  </Button>

                  {/* Botón Otros métodos de pago */}
                  <Button
                    style={[styles.secondaryButton, styles.fullWidthButton]}
                    textStyle={styles.secondaryButtonText}
                    onPress={handleManualPayment}
                    icon={
                      <Feather name="dollar-sign" size={18} color="#00CC86" />
                    }
                  >
                    Otros métodos de pago
                  </Button>
                </View>
              </>
            ) : subscription.status === 'ACTIVE' ? (
              <>
                <Text style={styles.actionTitle}>Suscripción Activa</Text>
                <Text style={styles.actionDescription}>
                  Tu suscripción está activa y se renovará automáticamente el{' '}
                  {formatDate(subscription.nextBillingDate)}.
                </Text>

                <View style={styles.actionButtonsContainer}>
                  <Button
                    style={[styles.secondaryButton, styles.fullWidthButton]}
                    textStyle={styles.secondaryButtonText}
                    onPress={() => setShowPaymentModal(true)}
                    icon={
                      <Feather name="external-link" size={18} color="#00CC86" />
                    }
                  >
                    Ver en Mercado Pago
                  </Button>

                  <Button
                    style={[styles.cancelButton, styles.fullWidthButton]}
                    textStyle={styles.cancelButtonText}
                    onPress={handleCancelSubscription}
                    icon={<Feather name="x-circle" size={18} color="#EF4444" />}
                  >
                    Cancelar Suscripción
                  </Button>
                </View>
              </>
            ) : subscription.status === 'CANCELLED' ? (
              <>
                <Text style={styles.actionTitle}>Suscripción Cancelada</Text>
                <Text style={styles.actionDescription}>
                  Tu suscripción ha sido cancelada. Puedes reactivarla en cualquier momento.
                </Text>

                <Button
                  style={[styles.primaryButton, styles.fullWidthButton]}
                  textStyle={styles.primaryButtonText}
                  onPress={handleActivateSubscription}
                  icon={
                    <MaterialIcons name="refresh" size={20} color="#FFFFFF" />
                  }
                >
                  Reactivar Suscripción
                </Button>
              </>
            ) : subscription.status === 'PENDING' ? (
              <>
                <Text style={styles.actionTitle}>Pago Pendiente</Text>
                <Text style={styles.actionDescription}>
                  Tu pago está siendo verificado. Te notificaremos cuando tu suscripción sea activada.
                </Text>

                <Button
                  style={[styles.secondaryButton, styles.fullWidthButton]}
                  textStyle={styles.secondaryButtonText}
                  onPress={() => loadSubscription(businessId)}
                  icon={<Feather name="refresh-cw" size={18} color="#00CC86" />}
                >
                  Verificar Estado
                </Button>
              </>
            ) : null}
          </Card>

          {/* Información */}
          <View style={styles.infoBox}>
            <Feather name="info" size={18} color="#3B82F6" />
            <Text style={styles.infoText}>
              Paga con OXXO, SPEI o tarjetas. Sin contratos, cancela cuando quieras.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Modal de Mercado Pago */}
      <MercadoPagoModal
        visible={showPaymentModal}
        title="Activar Suscripción"
        message="Completa el pago para activar tu suscripción mensual"
        mercadoPagoUrl={mercadoPagoUrl}
        onClose={() => setShowPaymentModal(false)}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
        showModal={showModal}
      />

      {/* Modal Personalizado para Alertas */}
      <CustomModal
        visible={customModal.visible}
        title={customModal.title}
        message={customModal.message}
        type={customModal.type}
        onConfirm={customModal.onConfirm}
        onCancel={customModal.onCancel}
        confirmText={customModal.confirmText}
        cancelText={customModal.cancelText}
        showCancel={customModal.showCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 16,
    paddingVertical: 24,
  },

  // Header
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
    lineHeight: 34,
  },
  headerSubtitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Light',
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 22,
  },

  // Componentes reutilizables
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  // ESTILOS PARA BOTONES
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // Status Card
  statusCard: {
    padding: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    textTransform: 'uppercase',
  },
  statusDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  statusDetailText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
    flex: 1,
  },
  statusDate: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
  },
  daysRemaining: {
    color: '#F59E0B',
  },

  // Plan Card
  planCard: {
    padding: 24,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  planIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF3CD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#00CC86',
  },
  planIncludes: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#374151',
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    color: '#4B5563',
    flex: 1,
  },

  // Actions Card
  actionsCard: {
    padding: 24,
  },
  actionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginBottom: 8,
  },
  actionDescription: {
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 24,
  },
  actionButtonsContainer: {
    gap: 12,
  },
  fullWidthButton: {
    width: '100%',
  },

  // ESTILOS ESPECÍFICOS PARA BOTONES
  primaryButton: {
    backgroundColor: '#00CC86',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  secondaryButton: {
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#00CC86',
  },
  secondaryButtonText: {
    color: '#00CC86',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  cancelButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',
  },

  // ==================== MODAL PERSONALIZADO ====================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconSuccess: {
    backgroundColor: '#10B981',
  },
  modalIconError: {
    backgroundColor: '#EF4444',
  },
  modalIconWarning: {
    backgroundColor: '#F59E0B',
  },
  modalIconInfo: {
    backgroundColor: '#3B82F6',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  modalConfirmButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmButtonSuccess: {
    backgroundColor: '#10B981',
  },
  modalConfirmButtonError: {
    backgroundColor: '#EF4444',
  },
  modalConfirmButtonWarning: {
    backgroundColor: '#F59E0B',
  },
  modalConfirmButtonInfo: {
    backgroundColor: '#3B82F6',
  },
  modalConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },

  // ==================== MODAL DE MERCADO PAGO ====================
  paymentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 0,
  },
  paymentModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    height: height * 0.9,
    maxHeight: height * 0.9,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  paymentModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    minHeight: 70,
  },
  paymentModalBackButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
  },
  paymentModalTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 8,
  },
  paymentModalTitle: {
    fontSize: 17,
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    textAlign: 'center',
    flexShrink: 1,
    maxWidth: '70%',
  },
  paymentModalReloadButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
  },
  webviewContainer: {
    flex: 1,
    minHeight: 450,
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webviewLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  webviewLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
  },
  webviewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  webviewLoadingCard: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  webviewOverlayTitle: {
    marginTop: 20,
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    textAlign: 'center',
  },
  webviewOverlaySubtitle: {
    marginTop: 8,
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  paymentModalFooter: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#F9FAFB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    minHeight: 60,
  },
  paymentModalFooterText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  mercadoPagoBrand: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#00B1EA',
  },
  paymentModalMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#EFF6FF',
    borderTopWidth: 1,
    borderTopColor: '#DBEAFE',
    gap: 12,
  },
  paymentModalMessageText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    color: '#4B5563',
    lineHeight: 22,
  },

  // ==================== ESTILOS PARA TIMEOUT ====================
  timeoutWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  timeoutWarningText: {
    fontSize: 13,
    color: '#92400E',
    fontFamily: 'Poppins-Regular',
  },
  loadingActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  primaryActionButton: {
    flex: 1,
    backgroundColor: '#00CC86',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  secondaryActionButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryActionText: {
    color: '#374151',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
});
