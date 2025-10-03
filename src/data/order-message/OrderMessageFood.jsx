import { OrderMessageBase } from './OrderMessageBase';

export class OrderMessageFood extends OrderMessageBase {
  generateOrderItems() {
    return this.cartState
      .map((item, index) => {
        const subtotal = this.getItemTotal(item);
        return `${index + 1}. 🍽️ ${item.name} × ${item.quantity} - $${subtotal}\n`;
      }).join('');
  }

  getItemTotal(item) {
    return item.price * item.quantity;
  }
}
