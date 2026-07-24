"use client";

import type { Cart, CartItem, Money } from "lib/supabase/cart";
import type { Product, ProductVariant } from "lib/supabase/products";
import React, {
  createContext,
  use,
  useContext,
  useMemo,
  useOptimistic,
} from "react";

type UpdateType = "plus" | "minus" | "delete";

type CartAction =
  | {
      type: "UPDATE_ITEM";
      payload: { variantId: string; updateType: UpdateType };
    }
  | {
      type: "ADD_ITEM";
      payload: { variant: ProductVariant; product: Product };
    };

type CartContextType = {
  cartPromise: Promise<Cart | null>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

function multiplyMoney(quantity: number, unitPrice: Money): Money {
  return {
    amount: (Number(unitPrice.amount) * quantity).toFixed(2),
    currencyCode: unitPrice.currencyCode,
  };
}

function updateCartItem(
  item: CartItem,
  updateType: UpdateType,
): CartItem | null {
  if (updateType === "delete") return null;

  const newQuantity =
    updateType === "plus" ? item.quantity + 1 : item.quantity - 1;
  if (newQuantity === 0) return null;

  return {
    ...item,
    quantity: newQuantity,
    totalPrice: item.variant
      ? multiplyMoney(newQuantity, item.variant.unitPrice)
      : item.totalPrice,
  };
}

function createOrUpdateCartItem(
  existingItem: CartItem | undefined,
  variant: ProductVariant,
  product: Product,
): CartItem {
  const quantity = existingItem ? existingItem.quantity + 1 : 1;
  const unitPrice = variant.price ?? product.price;
  const totalPrice = multiplyMoney(quantity, unitPrice);

  return {
    id: existingItem?.id ?? null,
    quantity,
    product: {
      id: product.id,
      slug: product.slug,
      name: product.name,
      imageUrl: product.imageUrl ?? null,
      imageAltText: product.images[0]?.altText ?? product.name,
    },
    variant: {
      id: variant.id,
      name: variant.name,
      optionValues: variant.optionValues,
      unitPrice,
    },
    totalPrice,
  };
}

function updateCartTotals(
  items: CartItem[],
): Pick<Cart, "totalQuantity" | "cost"> {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce(
    (sum, item) => sum + Number(item.totalPrice.amount),
    0,
  );
  const currencyCode = items[0]?.totalPrice.currencyCode ?? "USD";

  return {
    totalQuantity,
    cost: { subtotal: { amount: totalAmount.toFixed(2), currencyCode }, total: { amount: totalAmount.toFixed(2), currencyCode }, tax: { amount: "0.00", currencyCode } },
  };
}

function createEmptyCart(): Cart {
  return {
    id: "",
    token: "",
    totalQuantity: 0,
    items: [],
    cost: {
      subtotal: { amount: "0.00", currencyCode: "USD" },
      total: { amount: "0.00", currencyCode: "USD" },
      tax: { amount: "0.00", currencyCode: "USD" },
    },
  };
}

function cartReducer(state: Cart | null, action: CartAction): Cart {
  const currentCart = state || createEmptyCart();

  switch (action.type) {
    case "UPDATE_ITEM": {
      const { variantId, updateType } = action.payload;
      const updatedItems = currentCart.items
        .map((item) =>
          item.variant?.id === variantId
            ? updateCartItem(item, updateType)
            : item,
        )
        .filter(Boolean) as CartItem[];

      if (updatedItems.length === 0) {
        return {
          ...currentCart,
          items: [],
          totalQuantity: 0,
          cost: {
            ...currentCart.cost,
            total: { ...currentCart.cost.total, amount: "0.00" },
          },
        };
      }

      return {
        ...currentCart,
        ...updateCartTotals(updatedItems),
        items: updatedItems,
      };
    }
    case "ADD_ITEM": {
      const { variant, product } = action.payload;
      const existingItem = currentCart.items.find(
        (item) => item.variant?.id === variant.id,
      );
      const updatedItem = createOrUpdateCartItem(
        existingItem,
        variant,
        product,
      );

      const updatedItems = existingItem
        ? currentCart.items.map((item) =>
            item.variant?.id === variant.id ? updatedItem : item,
          )
        : [...currentCart.items, updatedItem];

      return {
        ...currentCart,
        ...updateCartTotals(updatedItems),
        items: updatedItems,
      };
    }
    default:
      return currentCart;
  }
}

export function CartProvider({
  children,
  cartPromise,
}: {
  children: React.ReactNode;
  cartPromise: Promise<Cart | null>;
}) {
  return (
    <CartContext.Provider value={{ cartPromise }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }

  const initialCart = use(context.cartPromise);
  const [optimisticCart, updateOptimisticCart] = useOptimistic(
    initialCart,
    cartReducer,
  );

  const updateCartItem = (variantId: string, updateType: UpdateType) => {
    updateOptimisticCart({
      type: "UPDATE_ITEM",
      payload: { variantId, updateType },
    });
  };

  const addCartItem = (variant: ProductVariant, product: Product) => {
    updateOptimisticCart({ type: "ADD_ITEM", payload: { variant, product } });
  };

  return useMemo(
    () => ({
      cart: optimisticCart,
      updateCartItem,
      addCartItem,
    }),
    [optimisticCart],
  );
}
