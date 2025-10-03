import { OrderMessageBase } from './OrderMessageBase';

export class OrderMessageTechnology extends OrderMessageBase {
  generateOrderItems() {
    return this.cartState
      .map((item, index) => {
        const subtotal = this.getItemTotal(item);
        let itemDetails = `${index + 1}. 💻 ${item.name}`;

        if (item.selectedWarranty) {
          itemDetails += ` (Garantía: ${item.selectedWarranty})`;
        }

        return `${itemDetails} × ${item.quantity} - $${subtotal}\n`;
      }).join('');
  }

  getItemTotal(item) {
    let price = item.price;
    if (item.selectedWarranty && item.warrantyOptions) {
      const warranty = item.warrantyOptions.find((w) => w.period === item.selectedWarranty,);
      if (warranty) {
        price += warranty.price;
      }
    }
    return price * item.quantity;
  }
}
