// Import React and necessary hooks for context and state management
import * as React from 'react';
// Import context, state, and effect hooks
import { createContext, useContext, useState, useEffect } from 'react';
// Import the Product type definition
import { Product } from '../types';
// Import toast notification utility
import { toast } from 'sonner';

// Define the shape of a single item in the cart
interface CartItem {
  // The product associated with this cart item
  product: Product;
  // The quantity of the product in the cart
  quantity: number;
  // The discount applied to this specific item
  discount: number;
}

// Define the shape of the cart context
interface CartContextType {
  // The current list of items in the cart
  cart: CartItem[];
  // Function to add a product to the cart
  addToCart: (product: Product) => void;
  // Function to remove a product from the cart by its ID
  removeFromCart: (productId: string) => void;
  // Function to update the quantity of a product in the cart
  updateQuantity: (productId: string, delta: number) => void;
  // Function to update the discount for a specific item in the cart
  updateItemDiscount: (productId: string, discount: number) => void;
  // The overall discount applied to the entire cart
  cartDiscount: number;
  // Function to set the overall cart discount
  setCartDiscount: (discount: number) => void;
  // Function to clear all items and discounts from the cart
  clearCart: () => void;
  // The calculated subtotal of all items in the cart
  subtotal: number;
  // The calculated tax based on the subtotal
  tax: number;
  // The final total amount after discounts and tax
  total: number;
}

// Create the cart context with an undefined initial value
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider component to wrap the application and provide cart state
export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  // State to store the current cart items
  const [cart, setCart] = useState<CartItem[]>([]);
  // State to store the overall cart discount
  const [cartDiscount, setCartDiscount] = useState(0);

  // Function to add a product to the cart
  const addToCart = (product: Product) => {
    // Check if the product is out of stock
    if (product.quantity <= 0) {
      // Show error toast if out of stock
      toast.error('Out of stock');
      // Return early
      return;
    }
    // Update the cart state
    setCart(prev => {
      // Check if the product is already in the cart
      const existing = prev.find(item => item.product.id === product.id);
      // If the product exists in the cart
      if (existing) {
        // Check if adding another would exceed available stock
        if (existing.quantity >= product.quantity) {
          // Show error toast if insufficient stock
          toast.error('Insufficient stock');
          // Return the previous state unchanged
          return prev;
        }
        // Show success toast for adding another item
        toast.success(`Added another ${product.name} to cart`);
        // Increment the quantity of the existing item
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      // Show success toast for adding a new item to the cart
      toast.success(`Added ${product.name} to cart`);
      // Add the new product to the cart with a quantity of 1 and no discount
      return [...prev, { product, quantity: 1, discount: 0 }];
    });
  };

  // Function to remove a product from the cart
  const removeFromCart = (productId: string) => {
    // Filter out the item with the specified product ID
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Function to update the quantity of a product in the cart
  const updateQuantity = (productId: string, delta: number) => {
    // Update the cart state
    setCart(prev => prev.map(item => {
      // Find the item to update
      if (item.product.id === productId) {
        // Calculate the new quantity, ensuring it's at least 1
        const newQty = Math.max(1, item.quantity + delta);
        // Check if the new quantity exceeds available stock
        if (newQty > item.product.quantity) {
          // Show error toast if insufficient stock
          toast.error('Insufficient stock');
          // Return the item unchanged
          return item;
        }
        // Return the item with the updated quantity
        return { ...item, quantity: newQty };
      }
      // Return other items unchanged
      return item;
    }));
  };

  // Function to update the discount for a specific item
  const updateItemDiscount = (productId: string, discount: number) => {
    // Update the cart state
    setCart(prev => prev.map(item => 
      // Find the item and update its discount, ensuring it's not negative
      item.product.id === productId ? { ...item, discount: Math.max(0, discount) } : item
    ));
  };

  // Function to clear the cart and reset discounts
  const clearCart = () => {
    // Reset the cart items to an empty array
    setCart([]);
    // Reset the cart discount to 0
    setCartDiscount(0);
  };

  // Calculate the subtotal by summing (price * quantity - item discount) for all items
  const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity) - item.discount, 0);
  // Calculate tax (8%) on the subtotal after the cart discount, ensuring it's not negative
  const tax = Math.max(0, subtotal - cartDiscount) * 0.08;
  // Calculate the final total after applying the cart discount and adding tax
  const total = Math.max(0, subtotal - cartDiscount + tax);

  // Render the context provider with the cart state and functions
  return (
    <CartContext.Provider value={{
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      updateItemDiscount,
      cartDiscount,
      setCartDiscount,
      clearCart,
      subtotal,
      tax,
      total
    }}>
      {/* Render children within the provider */}
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to easily access the cart context
export const useCart = () => {
  // Get the context value
  const context = useContext(CartContext);
  // Throw error if the hook is used outside of a CartProvider
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  // Return the context value
  return context;
};
