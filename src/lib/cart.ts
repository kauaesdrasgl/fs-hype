export type CartLine = {
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
};

export const CART_KEY = "fs-hype-cart-v1";
export const CART_UPDATED_EVENT = "fstore-cart-updated";

export function readCart(): CartLine[] {
  try {
    const saved = localStorage.getItem(CART_KEY);
    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((item): CartLine[] => {
      if (typeof item !== "object" || item === null) return [];

      const line = item as Record<string, unknown>;

      if (
        typeof line.productId !== "string" ||
        !Number.isInteger(line.quantity) ||
        (line.quantity as number) < 1
      ) {
        return [];
      }

      return [{
        productId: line.productId,
        quantity: Math.min(line.quantity as number, 10),
        ...(typeof line.size === "string" ? { size: line.size } : {}),
        ...(typeof line.color === "string" ? { color: line.color } : {}),
      }];
    });
  } catch {
    return [];
  }
}

export function writeCart(cart: CartLine[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}
