import { BookmarkDashboard } from "@/components/bookmark-dashboard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="scene">
      <BookmarkDashboard userId={user.id} userEmail={user.email ?? "Unknown user"} />
    </main>
  );
}
