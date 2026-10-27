import type { MetadataRoute } from "next";
import { appOrigin } from "@/lib/site-origin";
// Deliberately curated: zero database queries and no cached user identity.
// Profiles are discoverable through public links, but are not enumerated here.
// This avoids stale published/suspended entries and exposing profile usernames.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: appOrigin() + "/" }];
}
