import axios from 'axios';
import { API } from '../constants/ApiConfig';

const MERCADO_PAGO_URL = 'https://www.mercadopago.com.mx/subscriptions/checkout/v2?preapproval_plan_id=PLAN_ID';

const PaymentPlanService = {
  // ==================== PLANES DE PAGO ====================

  /**
   * Crear un nuevo plan de pago (inicia trial de 14 días)
   * Endpoint /createSubscription
   * DTO espera businessId, userId, businessName
   */
  createSubscription: async (businessId, userId, businessName) => {
    try {
      const response = await axios.post(API.PAYMENTS.CREATE_PAYMENT_PLAN,
        {
          businessId,
          userId,
          businessName,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000,
        },
      );

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('❌ Error creando plan de pago:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: error.response?.data?.error || 'Error al crear plan de pago',
      };
    }
  },

  /**
   * Obtener información del plan de pago por businessId
   * El endpoint devuelve PaymentPlanDTO directamente, no envuelto en "data"
   */
  getSubscriptionInfo: async (businessId) => {
    try {
      const response = await axios.get(API.PAYMENTS.GET_PAYMENT_PLAN_BY_BUSINESS(businessId),
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        },
      );

      // El backend devuelve PaymentPlanDTO directamente
      return {
        success: true,
        data: response.data,  // NO response.data.data
      };
    } catch (error) {
      console.error('❌ Error obteniendo plan de pago:', error);
      return {
        success: false,
        error: error.message,
        data: {
          status: 'NO_SUBSCRIPTION',
          isTrial: true,
          daysRemaining: 14,
          isActive: false,
          hasActiveSubscription: false,
          canActivate: true,
          mercadoPagoUrl: MERCADO_PAGO_URL,
        },
      };
    }
  },

  /**
   * Activar suscripción después de verificar pago
   * El endpoint es /{id}/activate
   * DTO espera paymentMethod, paymentProofUrl, notes
   */
  activateSubscription: async (paymentPlanId, paymentMethod, paymentProofUrl, notes) => {
    try {
      const response = await axios.put(API.PAYMENTS.ACTIVATE_PAYMENT_PLAN(paymentPlanId),
        {
          paymentMethod,
          paymentProofUrl,
          notes,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        },
      );

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('❌ Error activando suscripción:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: error.response?.data?.error || 'Error al activar suscripción',
      };
    }
  },

  /**
   * Cancelar suscripción
   * Endpoint es /{id}/cancel
   * No requiere body
   */
  cancelSubscription: async (paymentPlanId) => {
    try {
      const response = await axios.put(API.PAYMENTS.CANCEL_PAYMENT_PLAN(paymentPlanId),
        {}, // Body vacío
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        },
      );

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('❌ Error cancelando suscripción:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: error.response?.data?.error || 'Error al cancelar suscripción',
      };
    }
  },

  /**
   * Actualizar información del plan de pago
   * Endpoint es /{id}
   * DTO espera status, lastPaymentDate, paymentMethod, paymentProofUrl, notes
   */
  updateSubscription: async (paymentPlanId, updateData) => {
    try {
      const response = await axios.put(API.PAYMENTS.UPDATE_PAYMENT_PLAN(paymentPlanId), updateData,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        },
      );

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('❌ Error actualizando plan de pago:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: error.response?.data?.error || 'Error al actualizar plan',
      };
    }
  },

  /**
   * Verificar si tiene suscripción activa
   * Endpoint devuelve {hasActiveSubscription: boolean}
   */
  hasActiveSubscription: async (businessId) => {
    try {
      const response = await axios.get(API.PAYMENTS.HAS_ACTIVE_SUBSCRIPTION(businessId),
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        },
      );

      return {
        success: true,
        hasActiveSubscription: response.data.hasActiveSubscription,
        data: response.data,
      };
    } catch (error) {
      console.error('❌ Error verificando suscripción activa:', error);
      return {
        success: false,
        error: error.message,
        hasActiveSubscription: false,
      };
    }
  },

  /**
   * Obtener URL de Mercado Pago
   * Endpoint devuelve {mercadoPagoUrl: string}
   */
  getMercadoPagoUrl: async () => {
    try {
      const response = await axios.get(API.PAYMENTS.GET_MERCADO_PAGO_URL, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });

      return {
        success: true,
        url: response.data.mercadoPagoUrl,
        data: response.data,
      };
    } catch (error) {
      console.error('❌ Error obteniendo URL de Mercado Pago:', error);
      return {
        success: false,
        error: error.message,
        url: MERCADO_PAGO_URL,
      };
    }
  },

  /**
   * Marcar pago como pendiente
   * El endpoint es /{id}/markPending
   * y espera {paymentMethod: string} en el body
   */
  markPaymentAsPending: async (paymentPlanId, paymentMethod) => {
    try {
      const response = await axios.post(API.PAYMENTS.MARK_PAYMENT_AS_PENDING(paymentPlanId),
        { paymentMethod },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        },
      );

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('❌ Error marcando pago como pendiente:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: error.response?.data?.error || 'Error al marcar pago como pendiente',
      };
    }
  },

  /**
   * Función unificada para manejar suscripción completa
   *
   */
  handleSubscription: async (businessId, userId, businessName) => {
    try {
      // 1. Verificar si ya tiene un plan activo
      const checkResult = await PaymentPlanService.hasActiveSubscription(businessId);

      if (checkResult.success && checkResult.hasActiveSubscription) {
        // Ya tiene suscripción activa, obtener detalles
        const planResult = await PaymentPlanService.getSubscriptionInfo(businessId);

        if (planResult.success) {
          return {
            success: true,
            alreadyExists: true,
            data: planResult.data,
            message: 'Ya tienes una suscripción activa',
          };
        }
      }

      // 2. Crear nuevo plan (inicia trial)
      const createResult = await PaymentPlanService.createSubscription(
        businessId,
        userId,
        businessName
      );

      if (!createResult.success) {
        return createResult;
      }

      // 3. Obtener URL de Mercado Pago
      const urlResult = await PaymentPlanService.getMercadoPagoUrl();

      return {
        success: true,
        alreadyExists: false,
        data: {
          ...createResult.data,
          mercadoPagoUrl: urlResult.url,
        },
        mercadoPagoUrl: urlResult.url,
        message: createResult.message,
      };
    } catch (error) {
      console.error('❌ Error manejando suscripción:', error);
      return {
        success: false,
        error: error.message,
        message: 'Error al procesar la suscripción',
      };
    }
  },

  /**
   * Función para obtener estado completo de suscripción
   * Usar getSubscriptionInfo
   */
  getSubscriptionStatus: async (businessId) => {
    try {
      const planResult = await PaymentPlanService.getSubscriptionInfo(businessId);

      if (!planResult.success) {
        // Fallback: crear estado por defecto
        return {
          success: false,
          data: {
            status: 'NO_SUBSCRIPTION',
            isTrial: true,
            daysRemaining: 14,
            isActive: false,
            hasActiveSubscription: false,
            canActivate: true,
            mercadoPagoUrl: MERCADO_PAGO_URL,
          },
        };
      }

      // Si el backend devuelve NO_SUBSCRIPTION, aún podemos mostrar el trial
      if (planResult.data.status === 'NO_SUBSCRIPTION') {
        planResult.data.isTrial = true;
        planResult.data.daysRemaining = 14;
        planResult.data.canActivate = true;
      }

      // Asegurar que siempre haya una URL de Mercado Pago
      if (!planResult.data.mercadoPagoUrl) {
        const urlResult = await PaymentPlanService.getMercadoPagoUrl();
        if (urlResult.success) {
          planResult.data.mercadoPagoUrl = urlResult.url;
        }
      }

      return {
        success: true,
        data: planResult.data,
      };
    } catch (error) {
      console.error('❌ Error obteniendo estado de suscripción:', error);
      return {
        success: false,
        error: error.message,
        data: {
          status: 'ERROR',
          isTrial: true,
          daysRemaining: 14,
          isActive: false,
          hasActiveSubscription: false,
          canActivate: true,
          mercadoPagoUrl: MERCADO_PAGO_URL,
        },
      };
    }
  },

  createPaymentPlan: async (businessId, userId, businessName) => {
    return PaymentPlanService.createSubscription(businessId, userId, businessName);
  },

  getPaymentPlanByBusinessId: async (businessId) => {
    return PaymentPlanService.getSubscriptionInfo(businessId);
  },

  activatePaymentPlan: async (paymentPlanId, paymentMethod, paymentProofUrl, notes) => {
    return PaymentPlanService.activateSubscription(paymentPlanId, paymentMethod, paymentProofUrl, notes);
  },

  cancelPaymentPlan: async (paymentPlanId) => {
    return PaymentPlanService.cancelSubscription(paymentPlanId);
  },

  updatePaymentPlan: async (paymentPlanId, updateData) => {
    return PaymentPlanService.updateSubscription(paymentPlanId, updateData);
  },

  /**
   * Enviar comprobante de pago (para activación manual por admin)
   */
  sendPaymentProof: async (paymentPlanId, paymentProofData) => {
    try {
      const updateData = {
        paymentProofUrl: paymentProofData.url,
        notes: paymentProofData.notes || `Comprobante enviado: ${paymentProofData.method}`,
      };

      return await PaymentPlanService.updateSubscription(paymentPlanId, updateData);
    } catch (error) {
      console.error('❌ Error enviando comprobante:', error);
      return {
        success: false,
        error: error.message,
        message: 'Error al enviar comprobante',
      };
    }
  },

  /**
   * Helper para calcular días restantes localmente
   */
  calculateDaysRemaining: (trialEnd) => {
    if (!trialEnd) return 14;

    try {
      const endDate = new Date(trialEnd);
      const now = new Date();
      const diffTime = endDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    } catch (error) {
      return 14;
    }
  },

  /**
   * Helper para formatear fecha
   */
  formatDate: (dateString) => {
    if (!dateString) return 'No disponible';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch (error) {
      return 'Fecha no válida';
    }
  },

  /**
   * Helper para obtener texto del estado
   */
  getStatusText: (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'Activa';
      case 'TRIAL':
        return 'En Prueba';
      case 'PENDING':
        return 'Pendiente de Pago';
      case 'CANCELLED':
        return 'Cancelada';
      case 'EXPIRED':
        return 'Expirada';
      case 'SUSPENDED':
        return 'Suspendida';
      case 'NO_SUBSCRIPTION':
        return 'Sin Suscripción';
      default:
        return status;
    }
  },

  /**
   * Helper para obtener color del estado
   */
  getStatusColor: (status) => {
    switch (status) {
      case 'ACTIVE':
        return '#10B981';
      case 'TRIAL':
        return '#F59E0B';
      case 'PENDING':
        return '#3B82F6';
      case 'CANCELLED':
        return '#EF4444';
      case 'EXPIRED':
        return '#6B7280';
      case 'SUSPENDED':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  },
};

export default PaymentPlanService;
