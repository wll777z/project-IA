import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listSupportCases } from "@/lib/support";
import { SupportQueue } from "@/components/support-queue";
export const metadata = {
  title: "Suporte — administração",
  robots: { index: false, follow: false },
};
export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (
    !session?.user.emailVerified ||
    !(await db.administrator.findUnique({ where: { userId: session.user.id } }))
  )
    notFound();
  return <SupportQueue initial={await listSupportCases("OPEN")} />;
}
