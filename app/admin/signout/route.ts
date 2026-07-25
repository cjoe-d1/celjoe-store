import { redirect } from "next/navigation";
import { signOutAction } from "lib/auth/actions";

export const dynamic = "force-dynamic";

export async function POST() {
  "use server";
  await signOutAction();
  redirect("/admin/login");
}
