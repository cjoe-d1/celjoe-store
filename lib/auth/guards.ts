import {
  requireSession,
  requireCustomerSession,
  type AdminSession,
  type CustomerSession,
} from "lib/auth/session";

/**
 * Authentication Guards — Phase A
 *
 * Simplified to binary checks:
 *  - Admin: full access
 *  - Customer: own-data access
 *
 * No roles. No permissions. No hierarchies.
 */

export const requireAdmin = async (): Promise<AdminSession> => {
  const session = await requireSession();
  if (!session) {
    throw new Error("FORBIDDEN");
  }
  return session;
};

export const requireCustomer = async (): Promise<CustomerSession> => {
  return requireCustomerSession();
};

/**
 * @deprecated Phase A: every authenticated admin has full access.
 * Kept temporarily to minimise churn across page files during the
 * authentication refactor. Will be removed once callers are migrated.
 */
export const can = (_session: AdminSession | null): boolean => Boolean(_session);

export const canAny = (session: AdminSession | null): boolean => Boolean(session);
export const canAll = (session: AdminSession | null): boolean => Boolean(session);
