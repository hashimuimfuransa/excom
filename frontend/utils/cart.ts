"use client";
// Minimal cart store using localStorage for demo; can be replaced by backend session cart.
import { useEffect, useState, useCallback } from 'react';

export type CartItem = {
  id: string;
  title: string;
  price: number;
  image?: string;
  quantity: number;
};

export type BookingCartItem = {
  id: string;
  type: 'booking';
  collectionId: string;
  title: string;
  price: number;
  image?: string;
  bookingData: {
    checkIn?: string;
    checkOut?: string;
    guests: number;
    roomType?: string;
    specialRequests?: string;
    customerInfo: {
      name: string;
      email: string;
      phone: string;
    };
  };
  createdAt: string;
};

const KEY = 'excom_cart_v1';
const BOOKING_KEY = 'excom_booking_cart_v1';

function readCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

function writeCart(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(items));
}

function readBookingCart(): BookingCartItem[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(BOOKING_KEY) || '[]'); } catch { return []; }
}

function writeBookingCart(items: BookingCartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BOOKING_KEY, JSON.stringify(items));
}

export function addToCart(item: CartItem) {
  const items = readCart();
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx >= 0) {
    items[idx].quantity += item.quantity;
  } else {
    items.push(item);
  }
  writeCart(items);
  return items;
}

export function addBookingToCart(item: BookingCartItem) {
  const items = readBookingCart();
  items.push(item);
  writeBookingCart(items);
  return items;
}

export function removeFromCart(id: string) {
  const items = readCart().filter((i) => i.id !== id);
  writeCart(items);
  return items;
}

export function removeBookingFromCart(id: string) {
  const items = readBookingCart().filter((i) => i.id !== id);
  writeBookingCart(items);
  return items;
}

export function clearBookingCart() {
  writeBookingCart([]);
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [bookingItems, setBookingItems] = useState<BookingCartItem[]>([]);
  
  useEffect(() => { 
    setItems(readCart()); 
    setBookingItems(readBookingCart());
  }, []);
  
  const total = items.reduce((s, it) => s + it.price * it.quantity, 0);
  const bookingTotal = bookingItems.reduce((s, it) => s + it.price, 0);
  const grandTotal = total + bookingTotal;
  
  const refreshCart = useCallback(() => {
    setItems(readCart());
    setBookingItems(readBookingCart());
  }, []);
  
  return { 
    items, 
    setItems, 
    bookingItems, 
    setBookingItems,
    total, 
    bookingTotal, 
    grandTotal,
    refreshCart
  };
}