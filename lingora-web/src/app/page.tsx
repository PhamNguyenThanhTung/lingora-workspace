import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Home() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    redirect(user ? "/foundation" : "/login");
  } catch { redirect("/login"); }
}
