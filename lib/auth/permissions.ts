import type { Role } from "lib/auth/roles";

export type Permission =
  | "catalog:read"
  | "catalog:write"
  | "orders:read"
  | "orders:write"
  | "cms:read"
  | "cms:write"
  | "kitchen:read"
  | "kitchen:write"
  | "settings:read"
  | "settings:write"
  | "users:read"
  | "users:write";

const rolePermissions: Record<Role, ReadonlySet<Permission>> = {
  guest: new Set<Permission>(["catalog:read", "cms:read"]),
  customer: new Set<Permission>(["catalog:read", "cms:read", "orders:read"]),
  kitchen_staff: new Set<Permission>(["catalog:read", "orders:read", "kitchen:read", "kitchen:write"]),
  dispatch_rider: new Set<Permission>(["orders:read"]),
  customer_service: new Set<Permission>(["orders:read", "orders:write", "cms:read"]),
  store_manager: new Set<Permission>([
    "catalog:read",
    "catalog:write",
    "orders:read",
    "orders:write",
    "cms:read",
    "cms:write",
    "settings:read",
    "settings:write",
    "users:read",
  ]),
  super_admin: new Set<Permission>([
    "catalog:read",
    "catalog:write",
    "orders:read",
    "orders:write",
    "cms:read",
    "cms:write",
    "kitchen:read",
    "kitchen:write",
    "settings:read",
    "settings:write",
    "users:read",
    "users:write",
  ]),
};

export const hasPermission = (role: Role, permission: Permission): boolean =>
  rolePermissions[role].has(permission);

