export const buildJsonOrder = (cartState) => {
  return cartState.map((item, index) => {
    const subtotal = (item.price * item.quantity).toFixed(2);
    return `${index + 1}. 🍽️ ${item.name} × ${item.quantity} - $${subtotal}`;
  });
};
