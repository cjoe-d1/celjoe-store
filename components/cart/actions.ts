"use server";

import {
  addCartItem,
  createCartAndSetCookie,
  removeCartItem,
  updateCartItemQuantity,
} from "lib/supabase/cart";
import { redirect } from "next/navigation";

export async function addItem(prevState: any, selectedVariantId: string | undefined) {
  if (!selectedVariantId) {
    return "Error adding item to cart";
  }

  try {
    await addCartItem(selectedVariantId, 1);
  } catch (e) {
    return "Error adding item to cart";
  }
}

export async function removeItem(prevState: any, variantId: string) {
  try {
    await removeCartItem(variantId);
  } catch (e) {
    return "Error removing item from cart";
  }
}

export async function updateItemQuantity(
  prevState: any,
  payload: {
    variantId: string;
    quantity: number;
  }
) {
  const { variantId, quantity } = payload;

  try {
    await updateCartItemQuantity(variantId, quantity);
  } catch (e) {
    return "Error updating item quantity";
  }
}

export async function redirectToCheckout() {
  redirect("/checkout");
}

export { createCartAndSetCookie };
