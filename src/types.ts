// Define the possible roles a user can have in the system
export type UserRole = 'admin' | 'manager' | 'cashier';

// Interface representing a user in the application
export interface User {
  // Unique identifier for the user
  uid: string;
  // Full name of the user
  name: string;
  // Username for login
  username: string;
  // Email address of the user
  email: string;
  // Optional phone number of the user
  phoneNumber?: string;
  // Optional role assigned to the user
  role?: UserRole;
  // ISO timestamp of when the user was created
  createdAt: string;
}

// Interface representing a product in the inventory
export interface Product {
  // Unique identifier for the product
  id: string;
  // Name of the product
  name: string;
  // Category the product belongs to
  category: string;
  // Selling price of the product
  price: number;
  // Current quantity in stock
  quantity: number;
  // Barcode string for the product
  barcode: string;
  // Threshold for low stock notifications
  lowStockThreshold: number;
  // Optional identifier for the product's supplier
  supplierId?: string;
  // ISO timestamp of when the product was added
  createdAt: string;
}

// Interface representing a supplier of products
export interface Supplier {
  // Unique identifier for the supplier
  id: string;
  // Name of the supplier company
  name: string;
  // Name of the primary contact person at the supplier
  contactPerson: string;
  // Phone number of the supplier
  phone: string;
  // Optional email address of the supplier
  email?: string;
  // Optional physical address of the supplier
  address?: string;
  // Optional category of goods provided by the supplier
  category?: string;
  // ISO timestamp of when the supplier record was created
  createdAt: string;
}

// Interface representing a customer
export interface Customer {
  // Unique identifier for the customer
  id: string;
  // Full name of the customer
  name: string;
  // Optional phone number of the customer
  phone?: string;
  // Optional email address of the customer
  email?: string;
  // Optional physical address of the customer
  address?: string;
  // Number of loyalty points earned by the customer
  loyaltyPoints: number;
  // ISO timestamp of when the customer record was created
  createdAt: string;
}

// Interface representing a completed sale transaction
export interface Sale {
  // Unique identifier for the sale
  id: string;
  // Date and time the sale occurred
  date: string;
  // Identifier of the user who processed the sale
  userId: string;
  // Optional identifier of the customer involved in the sale
  customerId?: string;
  // Total amount of the sale after discounts and taxes
  totalAmount: number;
  // Method used for payment
  paymentMethod: 'cash' | 'card' | 'mobile_money' | 'mtn_momo' | 'telecel_cash';
  // Optional reference number for the payment (e.g., transaction ID)
  paymentReference?: string | null;
  // Total discount applied to the entire sale
  discount: number;
  // Total tax amount applied to the sale
  tax: number;
  // ISO timestamp of when the sale record was created
  createdAt: string;
}

// Interface representing an individual item within a sale
export interface SaleItem {
  // Unique identifier for the sale item record
  id: string;
  // Identifier of the parent sale transaction
  saleId: string;
  // Identifier of the user who processed the item
  userId: string;
  // Identifier of the product sold
  productId: string;
  // Name of the product at the time of sale
  productName: string;
  // Quantity of the product sold
  quantity: number;
  // Unit price of the product at the time of sale
  price: number;
  // Discount applied to this specific item
  discount: number;
  // ISO timestamp of when the sale item record was created
  createdAt: string;
}

// Interface representing a log entry for inventory changes
export interface InventoryLog {
  // Unique identifier for the inventory log entry
  id: string;
  // Identifier of the product affected by the change
  productId: string;
  // Type of inventory movement
  type: 'sale' | 'restock' | 'adjustment';
  // Quantity changed (positive for restock, negative for sale/adjustment)
  quantity: number;
  // Identifier of the user who initiated the change
  userId: string;
  // ISO timestamp of when the log entry was created
  createdAt: string;
}
