import { OrderMessageFood } from '../data/order-message/OrderMessageFood';
import { OrderMessageFashion } from '../data/order-message/OrderMessageFashion';
import { OrderMessageTechnology } from '../data/order-message/OrderMessageTechnology';
import { OrderMessageHardware } from '../data/order-message/OrderMessageHardware';
import { OrderMessagePharmacy } from '../data/order-message/OrderMessagePharmacy';

const orderMessageGenerators = {
  food: OrderMessageFood,
  fashion: OrderMessageFashion,
  technology: OrderMessageTechnology,
  hardware: OrderMessageHardware,
  pharmacy: OrderMessagePharmacy,
};

/**
 * Genera un mensaje de orden basado en el sector y los datos proporcionados
 * @param {string} sector - El sector del negocio (food, fashion, technology, etc.)
 * @param {Object} orderData - Datos de la orden incluyendo businessName, customerName, etc.
 * @returns {string} Mensaje formateado y codificado para WhatsApp
 * @throws {Error} Si no existe implementación para el sector especificado
 */
export const generateOrderMessage = (sector, orderData) => {
  const MessageGenerator = orderMessageGenerators[sector];

  if (!MessageGenerator) {
    throw new Error(`No hay implementación de OrderMessage para el sector: ${sector}`,);
  }

  const generator = new MessageGenerator(orderData);
  return generator.generateMessage();
};
