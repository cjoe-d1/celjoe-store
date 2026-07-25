import { isRole, type Role } from "lib/auth/roles";
import { hasPermission, type Permission } from "lib/auth/permissions";

export type AdminRole =
  | "super_admin"
  | "operations_manager"
  | "kitchen_manager"
  | "kitchen_staff"
  | "inventory_manager"
  | "procurement"
  | "finance"
  | "customer_service"
  | "marketing"
  | "content_manager"
  | "rider"
  | "manager"
  | "administrator";

export const adminRoles: readonly AdminRole[] = [
  "super_admin",
  "operations_manager",
  "kitchen_manager",
  "kitchen_staff",
  "inventory_manager",
  "procurement",
  "finance",
  "customer_service",
  "marketing",
  "content_manager",
  "rider",
  "manager",
  "administrator",
];

const ROLE_MAP: Record<AdminRole, Role> = {
  super_admin: "super_admin",
  operations_manager: "store_manager",
  kitchen_manager: "store_manager",
  kitchen_staff: "kitchen_staff",
  inventory_manager: "store_manager",
  procurement: "store_manager",
  finance: "store_manager",
  customer_service: "customer_service",
  marketing: "store_manager",
  content_manager: "store_manager",
  rider: "dispatch_rider",
  manager: "store_manager",
  administrator: "super_admin",
};

const ROLE_PERMISSIONS: Record<AdminRole, ReadonlySet<Permission>> = {
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
  operations_manager: new Set<Permission>([
    "catalog:read",
    "catalog:write",
    "orders:read",
    "orders:write",
    "cms:read",
    "cms:write",
    "settings:read",
    "users:read",
  ]),
  kitchen_manager: new Set<Permission>([
    "catalog:read",
    "orders:read",
    "orders:write",
    "kitchen:read",
    "kitchen:write",
    "cms:read",
    "users:read",
  ]),
  kitchen_staff: new Set<Permission>([
    "catalog:read",
    "orders:read",
    "kitchen:read",
    "kitchen:write",
  ]),
  inventory_manager: new Set<Permission>([
    "catalog:read",
    "orders:read",
    "kitchen:read",
    "settings:read",
  ]),
  procurement: new Set<Permission>([
    "catalog:read",
    "orders:read",
    "kitchen:read",
  ]),
  finance: new Set<Permission>([
    "orders:read",
    "cms:read",
    "settings:read",
    "settings:write",
  ]),
  customer_service: new Set<Permission>([
    "orders:read",
    "orders:write",
    "cms:read",
    "users:read",
  ]),
  marketing: new Set<Permission>([
    "catalog:read",
    "orders:read",
    "cms:read",
    "cms:write",
  ]),
  content_manager: new Set<Permission>([
    "catalog:read",
    "cms:read",
    "cms:write",
  ]),
  rider: new Set<Permission>(["orders:read"]),
  manager: new Set<Permission>([
    "catalog:read",
    "catalog:write",
    "orders:read",
    "orders:write",
    "cms:read",
    "cms:write",
    "settings:read",
    "users:read",
  ]),
  administrator: new Set<Permission>([
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

const ROLE_HIERARCHY: Record<AdminRole, number> = {
  super_admin: 100,
  administrator: 95,
  operations_manager: 90,
  manager: 85,
  kitchen_manager: 70,
  finance: 65,
  marketing: 60,
  content_manager: 55,
  inventory_manager: 50,
  procurement: 45,
  customer_service: 40,
  kitchen_staff: 30,
  rider: 20,
};

export const isAdminRole = (value: unknown): value is AdminRole =>
  typeof value === "string" && (adminRoles as readonly string[]).includes(value);

export const adminHasPermission = (
  role: AdminRole | Role,
  permission: Permission,
): boolean => {
  if (isAdminRole(role)) {
    return ROLE_PERMISSIONS[role].has(permission);
  }
  if (isRole(role)) {
    return hasPermission(role, permission);
  }
  return false;
};

export const adminRoleAtLeast = (
  role: AdminRole,
  minimum: AdminRole,
): boolean => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minimum];

export const isStaffRole = (role: AdminRole): boolean =>
  ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.kitchen_staff;

export const adminRoleLabel = (role: AdminRole | Role): string => {
  const labels: Record<string, string> = {
    super_admin: "Super Admin",
    operations_manager: "Operations Manager",
    kitchen_manager: "Kitchen Manager",
    kitchen_staff: "Kitchen Staff",
    inventory_manager: "Inventory Manager",
    procurement: "Procurement",
    finance: "Finance",
    customer_service: "Customer Service",
    marketing: "Marketing",
    content_manager: "Content Manager",
    rider: "Rider",
    manager: "Manager",
    administrator: "Administrator",
    customer: "Customer",
    guest: "Guest",
    dispatch_rider: "Rider",
    store_manager: "Manager",
  };
  return labels[role] ?? role;
};

export const toBaseRole = (role: AdminRole): Role => ROLE_MAP[role];

export const ROLE_HIERARCHY_MAP = ROLE_HIERARCHY;
