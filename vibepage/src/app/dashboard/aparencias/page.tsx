import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listAppearances } from "@/lib/appearance-store";
import { AppearanceManager } from "@/components/appearance-manager";
export const metadata = { title: "Coleções e temporadas" };
export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return <AppearanceManager initial={await listAppearances(session.user.id)} />;
}
