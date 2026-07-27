import { redirect } from "next/navigation";
import { AdminShell } from "components/layout/admin-shell";
import { getCurrentSession } from "lib/auth/session";
import { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/admin/login");
  }
  return (
    <AdminShell
      fullName={session.fullName}
      email={session.email}
      roleLabel="Admin"
    >
      {children}
    </AdminShell>
  );
}
