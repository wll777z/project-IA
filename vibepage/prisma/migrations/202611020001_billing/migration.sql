-- Assinatura Pro via Stripe
ALTER TABLE "Entitlement" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "Entitlement" ADD COLUMN "stripeSubscriptionId" TEXT;
ALTER TABLE "Entitlement" ADD COLUMN "subscriptionStatus" TEXT;
CREATE UNIQUE INDEX "Entitlement_stripeCustomerId_key" ON "Entitlement"("stripeCustomerId");
CREATE UNIQUE INDEX "Entitlement_stripeSubscriptionId_key" ON "Entitlement"("stripeSubscriptionId");
