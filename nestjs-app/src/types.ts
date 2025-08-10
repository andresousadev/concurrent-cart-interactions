export interface CartItem {
  productId: string;
  quantity: number;
  unitPrice: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  totalPrice: string;
}
