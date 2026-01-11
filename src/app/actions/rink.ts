"use server";

import { createClient } from "@/lib/supabase/server";
import { Rink } from "./types";

export async function getRinks(): Promise<Rink[]> {
  const supabase = await createClient();

  const { data: rinks, error } = await supabase
    .from("rinks")
    .select("*")
    .order("name_ko", { ascending: true });

  if (error) {
    console.error("Error fetching rinks:", error);
    return [];
  }

  return rinks as Rink[];
}
