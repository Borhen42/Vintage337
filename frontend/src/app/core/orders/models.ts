export type AdminOrderItem = {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  variantSize: string | null;
  variantColor: string | null;
};

export type AdminOrder = {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  customerPhoneSecondary: string | null;
  fulfillment: string | null;
  status: string;
  totalAmount: number;
  createdAt: string;
  awaitingConfirmation: boolean;
  items: AdminOrderItem[];
};
