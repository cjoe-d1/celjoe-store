import { cookies } from "next/headers";
import { createSupabaseClient } from "lib/supabase/client";
import { CURRENCY_CODE } from "lib/format-currency";

export type CurrencyCode = string;

export type Money = {
  amount: string;
  currencyCode: CurrencyCode;
};

export type CartItemOption = {
  name: string;
  value: string;
};

export type CartItem = {
  id: string | null;
  quantity: number;
  product: {
    id: string;
    slug: string;
    name: string;
    imageUrl: string | null;
    imageAltText: string | null;
  };
  variant: {
    id: string;
    name: string;
    optionValues: CartItemOption[];
    unitPrice: Money;
  } | null;
  totalPrice: Money;
};

export type Cart = {
  id: string;
  token: string;
  items: CartItem[];
  totalQuantity: number;
  cost: {
    subtotal: Money;
    total: Money;
    tax: Money;
  };
};

const DEFAULT_CURRENCY_CODE: CurrencyCode = CURRENCY_CODE;
const CART_TOKEN_COOKIE = "cartToken";

const money = (amount: number, currencyCode = DEFAULT_CURRENCY_CODE): Money => ({
  amount: amount.toFixed(2),
  currencyCode,
});

const parseOptionValues = (value: unknown): CartItemOption[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => {
      if (!v || typeof v !== "object") return null;
      const name = (v as any).name;
      const optionValue = (v as any).value;
      if (typeof name !== "string" || typeof optionValue !== "string") return null;
      return { name, value: optionValue } satisfies CartItemOption;
    })
    .filter(Boolean) as CartItemOption[];
};

const getCartTokenFromCookies = async (): Promise<string | null> => {
  const cookieStore = await cookies();
  return cookieStore.get(CART_TOKEN_COOKIE)?.value ?? null;
};

const createAuthedClient = (token: string) =>
  createSupabaseClient({ "x-cart-token": token });

export const createCartAndSetCookie = async (): Promise<Cart> => {
  const cookieStore = await cookies();
  const token = crypto.randomUUID();
  const supabase = createAuthedClient(token);

  const { data: cartRow, error } = await supabase
    .from("carts")
    .insert({ token })
    .select("id, token")
    .single();

  if (error) throw error;

  cookieStore.set(CART_TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return {
    id: cartRow.id,
    token: cartRow.token,
    items: [],
    totalQuantity: 0,
    cost: {
      subtotal: money(0),
      total: money(0),
      tax: money(0),
    },
  };
};

export const getCart = async (): Promise<Cart | null> => {
  const token = await getCartTokenFromCookies();
  if (!token) return null;

  const supabase = createAuthedClient(token);

  const { data, error } = await supabase
    .from("carts")
    .select(
      "id, token, cart_items:cart_items(id, quantity, variant:product_variants(id, name, price, option_values, product:products(id, slug, name, images:product_images(id, image_url, display_order))))",
    )
    .eq("token", token)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const items: CartItem[] = (data.cart_items ?? [])
    .map((row: any) => {
      const quantity = row.quantity as number;
      const variant = row.variant as any | null;
      const product = variant?.product as any | null;
      if (!product) return null;

      const unitPrice = money(Number(variant?.price ?? 0));
      const totalPrice = money(Number(unitPrice.amount) * quantity);

      return {
        id: row.id as string,
        quantity,
        product: {
          id: product.id,
          slug: product.slug,
          name: product.name,
          imageUrl: product.images?.[0]?.image_url ?? null,
          imageAltText: null,
        },
        variant: variant
          ? {
              id: variant.id,
              name: variant.name,
              optionValues: parseOptionValues(variant.option_values),
              unitPrice,
            }
          : null,
        totalPrice,
      } satisfies CartItem;
    })
    .filter(Boolean) as CartItem[];

  const subtotalAmount = items.reduce(
    (sum, item) => sum + Number(item.totalPrice.amount),
    0,
  );
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    id: data.id,
    token: data.token,
    items,
    totalQuantity,
    cost: {
      subtotal: money(subtotalAmount),
      total: money(subtotalAmount),
      tax: money(0),
    },
  };
};

export const addCartItem = async (
  variantId: string,
  quantity: number,
): Promise<void> => {
  const token = await getCartTokenFromCookies();
  if (!token) {
    await createCartAndSetCookie();
    return addCartItem(variantId, quantity);
  }

  const supabase = createAuthedClient(token);

  const { data: cartRow, error: cartError } = await supabase
    .from("carts")
    .select("id")
    .eq("token", token)
    .limit(1)
    .maybeSingle();

  if (cartError) throw cartError;
  if (!cartRow) {
    await createCartAndSetCookie();
    return addCartItem(variantId, quantity);
  }

  const cartId = cartRow.id as string;

  const { data: existing, error: existingError } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cartId)
    .eq("variant_id", variantId)
    .limit(1)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing) {
    const newQuantity = (existing.quantity as number) + quantity;
    const { error: updateError } = await supabase
      .from("cart_items")
      .update({ quantity: newQuantity })
      .eq("id", existing.id);

    if (updateError) throw updateError;
    return;
  }

  const { data: variantRow, error: variantError } = await supabase
    .from("product_variants")
    .select("id, product_id")
    .eq("id", variantId)
    .limit(1)
    .maybeSingle();

  if (variantError) throw variantError;
  if (!variantRow) throw new Error("Variant not found");

  const { error: insertError } = await supabase.from("cart_items").insert({
    cart_id: cartId,
    product_id: variantRow.product_id,
    variant_id: variantId,
    quantity,
  });

  if (insertError) throw insertError;
};

export const removeCartItem = async (variantId: string): Promise<void> => {
  const token = await getCartTokenFromCookies();
  if (!token) return;

  const supabase = createAuthedClient(token);

  const { data: cartRow, error: cartError } = await supabase
    .from("carts")
    .select("id")
    .eq("token", token)
    .limit(1)
    .maybeSingle();

  if (cartError) throw cartError;
  if (!cartRow) return;

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("cart_id", cartRow.id)
    .eq("variant_id", variantId);

  if (error) throw error;
};

export const updateCartItemQuantity = async (
  variantId: string,
  quantity: number,
): Promise<void> => {
  if (quantity <= 0) {
    await removeCartItem(variantId);
    return;
  }

  const token = await getCartTokenFromCookies();
  if (!token) return;

  const supabase = createAuthedClient(token);

  const { data: cartRow, error: cartError } = await supabase
    .from("carts")
    .select("id")
    .eq("token", token)
    .limit(1)
    .maybeSingle();

  if (cartError) throw cartError;
  if (!cartRow) return;

  const { data: existing, error: existingError } = await supabase
    .from("cart_items")
    .select("id")
    .eq("cart_id", cartRow.id)
    .eq("variant_id", variantId)
    .limit(1)
    .maybeSingle();

  if (existingError) throw existingError;

  if (!existing) {
    await addCartItem(variantId, quantity);
    return;
  }

  const { error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", existing.id);

  if (error) throw error;
};
