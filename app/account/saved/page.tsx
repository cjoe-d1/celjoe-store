import type { Metadata } from "next";

import { Alert } from "components/chds";
import { AccountShell } from "../_shell";
import { getCurrentCustomerSession } from "lib/auth/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Saved Meals",
  description: "Reorder your favourites in a tap.",
};

export default async function SavedMealsPage() {
  const session = await getCurrentCustomerSession();
  if (!session) {
    redirect("/account/login?next=/account/saved");
  }
  return (
    <AccountShell
      current="/account/saved"
      title="Saved Meals"
      description="Reorder your favourites in a tap."
    >
      <Alert tone="info" title="No saved meals yet">
        Save meals from any product page to see them here.
      </Alert>
    </AccountShell>
  );
}
