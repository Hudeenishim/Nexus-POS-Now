export type UserRole = 'admin' | 'manager' | 'cashier';

export interface User {
  uid: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  barcode: string;
  lowStockThreshold: number;
  supplierId?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  category?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  loyaltyPoints: number;
  createdAt: string;
}

export interface Sale {
  id: string;
  date: string;
  userId: string;
  customerId?: string;
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'mobile_money' | 'mtn_momo' | 'telecel_cash';
  paymentReference?: string | null;
  discount: number;
  tax: number;
  createdAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  createdAt: string;
}

export interface InventoryLog {
  id: string;
  productId: string;
  type: 'sale' | 'restock' | 'adjustment';
  quantity: number;
  userId: string;
  createdAt: string;
}
