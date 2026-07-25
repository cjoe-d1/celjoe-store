import type { Metadata } from "next";

import { Alert } from "components/chds";
import { AccountShell } from "../_shell";

export const metadata: Metadata = {
  title: "Saved Meals",
  description: "Reorder your favourites in a tap.",
};

export default function SavedMealsPage() {
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
