import type { SubscriptionTier } from "@/contexts/AuthContext";

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, { maxJobPostings: number; maxFeatured: number }> = {
  free: { maxJobPostings: 2, maxFeatured: 0 },
  pro: { maxJobPostings: 10, maxFeatured: 3 },
  elite: { maxJobPostings: 999, maxFeatured: 10 },
};

export function canCreateJobPosting(tier: SubscriptionTier, currentCount: number): boolean {
  return currentCount < SUBSCRIPTION_LIMITS[tier].maxJobPostings;
}

export function canFeatureJobPosting(tier: SubscriptionTier, currentFeaturedCount: number): boolean {
  return currentFeaturedCount < SUBSCRIPTION_LIMITS[tier].maxFeatured;
}

export function getRemainingJobPostings(tier: SubscriptionTier, currentCount: number): number {
  return Math.max(0, SUBSCRIPTION_LIMITS[tier].maxJobPostings - currentCount);
}

export function getRemainingFeatured(tier: SubscriptionTier, currentFeaturedCount: number): number {
  return Math.max(0, SUBSCRIPTION_LIMITS[tier].maxFeatured - currentFeaturedCount);
}
