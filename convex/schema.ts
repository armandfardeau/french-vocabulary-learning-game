import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  teams: defineTable({
    name: v.string(),
    userId: v.optional(v.id("users")),
  }),
  
  games: defineTable({
    teamId: v.id("teams"),
    mode: v.union(v.literal("antonym"), v.literal("synonym"), v.literal("wordFamily"), v.literal("lexicalField")),
    score: v.number(),
    totalQuestions: v.number(),
    correctAnswers: v.number(),
  }).index("by_team", ["teamId"]),

  teamQuestionUsage: defineTable({
    teamId: v.id("teams"),
    mode: v.union(v.literal("antonym"), v.literal("synonym"), v.literal("wordFamily"), v.literal("lexicalField")),
    usedQuestionIds: v.array(v.id("vocabulary")),
  }).index("by_team_mode", ["teamId", "mode"]),
  
  vocabulary: defineTable({
    word: v.string(),
    type: v.union(v.literal("antonym"), v.literal("synonym"), v.literal("wordFamily"), v.literal("lexicalField")),
    answer: v.string(),
    options: v.array(v.string()),
    explanation: v.optional(v.string()),
  }).index("by_type", ["type"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
