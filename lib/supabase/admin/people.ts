import { supabase } from "lib/supabase/client";

export type Rider = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  vehicleType: string;
  status: "available" | "on_delivery" | "offline";
  active: boolean;
  deliveriesCount: number;
  joinedAt: string;
};

export type StaffMember = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  department: string;
  active: boolean;
  joinedAt: string;
};

const isMissingTable = (code: string | undefined): boolean =>
  code === "PGRST205" || code === "42P01" || code === "PGRST116";

export async function listRiders(): Promise<Rider[]> {
  try {
    const { data, error } = await supabase
      .from("riders")
      .select("*")
      .order("full_name", { ascending: true });
    if (error) {
      if (isMissingTable(error.code)) return [];
      throw error;
    }
    return (data ?? []).map((d: Record<string, unknown>) => ({
      id: String(d.id),
      fullName: String(d.full_name ?? "Rider"),
      phone: String(d.phone ?? ""),
      email: (d.email as string | null) ?? null,
      vehicleType: String(d.vehicle_type ?? "motorbike"),
      status: (d.status as Rider["status"]) ?? "offline",
      active: Boolean(d.active ?? true),
      deliveriesCount: Number(d.deliveries_count ?? 0),
      joinedAt: String(d.joined_at ?? new Date().toISOString()),
    }));
  } catch {
    return [];
  }
}

export async function listStaff(): Promise<StaffMember[]> {
  try {
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .order("full_name", { ascending: true });
    if (error) {
      if (isMissingTable(error.code)) return [];
      throw error;
    }
    return (data ?? []).map((d: Record<string, unknown>) => ({
      id: String(d.id),
      fullName: String(d.full_name ?? "Team member"),
      email: String(d.email ?? ""),
      role: String(d.role ?? "staff"),
      department: String(d.department ?? "General"),
      active: Boolean(d.active ?? true),
      joinedAt: String(d.joined_at ?? new Date().toISOString()),
    }));
  } catch {
    return [];
  }
}
