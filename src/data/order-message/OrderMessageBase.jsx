export class OrderMessageBase {
  constructor(orderData) {
    this.businessName = orderData.businessName;
    this.customerName = orderData.customerName;
    this.cartState = orderData.cartState;
    this.location = orderData.location;
    this.customerNotes = orderData.customerNotes;
    this.deliveryMethod = orderData.deliveryMethod;
    this.paymentAmount = orderData.paymentAmount;
    this.paymentMethod = orderData.paymentMethod;
    this.deliveryReference = orderData.deliveryReference;
    this.deliveryTime = orderData.deliveryTime;
  }

  generateHeader() {
    let message = `📦 *Nuevo Pedido vía Tráelo* 🛵\n\n`;

    if (this.businessName) {
      message += `🛍️ *Negocio:* ${this.businessName}\n`;
    }

    if (this.customerName) {
      message += `👤 *Cliente:* ${this.customerName}\n`;
    }

    if (this.deliveryMethod) {
      message += `🚚 *Entrega:* ${this.deliveryMethod}\n`;
    }

    if (this.location && this.deliveryMethod === 'A domicilio') {
      message += `📍 *Ubicación:* ${this.location}\n`;
    }

    if (this.deliveryReference && this.deliveryMethod === 'A domicilio') {
      message += `🏠 *Referencia:* ${this.deliveryReference}\n`;
    }

    if (this.deliveryTime) {
      message += `⏱️ *Tiempo de entrega:* ${this.deliveryTime}\n`;
    }

    return message;
  }

  generatePaymentInfo() {
    let message = '';

    if (this.paymentMethod) {
      const paymentMethodText = this.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia Bancaria';
      message += `💳 *Método de pago:* ${paymentMethodText}\n`;
    }

    if (this.customerNotes?.trim()) {
      message += `\n📝 *Notas:* ${this.customerNotes.trim()}\n`;
    }

    return message;
  }

  generateOrderItems() {
    throw new Error('generateOrderItems debe ser implementado por la clase hija',);
  }

  generateTotalSection() {
    let message = '';
    const total = this.calculateTotal();

    message += `\n💰 *Total: $${total}*\n`;

    if (this.paymentMethod === 'cash' && this.paymentAmount) {
      const pago = parseFloat(this.paymentAmount);
      message += `💵 *Pagaré con:* $${pago}\n`;

      if (pago >= total) {
        const cambio = (pago - total).toFixed(2);
        message += `💸 *Cambio:* $${cambio}\n`;
      } else {
        message += `⚠️ *El monto ingresado es menor al total*\n`;
      }
    }

    return message;
  }

  calculateTotal() {
    return this.cartState.reduce(
      (sum, item) => sum + this.getItemTotal(item), 0,);
  }

  getItemTotal(item) {
    throw new Error('getItemTotal debe ser implementado por la clase hija');
  }

  generateMessage() {
    let message = this.generateHeader();
    message += this.generatePaymentInfo();
    message += `\n🧾 *Pedido:*\n`;
    message += this.generateOrderItems();
    message += this.generateTotalSection();
    message += `\n📲 Enviado desde la app Tráelo`;

    return message;
  }
}
