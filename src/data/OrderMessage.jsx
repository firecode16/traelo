export const generateOrderMessage = (
  businessName,
  customerName,
  cartState,
  location,
) => {
  let message = `📦 *Nuevo Pedido vía Tráelo* 🛵\n\n`;

  if (businessName) {
    message += `🛍️ *Negocio:* ${businessName}\n`;
  }

  if (customerName) {
    message += `👤 *Cliente:* ${customerName}\n`;
  }

  if (location) {
    message += `📍 *Ubicación del cliente::* ${location}\n`;
  }

  message += `\n🧾 *Pedido:*\n`;

  cartState.forEach((item, index) => {
    const subtotal = item.price * item.quantity;
    message += `${index + 1}. 🍽️ ${item.name} × ${item.quantity} - $${subtotal}\n`;
  });

  const total = cartState.reduce((sum, item) => sum + item.price * item.quantity, 0);
  message += `\n💰 *Total: $${total}*\n\n📲 Enviado desde la app Tráelo`;

  return encodeURIComponent(message); // para enviar por URL
};
