export const roles = [
  "guest",
  "customer",
  "kitchen_staff",
  "dispatch_rider",
  "customer_service",
  "store_manager",
  "super_admin",
] as const;

export type Role = (typeof roles)[number];

export const isRole = (value: unknown): value is Role =>
  typeof value === "string" && (roles as readonly string[]).includes(value);

