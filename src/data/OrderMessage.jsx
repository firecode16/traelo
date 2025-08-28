export const generateOrderMessage = (
  businessName,
  customerName,
  cartState,
  location,
  customerNotes,
  deliveryMethod,
  paymentAmount,
  paymentMethod,
  deliveryReference
) => {
  let message = `📦 *Nuevo Pedido vía Tráelo* 🛵\n\n`;

  if (businessName) {
    message += `🛍️ *Negocio:* ${businessName}\n`;
  }

  if (customerName) {
    message += `👤 *Cliente:* ${customerName}\n`;
  }

  if (deliveryMethod) {
    message += `🚚 *Entrega:* ${deliveryMethod}\n`;
  }

  if (location && deliveryMethod === 'A domicilio') {
    message += `📍 *Ubicación:* ${location}\n`;
  }

  if (deliveryReference && deliveryMethod === 'A domicilio') {
    message += `🏠 *Referencia:* ${deliveryReference}\n`;
  }

  if (paymentMethod) {
    const paymentMethodText = paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia Bancaria';
    message += `💳 *Método de pago:* ${paymentMethodText}\n`;
  }

  if (customerNotes?.trim()) {
    message += `\n📝 *Notas:* ${customerNotes.trim()}\n`;
  }

  message += `\n🧾 *Pedido:*\n`;

  cartState.forEach((item, index) => {
    const subtotal = item.price * item.quantity;
    message += `${index + 1}. 🍽️ ${item.name} × ${item.quantity} - $${subtotal}\n`;
  });

  const total = cartState.reduce((sum, item) => sum + item.price * item.quantity, 0);

  message += `\n💰 *Total: $${total}*\n`;

  if (paymentMethod === 'cash' && paymentAmount) {
    const pago = parseFloat(paymentAmount);
    message += `💵 *Pagaré con:* $${pago}\n`;

    if (pago >= total) {
      const cambio = (pago - total).toFixed(2);
      message += `💸 *Cambio:* $${cambio}\n`;
    } else {
      message += `⚠️ *El monto ingresado es menor al total*\n`;
    }
  }

  message += `\n📲 Enviado desde la app Tráelo`;

  return encodeURIComponent(message); // para enviar por URL
};