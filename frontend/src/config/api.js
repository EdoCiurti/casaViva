// Configurazione centralizzata per le API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Endpoint API
export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: `${API_BASE_URL}/api/auth/login`,
  AUTH_REGISTER: `${API_BASE_URL}/api/auth/register`,
  AUTH_PROFILE: `${API_BASE_URL}/api/auth/profile`,
  
  // Products
  PRODUCTS: `${API_BASE_URL}/api/products`,
  PRODUCT_BY_ID: (id) => `${API_BASE_URL}/api/products/${id}`,
  
  // Cart
  CART: `${API_BASE_URL}/api/cart`,
  CART_REMOVE: (id) => `${API_BASE_URL}/api/cart/${id}`,
  
  // Wishlist
  WISHLIST: `${API_BASE_URL}/api/wishlist`,
  WISHLIST_REMOVE: (id) => `${API_BASE_URL}/api/wishlist/${id}`,
  
  // Orders
  ORDERS: `${API_BASE_URL}/api/orders`,
  USER_ORDERS: `${API_BASE_URL}/api/orders/user`,
  ORDER_STATUS: (id) => `${API_BASE_URL}/api/orders/${id}/status`,
  
  // Payments
  PAYMENTS_CHECKOUT: `${API_BASE_URL}/api/payments/create-checkout-session`,
  
  // Virtual Room
  VIRTUAL_ROOM_RECOMMEND: `${API_BASE_URL}/api/virtual-room/recommend`,
};

export default API_BASE_URL;
