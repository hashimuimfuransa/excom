"use client";
import { useEffect, useState, useCallback } from 'react';

export type WishlistItem = {
  id: string;
  title: string;
  price: number;
  image?: string;
  category?: string;
  description?: string;
  seller?: {
    name: string;
    _id: string;
  };
  rating?: number;
  reviewCount?: number;
  createdAt?: string;
  addedAt: string;
};

const WISHLIST_KEY = 'excom_wishlist_v1';

function readWishlist(): WishlistItem[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]'); } catch { return []; }
}

function writeWishlist(items: WishlistItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
}

export function addToWishlist(item: Omit<WishlistItem, 'addedAt'>) {
  const items = readWishlist();
  const exists = items.find((i) => i.id === item.id);
  
  if (!exists) {
    const newItem: WishlistItem = {
      ...item,
      addedAt: new Date().toISOString()
    };
    items.unshift(newItem); // Add to the beginning
    writeWishlist(items);
  }
  
  return items;
}

export function removeFromWishlist(id: string) {
  const items = readWishlist().filter((i) => i.id !== id);
  writeWishlist(items);
  return items;
}

export function clearWishlist() {
  writeWishlist([]);
  return [];
}

export function isInWishlist(id: string): boolean {
  const items = readWishlist();
  return items.some((i) => i.id === id);
}

export function useWishlist() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  
  useEffect(() => { 
    setItems(readWishlist()); 
  }, []);
  
  const refreshWishlist = useCallback(() => {
    setItems(readWishlist());
  }, []);
  
  const addItem = useCallback((item: Omit<WishlistItem, 'addedAt'>) => {
    const updatedItems = addToWishlist(item);
    setItems(updatedItems);
    return updatedItems;
  }, []);
  
  const removeItem = useCallback((id: string) => {
    const updatedItems = removeFromWishlist(id);
    setItems(updatedItems);
    return updatedItems;
  }, []);
  
  const clearAll = useCallback(() => {
    const updatedItems = clearWishlist();
    setItems(updatedItems);
    return updatedItems;
  }, []);
  
  const isItemInWishlist = useCallback((id: string) => {
    return items.some((item) => item.id === id);
  }, [items]);
  
  return { 
    items,
    count: items.length,
    addItem,
    removeItem,
    clearAll,
    isItemInWishlist,
    refreshWishlist
  };
}