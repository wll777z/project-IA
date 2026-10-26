export function isPro(
  entitlement:
    { plan: string; expiresAt: Date | string | null } | null | undefined,
  now = new Date(),
) {
  return (
    entitlement?.plan === "PRO" &&
    (!entitlement.expiresAt || new Date(entitlement.expiresAt) > now)
  );
}
