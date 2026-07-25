import { hasPermission, type Permission } from "lib/auth/permissions";
import { isRole, type Role } from "lib/auth/roles";
import { isAdminRole, type AdminRole, adminHasPermission } from "lib/auth/admin-roles";
import type { AdminSession } from "lib/auth/session";

export type GuardResult = { ok: true } | { ok: false; reason: "unauthenticated" | "forbidden" };

const userHas = (role: AdminRole | Role, permission: Permission): boolean => {
  if (isAdminRole(role)) return adminHasPermission(role, permission);
  if (isRole(role)) return hasPermission(role, permission);
  return false;
};

export const can = (session: AdminSession | null, permission: Permission): boolean => {
  if (!session) return false;
  return userHas(session.role, permission);
};

export const canAny = (
  session: AdminSession | null,
  permissions: readonly Permission[],
): boolean => {
  if (!session) return false;
  return permissions.some((p) => userHas(session.role, p));
};

export const canAll = (
  session: AdminSession | null,
  permissions: readonly Permission[],
): boolean => {
  if (!session) return false;
  return permissions.every((p) => userHas(session.role, p));
};

export const guard = (session: AdminSession | null, permission: Permission): GuardResult => {
  if (!session) return { ok: false, reason: "unauthenticated" };
  if (!userHas(session.role, permission))
    return { ok: false, reason: "forbidden" };
  return { ok: true };
};

export const guardAny = (
  session: AdminSession | null,
  permissions: readonly Permission[],
): GuardResult => {
  if (!session) return { ok: false, reason: "unauthenticated" };
  const allowed = permissions.some((p) => userHas(session.role, p));
  return allowed ? { ok: true } : { ok: false, reason: "forbidden" };
};

export const requirePermission = (
  session: AdminSession | null,
  permission: Permission,
): void => {
  const result = guard(session, permission);
  if (!result.ok) {
    if (result.reason === "unauthenticated") throw new Error("UNAUTHENTICATED");
    throw new Error("FORBIDDEN");
  }
};
