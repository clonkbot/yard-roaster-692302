import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  roasts: defineTable({
    userId: v.optional(v.id("users")),
    imageUrl: v.string(),
    zipCode: v.optional(v.string()),
    score: v.optional(v.number()),
    verdictTier: v.string(),
    oneLiner: v.string(),
    roastParagraph: v.string(),
    fixes: v.array(v.object({
      title: v.string(),
      detail: v.string(),
    })),
    recommendedCollection: v.optional(v.object({
      name: v.string(),
      tier: v.string(),
      whyThisOne: v.string(),
    })),
    sunExposureGuess: v.string(),
    safeToShow: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]).index("by_created", ["createdAt"]),
});
