import { ViewRecorder } from "@/components/view-recorder";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPublicProfile, appOrigin } from "@/lib/public-profile";
import { ProfileView } from "@/components/profile-view";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const data = await getPublicProfile(username);
  if (!data)
    return {
      title: "Perfil não encontrado",
      robots: { index: false, follow: false },
    };
  const url = `${appOrigin()}/${data.profile.username}`;
  const description =
    data.profile.bio ||
    `Conheça o universo de ${data.profile.displayName} no VibePage.`;
  return {
    title: data.profile.displayName,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${data.profile.displayName} · VibePage`,
      description,
      url,
      type: "profile",
      images: [`${url}/opengraph-image`],
    },
    twitter: {
      card: "summary_large_image",
      title: data.profile.displayName,
      description,
      images: [`${url}/opengraph-image`],
    },
  };
}
export default async function PublicPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const data = await getPublicProfile(username);
  if (!data) notFound();
  if (username !== data.profile.username) redirect(`/${data.profile.username}`);
  return (
    <main id="main">
      <ViewRecorder username={data.profile.username} />
      <ProfileView profile={data.profile} pro={data.pro} />
    </main>
  );
}
