import { buildMetadata } from "lib/seo";
import {
  AdminPageContainer,
  AdminTopBar,
} from "components/chds/admin";
import { Card, Label } from "components/chds";
import { requireAdmin } from "lib/auth/guards";
import { listSettings } from "lib/supabase/admin/settings";
import { SettingsExplorer } from "./explorer";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Settings",
  description: "Business profile, hours, taxes, payments, delivery, branding, notifications, security, API.",
  path: "/admin/settings",
  noIndex: true,
});

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await listSettings();
  const value = <K extends string>(key: K, fallback: unknown = null) => {
    const s = settings.find((s) => s.key === key);
    return (s?.value as never) ?? fallback;
  };

  return (
    <>
      <AdminTopBar
        title="Settings"
        description="Configure your business, hours, taxes, payments, delivery, branding, notifications, security, and integrations."
      />
      <AdminPageContainer>
        <SettingsExplorer
          initial={{
            business: value("business_profile", {
              brand_name: "Celjoe",
              company_name: "Celjoe Hospitality Ltd.",
              tagline: "Editorial hospitality",
              contact_email: "",
              contact_phone: "",
              address: "",
              city: "",
              state: "",
              country: "Nigeria",
              registration_number: "",
              tax_id: "",
            }) as Record<string, string>,
            hours: value("opening_hours", {
              mon: { open: "09:00", close: "22:00", closed: false },
              tue: { open: "09:00", close: "22:00", closed: false },
              wed: { open: "09:00", close: "22:00", closed: false },
              thu: { open: "09:00", close: "22:00", closed: false },
              fri: { open: "09:00", close: "23:00", closed: false },
              sat: { open: "10:00", close: "23:00", closed: false },
              sun: { open: "10:00", close: "21:00", closed: false },
            }) as Record<string, { open: string; close: string; closed: boolean }>,
            taxes: value("taxes", {
              vatRate: 7.5,
              serviceChargeRate: 5,
              inclusive: false,
            }) as { vatRate: number; serviceChargeRate: number; inclusive: boolean },
            delivery: value("delivery", {
              baseFee: 1500,
              perKmFee: 200,
              freeDeliveryThreshold: 10000,
              minOrder: 0,
              maxRadiusKm: 25,
              zones: [],
            }) as {
              baseFee: number;
              perKmFee: number;
              freeDeliveryThreshold: number;
              minOrder: number;
              maxRadiusKm: number;
              zones: Array<{ name: string; fee: number }>;
            },
            payments: value("payments", {
              acceptedMethods: ["card", "transfer", "cash"],
              paystackPublicKey: "",
              defaultCurrency: "NGN",
            }) as Record<string, unknown>,
            branding: value("branding", {
              logoUrl: "",
              faviconUrl: "",
              primaryColor: "#0F0F0F",
              accentColor: "#A57E2F",
              fontHeading: "Montserrat",
              fontBody: "Inter",
            }) as Record<string, string>,
            notifications: value("notifications", {
              emailEnabled: true,
              smsEnabled: true,
              whatsappEnabled: false,
              orderConfirmation: true,
              orderReady: true,
              orderDelivered: true,
              marketingEmail: false,
            }) as Record<string, boolean>,
            security: value("security", {
              sessionMaxHours: 8,
              requireMfa: false,
              passwordMinLength: 8,
              ipAllowlist: "",
            }) as Record<string, unknown>,
          }}
        />
      </AdminPageContainer>
    </>
  );
}
