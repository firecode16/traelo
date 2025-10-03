import { OrderMessageBase } from './OrderMessageBase';

export class OrderMessagePharmacy extends OrderMessageBase {
  generateOrderItems() {
    return this.cartState
      .map((item, index) => {
        const subtotal = this.getItemTotal(item);
        let itemDetails = `${index + 1}. 💊 ${item.name}`;

        if (item.requiresPrescription) {
          itemDetails += ' (Requiere receta)';
        }

        return `${itemDetails} × ${item.quantity} - $${subtotal}\n`;
      }).join('');
  }

  getItemTotal(item) {
    return item.price * item.quantity;
  }
}
